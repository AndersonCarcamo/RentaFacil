from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict
from typing import Optional
import os


DEFAULT_ENV_FILE = os.getenv("SETTINGS_ENV_FILE", ".env.production")


class Settings(BaseSettings):
    # Database
    database_url: str
    database_url_test: Optional[str] = None
    db_pool_profile: Optional[str] = None
    db_pool_size: Optional[int] = None
    db_max_overflow: Optional[int] = None
    db_pool_timeout: Optional[int] = None
    db_pool_recycle: Optional[int] = None
    db_pool_pre_ping: Optional[bool] = None
    db_pool_per_worker: int = 8
    db_postgres_connection_budget: int = 120
    db_reserved_connections: int = 20
    
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Firebase Authentication
    firebase_service_account_path: Optional[str] = None
    firebase_service_account_json: Optional[str] = None
    firebase_project_id: Optional[str] = None
    
    # Application
    app_name: str = "EasyRent API"
    app_version: str = "1.0.0"
    debug: bool = False
    api_docs_enabled: bool = False
    environment: str = "production"
    allowed_hosts: str = "localhost,127.0.0.1"
    cors_allowed_origins: Optional[str] = None
    enforce_https_redirect: bool = True
    
    # Email
    email_enabled: bool = True
    smtp_host: str = "smtp.gmail.com"
    smtp_user: Optional[str] = None
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: str = "noreply@easyrent.com"
    email_from: str = "noreply@easyrent.pe"
    email_from_name: str = "EasyRent"
    
    # Frontend
    frontend_url: str = "http://localhost:3000"
    
    # Security
    bcrypt_rounds: int = 12
    email_verification_expire_hours: int = 24
    password_reset_expire_hours: int = 1
    
    # Rate Limiting
    rate_limit_per_minute: int = 60

    # Redis / Cache
    redis_url: str = "redis://localhost:6379/1"
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 1
    redis_password: Optional[str] = None
    search_cache_ttl_seconds: int = 120
    search_cache_version_key: str = "search:version"
    search_cache_prewarm_enabled: bool = True
    listing_detail_cache_ttl_seconds: int = 300
    static_cache_ttl_seconds: int = 1800

    # Celery
    celery_broker_url: Optional[str] = None
    celery_result_backend: Optional[str] = None
    notification_queue_drain_interval_seconds: int = 30
    
    # File Upload
    max_file_size: int = 10485760  # 10MB
    allowed_image_types: str = "image/jpeg,image/png,image/webp"
    upload_directory: str = "uploads"
    
    # Media Storage
    use_s3: bool = False
    s3_bucket_name: str = "easyrent-media"
    aws_region: str = "us-east-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    cdn_base_url: Optional[str] = None
    upload_path: str = "./uploads"
    api_base_url: str = "http://localhost:8000"
    
    # Media Limits (defaults - will be overridden by user plan)
    default_max_images_per_listing: int = 25
    default_max_videos_per_listing: int = 5
    max_image_size: int = 10485760  # 10MB
    max_video_size: int = 104857600  # 100MB
    
    # Culqi Payment Gateway
    culqi_public_key: Optional[str] = None
    culqi_secret_key: Optional[str] = None
    culqi_api_url: str = "https://api.culqi.com/v2"
    culqi_rsa_id: Optional[str] = None  # RSA ID from CulqiPanel -> Desarrollo -> RSA Keys
    culqi_rsa_public_key: Optional[str] = None  # RSA Public Key for payload encryption
    
    model_config = SettingsConfigDict(
        env_file=DEFAULT_ENV_FILE,
        case_sensitive=False,
        extra="ignore",
    )


# Global settings instance
settings = Settings()
