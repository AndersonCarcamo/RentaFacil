import os
import uuid
import json
import logging
from pathlib import Path
from typing import List, Tuple, Dict, Optional, Any
from datetime import datetime
from PIL import Image, ImageOps
from PIL.ExifTags import TAGS
import hashlib

logger = logging.getLogger(__name__)

class LocalMediaService:
    """
    Servicio para manejo de archivos multimedia en almacenamiento local.
    Genera thumbnails automáticamente y extrae metadatos completos.
    """
    
    def __init__(self):
        # Configuración de directorios
        self.base_path = Path(os.getenv("UPLOAD_PATH", "./uploads"))
        self.media_base_url = os.getenv("MEDIA_BASE_URL", "http://localhost/media")
        
        # Límites de archivos
        self.max_image_size = int(os.getenv("MAX_IMAGE_SIZE_MB", "10")) * 1024 * 1024  # 10MB
        self.max_video_size = int(os.getenv("MAX_VIDEO_SIZE_MB", "100")) * 1024 * 1024  # 100MB
        
        # Formatos permitidos
        self.allowed_image_formats = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp']
        }
        
        self.allowed_video_formats = {
            'video/mp4': ['.mp4'],
            'video/webm': ['.webm'],
            'video/avi': ['.avi'],
            'video/quicktime': ['.mov']
        }
        
        # Tamaños de thumbnails
        self.thumbnail_sizes = {
            'small': (150, 150),      # Para listados
            'medium': (400, 300),     # Para previews
            'large': (800, 600)       # Para galería
        }
        
        # Crear directorios base
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Crear estructura de directorios necesaria"""
        directories = [
            self.base_path,
            self.base_path / "images",
            self.base_path / "videos", 
            self.base_path / "temp",
            self.base_path / "thumbnails"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    def save_image(self, listing_id: str, file_data: bytes, 
                   filename: str, alt_text: str = None) -> Tuple[str, Dict[str, Any]]:
        """
        Guarda imagen, genera thumbnails y extrae metadatos
        
        Args:
            listing_id: ID del listing
            file_data: Datos binarios del archivo
            filename: Nombre original del archivo
            alt_text: Texto alternativo
            
        Returns:
            Tuple[str, Dict]: (URL del archivo, metadatos completos)
        """
        try:
            # Validar tamaño
            if len(file_data) > self.max_image_size:
                raise ValueError(f"File too large. Max size: {self.max_image_size / (1024*1024):.1f}MB")
            
            # Crear directorio del listing
            listing_dir = self.base_path / "images" / listing_id
            listing_dir.mkdir(parents=True, exist_ok=True)
            
            # Generar nombre único
            file_id = str(uuid.uuid4())
            original_ext = Path(filename).suffix.lower()
            if not original_ext:
                original_ext = '.jpg'  # Default para imágenes sin extensión
            
            # Validar formato por extensión y contenido
            self._validate_image_format(file_data, original_ext)
            
            # Nombres de archivos
            optimized_filename = f"{file_id}.jpg"  # Siempre convertir a JPEG optimizado
            original_path = listing_dir / optimized_filename
            
            # Procesar imagen
            with Image.open(io.BytesIO(file_data)) as img:
                # Extraer metadatos EXIF antes de procesamiento
                metadata = self._extract_image_metadata(img, filename, len(file_data))
                
                # Orientación automática (EXIF)
                img = ImageOps.exif_transpose(img)
                
                # Convertir a RGB si es necesario
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Para transparencias, usar fondo blanco
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background
                
                # Optimizar calidad/tamaño
                img_optimized = self._optimize_image(img)
                
                # Guardar imagen optimizada
                img_optimized.save(original_path, 'JPEG', quality=85, optimize=True, progressive=True)
                
                # Actualizar metadatos con imagen procesada
                metadata.update({
                    'width': img_optimized.width,
                    'height': img_optimized.height,
                    'file_size': original_path.stat().st_size,
                    'alt_text': alt_text
                })
                
                # Generar thumbnails
                thumbnails = self._generate_thumbnails(img_optimized, listing_dir, file_id)
                metadata['thumbnails'] = thumbnails
            
            # URLs finales
            original_url = f"{self.media_base_url}/images/{listing_id}/{optimized_filename}"
            thumbnail_url = thumbnails.get('medium', original_url)
            
            logger.info(f"Image saved successfully: {original_url}")
            
            return original_url, {
                'original_url': original_url,
                'thumbnail_url': thumbnail_url,
                'medium_url': thumbnails.get('medium'),
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"Error saving image: {e}")
            raise RuntimeError(f"Failed to save image: {str(e)}")
    
    def save_video(self, listing_id: str, file_data: bytes, 
                   filename: str, title: str = None) -> Tuple[str, Dict[str, Any]]:
        """
        Guarda video y genera thumbnail del primer frame
        
        Args:
            listing_id: ID del listing
            file_data: Datos binarios del archivo
            filename: Nombre original del archivo  
            title: Título del video
            
        Returns:
            Tuple[str, Dict]: (URL del archivo, metadatos completos)
        """
        try:
            # Validar tamaño
            if len(file_data) > self.max_video_size:
                raise ValueError(f"File too large. Max size: {self.max_video_size / (1024*1024):.1f}MB")
            
            # Crear directorio del listing
            listing_dir = self.base_path / "videos" / listing_id
            listing_dir.mkdir(parents=True, exist_ok=True)
            
            # Generar nombre único
            file_id = str(uuid.uuid4())
            original_ext = Path(filename).suffix.lower()
            
            # Validar formato
            content_type = self._detect_video_format(file_data, original_ext)
            
            # Guardar archivo original
            video_filename = f"{file_id}{original_ext}"
            video_path = listing_dir / video_filename
            
            with open(video_path, 'wb') as f:
                f.write(file_data)
            
            # Extraer metadatos del video
            metadata = self._extract_video_metadata(video_path, filename, len(file_data))
            metadata['title'] = title
            
            # Generar thumbnail del video
            thumbnail_path = self._generate_video_thumbnail(video_path, listing_dir, file_id)
            
            # URLs finales
            video_url = f"{self.media_base_url}/videos/{listing_id}/{video_filename}"
            thumbnail_url = f"{self.media_base_url}/videos/{listing_id}/thumbs/{file_id}_poster.jpg" if thumbnail_path else None
            
            logger.info(f"Video saved successfully: {video_url}")
            
            return video_url, {
                'original_url': video_url,
                'thumbnail_url': thumbnail_url,
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"Error saving video: {e}")
            raise RuntimeError(f"Failed to save video: {str(e)}")
    
    def delete_media_files(self, media_urls: List[str]):
        """
        Elimina archivos físicos del almacenamiento
        
        Args:
            media_urls: Lista de URLs de archivos a eliminar
        """
        for url in media_urls:
            if not url:
                continue
                
            try:
                # Convertir URL a path local
                if url.startswith(self.media_base_url):
                    relative_path = url.replace(self.media_base_url, "").lstrip("/")
                    file_path = self.base_path / relative_path
                    
                    if file_path.exists():
                        file_path.unlink()
                        logger.info(f"Deleted file: {file_path}")
                    
                    # Eliminar thumbnails asociados si es imagen
                    if "/images/" in url:
                        thumb_dir = file_path.parent / "thumbs"
                        file_id = file_path.stem
                        
                        for size in self.thumbnail_sizes.keys():
                            thumb_path = thumb_dir / f"{file_id}_{size}.jpg"
                            if thumb_path.exists():
                                thumb_path.unlink()
                                logger.info(f"Deleted thumbnail: {thumb_path}")
                                
            except Exception as e:
                logger.error(f"Error deleting file {url}: {e}")
    
    def _validate_image_format(self, file_data: bytes, extension: str):
        """Valida formato de imagen por magic bytes y extensión"""
        # Magic bytes para formatos comunes
        magic_bytes = {
            b'\xff\xd8\xff': 'image/jpeg',
            b'\x89PNG\r\n\x1a\n': 'image/png',
            b'GIF87a': 'image/gif',
            b'GIF89a': 'image/gif',
            b'RIFF': 'image/webp'  # Simplificado, WebP tiene más validación
        }
        
        # Verificar magic bytes
        detected_format = None
        for magic, format_type in magic_bytes.items():
            if file_data.startswith(magic):
                detected_format = format_type
                break
        
        if not detected_format:
            raise ValueError("Invalid image format or corrupted file")
        
        # Verificar que la extensión coincida con el formato
        valid_extensions = self.allowed_image_formats.get(detected_format, [])
        if extension not in valid_extensions:
            logger.warning(f"Extension {extension} doesn't match detected format {detected_format}")
    
    def _detect_video_format(self, file_data: bytes, extension: str) -> str:
        """Detecta formato de video por magic bytes"""
        # Magic bytes para videos comunes
        if file_data.startswith(b'\x00\x00\x00\x18ftypmp4') or file_data.startswith(b'\x00\x00\x00\x1cftyp'):
            return 'video/mp4'
        elif file_data.startswith(b'\x1a\x45\xdf\xa3'):
            return 'video/webm'
        elif file_data.startswith(b'RIFF') and b'AVI ' in file_data[:12]:
            return 'video/avi'
        elif file_data.startswith(b'\x00\x00\x00\x14ftypqt'):
            return 'video/quicktime'
        else:
            # Fallback a extensión
            for content_type, extensions in self.allowed_video_formats.items():
                if extension in extensions:
                    return content_type
            
            raise ValueError("Invalid video format or corrupted file")
    
    def _optimize_image(self, img: Image.Image, max_dimension: int = 1920) -> Image.Image:
        """Optimiza imagen reduciendo tamaño si es muy grande"""
        width, height = img.size
        
        if max(width, height) > max_dimension:
            # Calcular nuevo tamaño manteniendo proporción
            if width > height:
                new_width = max_dimension
                new_height = int((height * max_dimension) / width)
            else:
                new_height = max_dimension  
                new_width = int((width * max_dimension) / height)
            
            img = img.resize((new_width, new_height), Image.LANCZOS)
        
        return img
    
    def _generate_thumbnails(self, img: Image.Image, output_dir: Path, 
                           file_id: str) -> Dict[str, str]:
        """Genera thumbnails en diferentes tamaños"""
        thumbnails = {}
        thumb_dir = output_dir / "thumbs"
        thumb_dir.mkdir(exist_ok=True)
        
        try:
            for size_name, (width, height) in self.thumbnail_sizes.items():
                # Crear copia de la imagen
                img_copy = img.copy()
                
                # Redimensionar manteniendo proporción (thumbnail)
                img_copy.thumbnail((width, height), Image.LANCZOS)
                
                # Crear imagen final con fondo blanco si es necesario
                if img_copy.size != (width, height):
                    # Centrar imagen en canvas del tamaño deseado
                    final_img = Image.new('RGB', (width, height), (255, 255, 255))
                    paste_x = (width - img_copy.width) // 2
                    paste_y = (height - img_copy.height) // 2
                    final_img.paste(img_copy, (paste_x, paste_y))
                    img_copy = final_img
                
                # Guardar thumbnail
                thumb_filename = f"{file_id}_{size_name}.jpg"
                thumb_path = thumb_dir / thumb_filename
                img_copy.save(thumb_path, 'JPEG', quality=80, optimize=True)
                
                # URL del thumbnail
                listing_id = output_dir.name
                media_type = output_dir.parent.name  # 'images' o 'videos'
                thumbnails[size_name] = f"{self.media_base_url}/{media_type}/{listing_id}/thumbs/{thumb_filename}"
                
        except Exception as e:
            logger.error(f"Error generating thumbnails: {e}")
        
        return thumbnails
    
    def _generate_video_thumbnail(self, video_path: Path, output_dir: Path, 
                                file_id: str) -> Optional[Path]:
        """Genera thumbnail del primer frame del video"""
        try:
            # Intentar usar ffmpeg si está disponible
            import subprocess
            
            thumb_dir = output_dir / "thumbs"
            thumb_dir.mkdir(exist_ok=True)
            
            thumbnail_path = thumb_dir / f"{file_id}_poster.jpg"
            
            # Comando ffmpeg para extraer frame
            cmd = [
                'ffmpeg', '-i', str(video_path),
                '-vframes', '1',  # Solo 1 frame
                '-an',  # Sin audio
                '-vf', 'scale=400:300:force_original_aspect_ratio=decrease,pad=400:300:(ow-iw)/2:(oh-ih)/2',
                '-y',  # Sobrescribir
                str(thumbnail_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0 and thumbnail_path.exists():
                logger.info(f"Video thumbnail generated: {thumbnail_path}")
                return thumbnail_path
            else:
                logger.warning(f"Failed to generate video thumbnail: {result.stderr}")
                return None
                
        except (ImportError, subprocess.TimeoutExpired, Exception) as e:
            logger.warning(f"Could not generate video thumbnail (ffmpeg not available?): {e}")
            return None
    
    def _extract_image_metadata(self, img: Image.Image, filename: str, 
                              file_size: int) -> Dict[str, Any]:
        """Extrae metadatos completos de imagen"""
        metadata = {
            'filename': filename,
            'file_size': file_size,
            'format': img.format,
            'mode': img.mode,
            'width': img.width,
            'height': img.height,
            'has_transparency': img.mode in ('RGBA', 'LA') or 'transparency' in img.info,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # EXIF data si está disponible
        try:
            exif_dict = img._getexif()
            if exif_dict:
                exif_readable = {}
                for tag_id, value in exif_dict.items():
                    tag = TAGS.get(tag_id, tag_id)
                    exif_readable[tag] = str(value)
                metadata['exif'] = exif_readable
        except:
            pass
        
        return metadata
    
    def _extract_video_metadata(self, video_path: Path, filename: str, 
                              file_size: int) -> Dict[str, Any]:
        """Extrae metadatos de video usando ffprobe"""
        metadata = {
            'filename': filename,
            'file_size': file_size,
            'created_at': datetime.utcnow().isoformat()
        }
        
        try:
            import subprocess
            
            # Usar ffprobe para obtener metadatos
            cmd = [
                'ffprobe', '-v', 'quiet',
                '-print_format', 'json',
                '-show_format', '-show_streams',
                str(video_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0:
                import json
                probe_data = json.loads(result.stdout)
                
                # Extraer información del formato
                format_info = probe_data.get('format', {})
                metadata.update({
                    'duration': float(format_info.get('duration', 0)),
                    'bitrate': int(format_info.get('bit_rate', 0)),
                    'format_name': format_info.get('format_name', '')
                })
                
                # Extraer información del stream de video
                for stream in probe_data.get('streams', []):
                    if stream.get('codec_type') == 'video':
                        metadata.update({
                            'width': stream.get('width', 0),
                            'height': stream.get('height', 0),
                            'fps': eval(stream.get('r_frame_rate', '0/1')) if '/' in str(stream.get('r_frame_rate', '')) else 0,
                            'codec': stream.get('codec_name', '')
                        })
                        break
                        
        except Exception as e:
            logger.warning(f"Could not extract video metadata: {e}")
        
        return metadata
    
    def get_file_hash(self, file_path: Path) -> str:
        """Genera hash SHA-256 del archivo para detección de duplicados"""
        hash_sha256 = hashlib.sha256()
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        
        return hash_sha256.hexdigest()


# Agregar import necesario que faltaba
import io