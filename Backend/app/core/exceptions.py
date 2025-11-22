"""
Custom exceptions for the EasyRent API.
"""

from fastapi import HTTPException, status
from typing import Any, Dict, Optional


class EasyRentException(Exception):
    """Base exception class for EasyRent API."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(EasyRentException):
    """Authentication related errors."""
    pass


class AuthorizationError(EasyRentException):
    """Authorization related errors."""
    pass


class ValidationError(EasyRentException):
    """Data validation errors."""
    pass


class NotFoundError(EasyRentException):
    """Resource not found errors."""
    pass


class ConflictError(EasyRentException):
    """Resource conflict errors."""
    pass


class BusinessLogicError(EasyRentException):
    """Business logic errors."""
    pass


class IntegrationError(EasyRentException):
    """External integration errors."""
    pass


class NotFoundException(HTTPException):
    """Resource not found exception (404)."""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class BadRequestException(HTTPException):
    """Bad request exception (400)."""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


# HTTP Exception shortcuts
def http_400_bad_request(detail: str) -> HTTPException:
    """Return a 400 Bad Request HTTP exception."""
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail
    )


def http_401_unauthorized(detail: str = "Not authenticated") -> HTTPException:
    """Return a 401 Unauthorized HTTP exception."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def http_403_forbidden(detail: str = "Not enough permissions") -> HTTPException:
    """Return a 403 Forbidden HTTP exception."""
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail
    )


def http_404_not_found(detail: str = "Resource not found") -> HTTPException:
    """Return a 404 Not Found HTTP exception."""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=detail
    )


def http_409_conflict(detail: str = "Resource already exists") -> HTTPException:
    """Return a 409 Conflict HTTP exception."""
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=detail
    )


def http_422_validation_error(detail: str = "Validation error") -> HTTPException:
    """Return a 422 Unprocessable Entity HTTP exception."""
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=detail
    )


def http_500_internal_error(detail: str = "Internal server error") -> HTTPException:
    """Return a 500 Internal Server Error HTTP exception."""
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=detail
    )
