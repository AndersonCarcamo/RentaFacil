"""
Chat API endpoints package.
Includes WebSocket and REST endpoints.
"""
from fastapi import APIRouter
from .websocket import router as websocket_router
from .conversations import router as conversations_router

# Router principal que combina todos los endpoints de chat
router = APIRouter()

# Incluir routers
router.include_router(websocket_router)
router.include_router(conversations_router)

__all__ = ['router']
