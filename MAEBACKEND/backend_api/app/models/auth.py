from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, CITEXT
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

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Firebase integration
    firebase_uid = Column(Text, unique=True, nullable=True, index=True)
    
    # Core user information
    email = Column(CITEXT, unique=True, nullable=False, index=True)
    phone = Column(Text, nullable=True)
    
    # Profile information
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    national_id = Column(Text, nullable=True)
    national_id_type = Column(Text, default='DNI')
    
    # Agency information (for agents)
    agency_name = Column(Text, nullable=True)
    
    # Status and verification
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), 
                  nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, 
                       server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    login_count = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
