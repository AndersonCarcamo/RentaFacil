"""
Firebase Authentication service for EasyRent API.
"""

import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, status
from app.core.config import settings
import logging
import os
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class FirebaseService:
    """Firebase Authentication service."""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._initialize_firebase()
            self._initialized = True
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
            logger.info("Firebase already initialized")
        except ValueError:
            # Initialize Firebase
            if settings.firebase_service_account_path and os.path.exists(settings.firebase_service_account_path):
                # Production: Use service account file
                cred = credentials.Certificate(settings.firebase_service_account_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account file")
            elif settings.firebase_service_account_json:
                # Production: Use service account JSON from environment
                import json
                service_account_info = json.loads(settings.firebase_service_account_json)
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account JSON")
            else:
                # Development: Use default credentials or mock
                logger.warning("No Firebase credentials found. Using development mode.")
                # For development, we'll mock Firebase functionality
                self._mock_mode = True
                return
            
            self._mock_mode = False
            logger.info("Firebase Authentication service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            self._mock_mode = True
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify Firebase ID token and return user claims.
        
        Args:
            token: Firebase ID token
            
        Returns:
            Dict with user claims if valid, None if invalid
        """
        if self._mock_mode:
            return self._mock_verify_token(token)
        
        try:
            # Verify the token with Firebase
            decoded_token = auth.verify_id_token(token)
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
                'phone_number': decoded_token.get('phone_number')
            }
        except auth.InvalidIdTokenError:
            logger.warning("Invalid Firebase ID token")
            return None
        except auth.ExpiredIdTokenError:
            logger.warning("Expired Firebase ID token")
            return None
        except Exception as e:
            logger.error(f"Error verifying Firebase token: {e}")
            return None
    
    async def get_user_by_uid(self, uid: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from Firebase by UID.
        
        Args:
            uid: Firebase user UID
            
        Returns:
            Dict with user information if found, None if not found
        """
        if self._mock_mode:
            return self._mock_get_user_by_uid(uid)
        
        try:
            user_record = auth.get_user(uid)
            return {
                'uid': user_record.uid,
                'email': user_record.email,
                'email_verified': user_record.email_verified,
                'display_name': user_record.display_name,
                'photo_url': user_record.photo_url,
                'phone_number': user_record.phone_number,
                'disabled': user_record.disabled,
                'creation_timestamp': user_record.user_metadata.creation_timestamp,
                'last_sign_in_timestamp': user_record.user_metadata.last_sign_in_timestamp
            }
        except auth.UserNotFoundError:
            logger.warning(f"Firebase user not found: {uid}")
            return None
        except Exception as e:
            logger.error(f"Error getting Firebase user: {e}")
            return None
    
    async def create_custom_token(self, uid: str, additional_claims: Optional[Dict] = None) -> Optional[str]:
        """
        Create a custom token for a user.
        
        Args:
            uid: Firebase user UID
            additional_claims: Additional claims to include in token
            
        Returns:
            Custom token string if successful, None if failed
        """
        if self._mock_mode:
            return self._mock_create_custom_token(uid, additional_claims)
        
        try:
            custom_token = auth.create_custom_token(uid, additional_claims)
            return custom_token.decode('utf-8')
        except Exception as e:
            logger.error(f"Error creating custom token: {e}")
            return None
    
    # Mock methods for development
    def _mock_verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Mock Firebase token verification for development."""
        if token.startswith("mock_token_"):
            uid = token.replace("mock_token_", "")
            return {
                'uid': uid,
                'email': f"{uid}@mock.com",
                'email_verified': True,
                'name': f"Mock User {uid}",
                'picture': None,
                'phone_number': None
            }
        return None
    
    def _mock_get_user_by_uid(self, uid: str) -> Optional[Dict[str, Any]]:
        """Mock Firebase user lookup for development."""
        return {
            'uid': uid,
            'email': f"{uid}@mock.com",
            'email_verified': True,
            'display_name': f"Mock User {uid}",
            'photo_url': None,
            'phone_number': None,
            'disabled': False,
            'creation_timestamp': 1640995200000,  # Mock timestamp
            'last_sign_in_timestamp': 1640995200000
        }
    
    def _mock_create_custom_token(self, uid: str, additional_claims: Optional[Dict] = None) -> str:
        """Mock custom token creation for development."""
        return f"mock_custom_token_{uid}"


# Singleton instance
firebase_service = FirebaseService()


async def verify_firebase_token(token: str) -> Dict[str, Any]:
    """
    Verify Firebase token and return claims.
    
    Args:
        token: Firebase ID token
        
    Returns:
        User claims dict
        
    Raises:
        HTTPException: If token is invalid
    """
    claims = await firebase_service.verify_token(token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return claims
