from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
import uuid

class AgencyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=500)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None

class CreateAgencyRequest(AgencyBase):
    name: str = Field(..., min_length=2, max_length=500)

class UpdateAgencyRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None

class AgencyResponse(AgencyBase):
    id: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class AgencyAgentResponse(BaseModel):
    user_id: str
    agency_id: str
    role: str
    created_at: datetime

    @field_validator('user_id', 'agency_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class AddAgentRequest(BaseModel):
    user_id: str

class VerificationRequest(BaseModel):
    documents: List[str] = Field(..., description="List of document URLs for verification")
