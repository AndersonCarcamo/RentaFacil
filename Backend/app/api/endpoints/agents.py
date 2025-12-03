"""
Agent management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from uuid import UUID
import logging

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.agents import (
    AgentInviteRequest,
    AgentInvitationResponse,
    AgentResponse,
    AgentUpdateRequest,
    AgentListResponse,
    AcceptInvitationRequest,
    AcceptInvitationResponse
)
from app.services.agent_service import AgentService
from app.core.exceptions import http_403_forbidden, http_404_not_found
from app.core.security import create_access_token, get_password_hash
from datetime import timedelta

logger = logging.getLogger(__name__)

router = APIRouter()


def require_agency_owner(agency_id: UUID, current_user: dict, db: Session):
    """Verify that current user is owner of the agency"""
    service = AgentService(db)
    if not service.verify_agency_owner(UUID(current_user["user_id"]), agency_id):
        raise http_403_forbidden("You don't have permission to manage this agency")


@router.post("/{agency_id}/agents/invite",
    response_model=AgentInvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a new agent to the agency"
)
async def invite_agent(
    agency_id: UUID,
    data: AgentInviteRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Send an invitation to a new agent.
    Only agency owners can invite agents.
    """
    # Verify permissions
    require_agency_owner(agency_id, current_user, db)
    
    service = AgentService(db)
    invitation = service.create_invitation(
        agency_id=agency_id,
        invited_by_user_id=UUID(current_user["user_id"]),
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone
    )
    
    # TODO: Send email with invitation link
    # Email should contain: https://yourapp.com/accept-invitation?token={token}
    
    logger.info(f"Agent invitation created for {data.email} by user {current_user['user_id']}")
    
    return AgentInvitationResponse(**invitation)


@router.get("/{agency_id}/agents",
    response_model=AgentListResponse,
    summary="Get all agents in the agency"
)
async def get_agents(
    agency_id: UUID,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of all agents in the agency.
    Agency members can view agents.
    """
    service = AgentService(db)
    
    # Get agents
    agents = service.get_agency_agents(agency_id, include_inactive)
    
    # Get pending invitations count
    pending_invitations = service.get_pending_invitations(agency_id)
    
    # Calculate stats
    active_count = sum(1 for agent in agents if agent["is_active"])
    inactive_count = len(agents) - active_count
    
    return AgentListResponse(
        agents=[AgentResponse(**agent) for agent in agents],
        total=len(agents),
        active_count=active_count,
        inactive_count=inactive_count,
        pending_invitations=len(pending_invitations)
    )


@router.get("/{agency_id}/agents/{agent_id}",
    response_model=AgentResponse,
    summary="Get agent details"
)
async def get_agent_details(
    agency_id: UUID,
    agent_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific agent.
    """
    service = AgentService(db)
    agent = service.get_agent_details(agency_id, agent_id)
    
    if not agent:
        raise http_404_not_found("Agent not found")
    
    return AgentResponse(**agent)


@router.put("/{agency_id}/agents/{agent_id}",
    response_model=dict,
    summary="Update agent information"
)
async def update_agent(
    agency_id: UUID,
    agent_id: UUID,
    data: AgentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update agent information.
    Only agency owners can update agent info.
    """
    require_agency_owner(agency_id, current_user, db)
    
    service = AgentService(db)
    success = service.update_agent(
        agency_id=agency_id,
        agent_id=agent_id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        is_active=data.is_active
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update agent")
    
    return {"message": "Agent updated successfully"}


@router.delete("/{agency_id}/agents/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove agent from agency"
)
async def remove_agent(
    agency_id: UUID,
    agent_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Remove an agent from the agency.
    Only agency owners can remove agents.
    """
    require_agency_owner(agency_id, current_user, db)
    
    service = AgentService(db)
    success = service.remove_agent(agency_id, agent_id)
    
    if not success:
        raise http_404_not_found("Agent not found")
    
    logger.info(f"Agent {agent_id} removed from agency {agency_id}")


@router.get("/{agency_id}/invitations",
    response_model=List[AgentInvitationResponse],
    summary="Get pending invitations"
)
async def get_pending_invitations(
    agency_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all pending invitations for the agency.
    """
    service = AgentService(db)
    invitations = service.get_pending_invitations(agency_id)
    
    return [AgentInvitationResponse(**inv) for inv in invitations]


@router.delete("/{agency_id}/invitations/{invitation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke an invitation"
)
async def revoke_invitation(
    agency_id: UUID,
    invitation_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Revoke a pending invitation.
    Only agency owners can revoke invitations.
    """
    require_agency_owner(agency_id, current_user, db)
    
    service = AgentService(db)
    success = service.revoke_invitation(
        agency_id=agency_id,
        invitation_id=invitation_id,
        revoked_by=UUID(current_user["user_id"])
    )
    
    if not success:
        raise http_404_not_found("Invitation not found or already processed")
    
    logger.info(f"Invitation {invitation_id} revoked")


# Public endpoint - no authentication required
@router.post("/invitations/accept",
    response_model=AcceptInvitationResponse,
    summary="Accept agent invitation"
)
async def accept_invitation(
    data: AcceptInvitationRequest,
    db: Session = Depends(get_db)
):
    """
    Accept an agent invitation and create account.
    This is a public endpoint.
    """
    try:
        # Get invitation details
        result = db.execute(text("""
            SELECT 
                i.id,
                i.agency_id,
                i.email,
                i.first_name,
                i.last_name,
                i.phone,
                a.name as agency_name
            FROM core.agent_invitations i
            JOIN core.agencies a ON i.agency_id = a.id
            WHERE i.token = :token
            AND i.status = 'pending'
            AND i.expires_at > now()
        """), {"token": data.token})
        
        invitation = result.fetchone()
        
        if not invitation:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired invitation token"
            )
        
        inv_id, agency_id, email, first_name, last_name, phone, agency_name = invitation
        
        # Use phone from request if provided, otherwise use from invitation
        final_phone = data.phone if data.phone else phone
        
        # Check if user already exists
        existing_user = db.execute(text("""
            SELECT id FROM core.users WHERE email = :email
        """), {"email": email}).fetchone()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create user account
        hashed_password = get_password_hash(data.password)
        
        user_result = db.execute(text("""
            INSERT INTO core.users 
            (email, first_name, last_name, phone, firebase_uid, role, is_active)
            VALUES (:email, :first_name, :last_name, :phone, :firebase_uid, 'agent', true)
            RETURNING id
        """), {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "phone": final_phone,
            "firebase_uid": hashed_password  # Store hashed password temporarily
        })
        
        user_id = user_result.fetchone()[0]
        
        # Link user to agency
        db.execute(text("""
            INSERT INTO core.user_agency (user_id, agency_id, role)
            VALUES (:user_id, :agency_id, 'agent')
        """), {"user_id": user_id, "agency_id": agency_id})
        
        # Mark invitation as accepted
        db.execute(text("""
            UPDATE core.agent_invitations
            SET status = 'accepted',
                accepted_at = now(),
                accepted_by_user_id = :user_id
            WHERE id = :invitation_id
        """), {"invitation_id": inv_id, "user_id": user_id})
        
        db.commit()
        
        # Create access token
        access_token = create_access_token(
            data={
                "sub": str(user_id),
                "email": email,
                "role": "agent"
            },
            expires_delta=timedelta(days=30)
        )
        
        logger.info(f"Agent {email} accepted invitation and created account")
        
        return AcceptInvitationResponse(
            user_id=user_id,
            email=email,
            agency_id=agency_id,
            agency_name=agency_name,
            access_token=access_token,
            token_type="bearer"
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error accepting invitation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
