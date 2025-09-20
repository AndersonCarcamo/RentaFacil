"""
Utilidades multimedia para procesamiento avanzado de imágenes y videos.
Funcionalidades adicionales para el sistema de media de EasyRent.
"""

import os
import logging
import subprocess
from pathlib import Path
from typing import Dict, Tuple, Optional, List, Any
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageFont
import hashlib
import mimetypes

logger = logging.getLogger(__name__)

class ImageProcessor:
    """
    Procesador avanzado de imágenes con funcionalidades de optimización,
    filtros y manipulación.
    """
    
    def __init__(self):
        self.supported_formats = {
            'JPEG': {'extension': '.jpg', 'quality': True},
            'PNG': {'extension': '.png', 'quality': False},
            'WEBP': {'extension': '.webp', 'quality': True},
            'GIF': {'extension': '.gif', 'quality': False}
        }
        
        # Configuraciones de calidad por uso
        self.quality_presets = {
            'thumbnail': 75,
            'web_optimized': 85,
            'high_quality': 95,
            'original': 100
        }
    
    def optimize_for_web(self, image_path: Path, output_path: Path, 
                        max_width: int = 1920, quality: str = 'web_optimized') -> Dict[str, Any]:
        """
        Optimiza imagen para web reduciendo tamaño manteniendo calidad visual
        
        Args:
            image_path: Ruta de la imagen original
            output_path: Ruta de salida
            max_width: Ancho máximo permitido
            quality: Preset de calidad
            
        Returns:
            Dict con información del procesamiento
        """
        try:
            with Image.open(image_path) as img:
                original_size = img.size
                original_file_size = image_path.stat().st_size
                
                # Convertir a RGB si es necesario
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Crear fondo blanco para transparencias
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background
                
                # Redimensionar si es muy grande
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.LANCZOS)
                
                # Aplicar nitidez ligera después del redimensionado
                img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
                
                # Guardar con optimizaciones
                save_kwargs = {
                    'format': 'JPEG',
                    'quality': self.quality_presets[quality],
                    'optimize': True,
                    'progressive': True
                }
                
                img.save(output_path, **save_kwargs)
                
                # Información del resultado
                new_file_size = output_path.stat().st_size
                compression_ratio = (1 - new_file_size / original_file_size) * 100
                
                return {
                    'success': True,
                    'original_size': original_size,
                    'new_size': img.size,
                    'original_file_size': original_file_size,
                    'new_file_size': new_file_size,
                    'compression_ratio': round(compression_ratio, 2),
                    'quality_preset': quality
                }
                
        except Exception as e:
            logger.error(f"Error optimizing image {image_path}: {e}")
            return {'success': False, 'error': str(e)}
    
    def create_watermark(self, image_path: Path, output_path: Path,
                        watermark_text: str = "EasyRent", 
                        opacity: float = 0.3) -> bool:
        """
        Añade marca de agua a la imagen
        
        Args:
            image_path: Imagen original
            output_path: Imagen con marca de agua
            watermark_text: Texto de la marca de agua
            opacity: Opacidad (0.0 a 1.0)
            
        Returns:
            bool: True si fue exitoso
        """
        try:
            with Image.open(image_path) as img:
                # Crear capa de marca de agua
                watermark = Image.new('RGBA', img.size, (255, 255, 255, 0))
                draw = ImageDraw.Draw(watermark)
                
                # Intentar usar fuente personalizada, sino usar fuente por defecto
                try:
                    font_size = min(img.size) // 20  # Tamaño relativo a la imagen
                    font = ImageFont.truetype("arial.ttf", font_size)
                except:
                    font = ImageFont.load_default()
                
                # Calcular posición (esquina inferior derecha)
                bbox = draw.textbbox((0, 0), watermark_text, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                
                x = img.width - text_width - 20
                y = img.height - text_height - 20
                
                # Dibujar marca de agua
                alpha = int(255 * opacity)
                draw.text((x, y), watermark_text, font=font, fill=(255, 255, 255, alpha))
                
                # Combinar con imagen original
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                watermarked = Image.alpha_composite(img, watermark)
                
                # Convertir de vuelta a RGB para JPEG
                if output_path.suffix.lower() == '.jpg':
                    watermarked = watermarked.convert('RGB')
                
                watermarked.save(output_path, quality=90, optimize=True)
                
                return True
                
        except Exception as e:
            logger.error(f"Error adding watermark to {image_path}: {e}")
            return False
    
    def detect_duplicates(self, image_paths: List[Path]) -> List[List[Path]]:
        """
        Detecta imágenes duplicadas usando hashing perceptual
        
        Args:
            image_paths: Lista de rutas de imágenes
            
        Returns:
            Lista de grupos de imágenes duplicadas
        """
        try:
            import imagehash  # Requiere pillow-simd o imagehash
            
            hashes = {}
            for path in image_paths:
                try:
                    with Image.open(path) as img:
                        # Hash perceptual para detectar imágenes similares
                        phash = str(imagehash.phash(img))
                        
                        if phash not in hashes:
                            hashes[phash] = []
                        hashes[phash].append(path)
                        
                except Exception as e:
                    logger.warning(f"Could not hash image {path}: {e}")
            
            # Retornar solo grupos con más de una imagen
            duplicates = [group for group in hashes.values() if len(group) > 1]
            
            return duplicates
            
        except ImportError:
            logger.warning("imagehash library not available for duplicate detection")
            return []
        except Exception as e:
            logger.error(f"Error detecting duplicates: {e}")
            return []


class VideoProcessor:
    """
    Procesador de videos con funcionalidades de análisis y optimización
    """
    
    def __init__(self):
        self.ffmpeg_available = self._check_ffmpeg()
        self.supported_formats = ['mp4', 'webm', 'avi', 'mov', 'mkv']
    
    def _check_ffmpeg(self) -> bool:
        """Verifica si ffmpeg está disponible"""
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
            return True
        except:
            return False
    
    def get_video_info(self, video_path: Path) -> Dict[str, Any]:
        """
        Extrae información completa del video
        
        Args:
            video_path: Ruta del archivo de video
            
        Returns:
            Dict con metadatos del video
        """
        if not self.ffmpeg_available:
            return {'error': 'ffmpeg not available'}
        
        try:
            cmd = [
                'ffprobe', '-v', 'quiet',
                '-print_format', 'json',
                '-show_format', '-show_streams',
                str(video_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return {'error': f'ffprobe failed: {result.stderr}'}
            
            import json
            probe_data = json.loads(result.stdout)
            
            # Extraer información relevante
            format_info = probe_data.get('format', {})
            video_info = {}
            audio_info = {}
            
            for stream in probe_data.get('streams', []):
                if stream.get('codec_type') == 'video' and not video_info:
                    video_info = {
                        'codec': stream.get('codec_name'),
                        'width': stream.get('width'),
                        'height': stream.get('height'),
                        'fps': self._parse_fraction(stream.get('r_frame_rate', '0/1')),
                        'bitrate': stream.get('bit_rate'),
                        'pixel_format': stream.get('pix_fmt')
                    }
                elif stream.get('codec_type') == 'audio' and not audio_info:
                    audio_info = {
                        'codec': stream.get('codec_name'),
                        'sample_rate': stream.get('sample_rate'),
                        'channels': stream.get('channels'),
                        'bitrate': stream.get('bit_rate')
                    }
            
            return {
                'success': True,
                'duration': float(format_info.get('duration', 0)),
                'size': int(format_info.get('size', 0)),
                'bitrate': int(format_info.get('bit_rate', 0)),
                'format': format_info.get('format_name'),
                'video': video_info,
                'audio': audio_info
            }
            
        except Exception as e:
            logger.error(f"Error getting video info for {video_path}: {e}")
            return {'error': str(e)}
    
    def extract_thumbnail(self, video_path: Path, output_path: Path,
                         timestamp: str = "00:00:01", size: str = "400x300") -> bool:
        """
        Extrae thumbnail del video en timestamp específico
        
        Args:
            video_path: Archivo de video
            output_path: Donde guardar el thumbnail
            timestamp: Momento del video (formato HH:MM:SS)
            size: Tamaño del thumbnail
            
        Returns:
            bool: True si fue exitoso
        """
        if not self.ffmpeg_available:
            return False
        
        try:
            cmd = [
                'ffmpeg', '-i', str(video_path),
                '-ss', timestamp,
                '-vframes', '1',
                '-an',  # Sin audio
                '-vf', f'scale={size}:force_original_aspect_ratio=decrease,pad={size}:(ow-iw)/2:(oh-ih)/2',
                '-q:v', '2',  # Alta calidad
                '-y',  # Sobrescribir archivo existente
                str(output_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0 and output_path.exists():
                logger.info(f"Video thumbnail extracted: {output_path}")
                return True
            else:
                logger.error(f"Failed to extract thumbnail: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error extracting thumbnail from {video_path}: {e}")
            return False
    
    def compress_video(self, video_path: Path, output_path: Path,
                      quality: str = 'medium') -> Dict[str, Any]:
        """
        Comprime video para web manteniendo calidad aceptable
        
        Args:
            video_path: Video original
            output_path: Video comprimido
            quality: Nivel de calidad (low, medium, high)
            
        Returns:
            Dict con información del procesamiento
        """
        if not self.ffmpeg_available:
            return {'success': False, 'error': 'ffmpeg not available'}
        
        # Configuraciones de calidad
        quality_settings = {
            'low': {'crf': 28, 'preset': 'fast', 'max_bitrate': '500k'},
            'medium': {'crf': 23, 'preset': 'medium', 'max_bitrate': '1500k'},
            'high': {'crf': 18, 'preset': 'slow', 'max_bitrate': '3000k'}
        }
        
        settings = quality_settings.get(quality, quality_settings['medium'])
        
        try:
            original_size = video_path.stat().st_size
            
            cmd = [
                'ffmpeg', '-i', str(video_path),
                '-c:v', 'libx264',
                '-crf', str(settings['crf']),
                '-preset', settings['preset'],
                '-maxrate', settings['max_bitrate'],
                '-bufsize', str(int(settings['max_bitrate'].replace('k', '')) * 2) + 'k',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',  # Optimización para web
                '-y',
                str(output_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0 and output_path.exists():
                new_size = output_path.stat().st_size
                compression_ratio = (1 - new_size / original_size) * 100
                
                return {
                    'success': True,
                    'original_size': original_size,
                    'compressed_size': new_size,
                    'compression_ratio': round(compression_ratio, 2),
                    'quality': quality
                }
            else:
                return {
                    'success': False,
                    'error': f'Compression failed: {result.stderr}'
                }
                
        except Exception as e:
            logger.error(f"Error compressing video {video_path}: {e}")
            return {'success': False, 'error': str(e)}
    
    def _parse_fraction(self, fraction_str: str) -> float:
        """Convierte fracción string a float (ej: '30/1' -> 30.0)"""
        try:
            if '/' in fraction_str:
                num, den = fraction_str.split('/')
                return float(num) / float(den) if float(den) != 0 else 0.0
            return float(fraction_str)
        except:
            return 0.0


class MediaValidator:
    """
    Validador de archivos multimedia con verificaciones de seguridad
    """
    
    def __init__(self):
        self.max_image_size = 10 * 1024 * 1024  # 10MB
        self.max_video_size = 100 * 1024 * 1024  # 100MB
        
        self.allowed_image_types = {
            'image/jpeg', 'image/png', 'image/gif', 'image/webp'
        }
        
        self.allowed_video_types = {
            'video/mp4', 'video/webm', 'video/avi', 'video/quicktime'
        }
    
    def validate_image_file(self, file_data: bytes, filename: str) -> Dict[str, Any]:
        """
        Valida archivo de imagen completamente
        
        Args:
            file_data: Datos binarios del archivo
            filename: Nombre del archivo
            
        Returns:
            Dict con resultado de validación
        """
        result = {
            'valid': False,
            'errors': [],
            'warnings': [],
            'metadata': {}
        }
        
        try:
            # Verificar tamaño
            if len(file_data) > self.max_image_size:
                result['errors'].append(f"File too large: {len(file_data)} bytes (max: {self.max_image_size})")
                return result
            
            # Verificar MIME type por magic bytes
            mime_type = self._detect_mime_type(file_data)
            if mime_type not in self.allowed_image_types:
                result['errors'].append(f"Invalid image type: {mime_type}")
                return result
            
            # Verificar que sea una imagen válida
            try:
                from io import BytesIO
                with Image.open(BytesIO(file_data)) as img:
                    # Verificar dimensiones mínimas
                    if img.width < 100 or img.height < 100:
                        result['warnings'].append("Image dimensions are very small")
                    
                    # Verificar dimensiones máximas
                    if img.width > 8000 or img.height > 8000:
                        result['warnings'].append("Image dimensions are very large")
                    
                    result['metadata'] = {
                        'width': img.width,
                        'height': img.height,
                        'mode': img.mode,
                        'format': img.format,
                        'has_transparency': img.mode in ('RGBA', 'LA') or 'transparency' in img.info
                    }
                    
            except Exception as e:
                result['errors'].append(f"Invalid image file: {str(e)}")
                return result
            
            # Verificar extensión vs contenido
            expected_ext = self._mime_to_extension(mime_type)
            file_ext = Path(filename).suffix.lower()
            if file_ext != expected_ext:
                result['warnings'].append(f"Extension {file_ext} doesn't match content {expected_ext}")
            
            result['valid'] = len(result['errors']) == 0
            return result
            
        except Exception as e:
            result['errors'].append(f"Validation error: {str(e)}")
            return result
    
    def validate_video_file(self, file_data: bytes, filename: str) -> Dict[str, Any]:
        """Valida archivo de video"""
        result = {
            'valid': False,
            'errors': [],
            'warnings': [],
            'metadata': {}
        }
        
        try:
            # Verificar tamaño
            if len(file_data) > self.max_video_size:
                result['errors'].append(f"File too large: {len(file_data)} bytes (max: {self.max_video_size})")
                return result
            
            # Verificar MIME type
            mime_type = self._detect_mime_type(file_data)
            if mime_type not in self.allowed_video_types:
                result['errors'].append(f"Invalid video type: {mime_type}")
                return result
            
            # TODO: Validación más profunda con ffprobe si está disponible
            
            result['valid'] = len(result['errors']) == 0
            return result
            
        except Exception as e:
            result['errors'].append(f"Validation error: {str(e)}")
            return result
    
    def _detect_mime_type(self, file_data: bytes) -> str:
        """Detecta MIME type por magic bytes"""
        if file_data.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        elif file_data.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'image/png'
        elif file_data.startswith(b'GIF87a') or file_data.startswith(b'GIF89a'):
            return 'image/gif'
        elif file_data.startswith(b'RIFF') and b'WEBP' in file_data[:12]:
            return 'image/webp'
        elif file_data.startswith(b'\x00\x00\x00\x18ftypmp4') or file_data.startswith(b'\x00\x00\x00\x1cftyp'):
            return 'video/mp4'
        elif file_data.startswith(b'\x1a\x45\xdf\xa3'):
            return 'video/webm'
        elif file_data.startswith(b'RIFF') and b'AVI ' in file_data[:12]:
            return 'video/avi'
        elif file_data.startswith(b'\x00\x00\x00\x14ftypqt'):
            return 'video/quicktime'
        else:
            return 'application/octet-stream'
    
    def _mime_to_extension(self, mime_type: str) -> str:
        """Convierte MIME type a extensión esperada"""
        mime_to_ext = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'video/avi': '.avi',
            'video/quicktime': '.mov'
        }
        return mime_to_ext.get(mime_type, '')


# Instancias globales para uso fácil
image_processor = ImageProcessor()
video_processor = VideoProcessor()
media_validator = MediaValidator()