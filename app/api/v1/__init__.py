"""
API v1 router - includes all endpoints
"""

from fastapi import APIRouter
from app.api.v1 import auth, analysis, translate, admin, expert

# Create router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(analysis.router, tags=["analysis"])
api_router.include_router(translate.router, tags=["Translation"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(expert.router, tags=["expert"])
