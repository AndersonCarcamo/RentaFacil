from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Agency(Base):
    __tablename__ = "agencies"
    __table_args__ = {"schema": "core"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    email = Column(String, nullable=True)  # CITEXT in DB
    phone = Column(Text, nullable=True)
    website = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Agency(id={self.id}, name={self.name}, is_verified={self.is_verified})>"

class AgencyAgent(Base):
    __tablename__ = "user_agency"
    __table_args__ = {"schema": "core"}

    user_id = Column(UUID(as_uuid=True), nullable=False, primary_key=True)
    agency_id = Column(UUID(as_uuid=True), nullable=False, primary_key=True)
    role = Column(Text, default='agent')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AgencyAgent(agency_id={self.agency_id}, user_id={self.user_id}, role={self.role})>"
