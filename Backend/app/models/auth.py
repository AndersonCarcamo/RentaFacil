from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    TENANT = "tenant"
    LANDLORD = "landlord"
    AGENT = "agent"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "core"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(Text, unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    
    # Profile information
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    profile_picture_url = Column(String(500), nullable=True)
    national_id = Column(String(50), nullable=True)
    national_id_type = Column(String(10), default='DNI')
    
    # Role and status
    is_verified = Column(Boolean, default=False)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
