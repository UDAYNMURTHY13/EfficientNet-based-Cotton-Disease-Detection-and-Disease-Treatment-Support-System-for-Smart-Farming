"""
Database Integration for API endpoints
Adds database persistence to all API operations
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from db_operations import (
    ScanRepository, PredictionRepository, ReportRepository,
    VerificationRepository, AuditRepository
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/db", tags=["database"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SaveScanRequest(BaseModel):
    """Request to save a scan"""
    scanId: str
    farmerId: str
    farmerName: str
    farmerEmail: str
    imagePath: Optional[str] = None
    imageData: Optional[str] = None  # Base64 encoded
    location: Optional[dict] = None
    deviceInfo: Optional[str] = None
    metadata: Optional[dict] = None


class SavePredictionRequest(BaseModel):
    """Request to save a prediction"""
    scanId: str
    primaryDisease: str
    confidence: float
    severity: dict
    allPredictions: dict
    modelVersion: str
    processingTime: int


class SaveReportRequest(BaseModel):
    """Request to save a report"""
    reportId: str
    scanId: str
    primaryDisease: str
    severity: dict
    confidence: float
    diseaseDescription: str
    causes: List[str]
    symptoms: List[str]
    treatments: List[str]
    actions: List[str]
    measures: List[str]


class VerificationUpdateRequest(BaseModel):
    """Request to update verification status"""
    status: str  # APPROVED, REJECTED, NEEDS_REVIEW
    feedback: Optional[str] = None


# ============================================================================
# SCAN ENDPOINTS
# ============================================================================

@router.post("/scan/save")
async def save_scan(request: SaveScanRequest):
    """Save a new scan to database"""
    try:
        result = ScanRepository.create_scan(request.dict())
        if result['success']:
            # Log the action
            AuditRepository.log_action(
                entity_type='Scan',
                entity_id=request.scanId,
                action='CREATE',
                user_id=request.farmerId,
                new_value={'farmerId': request.farmerId, 'imagePath': request.imagePath}
            )
            return {
                'success': True,
                'scanId': result['scanId'],
                'message': 'Scan saved successfully'
            }
        else:
            raise HTTPException(status_code=500, detail=result['error'])
    except Exception as e:
        logger.error(f"Error saving scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scan/{scan_id}")
async def get_scan(scan_id: str):
    """Retrieve a scan by ID"""
    try:
        result = ScanRepository.get_scan(scan_id)
        if result['success']:
            return result['scan']
        else:
            raise HTTPException(status_code=404, detail="Scan not found")
    except Exception as e:
        logger.error(f"Error retrieving scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scans/farmer/{farmer_id}")
async def get_farmer_scans(farmer_id: str):
    """Get all scans for a farmer"""
    try:
        result = ScanRepository.get_farmer_scans(farmer_id)
        if result['success']:
            return {
                'success': True,
                'count': result['count'],
                'scans': result['scans']
            }
        else:
            raise HTTPException(status_code=500, detail=result['error'])
    except Exception as e:
        logger.error(f"Error retrieving farmer scans: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/scan/{scan_id}/status")
async def update_scan_status(scan_id: str, status: str = Query(...)):
    """Update scan status (PENDING_PREDICTION, PROCESSING, COMPLETED, FAILED)"""
    try:
        result = ScanRepository.update_scan_status(scan_id, status)
        if result['success']:
            AuditRepository.log_action(
                entity_type='Scan',
                entity_id=scan_id,
                action='UPDATE_STATUS',
                new_value={'status': status}
            )
            return {
                'success': True,
                'status': status,
                'message': 'Scan status updated'
            }
        else:
            raise HTTPException(status_code=404, detail="Scan not found")
    except Exception as e:
        logger.error(f"Error updating scan status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================

@router.post("/prediction/save")
async def save_prediction(request: SavePredictionRequest):
    """Save a prediction to database"""
    try:
        result = PredictionRepository.create_prediction(request.dict())
        if result['success']:
            # Update scan status to completed
            ScanRepository.update_scan_status(request.scanId, 'COMPLETED')
            
            # Log the action
            AuditRepository.log_action(
                entity_type='Prediction',
                entity_id=result['predictionId'],
                action='CREATE',
                new_value={
                    'scanId': request.scanId,
                    'disease': request.primaryDisease,
                    'confidence': request.confidence
                }
            )
            return {
                'success': True,
                'predictionId': result['predictionId'],
                'message': 'Prediction saved successfully'
            }
        else:
            raise HTTPException(status_code=500, detail=result['error'])
    except Exception as e:
        logger.error(f"Error saving prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prediction/{scan_id}")
async def get_prediction(scan_id: str):
    """Get prediction for a scan"""
    try:
        result = PredictionRepository.get_prediction(scan_id)
        if result['success']:
            return result['prediction']
        else:
            raise HTTPException(status_code=404, detail="Prediction not found")
    except Exception as e:
        logger.error(f"Error retrieving prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# REPORT ENDPOINTS
# ============================================================================

@router.post("/report/save")
async def save_report(request: SaveReportRequest):
    """Save a report to database"""
    try:
        result = ReportRepository.create_report(request.dict())
        if result['success']:
            # Log the action
            AuditRepository.log_action(
                entity_type='Report',
                entity_id=result['reportId'],
                action='CREATE',
                new_value={
                    'scanId': request.scanId,
                    'disease': request.primaryDisease
                }
            )
            return {
                'success': True,
                'reportId': result['reportId'],
                'message': 'Report saved successfully'
            }
        else:
            raise HTTPException(status_code=500, detail=result['error'])
    except Exception as e:
        logger.error(f"Error saving report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{report_id}")
async def get_report(report_id: str):
    """Get a report by ID"""
    try:
        result = ReportRepository.get_report(report_id)
        if result['success']:
            return result['report']
        else:
            raise HTTPException(status_code=404, detail="Report not found")
    except Exception as e:
        logger.error(f"Error retrieving report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# VERIFICATION ENDPOINTS
# ============================================================================

@router.get("/verifications/pending")
async def get_pending_verifications():
    """Get all pending verifications for experts"""
    try:
        result = VerificationRepository.get_pending_verifications()
        if result['success']:
            return {
                'success': True,
                'count': result['count'],
                'verifications': result['verifications']
            }
        else:
            raise HTTPException(status_code=500, detail=result['error'])
    except Exception as e:
        logger.error(f"Error retrieving verifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/verification/{verification_id}")
async def update_verification(
    verification_id: str,
    request: VerificationUpdateRequest
):
    """Update verification status"""
    try:
        result = VerificationRepository.update_verification(
            verification_id,
            request.status,
            request.feedback
        )
        if result['success']:
            # Log the action
            AuditRepository.log_action(
                entity_type='Verification',
                entity_id=verification_id,
                action='UPDATE_STATUS',
                new_value={
                    'status': request.status,
                    'feedback': request.feedback
                }
            )
            return {
                'success': True,
                'status': result['status'],
                'message': 'Verification updated'
            }
        else:
            raise HTTPException(status_code=404, detail="Verification not found")
    except Exception as e:
        logger.error(f"Error updating verification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Check database health and connectivity"""
    try:
        from database import SessionLocal
        db = SessionLocal()
        db.close()
        return {
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'message': 'Database connected and operational'
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }
