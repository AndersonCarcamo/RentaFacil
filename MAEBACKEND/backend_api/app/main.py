from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from pathlib import Path
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.users import router as users_router
from app.api.endpoints.agencies import router as agencies_router
from app.api.endpoints.agents import router as agents_router
from app.api.endpoints.listings import router as listings_router
from app.api.endpoints.listings_simple import router as listings_simple_router
from app.api.endpoints.search import router as search_router
from app.api.endpoints.media import router as media_router
from app.api.endpoints.images import router as images_router
from app.api.endpoints.subscriptions import router as subscriptions_router
from app.api.endpoints.admin import router as admin_router
from app.api.endpoints.subscription_plans import router as subscription_plans_router
from app.api.endpoints.plans import router as plans_router
from app.api.endpoints.bookings import router as bookings_router
from app.api.endpoints.chat import router as chat_router
from app.api.endpoints.notifications import router as notifications_router
from app.api.endpoints.scheduled_tasks import router as scheduled_tasks_router
from app.api.endpoints.analytics import router as analytics_router
from app.api.endpoints.agent_analytics import router as agent_analytics_router
from app.api.endpoints.admin_dashboard import router as admin_dashboard_router
# Temporarily disabled routers that depend on non-existent database tables:
# from app.api.endpoints.interactions import router as interactions_router
# from app.api.endpoints.verifications import router as verifications_router
# from app.api.endpoints.integrations import router as integrations_router
# from app.api.endpoints.webhooks import router as webhooks_router
# from app.api.endpoints.api_keys import router as api_keys_router
from app.api.endpoints.system import router as system_router
from app.core.config import settings
from app.core.firebase import firebase_service
import time


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 {settings.app_name} v{settings.app_version} starting...")
    print(f"📖 Environment: {settings.environment}")
    
    # Initialize Firebase
    print("🔥 Initializing Firebase Authentication...")
    try:
        # The firebase_service is a singleton and will initialize on first access
        _ = firebase_service
        print("✅ Firebase Authentication initialized successfully")
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        raise
    
    if settings.api_docs_enabled:
        print(f"📚 API Documentation: http://localhost:8000/docs")
        print(f"🔍 Alternative docs: http://localhost:8000/redoc")
    
    yield
    
    # Shutdown
    print(f"👋 {settings.app_name} shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    **Renta_Facil API** - Sistema Completo de Inmobiliario

    API completa para el marketplace inmobiliario Renta_Facil con todas las funcionalidades:
    - 🔐 **Autenticación**: JWT + Registro/Login
    - 👥 **Gestión de usuarios y agencias**
    - 🏠 **Listings y multimedia**
    - 🔍 **Búsqueda avanzada y filtros**
    - 💎 **Sistema de planes y facturación**
    - 📊 **Analytics y reportes**
    - ✅ **Verificación y moderación**
    
    ## Tecnologías
    - **Framework**: FastAPI + Python 3.13+
    - **Base de datos**: PostgreSQL 18
    - **Autenticación**: JWT (Bearer Token)
    """,
    docs_url="/docs" if settings.api_docs_enabled else None,
    redoc_url="/redoc" if settings.api_docs_enabled else None,
    openapi_url="/openapi.json" if settings.api_docs_enabled else None,
    lifespan=lifespan
)

# CORS Configuration
configured_frontend_origins = [
    origin.strip() for origin in (settings.frontend_url or "").split(",") if origin.strip()
]

configured_cors_origins = [
    origin.strip() for origin in (settings.cors_allowed_origins or "").split(",") if origin.strip()
]

if settings.environment.lower() == "production":
    cors_origins = [
        *configured_frontend_origins,
        *configured_cors_origins,
    ]
else:
    cors_origins = [
        "http://localhost:3000",  # React development
        "http://localhost:3001",  # Alternative React port
        "http://127.0.0.1:3000",  # React development (IP)
        "http://127.0.0.1:3001",  # Alternative React port (IP)
        "http://localhost:8000",  # Backend mismo origen
        "http://127.0.0.1:8000",  # Backend mismo origen (IP)
        "http://localhost:19006",  # Expo development
        "http://127.0.0.1:19006",
        "http://192.168.18.51:3000",  # Frontend en red local
        
        *configured_frontend_origins,
        *configured_cors_origins,
    ]

trusted_hosts = [
    host.strip() for host in (settings.allowed_hosts or "").split(",") if host.strip()
]

if trusted_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(dict.fromkeys(trusted_hosts)))

if settings.enforce_https_redirect:
    app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(cors_origins)),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Custom middleware for request timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to EasyRent API",
        "version": settings.app_version,
        "docs": "/docs" if settings.api_docs_enabled else "Documentation disabled",
        "health": "/health"
    }


# Include only basic routers that work with existing database tables
app.include_router(
    auth_router,
    prefix="/v1/auth",
    tags=["Authentication"]
)

app.include_router(
    users_router,
    prefix="/v1",
    tags=["Users"]
)

app.include_router(
    agencies_router,
    prefix="/v1/agencies",
    tags=["Agencies"]
)

app.include_router(
    agents_router,
    prefix="/v1/agencies",
    tags=["Agents"]
)

app.include_router(
    listings_router,
    prefix="/v1/listings",
    tags=["Listings"]
)

app.include_router(
    listings_simple_router,
    prefix="/v1/listings-simple",
    tags=["Listings Simple"]
)

app.include_router(
    search_router,
    prefix="/v1/search",
    tags=["Search"]
)

app.include_router(
    media_router,
    prefix="/v1/media",
    tags=["Media"]
)

app.include_router(
    subscriptions_router,
    prefix="/v1/subscriptions",
    tags=["Subscriptions"]
)

app.include_router(
    admin_router,
    prefix="/v1/admin",
    tags=["Admin"]
)

app.include_router(
    subscription_plans_router,
    prefix="/v1/subscription-plans",
    tags=["Subscription Plans"]
)

app.include_router(
    plans_router,
    prefix="/v1/plans",
    tags=["Plans"]
)

app.include_router(
    images_router,
    prefix="/v1/images",
    tags=["Images"]
)

app.include_router(
    bookings_router,
    prefix="/v1/bookings",
    tags=["Bookings"]
)

app.include_router(
    chat_router,
    prefix="/v1",
    tags=["Chat"]
)

app.include_router(
    notifications_router,
    prefix="/v1/notifications",
    tags=["Notifications"]
)

app.include_router(
    scheduled_tasks_router,
    prefix="/v1/scheduled-tasks",
    tags=["Scheduled Tasks"]
)

app.include_router(
    analytics_router,
    prefix="/v1",
    tags=["Analytics"]
)

app.include_router(
    agent_analytics_router,
    prefix="/v1",
    tags=["Agent Analytics"]
)

app.include_router(
    admin_dashboard_router,
    prefix="/v1/admin",
    tags=["Admin Dashboard"]
)

app.include_router(
    system_router,
    prefix="",
    tags=["System"]
)

# Mount static files for media (avatars, images, etc.)
MEDIA_DIR = Path(__file__).parent.parent / "media"
MEDIA_DIR.mkdir(exist_ok=True)  # Ensure media directory exists

# Create subdirectories
(MEDIA_DIR / "avatars").mkdir(exist_ok=True)
(MEDIA_DIR / "listings").mkdir(exist_ok=True)

app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

# Mount uploads directory for listing images
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
(UPLOADS_DIR / "listings").mkdir(exist_ok=True)
(UPLOADS_DIR / "payment_proofs").mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Temporarily disabled routers until corresponding database tables are created:
# interactions, subscriptions, analytics, verifications, 
# notifications, admin, integrations, webhooks, api_keys


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )
