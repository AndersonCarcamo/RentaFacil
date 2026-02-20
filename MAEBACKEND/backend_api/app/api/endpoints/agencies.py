from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.agencies import (
    CreateAgencyRequest, UpdateAgencyRequest, AgencyResponse, AgencyAgentResponse, AddAgentRequest, VerificationRequest
)
from app.services.agency_service import AgencyService
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.models.agency import AgencyAgent
from typing import List, Optional
import uuid

router = APIRouter()

@router.get("/", response_model=List[AgencyResponse], summary="Listar agencias")
async def list_agencies(city: str = None, verified: bool = None, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        agencies = service.list_agencies(verified=verified)
        return [AgencyResponse.from_orm(a) for a in agencies]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing agencies: {str(e)}")

@router.get("/me/agency", response_model=AgencyResponse, summary="Obtener agencia del usuario actual")
async def get_my_agency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get the agency associated with the current user (for agency owners/agents)."""
    try:
        # Query the user_agency table to find the user's agency
        user_agency = db.query(AgencyAgent).filter(
            AgencyAgent.user_id == current_user.id
        ).first()
        
        if not user_agency:
            # If user is an agent or landlord, auto-create a personal agency
            if current_user.role in ['agent', 'landlord']:
                from app.models.agency import Agency
                from app.schemas.agencies import CreateAgencyRequest
                
                # Create a personal agency for the user
                agency_name = f"{current_user.first_name or 'Mi'} {current_user.last_name or 'Agencia'}"
                service = AgencyService(db)
                
                new_agency_data = CreateAgencyRequest(
                    name=agency_name.strip(),
                    email=current_user.email,
                    phone=current_user.phone,
                    description=f"Agencia personal de {agency_name.strip()}"
                )
                
                new_agency = service.create_agency(new_agency_data)
                
                # Associate the user with the new agency as owner
                user_agency_relation = AgencyAgent(
                    user_id=current_user.id,
                    agency_id=new_agency.id,
                    role='owner'
                )
                db.add(user_agency_relation)
                db.commit()
                
                return AgencyResponse.from_orm(new_agency)
            else:
                raise HTTPException(
                    status_code=404, 
                    detail="User is not associated with any agency"
                )
        
        # Get the agency details
        service = AgencyService(db)
        agency = service.get_agency(str(user_agency.agency_id))
        
        if not agency:
            raise HTTPException(status_code=404, detail="Agency not found")
            
        return AgencyResponse.from_orm(agency)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user's agency: {str(e)}")

@router.post("/", response_model=AgencyResponse, status_code=status.HTTP_201_CREATED, summary="Crear agencia")
async def create_agency(request: CreateAgencyRequest, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        agency = service.create_agency(request)
        return AgencyResponse.from_orm(agency)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating agency: {str(e)}")

@router.get("/{agency_id}", response_model=AgencyResponse, summary="Obtener agencia por ID")
async def get_agency(agency_id: str, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        agency = service.get_agency(agency_id)
        if not agency:
            raise HTTPException(status_code=404, detail="Agency not found")
        return AgencyResponse.from_orm(agency)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid agency ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving agency: {str(e)}")

@router.put("/{agency_id}", response_model=AgencyResponse, summary="Actualizar agencia")
async def update_agency(agency_id: str, request: UpdateAgencyRequest, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        agency = service.update_agency(agency_id, request)
        if not agency:
            raise HTTPException(status_code=404, detail="Agency not found")
        return AgencyResponse.from_orm(agency)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid agency ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating agency: {str(e)}")

@router.delete("/{agency_id}", status_code=status.HTTP_200_OK, summary="Eliminar agencia")
async def delete_agency(agency_id: str, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        success = service.delete_agency(agency_id)
        if not success:
            raise HTTPException(status_code=404, detail="Agency not found")
        return {"message": "Agency deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid agency ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting agency: {str(e)}")

@router.get("/{agency_id}/agents", summary="Listar agentes de la agencia")
async def list_agents(
    agency_id: str, 
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get list of all agents in the agency with full user information.
    Returns data compatible with AgentListResponse.
    """
    try:
        from app.services.agent_service import AgentService
        from uuid import UUID
        
        agent_service = AgentService(db)
        
        # Get agents with full user data
        agents = agent_service.get_agency_agents(UUID(agency_id), include_inactive)
        
        # Get pending invitations count
        pending_invitations = agent_service.get_pending_invitations(UUID(agency_id))
        
        # Calculate stats
        active_count = sum(1 for agent in agents if agent["is_active"])
        inactive_count = len(agents) - active_count
        
        return {
            "agents": agents,
            "total": len(agents),
            "active_count": active_count,
            "inactive_count": inactive_count,
            "pending_invitations": len(pending_invitations)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid agency ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing agents: {str(e)}")

@router.post("/{agency_id}/agents", response_model=AgencyAgentResponse, status_code=status.HTTP_201_CREATED, summary="Agregar agente a la agencia")
async def add_agent(agency_id: str, request: AddAgentRequest, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        agent = service.add_agent(agency_id, request.user_id)
        return AgencyAgentResponse.from_orm(agent)
    except ValueError as e:
        if "already an agent" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding agent: {str(e)}")

@router.delete("/{agency_id}/agents/{user_id}", status_code=status.HTTP_200_OK, summary="Remover agente de la agencia")
async def remove_agent(agency_id: str, user_id: str, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        success = service.remove_agent(agency_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Agent relationship not found")
        return {"message": "Agent removed"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing agent: {str(e)}")

@router.post("/{agency_id}/verification", status_code=status.HTTP_200_OK, summary="Solicitar verificación de agencia")
async def request_verification(agency_id: str, request: VerificationRequest, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        success = service.request_verification(agency_id, request.documents)
        if not success:
            raise HTTPException(status_code=404, detail="Agency not found")
        return {"message": "Verification requested"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid agency ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error requesting verification: {str(e)}")
