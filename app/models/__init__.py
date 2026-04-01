"""
SQLAlchemy ORM models for CottonCare AI
Defines database schema and relationships
"""

from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Boolean, Text, ForeignKey, Enum as SQLEnum, Index, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    """User roles in the system"""
    FARMER = "farmer"
    EXPERT = "expert"
    ADMIN = "admin"


class SeverityLevel(str, enum.Enum):
    """Disease severity levels"""
    NONE = "none"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class VerificationStatus(str, enum.Enum):
    """Prediction verification status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"


class User(Base):
    """User model for farmers, experts, and admins"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.FARMER, nullable=False)
    
    # Additional fields
    farm_location = Column(String(500), nullable=True)
    farm_size_acres = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    email_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="expert")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    __table_args__ = (
        Index("ix_users_email_active", "email", "is_active"),
        Index("ix_users_role_active", "role", "is_active"),
    )


class Prediction(Base):
    """Prediction/Diagnosis model"""
    __tablename__ = "predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Image information
    image_filename = Column(String(255), nullable=False)
    image_path = Column(String(500), nullable=False)
    image_size_bytes = Column(Integer, nullable=True)
    
    # Prediction results
    predicted_disease = Column(String(100), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    all_predictions = Column(JSON, nullable=False)  # All class probabilities
    
    # Severity assessment
    severity_level = Column(SQLEnum(SeverityLevel), nullable=False, index=True)
    severity_score = Column(Integer, nullable=False)  # 0-4
    affected_area_percentage = Column(Float, nullable=True)
    
    # Performance metrics
    inference_time_ms = Column(Float, nullable=False)
    preprocessing_time_ms = Column(Float, nullable=True)
    
    # XAI data
    xai_data = Column(JSON, nullable=True)  # Heatmap, explanation, lesion analysis
    visualization_path = Column(String(500), nullable=True)
    
    # Verification
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, index=True)
    
    # Additional metadata
    device_info = Column(JSON, nullable=True)
    location_latitude = Column(Float, nullable=True)
    location_longitude = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="predictions")
    verification = relationship("Verification", back_populates="prediction", uselist=False, cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_predictions_user_created", "user_id", "created_at"),
        Index("ix_predictions_disease_severity", "predicted_disease", "severity_level"),
        Index("ix_predictions_verification", "verification_status", "created_at"),
    )


class Verification(Base):
    """Expert verification model"""
    __tablename__ = "verifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id = Column(UUID(as_uuid=True), ForeignKey("predictions.id"), nullable=False, unique=True)
    expert_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Verification details
    verification_status = Column(SQLEnum(VerificationStatus), nullable=False, index=True)
    expert_comments = Column(Text, nullable=True)
    
    # Corrections (if expert disagrees)
    corrections = Column(JSON, nullable=True)
    confidence_adjustment = Column(Float, nullable=True)
    suggested_treatment = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    prediction = relationship("Prediction", back_populates="verification")
    expert = relationship("User", back_populates="verifications")
    
    __table_args__ = (
        Index("ix_verifications_expert_status", "expert_id", "verification_status"),
        Index("ix_verifications_created", "created_at"),
    )


class Treatment(Base):
    """Treatment reference database"""
    __tablename__ = "treatments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    disease_name = Column(String(100), unique=True, nullable=False, index=True)
    scientific_name = Column(String(255), nullable=True)
    common_name = Column(String(255), nullable=True)
    
    # Disease information
    disease_info = Column(JSON, nullable=False)  # symptoms, spread, favorable conditions
    chemical_treatments = Column(JSON, nullable=False)
    organic_treatments = Column(JSON, nullable=False)
    preventive_measures = Column(JSON, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    """Audit logging for all system actions"""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    
    # Action details
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Request/Response details
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    request_body = Column(JSON, nullable=True)
    response_status = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index("ix_audit_logs_user_timestamp", "user_id", "timestamp"),
        Index("ix_audit_logs_action_timestamp", "action", "timestamp"),
        Index("ix_audit_logs_resource", "resource_type", "resource_id"),
    )


class UserStatistics(Base):
    """User statistics and analytics"""
    __tablename__ = "user_statistics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    
    # Statistics
    total_predictions = Column(Integer, default=0)
    total_verified_predictions = Column(Integer, default=0)
    diseases_detected = Column(JSON, nullable=True)  # {disease_name: count}
    
    # Accuracy metrics
    avg_confidence = Column(Float, nullable=True)
    accuracy_score = Column(Float, nullable=True)  # Based on expert verifications
    
    # Timestamps
    last_prediction_date = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SystemMetrics(Base):
    """System-wide metrics for monitoring"""
    __tablename__ = "system_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Performance metrics
    avg_prediction_time_ms = Column(Float, nullable=True)
    total_predictions = Column(Integer, default=0)
    total_verifications = Column(Integer, default=0)
    
    # User metrics
    total_users = Column(Integer, default=0)
    active_users_today = Column(Integer, default=0)
    total_farmers = Column(Integer, default=0)
    total_experts = Column(Integer, default=0)
    
    # Disease distribution
    disease_distribution = Column(JSON, nullable=True)  # {disease: count}
    
    # System health
    database_size_mb = Column(Float, nullable=True)
    api_uptime_percentage = Column(Float, nullable=True)
    error_rate_percentage = Column(Float, nullable=True)
    
    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
