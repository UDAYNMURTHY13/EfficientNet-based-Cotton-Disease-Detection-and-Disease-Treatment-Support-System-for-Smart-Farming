"""
FastAPI main application
Entry point for the CottonCare AI backend API
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from app.core.config import get_settings
from app.core.database import init_db, health_check
from app.api.v1 import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database
    try:
        init_db()
        logger.info("✓ Database initialized")
    except Exception as e:
        logger.error(f"✗ Database initialization failed: {e}")
        raise
    
    # Check database health
    if not health_check():
        raise RuntimeError("Database health check failed")
    
    logger.info("✓ Database health check passed")
    logger.info(f"✓ {settings.APP_NAME} started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": health_check()
    }


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve uploaded images statically so admin/expert dashboards can display them
import pathlib
_uploads_dir = pathlib.Path("uploads")
_uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")



# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"][1:]),
            "message": error["msg"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status_code": 422,
            "message": "Validation failed",
            "errors": errors
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status_code": exc.status_code,
            "message": exc.detail
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status_code": 500,
            "message": "Internal server error",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
