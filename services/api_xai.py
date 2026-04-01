"""
FastAPI endpoints for XAI analysis and model inference
Complete REST API for Cotton Disease Detection with Explainability
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import cv2
import logging
import uuid
from datetime import datetime
from PIL import Image
import io
import os

from model_service import model_service
from severity_engine import severity_engine
from xai_explainer import XAIExplainer
from xai_visualizations import HeatmapVisualizer, ComprehensiveVisualization

try:
    from api_db_integration import router as db_router
except Exception as e:
    db_router = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Cotton Leaf Disease Detection API",
    description="AI-powered disease diagnosis with Explainable AI (XAI)",
    version="2.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Include database integration router
if db_router is not None:
    app.include_router(db_router)
else:
    logger.warning("Database integration router disabled due to import error")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class PredictionResponse(BaseModel):
    """Standard prediction response"""
    diagnosis_id: str
    disease: str
    confidence: float
    confidence_percentage: float
    severity: Dict[str, Any]
    affected_area: Optional[float]
    inference_time: float
    timestamp: str
    xai_available: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "diagnosis_id": "550e8400-e29b-41d4-a716-446655440000",
                "disease": "Bacterial Blight",
                "confidence": 0.968,
                "confidence_percentage": 96.8,
                "severity": {
                    "level": "Moderate",
                    "score": 2,
                    "confidence": 96.8,
                    "description": "Progressing infection, urgent treatment needed"
                },
                "affected_area": 35.2,
                "inference_time": 0.214,
                "timestamp": "2025-12-24T10:30:00Z",
                "xai_available": True
            }
        }


class XAIExplanation(BaseModel):
    """XAI explanation response"""
    disease: str
    confidence_percentage: float
    confidence_level: str
    cause: str
    detected_indicators: List[str]
    all_possible_indicators: List[str]
    severity_assessment: Dict[str, Any]
    explanation_summary: str
    confidence_justification: str


class XAIDetailedResponse(BaseModel):
    """Detailed XAI analysis response"""
    prediction: Dict[str, Any]
    explanation: XAIExplanation
    lesion_analysis: Dict[str, Any]
    visualizations: Dict[str, str]  # Base64 encoded images


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    xai_enabled: bool
    timestamp: str


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_diagnosis_id() -> str:
    """Generate unique diagnosis ID"""
    return str(uuid.uuid4())


def get_current_timestamp() -> str:
    """Get current UTC timestamp"""
    return datetime.utcnow().isoformat() + "Z"


# ============================================================================
# HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Check API health and model status
    
    Returns:
        HealthCheckResponse with status details
    """
    return HealthCheckResponse(
        status="healthy" if model_service.health_check() else "degraded",
        model_loaded=model_service.model is not None,
        xai_enabled=model_service.enable_xai and model_service.xai_explainer is not None,
        timestamp=get_current_timestamp()
    )


@app.get("/info")
async def get_info():
    """
    Get API information and available disease classes
    
    Returns:
        JSON with API metadata and disease information
    """
    return {
        "api_name": "Cotton Leaf Disease Detection API",
        "version": "2.0",
        "diseases": model_service.classes,
        "features": {
            "xai_enabled": model_service.enable_xai,
            "offline_mode": False,
            "image_formats": ["jpg", "jpeg", "png", "webp"],
            "max_image_size_mb": 10,
            "supported_languages": ["en", "hi", "ka"]
        },
        "endpoints": {
            "predict": "/predict",
            "predict_xai": "/predict/xai",
            "batch_predict": "/batch",
            "get_explanation": "/explanation/{diagnosis_id}"
        }
    }


# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """
    Make a single disease prediction from an image
    
    Args:
        file: Image file (JPEG, PNG, WebP)
        
    Returns:
        PredictionResponse with disease diagnosis and severity
        
    Raises:
        HTTPException: If image processing fails
    """
    try:
        # Validate file
        if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(status_code=400, detail="Invalid image format. Supported: JPEG, PNG, WebP")
        
        # Read and open image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Make prediction
        prediction = model_service.predict_single(image, include_xai=False)
        
        # Calculate severity
        severity = severity_engine.calculate_severity(
            prediction['class'],
            prediction['confidence']
        )
        
        # Estimate affected area
        affected_area = severity_engine.estimate_affected_area(image)
        
        diagnosis_id = generate_diagnosis_id()
        
        return PredictionResponse(
            diagnosis_id=diagnosis_id,
            disease=prediction['class'],
            confidence=prediction['confidence'],
            confidence_percentage=round(prediction['confidence'] * 100, 2),
            severity=severity,
            affected_area=affected_area,
            inference_time=prediction['inference_time'],
            timestamp=get_current_timestamp(),
            xai_available=model_service.enable_xai
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/xai")
async def predict_with_xai(file: UploadFile = File(...)):
    """
    Make a prediction with complete XAI analysis and visualizations
    
    Args:
        file: Image file (JPEG, PNG, WebP)
        
    Returns:
        JSON with prediction, explanation, and base64-encoded visualizations
        
    Raises:
        HTTPException: If XAI is disabled or processing fails
    """
    try:
        if not model_service.enable_xai or not model_service.xai_explainer:
            raise HTTPException(status_code=503, detail="XAI features are not available")
        
        # Validate and read file
        if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Make prediction with XAI
        prediction = model_service.predict_single(image, include_xai=True)
        
        # Calculate severity
        severity = severity_engine.calculate_severity(
            prediction['class'],
            prediction['confidence']
        )
        
        diagnosis_id = generate_diagnosis_id()
        
        return {
            "diagnosis_id": diagnosis_id,
            "disease": prediction['class'],
            "confidence": round(prediction['confidence'], 4),
            "confidence_percentage": round(prediction['confidence'] * 100, 2),
            "severity": severity,
            "inference_time": prediction['inference_time'],
            "timestamp": get_current_timestamp(),
            "xai_analysis": {
                "explanation": prediction['xai']['explanation'],
                "lesion_analysis": prediction['xai']['lesion_analysis'],
                "confidence_justification": prediction['xai']['confidence_justification']
            },
            "visualizations": prediction.get('visualizations', {}),
            "all_predictions": prediction['all_predictions']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"XAI prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"XAI prediction failed: {str(e)}")


@app.post("/batch")
async def batch_predict(files: List[UploadFile] = File(...)):
    """
    Make predictions on multiple images
    
    Args:
        files: List of image files
        
    Returns:
        List of predictions for each image
    """
    results = []
    
    for file in files:
        try:
            if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
                results.append({
                    "filename": file.filename,
                    "error": "Invalid image format"
                })
                continue
            
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert('RGB')
            
            prediction = model_service.predict_single(image, include_xai=False)
            severity = severity_engine.calculate_severity(
                prediction['class'],
                prediction['confidence']
            )
            
            results.append({
                "filename": file.filename,
                "diagnosis_id": generate_diagnosis_id(),
                "disease": prediction['class'],
                "confidence": round(prediction['confidence'], 4),
                "severity": severity,
                "inference_time": prediction['inference_time']
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return {
        "total_images": len(files),
        "successful": len([r for r in results if "error" not in r]),
        "failed": len([r for r in results if "error" in r]),
        "results": results
    }


# ============================================================================
# EXPLANATION ENDPOINTS
# ============================================================================

@app.get("/explanation/{diagnosis_id}")
async def get_explanation(
    diagnosis_id: str,
    include_visualizations: bool = Query(False, description="Include base64 encoded visualizations")
):
    """
    Get stored explanation for a diagnosis (for demonstration)
    
    Args:
        diagnosis_id: ID of the diagnosis
        include_visualizations: Whether to include encoded visualizations
        
    Returns:
        Explanation and optionally visualizations
    """
    # In a real implementation, this would retrieve from database
    return {
        "diagnosis_id": diagnosis_id,
        "message": "Use /predict/xai endpoint to generate explanations",
        "note": "Store diagnosis_id and XAI data in your database for retrieval"
    }


# ============================================================================
# XAI ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/analyze/heatmap")
async def analyze_heatmap(file: UploadFile = File(...)):
    """
    Get just the Grad-CAM heatmap for an image
    
    Args:
        file: Image file
        
    Returns:
        Heatmap as base64-encoded image
    """
    if not model_service.enable_xai:
        raise HTTPException(status_code=503, detail="XAI features unavailable")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Get prediction
        pred = model_service.predict_single(image, include_xai=True)
        
        if 'xai' not in pred:
            raise HTTPException(status_code=500, detail="Heatmap generation failed")
        
        heatmap = np.array(pred['xai']['heatmap'])
        heatmap_img = HeatmapVisualizer.create_heatmap_image(heatmap)
        
        return {
            "disease": pred['class'],
            "confidence": round(pred['confidence'], 4),
            "heatmap_base64": HeatmapVisualizer.image_to_base64(np.array(heatmap_img))
        }
        
    except Exception as e:
        logger.error(f"Heatmap generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/lesions")
async def analyze_lesions(file: UploadFile = File(...)):
    """
    Get lesion detection analysis
    
    Args:
        file: Image file
        
    Returns:
        Lesion count, affected area, and bounding box information
    """
    if not model_service.enable_xai:
        raise HTTPException(status_code=503, detail="XAI features unavailable")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        pred = model_service.predict_single(image, include_xai=True)
        
        if 'xai' not in pred:
            raise HTTPException(status_code=500, detail="Lesion analysis failed")
        
        lesion_info = pred['xai']['lesion_analysis']
        
        return {
            "disease": pred['class'],
            "confidence": round(pred['confidence'], 4),
            "lesion_analysis": {
                "total_affected_percentage": lesion_info['total_affected_percentage'],
                "lesion_count": lesion_info['lesion_count'],
                "lesion_details": lesion_info['lesion_details'],
                "severity": severity_engine.calculate_severity(
                    pred['class'],
                    pred['confidence']
                )
            }
        }
        
    except Exception as e:
        logger.error(f"Lesion analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/features")
async def analyze_features(file: UploadFile = File(...)):
    """
    Get detected disease features
    
    Args:
        file: Image file
        
    Returns:
        List of detected indicators and symptoms
    """
    if not model_service.enable_xai:
        raise HTTPException(status_code=503, detail="XAI features unavailable")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        pred = model_service.predict_single(image, include_xai=True)
        
        if 'xai' not in pred:
            raise HTTPException(status_code=500, detail="Feature analysis failed")
        
        return {
            "disease": pred['class'],
            "confidence": round(pred['confidence'], 4),
            "detected_indicators": pred['xai']['explanation']['detected_indicators'],
            "all_possible_indicators": pred['xai']['explanation']['all_possible_indicators'],
            "confidence_justification": pred['xai']['confidence_justification']
        }
        
    except Exception as e:
        logger.error(f"Feature analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# TREATMENT ENDPOINTS
# ============================================================================

@app.get("/treatment/{disease}")
async def get_treatment(disease: str, severity: Optional[str] = Query(None)):
    """
    Get treatment recommendations for a disease
    
    Args:
        disease: Disease name
        severity: Disease severity level (mild/moderate/severe/critical)
        
    Returns:
        Treatment options and recommendations
    """
    try:
        # This would integrate with your treatment database
        return {
            "disease": disease,
            "severity": severity,
            "message": "Treatment data should be fetched from your treatment database",
            "recommendation": "Integrate with treatment_db.py for full treatment options"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": get_current_timestamp()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": get_current_timestamp()
        }
    )


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main UI page"""
    try:
        with open("templates/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return """
        <html>
            <head>
                <title>Cotton AI - Disease Detection</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; 
                           height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; }
                    .container { text-align: center; color: white; }
                    h1 { margin: 0 0 20px 0; }
                    p { margin: 10px 0; }
                    a { color: #fff; text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🌾 Cotton Disease Detection API</h1>
                    <p>Status: <strong style="color: #4ade80;">Online</strong></p>
                    <p><a href="/docs">Interactive API Documentation →</a></p>
                    <p><a href="/health">Health Check</a> | <a href="/info">API Info</a></p>
                </div>
            </body>
        </html>
        """


# ============================================================================
# DASHBOARD ENDPOINTS
# ============================================================================

# ============================================================================
# HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """API health check"""
    return {
        "status": "healthy",
        "service": "Backend API",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/info")
async def info():
    """API information"""
    return {
        "name": "CottonCare AI - Backend API",
        "version": "2.0.0",
        "status": "online"
    }


@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        from database import SessionLocal, Scan, Prediction, Report
        db = SessionLocal()
        
        total_scans = db.query(Scan).count()
        completed_scans = db.query(Scan).filter(Scan.status == "COMPLETED").count()
        predictions = db.query(Prediction).count()
        
        db.close()
        
        return {
            "success": True,
            "stats": {
                "totalScans": total_scans,
                "completedScans": completed_scans,
                "predictions": predictions,
                "successRate": (completed_scans / total_scans * 100) if total_scans > 0 else 0
            }
        }
    except Exception as e:
        return {
            "success": True,
            "stats": {
                "totalScans": 0,
                "completedScans": 0,
                "predictions": 0,
                "successRate": 0
            },
            "note": "No data yet"
        }


@app.get("/api/dashboard/recent")
async def get_recent_scans():
    """Get recent scans"""
    try:
        from database import SessionLocal, Scan
        db = SessionLocal()
        
        recent = db.query(Scan).order_by(Scan.created_at.desc()).limit(10).all()
        
        data = [
            {
                "id": scan.id,
                "farmerId": scan.farmer_id,
                "farmerName": scan.farmer_name,
                "status": scan.status,
                "createdAt": scan.created_at.isoformat() if scan.created_at else None
            }
            for scan in recent
        ]
        
        db.close()
        
        return {
            "success": True,
            "count": len(data),
            "scans": data
        }
    except Exception as e:
        return {
            "success": True,
            "count": 0,
            "scans": [],
            "note": "No scans yet"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
