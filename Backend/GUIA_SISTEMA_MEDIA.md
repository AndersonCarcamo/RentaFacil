# 📸 Sistema de Gestión de Media - RentaFacil

## 🎯 Descripción General

Sistema completo de gestión de archivos multimedia con soporte para:
- ✅ **Avatars de usuario** (perfil)
- ✅ **Imágenes de propiedades** (múltiples por listing)
- ✅ **Videos de propiedades**
- ✅ **Cache con Redis** para metadatos
- ✅ **Nginx** para servir archivos estáticos
- ✅ **Thumbnails automáticos**

## 🏗️ Arquitectura

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  FastAPI    │─────▶│  PostgreSQL │
│   (React)   │      │  Backend    │      │  (Metadata) │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            │ Upload/Process
                            ▼
                     ┌─────────────┐
                     │   Local     │
                     │   Storage   │
                     │   /media/   │
                     └─────────────┘
                            │
                            │ Serve Static
                            ▼
                     ┌─────────────┐
                     │    Nginx    │
                     │  (Proxy +   │
                     │   Static)   │
                     └─────────────┘
                            │
                            │ Cache Metadata
                            ▼
                     ┌─────────────┐
                     │    Redis    │
                     │   (Cache)   │
                     └─────────────┘
```

## 📁 Estructura de Directorios

```
Backend/
├── media/                      # Almacenamiento local
│   ├── avatars/               # Fotos de perfil
│   ├── listings/
│   │   ├── images/           # Imágenes de propiedades
│   │   ├── videos/           # Videos de propiedades
│   │   └── thumbs/           # Miniaturas generadas
│   └── README.md
│
├── nginx/
│   └── nginx.conf            # Configuración Nginx
│
├── redis/
│   └── redis.conf            # Configuración Redis
│
└── app/
    ├── models/
    │   └── media.py          # Modelos Image y Video
    ├── schemas/
    │   └── media.py          # Schemas Pydantic
    ├── services/
    │   ├── media_service.py         # Lógica de negocio
    │   └── media_cache_service.py   # Cache Redis
    ├── utils/
    │   └── media_utils.py    # Utilidades (resize, etc)
    └── api/endpoints/
        ├── media.py          # Endpoints de media
        └── users.py          # Incluye endpoint de avatar
```

## 🔌 Endpoints Disponibles

### 👤 Avatar de Usuario

#### Subir Avatar
```http
POST /v1/users/me/avatar
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
  avatar: (file) - Imagen del avatar
```

**Respuesta:**
```json
{
  "message": "Avatar uploaded successfully",
  "avatar_url": "/media/avatars/{user_id}.jpg"
}
```

#### Eliminar Avatar
```http
DELETE /v1/users/me/avatar
Authorization: Bearer {token}
```

### 🏠 Imágenes de Propiedades

#### Listar Imágenes
```http
GET /v1/media/listings/{listing_id}/images
```

**Respuesta:**
```json
{
  "images": [
    {
      "id": "uuid",
      "listing_id": "uuid",
      "filename": "property.jpg",
      "original_url": "/media/listings/images/...",
      "thumbnail_url": "/media/listings/thumbs/...",
      "medium_url": "/media/listings/thumbs/...",
      "display_order": 0,
      "is_main": true,
      "width": 1920,
      "height": 1080,
      "file_size": 245678,
      "created_at": "2025-10-06T10:30:00Z"
    }
  ],
  "total": 5
}
```

#### Subir Imágenes (Múltiples)
```http
POST /v1/media/listings/{listing_id}/images
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
  images[]: (files) - Múltiples imágenes
  descriptions[]: (strings, optional) - Descripciones
```

**Respuesta:**
```json
{
  "success": true,
  "created_count": 3,
  "errors": []
}
```

#### Actualizar Metadata de Imagen
```http
PUT /v1/media/listings/{listing_id}/images/{image_id}
Authorization: Bearer {token}

Body:
{
  "alt_text": "Vista frontal de la propiedad",
  "is_main": true,
  "display_order": 0
}
```

#### Eliminar Imagen
```http
DELETE /v1/media/listings/{listing_id}/images/{image_id}
Authorization: Bearer {token}
```

### 🎥 Videos de Propiedades

#### Listar Videos
```http
GET /v1/media/listings/{listing_id}/videos
```

#### Subir Video
```http
POST /v1/media/listings/{listing_id}/videos
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
  video: (file) - Archivo de video
  title: (string, optional) - Título del video
  description: (string, optional) - Descripción
```

#### Actualizar Metadata de Video
```http
PUT /v1/media/listings/{listing_id}/videos/{video_id}
Authorization: Bearer {token}
```

#### Eliminar Video
```http
DELETE /v1/media/listings/{listing_id}/videos/{video_id}
Authorization: Bearer {token}
```

### 🔧 Utilidades

#### Obtener Estadísticas
```http
GET /v1/media/stats
Authorization: Bearer {token}
```

#### Invalidar Cache
```http
POST /v1/media/cache/invalidate/{listing_id}
Authorization: Bearer {token}
```

#### Health Check
```http
GET /v1/media/health
```

## 📊 Base de Datos

### Tabla: core.images
```sql
CREATE TABLE core.images (
    id                  UUID PRIMARY KEY,
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL,
    filename            TEXT NOT NULL,
    original_url        TEXT NOT NULL,
    thumbnail_url       TEXT,
    medium_url          TEXT,
    display_order       INTEGER DEFAULT 0,
    alt_text            TEXT,
    width               INTEGER,
    height              INTEGER,
    file_size           INTEGER,
    is_main             BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE
);

CREATE INDEX images_listing_idx ON core.images(listing_id, display_order);
```

### Tabla: core.videos
```sql
CREATE TABLE core.videos (
    id                  UUID PRIMARY KEY,
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL,
    filename            TEXT NOT NULL,
    original_url        TEXT NOT NULL,
    thumbnail_url       TEXT,
    duration_seconds    INTEGER,
    file_size           INTEGER,
    width               INTEGER,
    height              INTEGER,
    display_order       INTEGER DEFAULT 0,
    is_main             BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE
);

CREATE INDEX videos_listing_idx ON core.videos(listing_id, display_order);
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/1
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1
REDIS_PASSWORD=

# Cache TTL (seconds)
CACHE_METADATA_TTL=86400      # 24 hours
CACHE_THUMBNAIL_TTL=604800    # 7 days
CACHE_LISTING_TTL=3600        # 1 hour

# Media Storage
MEDIA_ROOT=/path/to/media
MEDIA_URL=/media/

# Upload Limits
MAX_AVATAR_SIZE=10485760      # 10MB
MAX_IMAGE_SIZE=20971520       # 20MB
MAX_VIDEO_SIZE=104857600      # 100MB
```

### Nginx Configuration

El archivo `nginx/nginx.conf` ya está configurado con:
- Servir archivos estáticos desde `/media/`
- Rate limiting para uploads
- Cache de 1 año para imágenes
- Soporte para streaming de videos
- Redimensionado dinámico de imágenes

## 🚀 Uso desde el Frontend

### Ejemplo: Subir Avatar

```typescript
// lib/api/users.ts
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const token = localStorage.getItem('access_token');
  const response = await fetch('http://localhost:8000/v1/users/me/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload avatar');
  }

  const data = await response.json();
  return data.avatar_url;
};
```

### Ejemplo: Subir Múltiples Imágenes de Propiedad

```typescript
// lib/api/listings.ts
export const uploadListingImages = async (
  listingId: string, 
  files: File[]
): Promise<void> => {
  const formData = new FormData();
  
  files.forEach((file, index) => {
    formData.append('images', file);
    formData.append('descriptions', `Image ${index + 1}`);
  });

  const token = localStorage.getItem('access_token');
  const response = await fetch(
    `http://localhost:8000/v1/media/listings/${listingId}/images`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload images');
  }
};
```

### Ejemplo: Mostrar Avatar en Componente React

```tsx
// components/UserAvatar.tsx
import { useState, useEffect } from 'react';
import { fetchUserProfile } from '@/lib/api/users';

export function UserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      const profile = await fetchUserProfile();
      setAvatarUrl(profile.profile_picture_url);
    };
    loadAvatar();
  }, []);

  return (
    <img 
      src={avatarUrl || '/default-avatar.png'} 
      alt="User Avatar"
      className="w-10 h-10 rounded-full"
    />
  );
}
```

## 🔒 Seguridad

### Validaciones Implementadas

1. **Tipo de Archivo**
   - Solo imágenes: jpg, jpeg, png, gif, webp
   - Solo videos: mp4, webm, avi, mov

2. **Tamaño de Archivo**
   - Avatar: 10 MB máximo
   - Imagen: 20 MB máximo
   - Video: 100 MB máximo

3. **Autenticación**
   - Todos los endpoints requieren JWT token
   - Solo el propietario puede modificar sus archivos

4. **Rate Limiting (Nginx)**
   - Upload: 10 requests/segundo
   - Acceso: 50 requests/segundo

## 📈 Performance

### Cache con Redis

El sistema cachea:
- Metadatos de imágenes (24 horas)
- Metadatos de videos (24 horas)
- Rutas de thumbnails (7 días)
- Listados de media por listing (1 hora)

### Nginx Static Serving

- Archivos servidos directamente por Nginx
- Cache de 1 año con `immutable`
- Compresión gzip habilitada
- Range requests para streaming de videos

## 🧪 Testing

### Probar Upload de Avatar

```bash
# Con curl
curl -X POST http://localhost:8000/v1/users/me/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

### Probar Upload de Imágenes de Listing

```bash
curl -X POST http://localhost:8000/v1/media/listings/{listing_id}/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg"
```

## 🐛 Troubleshooting

### Error: "Redis not available"
```bash
# Verificar si Redis está corriendo
redis-cli ping
# Debería responder: PONG

# Iniciar Redis si no está corriendo
redis-server redis/redis.conf
```

### Error: "Permission denied" al guardar archivos
```bash
# Dar permisos al directorio media
chmod -R 755 media/
```

### Error: "File too large"
- Verificar límites en `.env`
- Verificar `client_max_body_size` en Nginx

## 📝 Notas Adicionales

- Los archivos se almacenan localmente en desarrollo
- En producción, considerar migrar a S3 o Cloudflare R2
- Redis es opcional pero recomendado para mejor performance
- Nginx puede ser opcional en desarrollo (FastAPI puede servir archivos)

## 🔄 Próximas Mejoras

- [ ] Procesamiento de imágenes (resize, optimize)
- [ ] Generación automática de thumbnails
- [ ] Watermarks en imágenes
- [ ] Soporte para AWS S3
- [ ] CDN integration
- [ ] Compresión automática de videos
- [ ] Detección de contenido inapropiado
- [ ] Soporte para más formatos (HEIC, AVIF)

## 📚 Referencias

- [FastAPI File Uploads](https://fastapi.tiangolo.com/tutorial/request-files/)
- [Nginx Static Files](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/)
- [Redis Caching](https://redis.io/docs/manual/client-side-caching/)
