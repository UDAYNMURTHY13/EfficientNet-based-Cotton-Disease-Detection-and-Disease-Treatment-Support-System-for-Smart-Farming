"""
Analysis API endpoints
Handles image upload, disease detection, and analysis history
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid
import os
import logging
from pathlib import Path

from app.core.database import get_db
from app.core.security import decode_token
from app.models.db_models import User, Analysis
from app.schemas import AnalysisResponse, AnalysisHistoryResponse, AnalysisDetailResponse

router = APIRouter(prefix="/analysis", tags=["Analysis"])
security = HTTPBearer()
logger = logging.getLogger(__name__)

# Import disease analysis pipeline
import sys

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    from services.disease_analysis_pipeline import DiseaseAnalysisPipeline
    pipeline = DiseaseAnalysisPipeline()
    logger.info("✓ Disease analysis pipeline loaded successfully")
except (ImportError, ModuleNotFoundError) as e:
    logger.warning(f"Could not load DiseaseAnalysisPipeline: {e}")
    pipeline = None
except Exception as e:
    logger.warning(f"Error initializing DiseaseAnalysisPipeline: {e}")
    pipeline = None

# Create uploads directory if not exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def get_current_user_analysis(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    from app.services.user_service import UserService
    
    token = credentials.credentials
    token_data = decode_token(token)
    
    if not token_data:
        logger.error(f"Failed to decode token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = UserService.get_user_by_id(db, token_data.user_id)
    
    if not user or not user.is_active:
        logger.error(f"User not found or inactive: {token_data.user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    latitude: float = Query(None),
    longitude: float = Query(None),
    location_accuracy: float = Query(None),
    location_name: str = Query(None),
    environment_conditions: str = Query(None),
    current_user: User = Depends(get_current_user_analysis),
    db: Session = Depends(get_db)
):
    """
    Upload cotton leaf image for disease analysis
    Runs complete 4-stage pipeline with GPS location capture
    
    Query Parameters:
    - latitude: GPS latitude coordinate
    - longitude: GPS longitude coordinate
    - location_accuracy: GPS accuracy in meters
    - location_name: Human-readable place name (village, taluk, district, state)
    - environment_conditions: Weather/environment notes
    """
    try:
        logger.info(f"Analysis request from user: {current_user.id}")
        user = current_user
        
        # Save uploaded file
        file_path = UPLOAD_DIR / f"{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Run pipeline
        from PIL import Image
        import time
        
        if pipeline is None:
            logger.error("Disease analysis pipeline is not initialized")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ML model is not available. Please try again later."
            )
        
        start_time = time.time()
        image = Image.open(file_path)
        analysis_result = pipeline.analyze(image)
        inference_time = time.time() - start_time
        
        # Extract results from pipeline (new format)
        disease = analysis_result.get("disease", "Unknown")
        confidence = analysis_result.get("confidence", 0)
        confidence_percentage = analysis_result.get("confidence_percentage", 0)
        affected_area = analysis_result.get("affected_area", 0)
        
        severity_data = analysis_result.get("severity", {})
        severity_level = severity_data.get("level", "Unknown") if isinstance(severity_data, dict) else "Unknown"
        severity_score = severity_data.get("score", 0) if isinstance(severity_data, dict) else 0
        severity_reasoning = severity_data.get("reasoning", "") if isinstance(severity_data, dict) else ""
        severity_description = severity_data.get("description", "") if isinstance(severity_data, dict) else ""
        severity_indicators = severity_data.get("indicators", {}) if isinstance(severity_data, dict) else {}
        
        lesion_data = analysis_result.get("lesion_analysis", {})
        lesion_count = lesion_data.get("count", 0) if lesion_data else 0
        lesion_details = lesion_data.get("details", []) if lesion_data else []
        
        # Save to database
        db_analysis = Analysis(
            user_id=user.id,
            image_filename=file.filename,
            image_path=str(file_path),
            latitude=latitude,
            longitude=longitude,
            location_accuracy=location_accuracy,
            location_name=location_name,
            environment_conditions=environment_conditions,
            disease_detected=disease,
            confidence=confidence,
            confidence_percentage=confidence_percentage,
            affected_area_percentage=affected_area,
            lesion_count=lesion_count,
            lesion_details=lesion_details,
            heatmap_data=[],
            severity_level=severity_level,
            severity_score=severity_score,
            reasoning=severity_reasoning,
            recommendation=severity_description,
            indicators=severity_indicators,
            inference_time=inference_time
        )
        
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        return AnalysisResponse(
            diagnosis_id=db_analysis.id,
            analysis=analysis_result,
            inference_time=inference_time,
            timestamp=datetime.utcnow().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Analysis failed: {type(e).__name__}: {str(e)}"
        logger.error(f"Analysis error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_detail
        )


@router.get("/history", response_model=AnalysisHistoryResponse)
async def get_analysis_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user_analysis),
    db: Session = Depends(get_db)
):
    """
    Get analysis history for current user
    """
    logger.info(f"Getting history for user: {current_user.id}")
    
    # Get analyses
    query = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.analyzed_at.desc())
    
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return AnalysisHistoryResponse(
        total=total,
        items=[{
            # Identifiers
            "id": item.id,
            "image_filename": item.image_filename,
            # Detection
            "disease_detected": item.disease_detected,
            "confidence": item.confidence,
            "confidence_percentage": item.confidence_percentage,
            # Area & Lesions
            "affected_area_percentage": item.affected_area_percentage,
            "lesion_count": item.lesion_count,
            "lesion_details": item.lesion_details,
            # Severity
            "severity_level": item.severity_level,
            "severity_score": item.severity_score,
            "reasoning": item.reasoning,
            "recommendation": item.recommendation,
            "indicators": item.indicators,
            # Location
            "latitude": item.latitude,
            "longitude": item.longitude,
            "location_accuracy": item.location_accuracy,
            "location_name": item.location_name,
            "environment_conditions": item.environment_conditions,
            # Meta
            "inference_time": item.inference_time,
            "analyzed_at": item.analyzed_at,
        } for item in items]
    )


@router.get("/history/{analysis_id}", response_model=AnalysisDetailResponse)
async def get_analysis_detail(
    analysis_id: str,
    current_user: User = Depends(get_current_user_analysis),
    db: Session = Depends(get_db)
):
    """
    Get detailed analysis result
    """
    # Get analysis
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    return AnalysisDetailResponse.from_orm(analysis)


@router.delete("/history/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user_analysis),
    db: Session = Depends(get_db)
):
    """
    Delete analysis record
    """
    # Get analysis
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Delete file
    if os.path.exists(analysis.image_path):
        os.remove(analysis.image_path)
    
    # Delete record
    db.delete(analysis)
    db.commit()
    
    return {"success": True, "message": "Analysis deleted successfully"}


@router.get("/stats")
async def get_analysis_stats(
    current_user: User = Depends(get_current_user_analysis),
    db: Session = Depends(get_db)
):
    """
    Get analysis statistics for current user
    """
    # Get stats
    total_analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).count()
    
    diseases = db.query(Analysis.disease_detected).filter(
        Analysis.user_id == current_user.id
    ).distinct().all()
    
    severity_levels = db.query(Analysis.severity_level).filter(
        Analysis.user_id == current_user.id
    ).all()
    
    severity_counts = {}
    for level, in severity_levels:
        severity_counts[level] = severity_counts.get(level, 0) + 1
    
    return {
        "total_analyses": total_analyses,
        "disease_types": [d[0] for d in diseases],
        "severity_distribution": severity_counts,
        "avg_confidence": db.query(
            func.avg(Analysis.confidence)
        ).filter(Analysis.user_id == current_user.id).scalar() or 0
    }
