"""
Database models for CottonCare AI
"""

from sqlalchemy import Column, String, DateTime, Float, Integer, JSON, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    """Farmer user model with comprehensive farm details"""
    __tablename__ = "users"
    
    # Primary Keys & Auth
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="farmer")  # farmer, admin
    is_active = Column(Boolean, default=True)
    
    # Personal Information
    first_name = Column(String)
    last_name = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True)
    age = Column(Integer, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    preferred_language = Column(String, default="en")  # en, hi, ta, te, etc.
    
    # Location Details
    village_town = Column(String, nullable=True)
    taluk_block = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Farm Information
    farm_name = Column(String, nullable=True)
    total_land_acres = Column(Float, nullable=True)
    num_cotton_fields = Column(Integer, nullable=True)
    soil_type = Column(String, nullable=True)  # black, red, sandy, loamy
    irrigation_source = Column(String, nullable=True)  # rain-fed, borewell, canal, drip
    
    # Cotton Cultivation Details
    cotton_variety = Column(String, nullable=True)  # Bt, hybrid, desi
    sowing_date = Column(DateTime, nullable=True)
    current_season = Column(String, nullable=True)  # summer, monsoon, winter
    
    # Experience & History
    farming_experience_years = Column(Integer, nullable=True)
    past_disease_history = Column(String, nullable=True)  # JSON stored as text
    pesticide_usage_habits = Column(String, nullable=True)  # organic, chemical, mixed
    
    # Preferences
    notification_preference = Column(String, default="in_app")  # sms, whatsapp, in_app
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    profile_completion = Column(Integer, default=0)  # 0-100 percentage
    
    # Relationships
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"


class Analysis(Base):
    """Analysis history model with location tracking"""
    __tablename__ = "analyses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    image_filename = Column(String)
    image_path = Column(String)
    
    # Location at time of analysis (GPS)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_accuracy = Column(Float, nullable=True)  # in meters
    
    # Disease Detection Results
    disease_detected = Column(String)
    confidence = Column(Float)
    confidence_percentage = Column(String)
    
    # Area Analysis
    affected_area_percentage = Column(String)
    
    # Lesion Analysis
    lesion_count = Column(Integer)
    lesion_details = Column(JSON)
    heatmap_data = Column(JSON)  # Store heatmap as JSON array
    
    # Severity
    severity_level = Column(String)
    severity_score = Column(Float)
    reasoning = Column(String)
    recommendation = Column(String)
    indicators = Column(JSON)
    
    # Additional
    inference_time = Column(Float)
    environment_conditions = Column(String, nullable=True)  # weather notes
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="analyses")
    
    def __repr__(self):
        return f"<Analysis {self.id} - {self.disease_detected}>"
