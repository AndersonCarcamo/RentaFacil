import redis
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import pickle
import os

logger = logging.getLogger(__name__)

class MediaCacheService:
    """
    Servicio de cache con Redis para metadatos de media y thumbnails.
    Optimiza el rendimiento cachando información frecuentemente accedida.
    """
    
    def __init__(self):
        # Configuración Redis
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/1")
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = int(os.getenv("REDIS_PORT", "6379"))
        self.redis_db = int(os.getenv("REDIS_DB", "1"))  # DB separada para media
        self.redis_password = os.getenv("REDIS_PASSWORD", None)
        
        # TTLs (Time To Live) para diferentes tipos de cache
        self.metadata_ttl = int(os.getenv("CACHE_METADATA_TTL", "86400"))  # 24 horas
        self.thumbnail_ttl = int(os.getenv("CACHE_THUMBNAIL_TTL", "604800"))  # 7 días
        self.listing_media_ttl = int(os.getenv("CACHE_LISTING_TTL", "3600"))  # 1 hora
        
        # Prefijos para organizar keys
        self.prefixes = {
            'image_meta': 'img_meta:',
            'video_meta': 'vid_meta:',
            'thumbnail': 'thumb:',
            'listing_images': 'listing_imgs:',
            'listing_videos': 'listing_vids:',
            'media_stats': 'stats:',
            'processed_uploads': 'processed:'
        }
        
        # Inicializar conexión Redis
        self._init_redis()
    
    def _init_redis(self):
        """Inicializa conexión con Redis con manejo de errores"""
        try:
            if self.redis_url and self.redis_url.startswith('redis://'):
                self.redis = redis.from_url(self.redis_url)
            else:
                self.redis = redis.Redis(
                    host=self.redis_host,
                    port=self.redis_port,
                    db=self.redis_db,
                    password=self.redis_password,
                    decode_responses=False,  # Para manejar datos binarios
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True
                )
            
            # Verificar conexión
            self.redis.ping()
            self.redis_available = True
            logger.info(f"Redis connected successfully at {self.redis_host}:{self.redis_port}/{self.redis_db}")
            
        except Exception as e:
            logger.warning(f"Redis not available: {e}. Media cache disabled.")
            self.redis_available = False
            self.redis = None
    
    def is_available(self) -> bool:
        """Verifica si Redis está disponible"""
        return self.redis_available and self.redis is not None
    
    # =====================================
    # CACHE DE METADATOS
    # =====================================
    
    def cache_image_metadata(self, image_id: str, metadata: Dict[str, Any]) -> bool:
        """
        Cachea metadatos de imagen
        
        Args:
            image_id: ID único de la imagen
            metadata: Diccionario con metadatos
            
        Returns:
            bool: True si se cacheó correctamente
        """
        if not self.is_available():
            return False
        
        try:
            key = f"{self.prefixes['image_meta']}{image_id}"
            serialized_data = json.dumps(metadata, default=str, ensure_ascii=False)
            
            return self.redis.setex(key, self.metadata_ttl, serialized_data)
            
        except Exception as e:
            logger.error(f"Error caching image metadata {image_id}: {e}")
            return False
    
    def get_image_metadata(self, image_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene metadatos de imagen desde cache
        
        Args:
            image_id: ID único de la imagen
            
        Returns:
            Dict con metadatos o None si no existe
        """
        if not self.is_available():
            return None
        
        try:
            key = f"{self.prefixes['image_meta']}{image_id}"
            cached_data = self.redis.get(key)
            
            if cached_data:
                return json.loads(cached_data.decode('utf-8'))
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting image metadata {image_id}: {e}")
            return None
    
    def cache_video_metadata(self, video_id: str, metadata: Dict[str, Any]) -> bool:
        """Cachea metadatos de video"""
        if not self.is_available():
            return False
        
        try:
            key = f"{self.prefixes['video_meta']}{video_id}"
            serialized_data = json.dumps(metadata, default=str, ensure_ascii=False)
            
            return self.redis.setex(key, self.metadata_ttl, serialized_data)
            
        except Exception as e:
            logger.error(f"Error caching video metadata {video_id}: {e}")
            return False
    
    def get_video_metadata(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene metadatos de video desde cache"""
        if not self.is_available():
            return None
        
        try:
            key = f"{self.prefixes['video_meta']}{video_id}"
            cached_data = self.redis.get(key)
            
            if cached_data:
                return json.loads(cached_data.decode('utf-8'))
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting video metadata {video_id}: {e}")
            return None
    
    # =====================================
    # CACHE DE THUMBNAILS
    # =====================================
    
    def cache_thumbnail_path(self, media_id: str, size: str, thumbnail_path: str) -> bool:
        """
        Cachea la ruta de un thumbnail generado
        
        Args:
            media_id: ID del media (imagen o video)
            size: Tamaño del thumbnail (small, medium, large)
            thumbnail_path: Ruta completa del thumbnail
            
        Returns:
            bool: True si se cacheó correctamente
        """
        if not self.is_available():
            return False
        
        try:
            key = f"{self.prefixes['thumbnail']}{media_id}:{size}"
            return self.redis.setex(key, self.thumbnail_ttl, thumbnail_path)
            
        except Exception as e:
            logger.error(f"Error caching thumbnail path {media_id}:{size}: {e}")
            return False
    
    def get_thumbnail_path(self, media_id: str, size: str) -> Optional[str]:
        """
        Obtiene la ruta de un thumbnail desde cache
        
        Args:
            media_id: ID del media
            size: Tamaño del thumbnail
            
        Returns:
            Ruta del thumbnail o None si no existe
        """
        if not self.is_available():
            return None
        
        try:
            key = f"{self.prefixes['thumbnail']}{media_id}:{size}"
            cached_path = self.redis.get(key)
            
            if cached_path:
                return cached_path.decode('utf-8')
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting thumbnail path {media_id}:{size}: {e}")
            return None
    
    def cache_thumbnails_batch(self, media_id: str, thumbnails: Dict[str, str]) -> bool:
        """Cachea múltiples thumbnails de una vez"""
        if not self.is_available():
            return False
        
        try:
            pipeline = self.redis.pipeline()
            
            for size, path in thumbnails.items():
                key = f"{self.prefixes['thumbnail']}{media_id}:{size}"
                pipeline.setex(key, self.thumbnail_ttl, path)
            
            results = pipeline.execute()
            return all(results)
            
        except Exception as e:
            logger.error(f"Error batch caching thumbnails {media_id}: {e}")
            return False
    
    # =====================================
    # CACHE DE LISTADOS DE MEDIA
    # =====================================
    
    def cache_listing_images(self, listing_id: str, image_ids: List[str]) -> bool:
        """
        Cachea lista de IDs de imágenes de un listing
        
        Args:
            listing_id: ID del listing
            image_ids: Lista de IDs de imágenes
            
        Returns:
            bool: True si se cacheó correctamente
        """
        if not self.is_available():
            return False
        
        try:
            key = f"{self.prefixes['listing_images']}{listing_id}"
            serialized_ids = json.dumps(image_ids)
            
            return self.redis.setex(key, self.listing_media_ttl, serialized_ids)
            
        except Exception as e:
            logger.error(f"Error caching listing images {listing_id}: {e}")
            return False
    
    def get_listing_images(self, listing_id: str) -> Optional[List[str]]:
        """Obtiene lista de IDs de imágenes desde cache"""
        if not self.is_available():
            return None
        
        try:
            key = f"{self.prefixes['listing_images']}{listing_id}"
            cached_data = self.redis.get(key)
            
            if cached_data:
                return json.loads(cached_data.decode('utf-8'))
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting listing images {listing_id}: {e}")
            return None
    
    def cache_listing_videos(self, listing_id: str, video_ids: List[str]) -> bool:
        """Cachea lista de IDs de videos de un listing"""
        if not self.is_available():
            return False
        
        try:
            key = f"{self.prefixes['listing_videos']}{listing_id}"
            serialized_ids = json.dumps(video_ids)
            
            return self.redis.setex(key, self.listing_media_ttl, serialized_ids)
            
        except Exception as e:
            logger.error(f"Error caching listing videos {listing_id}: {e}")
            return False
    
    def get_listing_videos(self, listing_id: str) -> Optional[List[str]]:
        """Obtiene lista de IDs de videos desde cache"""
        if not self.is_available():
            return None
        
        try:
            key = f"{self.prefixes['listing_videos']}{listing_id}"
            cached_data = self.redis.get(key)
            
            if cached_data:
                return json.loads(cached_data.decode('utf-8'))
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting listing videos {listing_id}: {e}")
            return None
    
    # =====================================
    # CACHE DE ESTADÍSTICAS
    # =====================================
    
    def increment_media_stat(self, stat_name: str, value: int = 1) -> bool:
        """
        Incrementa estadística de media
        
        Args:
            stat_name: Nombre de la estadística (uploads_today, total_images, etc.)
            value: Valor a incrementar
            
        Returns:
            bool: True si se incrementó correctamente
        """
        if not self.is_available():
            return False
        
        try:
            key = f"{self.prefixes['media_stats']}{stat_name}"
            self.redis.incrby(key, value)
            
            # Establecer expiración para stats diarias
            if 'today' in stat_name:
                # Calcular segundos hasta medianoche
                now = datetime.now()
                tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                seconds_until_midnight = int((tomorrow - now).total_seconds())
                self.redis.expire(key, seconds_until_midnight)
            
            return True
            
        except Exception as e:
            logger.error(f"Error incrementing stat {stat_name}: {e}")
            return False
    
    def get_media_stat(self, stat_name: str) -> int:
        """Obtiene estadística de media"""
        if not self.is_available():
            return 0
        
        try:
            key = f"{self.prefixes['media_stats']}{stat_name}"
            value = self.redis.get(key)
            
            return int(value) if value else 0
            
        except Exception as e:
            logger.error(f"Error getting stat {stat_name}: {e}")
            return 0
    
    # =====================================
    # CACHE DE UPLOADS PROCESADOS
    # =====================================
    
    def mark_upload_processed(self, upload_id: str, result_data: Dict[str, Any]) -> bool:
        """
        Marca un upload como procesado para evitar duplicados
        
        Args:
            upload_id: ID único del upload
            result_data: Datos del resultado del procesamiento
            
        Returns:
            bool: True si se marcó correctamente
        """
        if not self.is_available():
            return False
        
        try:
            key = f"{self.prefixes['processed_uploads']}{upload_id}"
            serialized_data = json.dumps(result_data, default=str)
            
            # Mantener por 1 hora para evitar resubidas inmediatas
            return self.redis.setex(key, 3600, serialized_data)
            
        except Exception as e:
            logger.error(f"Error marking upload processed {upload_id}: {e}")
            return False
    
    def is_upload_processed(self, upload_id: str) -> Optional[Dict[str, Any]]:
        """Verifica si un upload ya fue procesado"""
        if not self.is_available():
            return None
        
        try:
            key = f"{self.prefixes['processed_uploads']}{upload_id}"
            cached_data = self.redis.get(key)
            
            if cached_data:
                return json.loads(cached_data.decode('utf-8'))
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking processed upload {upload_id}: {e}")
            return None
    
    # =====================================
    # INVALIDACIÓN DE CACHE
    # =====================================
    
    def invalidate_listing_cache(self, listing_id: str) -> bool:
        """
        Invalida todo el cache relacionado con un listing
        
        Args:
            listing_id: ID del listing
            
        Returns:
            bool: True si se invalidó correctamente
        """
        if not self.is_available():
            return False
        
        try:
            # Obtener keys relacionadas con el listing
            pattern_keys = [
                f"{self.prefixes['listing_images']}{listing_id}",
                f"{self.prefixes['listing_videos']}{listing_id}"
            ]
            
            # Eliminar keys específicas
            pipeline = self.redis.pipeline()
            for key in pattern_keys:
                pipeline.delete(key)
            
            pipeline.execute()
            logger.info(f"Cache invalidated for listing {listing_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating listing cache {listing_id}: {e}")
            return False
    
    def invalidate_media_cache(self, media_id: str, media_type: str = None) -> bool:
        """
        Invalida cache de un media específico
        
        Args:
            media_id: ID del media
            media_type: 'image' o 'video' (opcional)
            
        Returns:
            bool: True si se invalidó correctamente
        """
        if not self.is_available():
            return False
        
        try:
            pipeline = self.redis.pipeline()
            
            # Invalidar metadatos
            if media_type == 'image' or media_type is None:
                pipeline.delete(f"{self.prefixes['image_meta']}{media_id}")
            
            if media_type == 'video' or media_type is None:
                pipeline.delete(f"{self.prefixes['video_meta']}{media_id}")
            
            # Invalidar thumbnails
            for size in ['small', 'medium', 'large']:
                pipeline.delete(f"{self.prefixes['thumbnail']}{media_id}:{size}")
            
            pipeline.execute()
            logger.info(f"Cache invalidated for media {media_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating media cache {media_id}: {e}")
            return False
    
    def clear_all_media_cache(self) -> bool:
        """Limpia todo el cache de media (usar con precaución)"""
        if not self.is_available():
            return False
        
        try:
            # Buscar todas las keys con prefijos de media
            all_patterns = list(self.prefixes.values())
            
            pipeline = self.redis.pipeline()
            for prefix in all_patterns:
                # Obtener keys que coincidan con el patrón
                keys = self.redis.keys(f"{prefix}*")
                for key in keys:
                    pipeline.delete(key)
            
            pipeline.execute()
            logger.info("All media cache cleared")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing all media cache: {e}")
            return False
    
    # =====================================
    # UTILIDADES Y ESTADÍSTICAS
    # =====================================
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas del cache"""
        if not self.is_available():
            return {'available': False}
        
        try:
            info = self.redis.info()
            
            # Contar keys por tipo
            key_counts = {}
            for cache_type, prefix in self.prefixes.items():
                keys = self.redis.keys(f"{prefix}*")
                key_counts[cache_type] = len(keys)
            
            return {
                'available': True,
                'redis_info': {
                    'used_memory': info.get('used_memory_human', 'unknown'),
                    'connected_clients': info.get('connected_clients', 0),
                    'total_commands_processed': info.get('total_commands_processed', 0),
                    'keyspace_hits': info.get('keyspace_hits', 0),
                    'keyspace_misses': info.get('keyspace_misses', 0)
                },
                'key_counts': key_counts,
                'hit_ratio': self._calculate_hit_ratio(info)
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {'available': False, 'error': str(e)}
    
    def _calculate_hit_ratio(self, info: Dict) -> float:
        """Calcula el ratio de aciertos del cache"""
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        
        if hits + misses == 0:
            return 0.0
        
        return round(hits / (hits + misses) * 100, 2)