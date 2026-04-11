"""
API v1 router - includes all endpoints
"""

from fastapi import APIRouter
from app.api.v1 import auth, analysis

# Create router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(analysis.router, tags=["analysis"])

# More routers will be added here:
# - predictions
# - treatments  
# - verifications
# - users
# - analytics
# - audit logs
