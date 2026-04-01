"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid


# ============================================================================
# Authentication Schemas
# ============================================================================

class UserRole(str, Enum):
    FARMER = "farmer"
    EXPERT = "expert"
    ADMIN = "admin"


class UserRegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.FARMER
    farm_location: Optional[str] = None
    farm_size_acres: Optional[float] = None
    
    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """User response (non-sensitive)"""
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    role: UserRole
    farm_location: Optional[str]
    farm_size_acres: Optional[float]
    is_active: bool
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# Prediction Schemas
# ============================================================================

class SeverityLevel(str, Enum):
    NONE = "none"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class SeverityInfo(BaseModel):
    """Severity information"""
    level: SeverityLevel
    score: int
    description: str
    affected_area_percentage: Optional[float] = None


class XAIData(BaseModel):
    """XAI explanation data"""
    heatmap: Optional[str] = None  # Base64 encoded image
    explanation: Optional[str] = None
    lesion_analysis: Optional[Dict[str, Any]] = None
    confidence_factors: Optional[List[str]] = None


class TreatmentOption(BaseModel):
    """Single treatment option"""
    name: str
    dosage: str
    cost: Optional[str] = None
    application: str
    safety: Optional[str] = None
    effectiveness: Optional[str] = None


class TreatmentInfo(BaseModel):
    """Treatment recommendations"""
    disease: str
    disease_info: Dict[str, Any]
    chemical: Optional[Dict[str, Any]] = None
    organic: Optional[Dict[str, Any]] = None
    preventive: Optional[List[str]] = None


class PredictionRequest(BaseModel):
    """Prediction request"""
    include_xai: bool = True
    include_treatment: bool = True


class PredictionResponse(BaseModel):
    """Prediction response"""
    diagnosis_id: uuid.UUID
    disease: str
    confidence: float
    confidence_percentage: float
    severity: SeverityInfo
    affected_area_percentage: Optional[float]
    inference_time_ms: float
    preprocessing_time_ms: Optional[float]
    xai_available: bool
    xai: Optional[XAIData] = None
    treatment: Optional[TreatmentInfo] = None
    visualization_path: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True


class BatchPredictionResponse(BaseModel):
    """Batch prediction response"""
    batch_id: uuid.UUID
    predictions: List[PredictionResponse]
    total_count: int
    processed_count: int
    failed_count: int
    timestamp: datetime


# ============================================================================
# Verification Schemas
# ============================================================================

class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"


class VerificationRequest(BaseModel):
    """Expert verification request"""
    verification_status: VerificationStatus
    expert_comments: Optional[str] = None
    corrections: Optional[Dict[str, Any]] = None
    confidence_adjustment: Optional[float] = None
    suggested_treatment: Optional[str] = None


class VerificationResponse(BaseModel):
    """Verification response"""
    id: uuid.UUID
    prediction_id: uuid.UUID
    expert_id: uuid.UUID
    verification_status: VerificationStatus
    expert_comments: Optional[str]
    corrections: Optional[Dict[str, Any]]
    confidence_adjustment: Optional[float]
    suggested_treatment: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PredictionDetailsResponse(PredictionResponse):
    """Extended prediction details with verification info"""
    verification_status: VerificationStatus
    verification: Optional[VerificationResponse] = None


# ============================================================================
# Analytics Schemas
# ============================================================================

class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_predictions: int
    total_users: int
    total_experts: int
    total_farmers: int
    avg_prediction_confidence: float
    disease_distribution: Dict[str, int]
    severity_distribution: Dict[str, int]
    verification_rate: float
    accuracy_score: float


class DiseaseStats(BaseModel):
    """Disease statistics"""
    disease_name: str
    detection_count: int
    avg_confidence: float
    avg_severity_score: int
    most_common_severity: str
    verified_count: int
    expert_approval_rate: float


class UserStats(BaseModel):
    """User statistics"""
    user_id: uuid.UUID
    email: str
    role: UserRole
    total_predictions: int
    total_verified: int
    avg_confidence: float
    accuracy_score: Optional[float]
    diseases_detected: Dict[str, int]
    last_prediction_date: Optional[datetime]


# ============================================================================
# Audit Log Schemas
# ============================================================================

class AuditLogResponse(BaseModel):
    """Audit log entry"""
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[uuid.UUID]
    ip_address: Optional[str]
    response_status: Optional[int]
    error_message: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Audit log list response"""
    logs: List[AuditLogResponse]
    total_count: int
    limit: int
    offset: int


# ============================================================================
# Error Schemas
# ============================================================================

class ErrorResponse(BaseModel):
    """Error response"""
    status_code: int
    message: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ValidationErrorResponse(BaseModel):
    """Validation error response"""
    status_code: int = 422
    message: str = "Validation failed"
    errors: List[Dict[str, str]]
