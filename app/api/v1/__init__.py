"""
API v1 router - includes all endpoints
"""

from fastapi import APIRouter
from app.api.v1 import auth

# Create router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# More routers will be added here:
# - predictions
# - treatments  
# - verifications
# - users
# - analytics
# - audit logs
