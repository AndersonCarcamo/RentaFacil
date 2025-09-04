from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class AgencyStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"

class AgencyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=6, max_length=20)
    email: EmailStr
    address: str = Field(..., min_length=2, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    district: Optional[str] = None

class CreateAgencyRequest(AgencyBase):
    pass

class UpdateAgencyRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    status: Optional[AgencyStatus] = None

class AgencyResponse(AgencyBase):
    id: str
    status: AgencyStatus
    verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AgencyAgentResponse(BaseModel):
    id: str
    agency_id: str
    user_id: str
    created_at: datetime

class AddAgentRequest(BaseModel):
    user_id: str

class VerificationRequest(BaseModel):
    documents: List[str] = Field(..., description="List of document URLs for verification")
