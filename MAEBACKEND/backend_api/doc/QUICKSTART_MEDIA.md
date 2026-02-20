# 🚀 Quick Start - Sistema de Media

## Paso 1: Iniciar Redis

```bash
# Windows (con WSL)
wsl redis-server

# O con Redis para Windows
redis-server

# Verificar que Redis está corriendo
redis-cli ping
# Debería responder: PONG
```

## Paso 2: Iniciar Backend

```bash
cd Backend

# Activar entorno virtual
.\.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Instalar dependencias (si no están instaladas)
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

## Paso 3: Verificar que los endpoints están disponibles

Abre tu navegador en: http://localhost:8000/docs

Deberías ver en la documentación:
- ✅ **Media** - Endpoints de gestión de archivos multimedia
- ✅ **Users** - Incluye `/users/me/avatar`

## Paso 4: Probar Upload de Avatar

### Desde el Frontend (React)

```typescript
// Componente de ejemplo
import { useState } from 'react';

export function AvatarUploader() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
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

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      alert(`Avatar uploaded! URL: ${data.avatar_url}`);
    } catch (error) {
      alert('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### Desde Postman/Insomnia

1. **Crear request POST**
   - URL: `http://localhost:8000/v1/users/me/avatar`
   
2. **Headers**
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
   
3. **Body** (form-data)
   - Key: `avatar`
   - Type: File
   - Value: Seleccionar imagen

4. **Send**

## Paso 5: Probar Upload de Imágenes de Listing

```bash
# Con curl
curl -X POST http://localhost:8000/v1/media/listings/LISTING_UUID/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "descriptions=Vista frontal" \
  -F "descriptions=Vista interior"
```

## 🔍 Verificar que todo funciona

### 1. Verificar Redis
```bash
redis-cli
127.0.0.1:6379> PING
PONG
127.0.0.1:6379> INFO
# Deberías ver información del servidor
```

### 2. Verificar Backend
```bash
# Health check
curl http://localhost:8000/health

# Media health check
curl http://localhost:8000/v1/media/health
```

### 3. Verificar directorio media
```bash
cd Backend/media
ls -la
# Deberías ver:
# avatars/
# listings/images/
# listings/videos/
# listings/thumbs/
```

## 📝 Notas Importantes

1. **Autenticación requerida**: Necesitas hacer login primero y obtener un token
2. **CORS**: Asegúrate que el backend tiene CORS configurado para tu frontend
3. **Archivos**: Se guardan en `Backend/media/` en desarrollo
4. **Redis opcional**: El sistema funciona sin Redis pero con menos performance

## 🆘 Problemas Comunes

### Error: "Redis connection refused"
```bash
# Iniciar Redis
redis-server

# O verificar que esté corriendo
ps aux | grep redis
```

### Error: "Permission denied" al guardar archivos
```bash
# Dar permisos
chmod -R 755 Backend/media/
```

### Error: 401 Unauthorized
- Verifica que tienes un token válido
- Verifica que el token no haya expirado
- Haz login nuevamente si es necesario

## 📚 Documentación Completa

- Ver `GUIA_SISTEMA_MEDIA.md` para documentación completa
- Ver `media/README.md` para información sobre estructura de directorios
- Ver http://localhost:8000/docs para API interactiva
