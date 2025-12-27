from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/easy_rent"
    database_url_test: str = "postgresql://postgres:password@localhost:5432/easy_rent_test"
    
    # JWT
    secret_key: str = "dev-secret-key-change-in-production"
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
    debug: bool = True
    environment: str = "development"
    
    # Email
    email_enabled: bool = True
    smtp_host: str = "smtp.gmail.com"
    smtp_user: Optional[str] = None
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: str = "noreply@easyrent.com"  # Campo agregado
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
    culqi_public_key: str = "pk_test_SsNSbc4aceAySSp3"
    culqi_secret_key: str = "sk_test_yrsjDrloVOls3E62"
    culqi_api_url: str = "https://api.culqi.com/v2"
    culqi_rsa_id: Optional[str] = None  # RSA ID from CulqiPanel -> Desarrollo -> RSA Keys
    culqi_rsa_public_key: Optional[str] = None  # RSA Public Key for payload encryption
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
