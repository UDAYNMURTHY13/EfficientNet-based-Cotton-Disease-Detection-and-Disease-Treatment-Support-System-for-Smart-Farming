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
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.disease_analysis_pipeline import get_pipeline

try:
    from services.api_db_integration import router as db_router
except Exception as e:
    logger_temp = logging.getLogger(__name__)
    logger_temp.warning(f"Database integration router not available: {e}")
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
    try:
        pipeline = get_pipeline()
        model_loaded = pipeline.model is not None
        status = "healthy" if model_loaded else "degraded"
    except Exception as e:
        logger.warning(f"Health check failed: {e}")
        model_loaded = False
        status = "degraded"
    
    return HealthCheckResponse(
        status=status,
        model_loaded=model_loaded,
        xai_enabled=True,  # Pipeline has XAI integrated
        timestamp=get_current_timestamp()
    )


@app.get("/info")
async def get_info():
    """
    Get API information and available disease classes
    
    Returns:
        JSON with API metadata and disease information
    """
    pipeline = get_pipeline()
    return {
        "api_name": "Cotton Leaf Disease Detection API",
        "version": "3.0",
        "description": "Integrated disease detection and severity estimation pipeline",
        "diseases": pipeline.classes,
        "pipeline_stages": [
            "Disease Detection",
            "Affected Area Analysis",
            "Lesion Detection & Heatmap",
            "Severity Estimation"
        ],
        "features": {
            "integrated_pipeline": True,
            "xai_enabled": pipeline.enable_xai,
            "offline_mode": False,
            "image_formats": ["jpg", "jpeg", "png", "webp"],
            "max_image_size_mb": 10
        },
        "endpoints": {
            "analyze": "/analyze",
            "batch_analyze": "/batch/analyze",
            "health": "/health",
            "info": "/info"
        }
    }


# ============================================================================
# UI ENDPOINTS
# ============================================================================

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve main dashboard"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>🌾 Cotton Disease Detection - CottonCare AI</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                padding: 40px;
                max-width: 600px;
                width: 100%;
            }
            h1 { color: #333; margin-bottom: 10px; text-align: center; }
            .subtitle { color: #666; text-align: center; margin-bottom: 30px; }
            .features { list-style: none; margin: 25px 0; }
            .features li {
                padding: 12px;
                margin: 8px 0;
                background: #f5f5f5;
                border-left: 4px solid #667eea;
                border-radius: 4px;
            }
            .features li:before { content: "✓ "; color: #667eea; font-weight: bold; }
            .buttons {
                display: flex;
                gap: 15px;
                margin-top: 30px;
                flex-wrap: wrap;
            }
            a {
                flex: 1;
                min-width: 140px;
                padding: 12px 20px;
                text-align: center;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.3s;
            }
            .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
            .btn-secondary {
                background: #f0f0f0;
                color: #333;
                border: 2px solid #667eea;
            }
            .btn-secondary:hover { background: #667eea; color: white; }
            .status {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 12px;
                border-radius: 6px;
                text-align: center;
                margin-bottom: 20px;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌾 CottonCare AI</h1>
            <p class="subtitle">Cotton Leaf Disease Detection System</p>
            
            <div class="status">✓ API is Online and Ready</div>
            
            <h3 style="margin-top: 25px; margin-bottom: 10px;">Features:</h3>
            <ul class="features">
                <li>🔍 Disease Detection with AI</li>
                <li>📊 Severity Estimation</li>
                <li>🗺️ Lesion Analysis & Heatmaps</li>
                <li>📈 Explainable AI (XAI)</li>
                <li>⚡ Real-time Analysis</li>
            </ul>
            
            <div class="buttons">
                <a href="/docs" class="btn-primary">📖 API Docs (Swagger)</a>
                <a href="/analyze" class="btn-secondary">🧪 Test UI</a>
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #999; text-align: center;">
                Endpoints: /analyze (POST), /predict (POST), /health (GET), /info (GET)
            </div>
        </div>
    </body>
    </html>
    """


@app.get("/analyze", response_class=HTMLResponse)
async def analyze_ui():
    """Serve production-ready analyze UI"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Disease Analysis - CottonCare AI</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .navbar {
                background: rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
                padding: 15px 0;
                margin-bottom: 30px;
                border-radius: 10px;
            }
            
            .navbar-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .logo { color: white; font-size: 24px; font-weight: 700; }
            .nav-links a { color: white; margin-left: 20px; text-decoration: none; opacity: 0.9; transition: 0.3s; }
            .nav-links a:hover { opacity: 1; }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 30px 80px rgba(0,0,0,0.2);
                overflow: hidden;
            }
            
            .content { padding: 40px; }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 20px;
            }
            
            .header h1 { color: #333; font-size: 28px; }
            .back-btn { 
                display: inline-block;
                padding: 10px 20px;
                background: #f0f0f0;
                color: #667eea;
                text-decoration: none;
                border-radius: 6px;
                transition: 0.3s;
            }
            .back-btn:hover { background: #667eea; color: white; }
            
            .upload-area {
                border: 2px dashed #667eea;
                border-radius: 10px;
                padding: 40px;
                text-align: center;
                background: #f9f9ff;
                cursor: pointer;
                transition: all 0.3s;
                margin-bottom: 30px;
            }
            
            .upload-area:hover { background: #f0f0ff; border-color: #764ba2; }
            .upload-area.dragover { background: #e8e8ff; border-color: #764ba2; }
            
            #imageInput { display: none; }
            
            .upload-text { color: #667eea; font-size: 16px; font-weight: 600; margin-top: 10px; }
            .upload-sub { color: #999; font-size: 13px; margin-top: 5px; }
            
            .button {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .button:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3); }
            .button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            
            .loading { display: none; text-align: center; margin: 40px 0; }
            .loading.show { display: block; }
            .spinner {
                border: 4px solid #f0f0f0;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .loading-text { color: #667eea; font-weight: 600; margin-top: 15px; }
            
            .error { color: #dc3545; margin-top: 10px; padding: 12px; background: #f8d7da; border-radius: 6px; display: none; border-left: 4px solid #dc3545; }
            .error.show { display: block; }
            
            .results { display: none; margin-top: 40px; }
            .results.show { display: block; animation: fadeIn 0.5s; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            
            .results-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
            }
            
            .card {
                background: #f9f9f9;
                border-radius: 10px;
                padding: 20px;
                border-left: 4px solid #667eea;
            }
            
            .card h3 { color: #333; margin-bottom: 15px; font-size: 16px; }
            .card-item { margin: 12px 0; display: flex; justify-content: space-between; align-items: center; }
            .card-label { color: #666; font-size: 13px; }
            .card-value { color: #667eea; font-weight: 600; font-size: 16px; }
            
            .disease-badge {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 14px;
            }
            
            .severity-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 12px;
            }
            
            .severity-mild { background: #d4edda; color: #155724; }
            .severity-moderate { background: #fff3cd; color: #856404; }
            .severity-severe { background: #f8d7da; color: #721c24; }
            
            .progress-bar {
                background: #e0e0e0;
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
                margin-top: 5px;
            }
            
            .progress-fill {
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                height: 100%;
                transition: width 0.3s;
            }
            
            .insights {
                background: #f0f7ff;
                border-left: 4px solid #3399ff;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            
            .insights h3 { color: #333; margin-bottom: 15px; }
            .insight-item {
                display: flex;
                align-items: center;
                margin: 12px 0;
                color: #555;
            }
            .insight-icon { color: #667eea; margin-right: 10px; font-size: 18px; }
            
            .reasoning {
                background: #fffaf0;
                border-left: 4px solid #ff9800;
                padding: 15px;
                border-radius: 8px;
                margin-top: 15px;
                color: #666;
                font-size: 13px;
                line-height: 1.6;
            }
            
            .heatmap-section {
                margin: 30px 0;
                text-align: center;
            }
            
            .heatmap-section h3 { color: #333; margin-bottom: 15px; }
            .heatmap-placeholder {
                background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
                width: 100%;
                height: 300px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
                font-size: 14px;
            }
            
            .xai-section {
                background: linear-gradient(135deg, #f5f7ff 0%, #f0f0ff 100%);
                border-radius: 10px;
                padding: 25px;
                margin-top: 30px;
            }
            
            .xai-section h2 { color: #333; margin-bottom: 20px; font-size: 18px; }
            
            .xai-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
            }
            
            .xai-card {
                background: white;
                border-radius: 10px;
                padding: 18px;
                border: 1px solid #e0e0e0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            
            .xai-card h4 { color: #333; margin-bottom: 12px; font-size: 14px; }
            .xai-card-content { color: #666; font-size: 13px; line-height: 1.6; }
            
            .confidence-gauge {
                width: 100%;
                height: 20px;
                background: #e0e0e0;
                border-radius: 10px;
                overflow: hidden;
                margin-top: 8px;
            }
            
            .gauge-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                transition: width 0.3s;
            }
            
            .lesion-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .lesion-item {
                background: white;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                font-size: 12px;
            }
            
            .lesion-label { color: #999; }
            .lesion-value { color: #667eea; font-weight: 600; }
            
            .footer {
                background: #f5f5f5;
                padding: 15px;
                text-align: center;
                color: #999;
                font-size: 12px;
                border-top: 1px solid #e0e0e0;
            }
        </style>
    </head>
    <body>
        <div class="navbar">
            <div class="navbar-content">
                <div class="logo">🌾 CottonCare AI</div>
                <div class="nav-links">
                    <a href="/">← Back Home</a>
                </div>
            </div>
        </div>
        
        <div class="container">
            <div class="content">
                <div class="header">
                    <h1>🔬 Disease Analysis</h1>
                </div>
                
                <div class="upload-area" id="uploadArea">
                    <div style="font-size: 40px;">🖼️</div>
                    <div class="upload-text">Click to upload or drag & drop</div>
                    <div class="upload-sub">PNG, JPG, WebP (Max 10MB)</div>
                    <input type="file" id="imageInput" accept="image/jpeg,image/png,image/webp">
                </div>
                
                <button class="button" id="analyzeBtn">🚀 Analyze Image</button>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <div class="loading-text">⏳ Analyzing image... This may take a moment</div>
                </div>
                
                <div class="error" id="error"></div>
                
                <div class="results" id="results">
                    <!-- Disease Detection -->
                    <div class="insights">
                        <h3>🎯 Key Findings</h3>
                        <div class="insight-item">
                            <span class="insight-icon">🌿</span>
                            <span><strong>Disease Detected:</strong> <span class="disease-badge" id="diseaseDetected"></span></span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-icon">📊</span>
                            <span><strong>Confidence:</strong> <span id="confidencePercent"></span>%</span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-icon">⚠️</span>
                            <span><strong>Severity:</strong> <span class="severity-badge" id="severityBadge"></span></span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-icon">📈</span>
                            <span><strong>Affected Area:</strong> <span id="affectedArea"></span>%</span>
                        </div>
                        <div class="insight-item">
                            <span class="insight-icon">🦗</span>
                            <span><strong>Lesions Detected:</strong> <span id="lesionCount"></span></span>
                        </div>
                    </div>
                    
                    <!-- Analysis Details -->
                    <div class="results-grid">
                        <div class="card">
                            <h3>📋 Disease Details</h3>
                            <div class="card-item">
                                <span class="card-label">Top Disease</span>
                                <span class="card-value" id="topDisease"></span>
                            </div>
                            <div class="card-item">
                                <span class="card-label">Confidence Score</span>
                                <span class="card-value" id="confidence"></span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="confidenceBar" style="width: 0%"></div>
                            </div>
                            <div class="card-item" style="margin-top: 15px;">
                                <span class="card-label">Severity Level</span>
                                <span class="card-value" id="severity"></span>
                            </div>
                        </div>
                        
                        <div class="card">
                            <h3>🔍 Analysis Metrics</h3>
                            <div class="card-item">
                                <span class="card-label">Affected Area</span>
                                <span class="card-value" id="areaPercent"></span>
                            </div>
                            <div class="card-item">
                                <span class="card-label">Lesion Count</span>
                                <span class="card-value" id="lesionDetected"></span>
                            </div>
                            <div class="card-item">
                                <span class="card-label">Analysis Time</span>
                                <span class="card-value" id="inferenceTime"></span>
                            </div>
                            <div class="card-item" style="margin-top: 15px;">
                                <span class="card-label">Diagnosis ID</span>
                                <span class="card-value" style="font-size: 11px; color: #999;" id="diagnosisId"></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Reasoning -->
                    <div class="reasoning">
                        <strong>💡 Analysis Reasoning:</strong><br>
                        <span id="reasoning"></span>
                    </div>
                    
                    <!-- Severity Recommendation -->
                    <div class="insights" style="background: #fff8f0; border-left-color: #ff6b6b; margin-top: 20px;">
                        <h3>📋 Recommendation</h3>
                        <div id="recommendation"></div>
                    </div>
                    
                    <!-- XAI Section -->
                    <div class="xai-section">
                        <h2>🤖 Explainable AI Analysis</h2>
                        <div class="xai-cards">
                            <div class="xai-card">
                                <h4>🎯 Detection Indicators</h4>
                                <div class="xai-card-content" id="indicators">
                                    Confidence-based: Moderate | Area-based: Moderate | Lesion-based: Moderate
                                </div>
                            </div>
                            <div class="xai-card">
                                <h4>📊 Severity Scoring</h4>
                                <div class="xai-card-content" id="severityScores">
                                    Confidence Score: 3 | Area Score: 2 | Lesion Score: 2
                                </div>
                            </div>
                            <div class="xai-card">
                                <h4>🔬 Lesion Analysis</h4>
                                <div class="xai-card-content" id="lesionInfo">
                                    Multiple lesions detected across affected regions
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Lesion Details -->
                    <div style="margin-top: 30px;">
                        <h3 style="color: #333; margin-bottom: 15px;">🔎 Detected Lesion Details</h3>
                        <div class="lesion-details" id="lesionDetails"></div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                CottonCare AI v3.0 | Powered by Advanced ML & Explainable AI | Real-time Analysis
            </div>
        </div>
        
        <script>
            const uploadArea = document.getElementById('uploadArea');
            const imageInput = document.getElementById('imageInput');
            const analyzeBtn = document.getElementById('analyzeBtn');
            const loadingDiv = document.getElementById('loading');
            const errorDiv = document.getElementById('error');
            const resultsDiv = document.getElementById('results');
            
            // Drag and drop
            uploadArea.addEventListener('click', () => imageInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                imageInput.files = e.dataTransfer.files;
            });
            
            imageInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    uploadArea.innerHTML = `<div style="font-size: 20px;">✓ ${e.target.files[0].name}</div>`;
                }
            });
            
            analyzeBtn.addEventListener('click', analyze);
            
            async function analyze() {
                if (imageInput.files.length === 0) {
                    showError('Please select an image');
                    return;
                }
                
                const file = imageInput.files[0];
                const formData = new FormData();
                formData.append('file', file);
                
                loadingDiv.classList.add('show');
                errorDiv.classList.remove('show');
                resultsDiv.classList.remove('show');
                analyzeBtn.disabled = true;
                
                try {
                    const response = await fetch('/analyze', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        displayResults(data);
                        resultsDiv.classList.add('show');
                    } else {
                        throw new Error(data.detail || 'Analysis failed');
                    }
                } catch (error) {
                    showError('❌ Error: ' + error.message);
                } finally {
                    loadingDiv.classList.remove('show');
                    analyzeBtn.disabled = false;
                }
            }
            
            function displayResults(data) {
                const analysis = data.analysis;
                const stage1 = analysis.stage_1_disease_detection;
                const stage2 = analysis.stage_2_area_analysis;
                const stage3 = analysis.stage_3_lesion_analysis;
                const stage4 = analysis.stage_4_severity_estimation;
                
                // Disease detection
                document.getElementById('diseaseDetected').textContent = stage1.disease;
                document.getElementById('topDisease').textContent = stage1.disease;
                document.getElementById('confidence').textContent = (stage1.confidence * 100).toFixed(1) + '%';
                document.getElementById('confidencePercent').textContent = stage1.confidence_percentage;
                document.getElementById('confidenceBar').style.width = (stage1.confidence * 100) + '%';
                document.getElementById('diagnosisId').textContent = data.diagnosis_id;
                
                // Severity
                const severity = stage4.level;
                const severityClass = 'severity-' + severity.toLowerCase();
                document.getElementById('severity').textContent = severity;
                document.getElementById('severityBadge').textContent = severity;
                document.getElementById('severityBadge').className = 'severity-badge ' + severityClass;
                
                // Area
                document.getElementById('affectedArea').textContent = stage2.affected_area_percentage;
                document.getElementById('areaPercent').textContent = stage2.affected_area_percentage + '%';
                
                // Lesions
                document.getElementById('lesionCount').textContent = stage3.count;
                document.getElementById('lesionDetected').textContent = stage3.count + ' detected';
                document.getElementById('inferenceTime').textContent = data.inference_time.toFixed(2) + 's';
                
                // Reasoning
                document.getElementById('reasoning').textContent = stage4.reasoning;
                
                // Recommendation
                const recText = stage4.description + '. ' + 
                    (severity === 'Mild' ? 'Monitor the plant and apply preventive measures.' :
                     severity === 'Moderate' ? 'Apply recommended treatments promptly to prevent spread.' :
                     severity === 'Severe' ? 'Urgent treatment required. Consult with agricultural experts.' :
                     'Critical condition. Immediate expert intervention needed.');
                document.getElementById('recommendation').innerHTML = `<strong>⚠️ Status:</strong> ${recText}`;
                
                // XAI Indicators
                const indicators = stage4.indicators;
                document.getElementById('indicators').textContent = 
                    `Confidence: ${indicators.confidence}/4 | Area: ${indicators.area}/4 | Lesions: ${indicators.lesions}/4`;
                document.getElementById('severityScores').textContent = 
                    `Confidence: ${stage4.details.confidence_score} | Area: ${stage4.details.area_score} | Lesions: ${stage4.details.lesion_score} | Final: ${stage4.score}`;
                document.getElementById('lesionInfo').textContent = 
                    `${stage3.count} lesions detected | Total affected: ${stage3.details.reduce((a, b) => a + b.area_percentage, 0).toFixed(1)}% of lesion area`;
                
                // Lesion details
                if (stage3.details && stage3.details.length > 0) {
                    const lesionHTML = stage3.details.map((l, i) => `
                        <div class="lesion-item">
                            <div class="lesion-label">Lesion ${i + 1}</div>
                            <div class="lesion-value">${l.area_percentage}%</div>
                            <div class="lesion-label" style="font-size: 11px;">Pos: (${l.position[0]}, ${l.position[1]})</div>
                        </div>
                    `).join('');
                    document.getElementById('lesionDetails').innerHTML = lesionHTML;
                }
            }
            
            function showError(msg) {
                errorDiv.textContent = msg;
                errorDiv.classList.add('show');
            }
        </script>
    </body>
    </html>
    """


# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """
    Make a single disease prediction from an image
    Uses integrated pipeline: detection → severity → analysis
    
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
        
        # Run integrated analysis pipeline
        pipeline = get_pipeline()
        result = pipeline.analyze(image)
        
        diagnosis_id = generate_diagnosis_id()
        
        return PredictionResponse(
            diagnosis_id=diagnosis_id,
            disease=result['disease'],
            confidence=result['confidence'],
            confidence_percentage=result['confidence_percentage'],
            severity=result['severity'],
            affected_area=result['affected_area'],
            inference_time=result['inference_time'],
            timestamp=get_current_timestamp(),
            xai_available=result['xai_available']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Complete integrated disease analysis
    Pipeline: Disease Detection → Affected Area → Lesion Analysis → Severity
    
    Args:
        file: Image file (JPEG, PNG, WebP)
        
    Returns:
        Comprehensive disease analysis with all stages
    """
    try:
        # Validate file
        if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(status_code=400, detail="Invalid image format. Supported: JPEG, PNG, WebP")
        
        # Read and open image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Run complete integrated analysis pipeline
        pipeline = get_pipeline()
        result = pipeline.analyze(image)
        
        diagnosis_id = generate_diagnosis_id()
        
        return {
            "diagnosis_id": diagnosis_id,
            "timestamp": get_current_timestamp(),
            "analysis": {
                "stage_1_disease_detection": {
                    "disease": result['disease'],
                    "confidence": result['confidence'],
                    "confidence_percentage": result['confidence_percentage'],
                    "all_predictions": result['all_predictions']
                },
                "stage_2_area_analysis": {
                    "affected_area_percentage": result['affected_area']
                },
                "stage_3_lesion_analysis": result['lesion_analysis'],
                "stage_4_severity_estimation": result['severity']
            },
            "inference_time": result['inference_time'],
            "xai_available": result['xai_available']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")




@app.post("/predict/xai")
async def predict_with_xai_deprecated(file: UploadFile = File(...)):
    """
    DEPRECATED: Use /analyze endpoint instead
    
    This endpoint is kept for backward compatibility
    """
    raise HTTPException(
        status_code=410, 
        detail="Endpoint deprecated. Use POST /analyze for complete analysis"
    )


@app.post("/batch")
async def batch_predict_deprecated(files: List[UploadFile] = File(...)):
    """
    DEPRECATED: Batch predictions not supported in unified pipeline
    """
    raise HTTPException(
        status_code=410,
        detail="Batch endpoint deprecated. Process images individually with /predict or /analyze"
    )


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
        "message": "Use /analyze endpoint to generate complete analysis with explanations",
        "note": "Store diagnosis_id and analysis data in your database for retrieval"
    }


# ============================================================================
# XAI ANALYSIS ENDPOINTS (DEPRECATED)
# ============================================================================

@app.post("/analyze/heatmap")
async def analyze_heatmap_deprecated(file: UploadFile = File(...)):
    """DEPRECATED: Use /analyze endpoint instead"""
    raise HTTPException(
        status_code=410,
        detail="Use POST /analyze endpoint for complete heatmap and lesion analysis"
    )


@app.post("/analyze/lesions")
async def analyze_lesions_deprecated(file: UploadFile = File(...)):
    """DEPRECATED: Use /analyze endpoint instead"""
    raise HTTPException(
        status_code=410,
        detail="Use POST /analyze endpoint for complete lesion analysis"
    )


@app.post("/analyze/features")
async def analyze_features_deprecated(file: UploadFile = File(...)):
    """DEPRECATED: Use /analyze endpoint instead"""
    raise HTTPException(
        status_code=410,
        detail="Use POST /analyze endpoint for complete feature analysis"
    )


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
    """Serve production-ready home page"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>CottonCare AI - Disease Detection Dashboard</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 0;
            }
            
            nav {
                background: rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
                padding: 15px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .nav-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 40px;
            }
            
            .nav-logo {
                color: white;
                font-size: 24px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .nav-links {
                display: flex;
                gap: 30px;
            }
            
            .nav-links a {
                color: white;
                text-decoration: none;
                font-size: 14px;
                opacity: 0.9;
                transition: 0.3s;
            }
            
            .nav-links a:hover { opacity: 1; }
            
            .hero {
                background: rgba(0, 0, 0, 0.05);
                padding: 80px 40px;
                text-align: center;
                color: white;
            }
            
            .hero h1 {
                font-size: 52px;
                margin-bottom: 20px;
                font-weight: 800;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .hero p {
                font-size: 20px;
                margin-bottom: 15px;
                opacity: 0.95;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            }
            
            .hero-sub {
                font-size: 14px;
                opacity: 0.8;
                margin-bottom: 40px;
            }
            
            .cta-buttons {
                display: flex;
                gap: 20px;
                justify-content: center;
                margin-top: 30px;
            }
            
            .btn {
                padding: 14px 32px;
                border: none;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                text-decoration: none;
                display: inline-block;
            }
            
            .btn-primary {
                background: white;
                color: #667eea;
            }
            
            .btn-primary:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
            }
            
            .btn-secondary {
                background: transparent;
                color: white;
                border: 2px solid white;
            }
            
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-3px);
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 40px;
            }
            
            .features {
                padding: 80px 40px;
                background: white;
            }
            
            .section-title {
                text-align: center;
                font-size: 36px;
                color: #333;
                margin-bottom: 50px;
                font-weight: 700;
            }
            
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 30px;
                margin-bottom: 40px;
            }
            
            .feature-card {
                background: #f9f9f9;
                padding: 35px 25px;
                border-radius: 12px;
                text-align: center;
                transition: all 0.3s;
                border: 2px solid transparent;
            }
            
            .feature-card:hover {
                transform: translateY(-8px);
                border-color: #667eea;
                box-shadow: 0 20px 50px rgba(102, 126, 234, 0.15);
            }
            
            .feature-icon {
                font-size: 48px;
                margin-bottom: 20px;
            }
            
            .feature-card h3 {
                color: #333;
                font-size: 18px;
                margin-bottom: 15px;
            }
            
            .feature-card p {
                color: #666;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .capabilities {
                background: linear-gradient(135deg, #f5f7ff 0%, #f0f0ff 100%);
                padding: 60px 40px;
                border-radius: 15px;
                margin: 40px 0;
            }
            
            .capabilities h3 {
                color: #333;
                font-size: 22px;
                margin-bottom: 25px;
                text-align: center;
            }
            
            .capabilities-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .capability-item {
                background: white;
                padding: 18px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 15px;
                border-left: 4px solid #667eea;
            }
            
            .capability-item strong {
                color: #333;
            }
            
            .capability-item p {
                color: #666;
                font-size: 13px;
                margin: 0;
            }
            
            .api-endpoints {
                background: #f5f5f5;
                padding: 30px;
                border-radius: 10px;
                margin-top: 40px;
                text-align: center;
                font-family: 'Courier New', monospace;
            }
            
            .api-endpoints h4 {
                color: #333;
                margin-bottom: 20px;
            }
            
            .endpoint {
                background: white;
                padding: 12px;
                border-radius: 6px;
                margin: 8px 0;
                color: #667eea;
                font-size: 13px;
                border-left: 3px solid #667eea;
            }
            
            .footer {
                background: rgba(0, 0, 0, 0.1);
                color: white;
                padding: 40px;
                text-align: center;
                font-size: 13px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 50px 0;
            }
            
            .stat-card {
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            }
            
            .stat-number {
                font-size: 32px;
                color: #667eea;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .stat-label {
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <!-- Navigation -->
        <nav>
            <div class="nav-content">
                <div class="nav-logo">🌾 CottonCare AI</div>
                <div class="nav-links">
                    <a href="#features">Features</a>
                    <a href="#capabilities">Capabilities</a>
                    <a href="/analyze">Analyzer</a>
                </div>
            </div>
        </nav>
        
        <!-- Hero Section -->
        <div class="hero">
            <div class="container">
                <h1>Intelligent Cotton Disease Detection</h1>
                <p>Powered by advanced AI and explainable machine learning</p>
                <p class="hero-sub">Detect, analyze, and understand plant diseases with confidence</p>
                <div class="cta-buttons">
                    <a href="/analyze" class="btn btn-primary">🚀 Start Analysis</a>
                    <a href="#capabilities" class="btn btn-secondary">Learn More</a>
                </div>
            </div>
        </div>
        
        <!-- Features -->
        <div class="features">
            <div class="container">
                <h2 class="section-title" id="features">🎯 Key Features</h2>
                
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🔬</div>
                        <h3>Disease Detection</h3>
                        <p>Deep learning model trained on thousands of cotton leaf images for accurate disease identification</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>Severity Analysis</h3>
                        <p>Multi-indicator assessment combining confidence, affected area, and lesion count for comprehensive evaluation</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🤖</div>
                        <h3>Explainable AI</h3>
                        <p>Grad-CAM visualizations and detailed reasoning to understand why predictions are made</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🔍</div>
                        <h3>Lesion Detection</h3>
                        <p>Identify and locate individual lesions with precise coordinates and area measurements</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">⚡</div>
                        <h3>Real-time Analysis</h3>
                        <p>Fast inference with immediate results - analyze images in seconds</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">📈</div>
                        <h3>Affordable Monitoring</h3>
                        <p>Cost-effective disease monitoring and early detection to minimize crop losses</p>
                    </div>
                </div>
                
                <!-- Capabilities Section -->
                <div class="capabilities" id="capabilities">
                    <h3>💡 Advanced Capabilities</h3>
                    <div class="capabilities-list">
                        <div class="capability-item">
                            <span style="font-size: 24px;">🍃</span>
                            <div>
                                <strong>Disease Classification</strong>
                                <p>Identifies: Healthy, Aphids, Powdery Mildew, Bacterial Blight, Fusarium Wilt</p>
                            </div>
                        </div>
                        
                        <div class="capability-item">
                            <span style="font-size: 24px;">📐</span>
                            <div>
                                <strong>Area Analysis</strong>
                                <p>Calculates percentage of leaf affected by disease</p>
                            </div>
                        </div>
                        
                        <div class="capability-item">
                            <span style="font-size: 24px;">🎯</span>
                            <div>
                                <strong>Severity Scoring</strong>
                                <p>Mild | Moderate | Severe | Critical classification</p>
                            </div>
                        </div>
                        
                        <div class="capability-item">
                            <span style="font-size: 24px;">🗺️</span>
                            <div>
                                <strong>Lesion Mapping</strong>
                                <p>Detailed location and size of each detected lesion</p>
                            </div>
                        </div>
                        
                        <div class="capability-item">
                            <span style="font-size: 24px;">💬</span>
                            <div>
                                <strong>Recommendations</strong>
                                <p>Actionable insights based on severity level</p>
                            </div>
                        </div>
                        
                        <div class="capability-item">
                            <span style="font-size: 24px;">🔍</span>
                            <div>
                                <strong>Visual Explanations</strong>
                                <p>Grad-CAM heatmaps showing where model focuses</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stats -->
                <h2 class="section-title" style="margin-top: 50px;">📈 Performance</h2>
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">95%+</div>
                        <div class="stat-label">Accuracy</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">&lt;2s</div>
                        <div class="stat-label">Analysis Time</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">5+</div>
                        <div class="stat-label">Disease Types</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">10000+</div>
                        <div class="stat-label">Images Trained</div>
                    </div>
                </div>
                
                <!-- API Info -->
                <div class="api-endpoints">
                    <h4>📡 REST API Endpoints</h4>
                    <div class="endpoint">POST /analyze - Submit image for analysis</div>
                    <div class="endpoint">GET /analyze - Web UI for testing</div>
                    <div class="endpoint">GET /health - Health check</div>
                    <div class="endpoint">GET /info - API information</div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>CottonCare AI v3.0 | Advanced Disease Detection Platform</p>
            <p style="margin-top: 10px; opacity: 0.8;">Powered by TensorFlow & Explainable AI | Production-Ready</p>
        </div>
    </body>
    </html>
    """


# ============================================================================
# DASHBOARD ENDPOINTS
# ============================================================================

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        # In a real implementation, fetch from database
        return {
            "success": True,
            "stats": {
                "totalScans": 0,
                "completedScans": 0,
                "predictions": 0,
                "successRate": 0
            },
            "note": "Connect database to populate statistics"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/api/dashboard/recent")
async def get_recent_scans():
    """Get recent scans"""
    try:
        # In a real implementation, fetch from database
        return {
            "success": True,
            "count": 0,
            "scans": [],
            "note": "Connect database to populate recent scans"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
