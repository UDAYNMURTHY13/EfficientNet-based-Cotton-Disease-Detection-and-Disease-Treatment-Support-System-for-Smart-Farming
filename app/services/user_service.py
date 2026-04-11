"""
User management and authentication service
"""

from sqlalchemy.orm import Session
from app.models.db_models import User
from app.core.security import hash_password, verify_password
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)


class UserService:
    """Service for user operations"""
    
    @staticmethod
    def create_user(
        db: Session,
        email: str,
        password: str,
        first_name: str = None,
        phone: Optional[str] = None,
        role: Optional[str] = "farmer",
        last_name: Optional[str] = None,
        location: Optional[str] = None,
        full_name: Optional[str] = None,  # For backward compatibility
        **kwargs  # Accept additional fields for progressive profile updates
    ) -> User:
        """Create a new user (quick registration with minimal fields)"""
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise ValueError(f"User with email {email} already exists")
        
        # Hash password
        password_hash = hash_password(password)
        
        # Handle name mapping (full_name or first_name/last_name)
        if full_name and not first_name:
            name_parts = full_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else None
        
        # Create user with quick registration (5 fields minimum)
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role,
            is_active=True,
            profile_completion=20,  # 20% after quick signup
            **kwargs  # Accept any additional fields passed
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"User created: {email} (role: {role})")
        return user
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = UserService.get_user_by_email(db, email)
        
        if not user:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        if not user.is_active:
            return None
        
        return user
    
    @staticmethod
    def get_user_list(
        db: Session,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[list[User], int]:
        """Get list of users with optional filtering"""
        query = db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        
        return users, total
    
    @staticmethod
    def update_user(
        db: Session,
        user_id: str,
        **kwargs
    ) -> Optional[User]:
        """Update user profile fields"""
        user = UserService.get_user_by_id(db, user_id)
        
        if not user:
            return None
        
        # Allow updating comprehensive agricultural profile fields
        allowed_fields = {
            # Personal
            'first_name', 'last_name', 'phone', 'age', 'date_of_birth', 'preferred_language',
            # Location
            'village_town', 'taluk_block', 'district', 'state', 'pincode', 'latitude', 'longitude',
            # Farm
            'farm_name', 'total_land_acres', 'num_cotton_fields', 'soil_type', 'irrigation_source',
            # Cultivation
            'cotton_variety', 'sowing_date', 'current_season',
            # Experience
            'farming_experience_years', 'past_disease_history', 'pesticide_usage_habits',
            # Preferences
            'notification_preference', 'profile_completion', 'is_active'
        }
        
        for key, value in kwargs.items():
            if key in allowed_fields and value is not None:
                setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def change_password(
        db: Session,
        user_id: str,
        old_password: str,
        new_password: str
    ) -> bool:
        """Change user password"""
        user = UserService.get_user_by_id(db, user_id)
        
        if not user:
            return False
        
        # Verify old password
        if not verify_password(old_password, user.password_hash):
            return False
        
        # Set new password
        user.password_hash = hash_password(new_password)
        db.commit()
        
        logger.info(f"Password changed for user: {user.email}")
        return True
    
    @staticmethod
    def deactivate_user(db: Session, user_id: str) -> bool:
        """Deactivate user"""
        user = UserService.get_user_by_id(db, user_id)
        
        if not user:
            return False
        
        user.is_active = False
        db.commit()
        
        logger.info(f"User deactivated: {user.email}")
        return True
    
    @staticmethod
    def activate_user(db: Session, user_id: str) -> bool:
        """Activate user"""
        user = UserService.get_user_by_id(db, user_id)
        
        if not user:
            return False
        
        user.is_active = True
        db.commit()
        
        logger.info(f"User activated: {user.email}")
        return True
