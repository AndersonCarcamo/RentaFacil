from sqlalchemy.orm import Session
from app.models.auth import User, UserRole
from app.schemas.auth import UserRegisterRequest
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.core.firebase import firebase_service, verify_firebase_token
from app.core.config import settings
from app.core.redis_client import get_redis_client
from app.core.constants import STATUS_MESSAGES, ERROR_MESSAGES
from app.core.exceptions import (
    AuthenticationError, ValidationError, NotFoundError, ConflictError
)
from datetime import datetime, timedelta
from typing import Optional, Dict
import uuid
import logging
import hashlib
import json
import time

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _refresh_token_hash(refresh_token: str) -> str:
        return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()

    @staticmethod
    def _refresh_token_ttl(payload: Dict) -> int:
        exp = payload.get("exp")
        if exp is None:
            return 0
        try:
            exp_timestamp = int(exp)
        except (TypeError, ValueError):
            return 0

        ttl = exp_timestamp - int(time.time())
        return max(0, ttl)

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
                is_verified=False,
                is_active=True
            )
            logger.info(f"User instance created with role: {user.role}")
            if user_data.agency_name:
                logger.info(f"Agency name set: {user_data.agency_name}")
            
            # Save user + agency in a single transaction
            logger.info("Adding user to database session...")
            self.db.add(user)
            self.db.flush()
            logger.info(f"User prepared with ID: {user.id}")
            
            # If user is an agent and has agency_name, create agency automatically
            if user.role == UserRole.AGENT and user_data.agency_name:
                logger.info(f"Creating agency automatically for agent: {user_data.agency_name}")
                from app.models.agency import Agency, AgencyAgent
                
                # Create agency (agency_name is persisted in agencies table, not users)
                agency = Agency(
                    name=user_data.agency_name,
                    email=user.email,
                    phone=user.phone,
                    description=f"Agencia creada automáticamente para {user.first_name} {user.last_name}",
                    is_verified=False
                )
                self.db.add(agency)
                self.db.flush()
                logger.info(f"Agency prepared with ID: {agency.id}")
                
                # Link user to agency as owner
                agency_agent = AgencyAgent(
                    user_id=user.id,
                    agency_id=agency.id,
                    role='owner'  # User who creates the agency is the owner
                )
                self.db.add(agency_agent)
                self.db.flush()
                logger.info("User linked to agency as owner")

            logger.info("Committing transaction...")
            self.db.commit()
            logger.info("Refreshing user object...")
            self.db.refresh(user)
            logger.info(f"User saved successfully with ID: {user.id}")
            
            return user
            
        except Exception as e:
            self.db.rollback()
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
                if not user.is_active:
                    logger.warning(f"User {user.id} attempted login but account is inactive (deleted)")
                    return None
                self.update_last_login(user)
                return user
            
            # Check if user exists by email (for migration cases or after deletion)
            user = self.get_user_by_email(email)
            if user:
                logger.info(f"User found by email: {user.id}")
                
                # If user is inactive (deleted), don't allow re-activation via Firebase login
                if not user.is_active:
                    logger.warning(f"User {user.id} with email {email} attempted login but account was previously deleted")
                    return None
                
                # If inactive but was a normal account, link Firebase UID
                if not user.firebase_uid:
                    logger.info(f"Linking Firebase UID to existing user {user.id}...")
                    user.firebase_uid = firebase_uid
                    self.db.commit()
                
                self.update_last_login(user)
                return user
            
            # User doesn't exist and hasn't been deleted - create new one from Firebase data
            logger.info(f"New user registration from Firebase data for email: {email}")
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

        redis_client = get_redis_client()
        if not redis_client:
            logger.error("Redis unavailable: cannot validate refresh token session")
            return None

        token_hash = self._refresh_token_hash(refresh_token)
        session_key = f"auth:refresh:{token_hash}"
        session_data_raw = redis_client.get(session_key)
        if not session_data_raw:
            return None

        try:
            session_data = json.loads(session_data_raw)
        except json.JSONDecodeError:
            return None
        
        # Get user
        user_id = uuid.UUID(payload.get("sub"))
        if str(session_data.get("user_id")) != str(user_id):
            return None

        user = self.get_user_by_id(user_id)
        if not user or not user.is_active:
            return None
        
        # Create new tokens
        new_tokens = self.create_user_tokens(user)

        # Rotate refresh token: revoke old and persist new
        if not self.revoke_refresh_token(refresh_token):
            return None

        if not self.create_user_session(
            user_id=user.id,
            refresh_token=new_tokens["refresh_token"],
            user_agent=session_data.get("user_agent"),
            ip_address=session_data.get("ip_address"),
        ):
            return None
        
        return new_tokens

    def create_user_session(self, user_id: uuid.UUID, refresh_token: str, 
                           user_agent: str = None, ip_address: str = None) -> bool:
        """Persist refresh token session in Redis for revocation and rotation."""
        payload = verify_token(refresh_token, "refresh")
        if not payload:
            return False

        if str(payload.get("sub")) != str(user_id):
            return False

        ttl_seconds = self._refresh_token_ttl(payload)
        if ttl_seconds <= 0:
            return False

        redis_client = get_redis_client()
        if not redis_client:
            logger.error("Redis unavailable: cannot persist refresh token session")
            return False

        token_hash = self._refresh_token_hash(refresh_token)
        session_key = f"auth:refresh:{token_hash}"

        session_payload = {
            "user_id": str(user_id),
            "user_agent": user_agent,
            "ip_address": ip_address,
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            redis_client.setex(session_key, ttl_seconds, json.dumps(session_payload))
            return True
        except Exception as exc:
            logger.error("Error persisting refresh token session: %s", exc)
            return False

    def revoke_refresh_token(self, refresh_token: str) -> bool:
        """Revoke a refresh token by deleting its session key from Redis."""
        redis_client = get_redis_client()
        if not redis_client:
            logger.error("Redis unavailable: cannot revoke refresh token")
            return False

        token_hash = self._refresh_token_hash(refresh_token)
        session_key = f"auth:refresh:{token_hash}"

        try:
            redis_client.delete(session_key)
            return True
        except Exception as exc:
            logger.error("Error revoking refresh token: %s", exc)
            return False

    def update_last_login(self, user: User):
        """Update user's last login timestamp."""
        user.last_login_at = datetime.utcnow()
        self.db.commit()
