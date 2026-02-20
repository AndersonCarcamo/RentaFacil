from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.agency import Agency, AgencyAgent
from app.schemas.agencies import CreateAgencyRequest, UpdateAgencyRequest
from typing import List, Optional
import uuid

class AgencyService:
    def __init__(self, db: Session):
        self.db = db

    def list_agencies(self, city: Optional[str] = None, verified: Optional[bool] = None) -> List[Agency]:
        query = self.db.query(Agency)
        if verified is not None:
            query = query.filter(Agency.is_verified == verified)
        return query.all()

    def get_agency(self, agency_id: str) -> Optional[Agency]:
        return self.db.query(Agency).filter(Agency.id == uuid.UUID(agency_id)).first()

    def create_agency(self, data: CreateAgencyRequest) -> Agency:
        agency = Agency(
            name=data.name,
            email=data.email,
            phone=data.phone,
            website=data.website,
            address=data.address,
            description=data.description,
            logo_url=data.logo_url,
            is_verified=False
        )
        self.db.add(agency)
        self.db.commit()
        self.db.refresh(agency)
        return agency

    def update_agency(self, agency_id: str, data: UpdateAgencyRequest) -> Optional[Agency]:
        agency = self.get_agency(agency_id)
        if not agency:
            return None
        for field, value in data.dict(exclude_unset=True).items():
            setattr(agency, field, value)
        self.db.commit()
        self.db.refresh(agency)
        return agency

    def delete_agency(self, agency_id: str) -> bool:
        agency = self.get_agency(agency_id)
        if not agency:
            return False
        self.db.delete(agency)
        self.db.commit()
        return True

    def list_agents(self, agency_id: str) -> List[AgencyAgent]:
        return self.db.query(AgencyAgent).filter(AgencyAgent.agency_id == uuid.UUID(agency_id)).all()

    def add_agent(self, agency_id: str, user_id: str, role: str = 'agent') -> AgencyAgent:
        """
        Add an agent to an agency.
        
        Args:
            agency_id: UUID of the agency
            user_id: UUID of the user
            role: Role in the agency ('owner', 'agent', 'admin'). Default is 'agent'
        """
        # Check if relationship already exists
        existing = self.db.query(AgencyAgent).filter(
            AgencyAgent.agency_id == uuid.UUID(agency_id),
            AgencyAgent.user_id == uuid.UUID(user_id)
        ).first()
        
        if existing:
            raise ValueError("User is already an agent for this agency")
            
        agent = AgencyAgent(
            agency_id=uuid.UUID(agency_id),
            user_id=uuid.UUID(user_id),
            role=role  # Use provided role
        )
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return agent

    def remove_agent(self, agency_id: str, user_id: str) -> bool:
        agent = self.db.query(AgencyAgent).filter(
            AgencyAgent.agency_id == uuid.UUID(agency_id),
            AgencyAgent.user_id == uuid.UUID(user_id)
        ).first()
        if not agent:
            return False
        self.db.delete(agent)
        self.db.commit()
        return True

    def request_verification(self, agency_id: str, documents: list) -> bool:
        agency = self.get_agency(agency_id)
        if not agency:
            return False
        # Here you would save documents and potentially update verification status
        # For now, we'll just return True to indicate the request was processed
        return True
