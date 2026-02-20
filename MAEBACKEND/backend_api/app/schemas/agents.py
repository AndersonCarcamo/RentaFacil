"""
Schemas for agent management
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class AgentInviteRequest(BaseModel):
    """Request to invite a new agent to an agency"""
    email: EmailStr = Field(..., description="Agent's email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="Agent's first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Agent's last name")
    phone: Optional[str] = Field(None, description="Agent's phone number")


class AgentInvitationResponse(BaseModel):
    """Response for an agent invitation"""
    id: UUID
    agency_id: UUID
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    token: str
    status: str
    expires_at: datetime
    created_at: datetime
    invited_by_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class AgentResponse(BaseModel):
    """Response for agent information"""
    id: UUID
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    profile_picture_url: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime]
    
    # Agency relationship
    agency_id: UUID
    agency_role: str = "agent"
    joined_agency_at: datetime
    
    # Stats
    listings_count: int = 0
    active_listings_count: int = 0
    
    class Config:
        from_attributes = True


class AgentUpdateRequest(BaseModel):
    """Request to update agent information"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class AgentStatsResponse(BaseModel):
    """Statistics for an agent"""
    agent_id: UUID
    total_listings: int = 0
    active_listings: int = 0
    draft_listings: int = 0
    archived_listings: int = 0
    total_views: int = 0
    total_contacts: int = 0
    average_price: Optional[float] = None


class AgentListResponse(BaseModel):
    """Response for list of agents"""
    agents: List[AgentResponse]
    total: int
    active_count: int
    inactive_count: int
    pending_invitations: int


class AcceptInvitationRequest(BaseModel):
    """Request to accept an agent invitation"""
    token: str = Field(..., description="Invitation token")
    password: str = Field(..., min_length=8, description="Password for new account")
    phone: Optional[str] = Field(None, description="Phone number")


class AcceptInvitationResponse(BaseModel):
    """Response after accepting invitation"""
    user_id: UUID
    email: str
    agency_id: UUID
    agency_name: str
    access_token: str
    token_type: str = "bearer"
    
    class Config:
        from_attributes = True
