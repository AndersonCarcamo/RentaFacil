"""
Service layer for agent management
"""
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import secrets
import logging

from app.models.listing import Listing
from app.core.exceptions import http_400_bad_request, http_403_forbidden, http_404_not_found
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


class AgentService:
    """Service for managing agents and invitations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_invitation(
        self,
        agency_id: UUID,
        invited_by_user_id: UUID,
        email: str,
        first_name: str,
        last_name: str,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new agent invitation and send email"""
        try:
            # Check if user already exists with this email
            existing_user = self.db.execute(text("""
                SELECT id, role FROM core.users WHERE email = :email
            """), {"email": email}).fetchone()
            
            if existing_user:
                raise http_400_bad_request("User with this email already exists")
            
            # Check if there's already a pending invitation
            existing_invitation = self.db.execute(text("""
                SELECT id FROM core.agent_invitations
                WHERE email = :email 
                AND agency_id = :agency_id
                AND status = 'pending'
                AND expires_at > now()
            """), {"email": email, "agency_id": agency_id}).fetchone()
            
            if existing_invitation:
                raise http_400_bad_request("Pending invitation already exists for this email")
            
            # Get agency name and inviter name for the email
            agency_info = self.db.execute(text("""
                SELECT 
                    a.name as agency_name,
                    u.first_name || ' ' || u.last_name as inviter_name
                FROM core.agencies a
                JOIN core.users u ON u.id = :inviter_id
                WHERE a.id = :agency_id
            """), {
                "agency_id": agency_id,
                "inviter_id": invited_by_user_id
            }).fetchone()
            
            if not agency_info:
                raise http_404_not_found("Agency not found")
            
            agency_name = agency_info[0]
            inviter_name = agency_info[1]
            
            # Generate secure token
            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(days=7)  # 7 days expiration
            
            # Create invitation
            result = self.db.execute(text("""
                INSERT INTO core.agent_invitations 
                (agency_id, invited_by_user_id, email, first_name, last_name, phone, token, expires_at)
                VALUES (:agency_id, :invited_by, :email, :first_name, :last_name, :phone, :token, :expires_at)
                RETURNING id, token, expires_at, created_at
            """), {
                "agency_id": agency_id,
                "invited_by": invited_by_user_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "token": token,
                "expires_at": expires_at
            })
            
            invitation = result.fetchone()
            self.db.commit()
            
            # Send invitation email
            try:
                email_sent = email_service.send_agent_invitation(
                    to_email=email,
                    first_name=first_name,
                    last_name=last_name,
                    agency_name=agency_name,
                    inviter_name=inviter_name,
                    invitation_token=invitation[1],  # token
                    expires_at=invitation[2].strftime("%d/%m/%Y %H:%M")  # formato legible
                )
                
                if email_sent:
                    logger.info(f"✅ Invitation email sent to {email}")
                else:
                    logger.warning(f"⚠️ Failed to send invitation email to {email}")
                    
            except Exception as email_error:
                logger.error(f"❌ Error sending invitation email: {email_error}")
                # No lanzar error, la invitación ya fue creada
            
            return {
                "id": invitation[0],
                "agency_id": agency_id,
                "token": invitation[1],
                "expires_at": invitation[2],
                "created_at": invitation[3],
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "status": "pending",
                "invited_by_name": inviter_name
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating invitation: {e}")
            raise
    
    def get_agency_agents(
        self, 
        agency_id: UUID,
        include_inactive: bool = False
    ) -> List[Dict[str, Any]]:
        """Get all agents for an agency"""
        try:
            status_filter = "" if include_inactive else "AND u.is_active = true"
            
            query = text(f"""
                SELECT 
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone,
                    u.profile_picture_url,
                    u.role,
                    u.is_active,
                    u.created_at,
                    u.last_login_at,
                    ua.agency_id,
                    ua.role as agency_role,
                    ua.created_at as joined_agency_at,
                    COUNT(DISTINCT l.id) FILTER (WHERE l.status != 'archived') as listings_count,
                    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'published') as active_listings_count
                FROM core.users u
                JOIN core.user_agency ua ON u.id = ua.user_id
                LEFT JOIN core.listings l ON l.owner_user_id = u.id AND l.agency_id = :agency_id
                WHERE ua.agency_id = :agency_id
                {status_filter}
                GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, 
                         u.profile_picture_url, u.role, u.is_active, u.created_at, 
                         u.last_login_at, ua.agency_id, ua.role, ua.created_at
                ORDER BY u.created_at DESC
            """)
            
            result = self.db.execute(query, {"agency_id": agency_id})
            agents = result.fetchall()
            
            return [
                {
                    "id": str(agent[0]),
                    "email": agent[1],
                    "first_name": agent[2],
                    "last_name": agent[3],
                    "phone": agent[4],
                    "profile_picture_url": agent[5],
                    "role": agent[6],
                    "is_active": agent[7],
                    "created_at": agent[8],
                    "last_login_at": agent[9],
                    "agency_id": str(agent[10]),
                    "agency_role": agent[11],
                    "joined_agency_at": agent[12],
                    "listings_count": agent[13],
                    "active_listings_count": agent[14]
                }
                for agent in agents
            ]
            
        except Exception as e:
            logger.error(f"Error getting agency agents: {e}")
            raise
    
    def get_agent_details(self, agency_id: UUID, agent_id: UUID) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific agent"""
        try:
            result = self.db.execute(text("""
                SELECT 
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone,
                    u.profile_picture_url,
                    u.role,
                    u.is_active,
                    u.created_at,
                    u.last_login_at,
                    ua.agency_id,
                    ua.role as agency_role,
                    ua.created_at as joined_agency_at
                FROM core.users u
                JOIN core.user_agency ua ON u.id = ua.user_id
                WHERE u.id = :agent_id 
                AND ua.agency_id = :agency_id
            """), {"agent_id": agent_id, "agency_id": agency_id})
            
            agent = result.fetchone()
            if not agent:
                return None
            
            # Get listings stats
            stats_result = self.db.execute(text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'published') as active,
                    COUNT(*) FILTER (WHERE status = 'draft') as draft,
                    COUNT(*) FILTER (WHERE status = 'archived') as archived
                FROM core.listings
                WHERE owner_user_id = :agent_id AND agency_id = :agency_id
            """), {"agent_id": agent_id, "agency_id": agency_id})
            
            stats = stats_result.fetchone()
            
            return {
                "id": str(agent[0]),
                "email": agent[1],
                "first_name": agent[2],
                "last_name": agent[3],
                "phone": agent[4],
                "profile_picture_url": agent[5],
                "role": agent[6],
                "is_active": agent[7],
                "created_at": agent[8],
                "last_login_at": agent[9],
                "agency_id": str(agent[10]),
                "agency_role": agent[11],
                "joined_agency_at": agent[12],
                "listings_count": stats[0] if stats else 0,
                "active_listings_count": stats[1] if stats else 0,
                "draft_listings_count": stats[2] if stats else 0,
                "archived_listings_count": stats[3] if stats else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting agent details: {e}")
            raise
    
    def update_agent(
        self,
        agency_id: UUID,
        agent_id: UUID,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> bool:
        """Update agent information"""
        try:
            # Verify agent belongs to agency
            check = self.db.execute(text("""
                SELECT 1 FROM core.user_agency 
                WHERE user_id = :agent_id AND agency_id = :agency_id
            """), {"agent_id": agent_id, "agency_id": agency_id}).fetchone()
            
            if not check:
                raise http_404_not_found("Agent not found in this agency")
            
            # Build update query dynamically
            updates = []
            params = {"agent_id": agent_id}
            
            if first_name is not None:
                updates.append("first_name = :first_name")
                params["first_name"] = first_name
            
            if last_name is not None:
                updates.append("last_name = :last_name")
                params["last_name"] = last_name
            
            if phone is not None:
                updates.append("phone = :phone")
                params["phone"] = phone
            
            if is_active is not None:
                updates.append("is_active = :is_active")
                params["is_active"] = is_active
            
            if not updates:
                return True
            
            updates.append("updated_at = now()")
            update_query = f"UPDATE core.users SET {', '.join(updates)} WHERE id = :agent_id"
            
            self.db.execute(text(update_query), params)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating agent: {e}")
            raise
    
    def remove_agent(self, agency_id: UUID, agent_id: UUID) -> bool:
        """Remove agent from agency"""
        try:
            result = self.db.execute(text("""
                DELETE FROM core.user_agency
                WHERE user_id = :agent_id AND agency_id = :agency_id
                RETURNING user_id
            """), {"agent_id": agent_id, "agency_id": agency_id})
            
            deleted = result.fetchone()
            self.db.commit()
            
            return deleted is not None
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing agent: {e}")
            raise
    
    def get_pending_invitations(self, agency_id: UUID) -> List[Dict[str, Any]]:
        """Get all pending invitations for an agency"""
        try:
            # First expire old invitations
            self.db.execute(text("SELECT expire_old_agent_invitations()"))
            
            result = self.db.execute(text("""
                SELECT * FROM core.v_active_agent_invitations
                WHERE agency_id = :agency_id
                ORDER BY created_at DESC
            """), {"agency_id": agency_id})
            
            invitations = result.fetchall()
            
            return [
                {
                    "id": str(inv[0]),
                    "agency_id": str(inv[1]),
                    "agency_name": inv[2],
                    "email": inv[3],
                    "first_name": inv[4],
                    "last_name": inv[5],
                    "phone": inv[6],
                    "token": inv[7],
                    "status": inv[8],
                    "expires_at": inv[9],
                    "created_at": inv[10],
                    "invited_by_name": inv[11],
                    "invited_by_email": inv[12]
                }
                for inv in invitations
            ]
            
        except Exception as e:
            logger.error(f"Error getting pending invitations: {e}")
            raise
    
    def revoke_invitation(self, agency_id: UUID, invitation_id: UUID, revoked_by: UUID) -> bool:
        """Revoke a pending invitation"""
        try:
            result = self.db.execute(text("""
                UPDATE core.agent_invitations
                SET status = 'revoked',
                    revoked_at = now(),
                    revoked_by_user_id = :revoked_by
                WHERE id = :invitation_id 
                AND agency_id = :agency_id
                AND status = 'pending'
                RETURNING id
            """), {
                "invitation_id": invitation_id,
                "agency_id": agency_id,
                "revoked_by": revoked_by
            })
            
            revoked = result.fetchone()
            self.db.commit()
            
            return revoked is not None
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error revoking invitation: {e}")
            raise
    
    def verify_agency_owner(self, user_id: UUID, agency_id: UUID) -> bool:
        """Verify if user is the owner of the agency"""
        try:
            # Check if user has admin role or is the creator of the agency
            result = self.db.execute(text("""
                SELECT 1 FROM core.agencies a
                LEFT JOIN core.user_agency ua ON a.id = ua.agency_id
                WHERE a.id = :agency_id
                AND (
                    ua.user_id = :user_id AND ua.role = 'owner'
                    OR EXISTS (
                        SELECT 1 FROM core.users u 
                        WHERE u.id = :user_id AND u.role = 'admin'
                    )
                )
            """), {"user_id": user_id, "agency_id": agency_id})
            
            return result.fetchone() is not None
            
        except Exception as e:
            logger.error(f"Error verifying agency owner: {e}")
            return False
