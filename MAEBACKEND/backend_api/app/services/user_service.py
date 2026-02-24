"""
User management service for EasyRent API.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.models.auth import User, UserRole
from app.schemas.users import (
    CreateUserRequest, UpdateUserRequest, UserListFilters, 
    DeleteAccountRequest, UserPreferences, PrivacySettings
)
from app.core.config import settings
from app.core.constants import STATUS_MESSAGES, ERROR_MESSAGES
from app.core.exceptions import (
    AuthenticationError, ValidationError, NotFoundError, ConflictError
)
from app.core.utils import paginate_query_params, sanitize_string, utc_now
from typing import Optional, Tuple, Dict, Any
import uuid
import logging

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(
            User.email == email.lower(),
            User.is_active == True
        ).first()

    def list_users(self, filters: UserListFilters, current_user: User) -> Tuple[list, Dict[str, Any]]:
        """List users with pagination and filters (admin only)."""
        # Check admin permission
        if current_user.role != UserRole.ADMIN:
            raise ValidationError("Insufficient permissions")

        # Build query
        query = self.db.query(User).filter(User.is_active == True)

        # Apply filters
        if filters.role:
            query = query.filter(User.role == filters.role)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )

        # Get total count
        total = query.count()

        # Apply pagination
        pagination = paginate_query_params(filters.page, filters.limit)
        users = query.offset(pagination["offset"]).limit(pagination["limit"]).all()

        # Calculate pagination metadata
        pages = (total + pagination["limit"] - 1) // pagination["limit"]
        has_next = pagination["page"] < pages
        has_prev = pagination["page"] > 1

        meta = {
            "total": total,
            "page": pagination["page"],
            "limit": pagination["limit"],
            "pages": pages,
            "has_next": has_next,
            "has_prev": has_prev
        }

        return users, meta

    def create_user_admin(self, user_data: CreateUserRequest, current_user: User) -> User:
        """Create user (admin only)."""
        # Check admin permission
        if current_user.role != UserRole.ADMIN:
            raise ValidationError("Insufficient permissions")

        # Check if user already exists
        if self.get_user_by_email(user_data.email):
            raise ConflictError(ERROR_MESSAGES["EMAIL_EXISTS"])

        # Create user
        user = User(
            email=user_data.email.lower(),
            first_name=sanitize_string(user_data.first_name),
            last_name=sanitize_string(user_data.last_name),
            phone=user_data.phone,
            role=user_data.role,
            is_verified=True,  # Admin created users are auto-verified
            is_active=True
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        logger.info(f"User created by admin {current_user.id}: {user.id}")
        return user

    def update_user_profile(self, user: User, update_data: UpdateUserRequest) -> User:
        """Update user profile."""
        # Update fields if provided
        if update_data.first_name is not None:
            user.first_name = sanitize_string(update_data.first_name)
        
        if update_data.last_name is not None:
            user.last_name = sanitize_string(update_data.last_name)
        
        if update_data.phone is not None:
            user.phone = update_data.phone
            
        if update_data.bio is not None:
            user.bio = sanitize_string(update_data.bio)

        # Handle role upgrade
        if update_data.role is not None:
            logger.info(f"Upgrading user {user.id} role from {user.role} to {update_data.role}")
            user.role = update_data.role
            
        # Handle national ID
        if update_data.national_id is not None:
            user.national_id = update_data.national_id
            
        if update_data.national_id_type is not None:
            user.national_id_type = update_data.national_id_type

        user.updated_at = utc_now()
        self.db.commit()
        self.db.refresh(user)

        logger.info(f"User profile updated: {user.id}, role: {user.role}")
        return user

    def update_user_admin(self, user_id: uuid.UUID, update_data: UpdateUserRequest, 
                         current_user: User) -> User:
        """Update user (admin only)."""
        # Check admin permission
        if current_user.role != UserRole.ADMIN:
            raise ValidationError("Insufficient permissions")

        user = self.get_user_by_id(user_id)
        if not user:
            raise NotFoundError(ERROR_MESSAGES["USER_NOT_FOUND"])

        return self.update_user_profile(user, update_data)

    def delete_account(self, user: User, delete_data: DeleteAccountRequest) -> bool:
        """Delete user account (soft delete in DB, hard delete in Firebase)."""
        from app.core.firebase import FirebaseService
        
        user_id = user.id
        firebase_uid = user.firebase_uid
        email = user.email
        
        logger.info(f"Starting account deletion for user {user_id} ({email})")
        
        # Step 1: Delete from Firebase if user has firebase_uid
        firebase_deleted = False
        if firebase_uid:
            firebase_service = FirebaseService()
            try:
                result = firebase_service.delete_user_by_uid(firebase_uid)
                if result:
                    firebase_deleted = True
                    logger.info(f"✓ User deleted from Firebase: {firebase_uid}")
                else:
                    logger.warning(f"✗ Failed to delete user from Firebase: {firebase_uid}")
            except Exception as e:
                logger.error(f"✗ Exception deleting user from Firebase: {type(e).__name__} - {str(e)}")
                # Don't stop the process - continue with DB deletion
        else:
            logger.warning(f"! User {user_id} has no firebase_uid associated")
        
        # Step 2: Soft delete in database (mark as inactive)
        try:
            user.is_active = False
            user.firebase_uid = None  # Clear Firebase UID to prevent accidental re-linking
            user.updated_at = utc_now()
            self.db.commit()
            logger.info(f"✓ User marked as inactive in database: {user_id}")
        except Exception as e:
            self.db.rollback()
            logger.error(f"✗ Error marking user as inactive: {type(e).__name__} - {str(e)}")
            raise Exception(f"Error marking account as inactive: {str(e)}")
        
        logger.info(f"✓ Account deletion completed for user {user_id}. Firebase deleted: {firebase_deleted}")
        return True

    def delete_user_admin(self, user_id: uuid.UUID, current_user: User) -> bool:
        """Delete user (admin only)."""
        # Check admin permission
        if current_user.role != UserRole.ADMIN:
            raise ValidationError("Insufficient permissions")

        user = self.get_user_by_id(user_id)
        if not user:
            raise NotFoundError(ERROR_MESSAGES["USER_NOT_FOUND"])

        # Prevent admin from deleting themselves
        if user.id == current_user.id:
            raise ValidationError("Cannot delete your own account")

        # Soft delete using is_active
        user.is_active = False
        user.updated_at = utc_now()
        
        self.db.commit()
        
        logger.info(f"User deleted by admin {current_user.id}: {user_id}")
        return True

    def upload_avatar(self, user: User, avatar_url: str) -> User:
        """Upload user avatar."""
        user.profile_picture_url = avatar_url
        user.updated_at = utc_now()
        self.db.commit()
        self.db.refresh(user)

        logger.info(f"Avatar uploaded for user: {user.id}")
        return user

    def delete_avatar(self, user: User) -> User:
        """Delete user avatar."""
        user.profile_picture_url = None
        user.updated_at = utc_now()
        self.db.commit()
        self.db.refresh(user)

        logger.info(f"Avatar deleted for user: {user.id}")
        return user

    def get_user_preferences(self, user: User) -> UserPreferences:
        """Get user preferences."""
        # For now, return default preferences
        # In a real app, this would come from a separate preferences table
        return UserPreferences()

    def update_user_preferences(self, user: User, preferences: UserPreferences) -> UserPreferences:
        """Update user preferences."""
        # In a real app, this would update a separate preferences table
        # For now, we'll just log and return the preferences
        logger.info(f"Preferences updated for user: {user.id}")
        return preferences

    def get_privacy_settings(self, user: User) -> PrivacySettings:
        """Get user privacy settings."""
        # For now, return default privacy settings
        # In a real app, this would come from a separate privacy_settings table
        return PrivacySettings()

    def update_privacy_settings(self, user: User, settings: PrivacySettings) -> PrivacySettings:
        """Update user privacy settings."""
        # In a real app, this would update a separate privacy_settings table
        # For now, we'll just log and return the settings
        logger.info(f"Privacy settings updated for user: {user.id}")
        return settings

    def get_public_user_info(self, user_id: uuid.UUID) -> Optional[User]:
        """Get public user information (for displaying to other users)."""
        return self.db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
