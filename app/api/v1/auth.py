"""
Authentication routes and endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from http import HTTPStatus
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from app.core.database import get_db
from app.core.security import (
    create_access_token, create_refresh_token, decode_token, validate_password_strength
)
from app.models.db_models import User
from app.schemas import (
    UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse, 
    UserCompleteProfileRequest
)
from app.services.user_service import UserService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["authentication"])
security = HTTPBearer()


def get_current_user(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    token_data = decode_token(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = UserService.get_user_by_id(db, token_data.user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user (Quick onboarding with 5 fields)"""
    
    # Validate password strength
    is_strong, message = validate_password_strength(request.password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Check if user already exists
    existing_user = UserService.get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    try:
        user = UserService.create_user(
            db=db,
            email=request.email,
            password=request.password,
            first_name=request.first_name,
            phone=request.phone,
            location=request.location,
            role="farmer"  # Default to farmer role
        )
        
        logger.info(f"New user registered: {request.email}")
        return user
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user and return tokens"""
    
    # Authenticate user
    user = UserService.authenticate_user(db, request.email, request.password)
    
    if not user:
        logger.warning(f"Failed login attempt for: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate tokens
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Update last login
    UserService.update_user(db, str(user.id), last_login=__import__('datetime').datetime.utcnow())
    
    logger.info(f"User logged in: {request.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=15 * 60  # 15 minutes in seconds
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: dict,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    
    refresh_token = request.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required"
        )
    
    token_data = decode_token(refresh_token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user = UserService.get_user_by_id(db, token_data.user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Generate new tokens
    new_token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value
    }
    
    access_token = create_access_token(new_token_data)
    new_refresh_token = create_refresh_token(new_token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=15 * 60
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout (client-side token cleanup)"""
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully"}


@router.post("/profile/complete", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def complete_profile(
    request: UserCompleteProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user profile (Progressive onboarding - Step 2-5)"""
    
    try:
        # Update user with complete profile data
        for field, value in request.dict(exclude_none=True).items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)
        
        # Calculate profile completion percentage (rough estimate)
        # Count non-null fields / total fields * 100
        profile_fields = [
            'first_name', 'last_name', 'age', 'phone', 'village_town', 'taluk_block',
            'district', 'state', 'pincode', 'latitude', 'longitude', 'farm_name',
            'total_land_acres', 'num_cotton_fields', 'soil_type', 'irrigation_source',
            'cotton_variety', 'sowing_date', 'current_season', 'farming_experience_years',
            'past_disease_history', 'pesticide_usage_habits', 'notification_preference'
        ]
        completed_fields = sum(1 for field in profile_fields if getattr(current_user, field, None) is not None)
        current_user.profile_completion = min(100, int((completed_fields / len(profile_fields)) * 100))
        
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"User profile completed: {current_user.email} ({current_user.profile_completion}% complete)")
        return current_user
    
    except Exception as e:
        db.rollback()
        logger.error(f"Profile completion error for user {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to complete profile: {str(e)}"
        )
