from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import (
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    RefreshTokenRequest, MessageResponse, LoginResponse, UserResponse,
    RegisterInitRequest, RegisterInitResponse, RegisterCompleteRequest
)
from app.services.auth_service import AuthService
from app.api.deps import get_current_user, get_current_active_user
from app.models.auth import User
from app.core.constants import STATUS_MESSAGES, ERROR_MESSAGES
from app.core.exceptions import (
    http_400_bad_request, http_401_unauthorized, http_409_conflict,
    http_500_internal_error
)
from app.core.firebase import verify_firebase_token, firebase_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register/init",
             response_model=RegisterInitResponse,
             summary="Validar preregistro",
             description="Valida disponibilidad de email en DB y Firebase antes de crear cuenta")
async def register_init(
    request: RegisterInitRequest,
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    email = request.email.lower().strip()

    existing_user = auth_service.get_user_by_email(email)
    if existing_user:
        raise http_409_conflict(ERROR_MESSAGES["EMAIL_EXISTS"])

    firebase_user = await firebase_service.get_user_by_email(email)
    if firebase_user:
        raise http_409_conflict("Email already registered in Firebase")

    return RegisterInitResponse(can_register=True, email=email)


@router.post("/register/complete",
             response_model=UserResponse,
             status_code=status.HTTP_201_CREATED,
             summary="Completar registro",
             description="Completa registro luego de crear cuenta en Firebase")
async def register_complete(
    request: RegisterCompleteRequest,
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    firebase_uid = None

    try:
        firebase_claims = await verify_firebase_token(request.firebase_token)
        firebase_uid = firebase_claims.get("uid")
        firebase_email = (firebase_claims.get("email") or "").strip().lower()
        request_email = request.email.strip().lower()

        if not firebase_uid or not firebase_email:
            raise http_400_bad_request("Firebase token does not include required user information")

        if firebase_email != request_email:
            raise http_400_bad_request("Email mismatch between Firebase token and request")

        existing_by_uid = auth_service.get_user_by_firebase_uid(firebase_uid)
        if existing_by_uid:
            if existing_by_uid.email.lower() == firebase_email:
                return UserResponse.from_orm(existing_by_uid)
            raise http_409_conflict("Firebase UID already registered")

        existing_by_email = auth_service.get_user_by_email(firebase_email)
        if existing_by_email:
            if request.cleanup_firebase_on_failure:
                firebase_service.delete_user_by_uid(firebase_uid)
            raise http_409_conflict(ERROR_MESSAGES["EMAIL_EXISTS"])

        user_data = UserRegisterRequest(
            email=firebase_email,
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            firebase_uid=firebase_uid,
            firebase_created_in_flow=False,
            role=request.role,
            national_id=request.national_id,
            national_id_type=request.national_id_type,
            agency_name=request.agency_name,
        )

        user = auth_service.create_user(user_data, firebase_uid=firebase_uid)
        return UserResponse.from_orm(user)

    except HTTPException:
        raise
    except Exception as e:
        if request.cleanup_firebase_on_failure and firebase_uid:
            deleted = firebase_service.delete_user_by_uid(firebase_uid)
            if deleted:
                logger.info(
                    f"Compensation applied on register/complete: deleted Firebase user {firebase_uid}"
                )
            else:
                logger.error(
                    f"Compensation failed on register/complete: could not delete Firebase user {firebase_uid}"
                )
        logger.error(f"Unexpected error during register/complete: {e}")
        raise http_500_internal_error("Registration failed")


@router.post("/register", 
             response_model=UserResponse,
             status_code=status.HTTP_201_CREATED,
             deprecated=True,
             summary="Registro de nuevo usuario",
             description="[DEPRECATED] Usa /register/init + /register/complete. Se mantiene solo por compatibilidad.")
async def register(
    request: UserRegisterRequest,
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """Register a new user with Firebase authentication."""
    logger.warning("Deprecated endpoint /v1/auth/register was used. Prefer /register/init + /register/complete")
    firebase_uid_to_cleanup = (
        request.firebase_uid if request.firebase_uid and request.firebase_created_in_flow else None
    )

    try:
        logger.info(f"Starting registration for email: {request.email}")
        logger.info(f"Request data: {request.dict()}")
        
        auth_service = AuthService(db)
        
        # If firebase_uid is provided, verify it exists in Firebase
        if request.firebase_uid:
            firebase_user = await firebase_service.get_user_by_uid(request.firebase_uid)
            if not firebase_user:
                raise http_400_bad_request("Invalid Firebase UID")
            
            # Check if Firebase UID already exists in our database
            existing_firebase_user = auth_service.get_user_by_firebase_uid(request.firebase_uid)
            if existing_firebase_user:
                raise http_409_conflict("Firebase UID already registered")
        
        # Check if user already exists by email
        logger.info("Checking if user exists...")
        existing_user = auth_service.get_user_by_email(request.email)
        if existing_user:
            logger.warning(f"User already exists: {request.email}")
            raise http_409_conflict(ERROR_MESSAGES["EMAIL_EXISTS"])
        
        logger.info("User doesn't exist, proceeding with creation...")
        
        # Create user
        logger.info("Calling auth_service.create_user...")
        user = auth_service.create_user(request)
        logger.info(f"User created successfully with ID: {user.id}")
        
        logger.info("User registration completed successfully")
        
        logger.info("Converting user to response format...")
        response = UserResponse.from_orm(user)
        logger.info("Registration completed successfully")
        return response
        
    except HTTPException as exc:
        if firebase_uid_to_cleanup:
            deleted = firebase_service.delete_user_by_uid(firebase_uid_to_cleanup)
            if deleted:
                logger.info(
                    f"Compensation applied: deleted Firebase user {firebase_uid_to_cleanup}"
                )
            else:
                logger.error(
                    f"Compensation failed: could not delete Firebase user {firebase_uid_to_cleanup}"
                )
        logger.error("HTTPException occurred during registration")
        raise exc
    except Exception as e:
        if firebase_uid_to_cleanup:
            deleted = firebase_service.delete_user_by_uid(firebase_uid_to_cleanup)
            if deleted:
                logger.info(
                    f"Compensation applied: deleted Firebase user {firebase_uid_to_cleanup}"
                )
            else:
                logger.error(
                    f"Compensation failed: could not delete Firebase user {firebase_uid_to_cleanup}"
                )
        logger.error(f"Unexpected error during user registration: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise http_500_internal_error("Registration failed")


@router.post("/login",
             response_model=LoginResponse,
             summary="Inicio de sesión",
             description="Autentica un usuario con Firebase token y devuelve tokens JWT")
async def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """Authenticate user with Firebase token and return JWT tokens."""
    auth_service = AuthService(db)
    
    # Authenticate user with Firebase
    if not request.firebase_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase token is required",
        )
    
    user = await auth_service.authenticate_with_firebase(request.firebase_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token or user not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is suspended",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    tokens = auth_service.create_user_tokens(user)
    
    # Update last login
    auth_service.update_last_login(user)
    
    # Get client info
    user_agent = http_request.headers.get("user-agent") if http_request else None
    ip_address = http_request.client.host if http_request and http_request.client else None
    
    # Save session
    auth_service.create_user_session(
        user_id=user.id,
        refresh_token=tokens["refresh_token"],
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    return LoginResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=tokens["expires_in"],
        user=UserResponse.from_orm(user)
    )


@router.post("/logout",
             response_model=MessageResponse,
             summary="Cerrar sesión",
             description="Revoca el token de refresh del usuario")
async def logout(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Logout user and revoke refresh token."""
    auth_service = AuthService(db)
    
    # Revoke refresh token
    auth_service.revoke_refresh_token(request.refresh_token)
    
    return MessageResponse(message="Successfully logged out")


@router.post("/refresh",
             response_model=TokenResponse,
             summary="Renovar token de acceso",
             description="Renueva el token de acceso usando el refresh token")
async def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token."""
    auth_service = AuthService(db)
    
    # Verify and refresh token
    tokens = auth_service.refresh_access_token(request.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=tokens["expires_in"]
    )


@router.get("/me",
            response_model=UserResponse,
            summary="Obtener información básica del usuario autenticado",
            description="Obtiene información básica del usuario autenticado (para contexto de auth)")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user basic information for auth context."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        profile_picture_url=current_user.profile_picture_url,
        national_id=current_user.national_id,
        national_id_type=current_user.national_id_type,
        role=current_user.role,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        last_login_at=current_user.last_login_at,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )


@router.post("/check-email",
             summary="Verificar disponibilidad de email",
             description="Verifica si un email ya está registrado en Firebase")
async def check_email(
    request: dict,
    db: Session = Depends(get_db)
):
    """Check if email already exists in Firebase."""
    try:
        email = request.get("email", "").strip().lower()
        
        if not email:
            raise http_400_bad_request("Email is required")
        
        logger.info(f"Checking if email exists: {email}")
        
        # Check in Firebase first
        try:
            firebase_user = await firebase_service.get_user_by_email(email)
            exists = firebase_user is not None
            logger.info(f"Email {email} exists in Firebase: {exists}")
        except Exception as firebase_error:
            logger.warning(f"Firebase check error: {firebase_error}")
            # If Firebase check fails, check in database as fallback
            auth_service = AuthService(db)
            db_user = auth_service.get_user_by_email(email)
            exists = db_user is not None
            logger.info(f"Email {email} exists in database: {exists}")
        
        return {"exists": exists, "email": email}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking email: {str(e)}")
        raise http_500_internal_error(f"Error checking email: {str(e)}")
