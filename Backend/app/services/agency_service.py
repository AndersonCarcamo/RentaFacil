from sqlalchemy.orm import Session
from app.models.agency import Agency, AgencyAgent, AgencyStatus
from app.schemas.agencies import CreateAgencyRequest, UpdateAgencyRequest
from typing import List, Optional
import uuid

class AgencyService:
    def __init__(self, db: Session):
        self.db = db

    def list_agencies(self, city: Optional[str] = None, verified: Optional[bool] = None) -> List[Agency]:
        query = self.db.query(Agency).filter(Agency.deleted_at.is_(None))
        if city:
            query = query.filter(Agency.city == city)
        if verified is not None:
            query = query.filter(Agency.verified == verified)
        return query.all()

    def get_agency(self, agency_id: str) -> Optional[Agency]:
        return self.db.query(Agency).filter(Agency.id == uuid.UUID(agency_id), Agency.deleted_at.is_(None)).first()

    def create_agency(self, data: CreateAgencyRequest) -> Agency:
        agency = Agency(
            name=data.name,
            phone=data.phone,
            email=data.email,
            address=data.address,
            city=data.city,
            district=data.district,
            status=AgencyStatus.PENDING_VERIFICATION,
            verified=False
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
        agency.deleted_at = func.now()
        self.db.commit()
        return True

    def list_agents(self, agency_id: str) -> List[AgencyAgent]:
        return self.db.query(AgencyAgent).filter(AgencyAgent.agency_id == uuid.UUID(agency_id), AgencyAgent.deleted_at.is_(None)).all()

    def add_agent(self, agency_id: str, user_id: str) -> AgencyAgent:
        agent = AgencyAgent(
            agency_id=uuid.UUID(agency_id),
            user_id=uuid.UUID(user_id)
        )
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return agent

    def remove_agent(self, agency_id: str, user_id: str) -> bool:
        agent = self.db.query(AgencyAgent).filter(
            AgencyAgent.agency_id == uuid.UUID(agency_id),
            AgencyAgent.user_id == uuid.UUID(user_id),
            AgencyAgent.deleted_at.is_(None)
        ).first()
        if not agent:
            return False
        agent.deleted_at = func.now()
        self.db.commit()
        return True

    def request_verification(self, agency_id: str, documents: list) -> bool:
        agency = self.get_agency(agency_id)
        if not agency:
            return False
        # Here you would save documents and update status
        agency.status = AgencyStatus.PENDING_VERIFICATION
        self.db.commit()
        return True
