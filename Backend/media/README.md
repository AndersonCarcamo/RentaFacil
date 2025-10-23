# Media Storage Directory

Este directorio almacena todos los archivos multimedia subidos por los usuarios.

## Estructura

```
media/
├── avatars/              # Fotos de perfil de usuarios
├── listings/
│   ├── images/          # Imágenes de propiedades
│   ├── videos/          # Videos de propiedades
│   └── thumbs/          # Miniaturas generadas automáticamente
```

## Configuración

### Nginx
Los archivos en este directorio son servidos directamente por Nginx para mejor rendimiento.

Configuración en `nginx/nginx.conf`:
- **Ruta**: `/media/`
- **Alias**: `/var/www/easyrent/media/`
- **Cache**: 1 año para imágenes y videos
- **Max size**: 100MB por archivo

### Redis
Las rutas y metadatos de los archivos se cachean en Redis para acceso rápido.

### Límites

| Tipo | Tamaño Máximo | Formatos Permitidos |
|------|---------------|-------------------|
| Avatar | 10 MB | jpg, jpeg, png, gif, webp |
| Imagen | 20 MB | jpg, jpeg, png, gif, webp |
| Video | 100 MB | mp4, webm, avi, mov |

## Endpoints

### Avatars
- `POST /v1/users/me/avatar` - Subir avatar
- `DELETE /v1/users/me/avatar` - Eliminar avatar

### Imágenes de Listings
- `GET /v1/media/listings/{listing_id}/images` - Listar imágenes
- `POST /v1/media/listings/{listing_id}/images` - Subir imágenes (múltiples)
- `PUT /v1/media/listings/{listing_id}/images/{image_id}` - Actualizar metadata
- `DELETE /v1/media/listings/{listing_id}/images/{image_id}` - Eliminar imagen

### Videos de Listings
- `GET /v1/media/listings/{listing_id}/videos` - Listar videos
- `POST /v1/media/listings/{listing_id}/videos` - Subir video
- `PUT /v1/media/listings/{listing_id}/videos/{video_id}` - Actualizar metadata
- `DELETE /v1/media/listings/{listing_id}/videos/{video_id}` - Eliminar video

## Seguridad

- Rate limiting configurado en Nginx
- Validación de tipos de archivo
- Validación de tamaños
- Solo propietarios pueden modificar sus archivos
- CORS configurado para acceso desde frontend

## Notas

- Este directorio **NO** debe estar en el control de versiones (Git)
- Los archivos se almacenan localmente en desarrollo
- En producción, considerar usar S3 o similar para almacenamiento en la nube
