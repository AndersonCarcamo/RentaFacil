"""
User management endpoints for EasyRent API.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.users import (
    UserDetailResponse, UserPublicResponse, PaginatedUsers, MessageResponse,
    CreateUserRequest, UpdateUserRequest, DeleteAccountRequest, UserPreferences, 
    PrivacySettings, AvatarUploadResponse, UserListFilters
)
from app.services.user_service import UserService
from app.api.deps import get_current_user, get_current_active_user
from app.models.auth import User, UserRole
from app.core.constants import STATUS_MESSAGES, ERROR_MESSAGES
from app.core.exceptions import (
    http_400_bad_request, http_401_unauthorized, http_403_forbidden,
    http_404_not_found, http_409_conflict, http_500_internal_error,
    ValidationError, NotFoundError, ConflictError
)
from app.core.utils import get_file_extension, is_valid_image_type, format_file_size
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/users",
            response_model=PaginatedUsers,
            summary="Listar usuarios (admin)",
            description="Obtiene una lista paginada de usuarios con filtros (solo administradores)")
async def list_users(
    role: Optional[UserRole] = Query(None, description="Filtrar por rol"),
    search: Optional[str] = Query(None, description="Buscar por nombre o email"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List users with pagination and filters (admin only)."""
    try:
        user_service = UserService(db)
        filters = UserListFilters(
            role=role,
            search=search,
            page=page,
            limit=limit
        )
        
        users, meta = user_service.list_users(filters, current_user)
        
        return PaginatedUsers(
            data=[UserDetailResponse.from_orm(user) for user in users],
            **meta
        )
        
    except HTTPException:
        raise
    except ValidationError as e:
        logger.error(f"Validation error listing users: {e}")
        raise http_403_forbidden("Insufficient permissions")
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise http_500_internal_error("Failed to list users")
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise http_500_internal_error("Failed to list users")


@router.post("/users",
             response_model=UserDetailResponse,
             status_code=status.HTTP_201_CREATED,
             summary="Crear usuario (admin)",
             description="Crea un nuevo usuario (solo administradores)")
async def create_user(
    request: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new user (admin only)."""
    try:
        user_service = UserService(db)
        user = user_service.create_user_admin(request, current_user)
        return UserDetailResponse.from_orm(user)
        
    except HTTPException:
        raise
    except ValidationError as e:
        logger.error(f"Validation error creating user: {e}")
        raise http_403_forbidden("Insufficient permissions")
    except ConflictError as e:
        logger.error(f"Conflict error creating user: {e}")
        raise http_409_conflict("Email already exists")
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise http_500_internal_error("Failed to create user")


@router.get("/users/me",
            response_model=UserDetailResponse,
            summary="Obtener perfil propio",
            description="Obtiene la información completa del usuario autenticado")
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile."""
    return UserDetailResponse.from_orm(current_user)


@router.put("/users/me",
            response_model=UserDetailResponse,
            summary="Actualizar perfil propio",
            description="Actualiza la información del usuario autenticado")
async def update_current_user_profile(
    request: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user profile."""
    try:
        user_service = UserService(db)
        user = user_service.update_user_profile(current_user, request)
        return UserDetailResponse.from_orm(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise http_500_internal_error("Failed to update profile")


@router.delete("/users/me",
               response_model=MessageResponse,
               summary="Eliminar cuenta propia",
               description="Elimina permanentemente la cuenta del usuario")
async def delete_current_user_account(
    request: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete current user account."""
    try:
        user_service = UserService(db)
        user_service.delete_account(current_user, request)
        return MessageResponse(message=STATUS_MESSAGES["ACCOUNT_DELETED"])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user account: {e}")
        raise http_500_internal_error("Failed to delete account")


@router.get("/users/{user_id}",
            response_model=UserPublicResponse,
            summary="Obtener usuario por ID",
            description="Obtiene la información pública de un usuario")
async def get_user_by_id(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID."""
    try:
        user_service = UserService(db)
        
        # If current user is admin, return full details
        if current_user and current_user.role == UserRole.ADMIN:
            user = user_service.get_user_by_id(user_id)
            if not user:
                raise http_404_not_found(ERROR_MESSAGES["USER_NOT_FOUND"])
            return UserDetailResponse.from_orm(user)
        
        # Otherwise, return public information only
        user = user_service.get_public_user_info(user_id)
        if not user:
            raise http_404_not_found(ERROR_MESSAGES["USER_NOT_FOUND"])
        
        return UserPublicResponse.from_orm(user)
        
    except HTTPException:
        raise
    except NotFoundError as e:
        logger.error(f"User not found: {e}")
        raise http_404_not_found("User not found")
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        raise http_500_internal_error("Failed to get user")


@router.put("/users/{user_id}",
            response_model=UserDetailResponse,
            summary="Actualizar usuario (admin)",
            description="Actualiza un usuario específico (solo administradores)")
async def update_user(
    user_id: uuid.UUID,
    request: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user (admin only)."""
    try:
        user_service = UserService(db)
        user = user_service.update_user_admin(user_id, request, current_user)
        return UserDetailResponse.from_orm(user)
        
    except HTTPException:
        raise
    except ValidationError as e:
        logger.error(f"Validation error updating user: {e}")
        raise http_403_forbidden("Insufficient permissions")
    except NotFoundError as e:
        logger.error(f"User not found: {e}")
        raise http_404_not_found("User not found")
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise http_500_internal_error("Failed to update user")


@router.delete("/users/{user_id}",
               response_model=MessageResponse,
               summary="Eliminar usuario (admin)",
               description="Elimina un usuario específico (solo administradores)")
async def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete user (admin only)."""
    try:
        user_service = UserService(db)
        user_service.delete_user_admin(user_id, current_user)
        return MessageResponse(message="User deleted successfully")
        
    except HTTPException:
        raise
    except ValidationError as e:
        logger.error(f"Validation error deleting user: {e}")
        raise http_403_forbidden("Insufficient permissions or cannot delete own account")
    except NotFoundError as e:
        logger.error(f"User not found: {e}")
        raise http_404_not_found("User not found")
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise http_500_internal_error("Failed to delete user")


@router.post("/users/me/avatar",
             response_model=AvatarUploadResponse,
             summary="Subir avatar",
             description="Sube una imagen de avatar para el usuario")
async def upload_avatar(
    avatar: UploadFile = File(..., description="Image file for avatar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload user avatar."""
    try:
        # Import here to avoid circular dependency
        from app.services.media_service import MediaService
        import os
        
        # Validate file type
        if not avatar.content_type or not avatar.content_type.startswith('image/'):
            raise http_400_bad_request("Invalid file type. Only images are allowed (jpg, jpeg, png, gif, webp)")
        
        # Read file data
        file_data = await avatar.read()
        
        # Validate file size (10MB max for avatars)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_data) > max_size:
            raise http_400_bad_request(f"File too large. Maximum size: 10MB")
        
        # Initialize media service
        media_service = MediaService(db)
        
        # Create avatars directory if it doesn't exist
        avatar_dir = os.path.join("media", "avatars")
        os.makedirs(avatar_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(avatar.filename)[1] or '.jpg'
        unique_filename = f"{current_user.id}{file_extension}"
        file_path = os.path.join(avatar_dir, unique_filename)
        
        # Save file locally
        with open(file_path, "wb") as f:
            f.write(file_data)
        
        # Generate avatar URL (will be served by Nginx)
        avatar_url = f"/media/avatars/{unique_filename}"
        
        # Update user profile with new avatar URL
        user_service = UserService(db)
        user = user_service.upload_avatar(current_user, avatar_url)
        
        logger.info(f"Avatar uploaded successfully for user {current_user.id}")
        
        return AvatarUploadResponse(
            message="Avatar uploaded successfully",
            avatar_url=avatar_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading avatar: {e}")
        raise http_500_internal_error(f"Failed to upload avatar: {str(e)}")


@router.delete("/users/me/avatar",
               response_model=MessageResponse,
               summary="Eliminar avatar",
               description="Elimina el avatar del usuario")
async def delete_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete user avatar."""
    try:
        user_service = UserService(db)
        user_service.delete_avatar(current_user)
        return MessageResponse(message="Avatar deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting avatar: {e}")
        raise http_500_internal_error("Failed to delete avatar")


@router.get("/users/me/preferences",
            response_model=UserPreferences,
            summary="Obtener preferencias",
            description="Obtiene las preferencias del usuario")
async def get_user_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user preferences."""
    try:
        user_service = UserService(db)
        preferences = user_service.get_user_preferences(current_user)
        return preferences
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise http_500_internal_error("Failed to get preferences")


@router.put("/users/me/preferences",
            response_model=UserPreferences,
            summary="Actualizar preferencias",
            description="Actualiza las preferencias del usuario")
async def update_user_preferences(
    request: UserPreferences,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user preferences."""
    try:
        user_service = UserService(db)
        preferences = user_service.update_user_preferences(current_user, request)
        return preferences
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        raise http_500_internal_error("Failed to update preferences")


@router.get("/users/me/privacy",
            response_model=PrivacySettings,
            summary="Obtener configuración de privacidad",
            description="Obtiene la configuración de privacidad del usuario")
async def get_privacy_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user privacy settings."""
    try:
        user_service = UserService(db)
        settings = user_service.get_privacy_settings(current_user)
        return settings
        
    except Exception as e:
        logger.error(f"Error getting privacy settings: {e}")
        raise http_500_internal_error("Failed to get privacy settings")


@router.put("/users/me/privacy",
            response_model=PrivacySettings,
            summary="Actualizar configuración de privacidad",
            description="Actualiza la configuración de privacidad del usuario")
async def update_privacy_settings(
    request: PrivacySettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user privacy settings."""
    try:
        user_service = UserService(db)
        settings = user_service.update_privacy_settings(current_user, request)
        return settings
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating privacy settings: {e}")
        raise http_500_internal_error("Failed to update privacy settings")
