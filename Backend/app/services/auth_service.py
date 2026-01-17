from sqlalchemy.orm import Session
from app.models.auth import User, UserRole
from app.schemas.auth import UserRegisterRequest
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.core.firebase import firebase_service, verify_firebase_token
from app.core.config import settings
from app.core.constants import STATUS_MESSAGES, ERROR_MESSAGES
from app.core.exceptions import (
    AuthenticationError, ValidationError, NotFoundError, ConflictError
)
from datetime import datetime, timedelta
from typing import Optional, Dict
import uuid
import logging

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        """Get user by Firebase UID."""
        return self.db.query(User).filter(
            User.firebase_uid == firebase_uid
        ).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(
            User.email == email.lower()
        ).first()

    def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(
            User.id == user_id
        ).first()

    def create_user(self, user_data: UserRegisterRequest, firebase_uid: str = None) -> User:
        """Create a new user with Firebase integration."""
        try:
            logger.info(f"Creating user with data: {user_data.dict()}")
            
            # Create user instance
            logger.info("Creating User instance...")
            user = User(
                email=user_data.email.lower(),
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                phone=user_data.phone,
                firebase_uid=firebase_uid or user_data.firebase_uid,
                role=user_data.role,
                national_id=user_data.national_id,
                national_id_type=user_data.national_id_type,
                agency_name=user_data.agency_name,  # Guardar nombre de agencia
                is_verified=False,
                is_active=True
            )
            logger.info(f"User instance created with role: {user.role}")
            if user_data.agency_name:
                logger.info(f"Agency name set: {user_data.agency_name}")
            
            # Save to database
            logger.info("Adding user to database session...")
            self.db.add(user)
            logger.info("Committing transaction...")
            self.db.commit()
            logger.info("Refreshing user object...")
            self.db.refresh(user)
            logger.info(f"User saved successfully with ID: {user.id}")
            
            # If user is an agent and has agency_name, create agency automatically
            if user.role == UserRole.AGENT and user_data.agency_name:
                logger.info(f"Creating agency automatically for agent: {user_data.agency_name}")
                try:
                    from app.models.agency import Agency, AgencyAgent
                    
                    # Create agency
                    agency = Agency(
                        name=user_data.agency_name,
                        email=user.email,
                        phone=user.phone,
                        description=f"Agencia creada automáticamente para {user.first_name} {user.last_name}",
                        is_verified=False
                    )
                    self.db.add(agency)
                    self.db.commit()
                    self.db.refresh(agency)
                    logger.info(f"Agency created with ID: {agency.id}")
                    
                    # Link user to agency as owner
                    agency_agent = AgencyAgent(
                        user_id=user.id,
                        agency_id=agency.id,
                        role='owner'  # User who creates the agency is the owner
                    )
                    self.db.add(agency_agent)
                    self.db.commit()
                    logger.info(f"User linked to agency as owner")
                    
                except Exception as agency_error:
                    logger.error(f"Error creating agency: {agency_error}")
                    # Don't fail user creation if agency creation fails
                    # User can create/link agency later
                    self.db.rollback()
            
            return user
            
        except Exception as e:
            logger.error(f"Error in create_user: {e}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise

    async def authenticate_with_firebase(self, firebase_token: str) -> Optional[User]:
        """Authenticate user with Firebase token."""
        try:
            logger.info("Starting Firebase authentication...")
            
            # Verify Firebase token
            firebase_claims = await verify_firebase_token(firebase_token)
            firebase_uid = firebase_claims['uid']
            email = firebase_claims['email']
            
            logger.info(f"Token verified for user: {email}, Firebase UID: {firebase_uid}")
            
            # Check if user exists by Firebase UID
            user = self.get_user_by_firebase_uid(firebase_uid)
            if user:
                logger.info(f"User found by Firebase UID: {user.id}")
                # Update last login
                self.update_last_login(user)
                return user
            
            # Check if user exists by email (for migration cases)
            user = self.get_user_by_email(email)
            if user:
                logger.info(f"User found by email: {user.id}, linking Firebase UID...")
                # Link Firebase UID to existing user
                user.firebase_uid = firebase_uid
                self.db.commit()
                self.update_last_login(user)
                return user
            
            # User doesn't exist, create new one from Firebase data
            logger.info(f"User not found, creating new user from Firebase data...")
            user_data = UserRegisterRequest(
                email=email,
                first_name=firebase_claims.get('name', '').split(' ')[0] if firebase_claims.get('name') else '',
                last_name=' '.join(firebase_claims.get('name', '').split(' ')[1:]) if firebase_claims.get('name') else '',
                phone=firebase_claims.get('phone_number'),
                firebase_uid=firebase_uid,
                role=UserRole.USER
            )
            
            user = self.create_user(user_data, firebase_uid)
            logger.info(f"New user created successfully: {user.id}")
            return user
            
        except Exception as e:
            logger.error(f"Error in authenticate_with_firebase: {type(e).__name__} - {str(e)}")
            import traceback
            logger.error(f"Full traceback:\n{traceback.format_exc()}")
            return None

    def authenticate_user(self, email: str, firebase_uid: str = None) -> Optional[User]:
        """Authenticate user with email and optional firebase UID."""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if firebase_uid and user.firebase_uid != firebase_uid:
            return None
        return user

    def create_user_tokens(self, user: User, remember_me: bool = False) -> Dict[str, str]:
        """Create access and refresh tokens for user."""
        # Token data
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
        
        # Create tokens
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60
        }

    def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """Refresh access token using refresh token."""
        # Verify refresh token
        payload = verify_token(refresh_token, "refresh")
        if not payload:
            return None
        
        # Get user
        user_id = uuid.UUID(payload.get("sub"))
        user = self.get_user_by_id(user_id)
        if not user or not user.is_active:
            return None
        
        # Create new tokens
        new_tokens = self.create_user_tokens(user)
        
        return new_tokens

    def create_user_session(self, user_id: uuid.UUID, refresh_token: str, 
                           user_agent: str = None, ip_address: str = None) -> bool:
        """Create a new user session (simplified)."""
        # For now, just return True as we're not storing sessions in database
        return True

    def revoke_refresh_token(self, refresh_token: str) -> bool:
        """Revoke a refresh token (simplified)."""
        # For now, just return True as we're not storing sessions in database
        return True

    def update_last_login(self, user: User):
        """Update user's last login timestamp."""
        user.last_login_at = datetime.utcnow()
        self.db.commit()
