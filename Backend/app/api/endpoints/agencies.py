from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.agencies import (
    CreateAgencyRequest, UpdateAgencyRequest, AgencyResponse, AgencyAgentResponse, AddAgentRequest, VerificationRequest
)
from app.services.agency_service import AgencyService
from typing import List

router = APIRouter()

@router.get("/", response_model=List[AgencyResponse], summary="Listar agencias")
async def list_agencies(city: str = None, verified: bool = None, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        agencies = service.list_agencies(verified=verified)
        return [AgencyResponse.from_orm(a) for a in agencies]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing agencies: {str(e)}")

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

@router.get("/{agency_id}/agents", response_model=List[AgencyAgentResponse], summary="Listar agentes de la agencia")
async def list_agents(agency_id: str, db: Session = Depends(get_db)):
    try:
        service = AgencyService(db)
        # First check if agency exists
        agency = service.get_agency(agency_id)
        if not agency:
            raise HTTPException(status_code=404, detail="Agency not found")
        
        agents = service.list_agents(agency_id)
        return [AgencyAgentResponse.from_orm(a) for a in agents]
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
