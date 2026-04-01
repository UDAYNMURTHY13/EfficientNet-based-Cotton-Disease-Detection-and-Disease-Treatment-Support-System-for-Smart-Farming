#!/usr/bin/env python
"""
FastAPI Server Startup Script for Cotton Leaf Disease Detection with XAI
Starts the API server with hot reload for development
"""

import sys
import os
import logging
from pathlib import Path

# Add paths for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'services'))
sys.path.insert(0, os.path.dirname(__file__))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Verify all required packages are installed"""
    logger.info("Checking dependencies...")
    
    required_modules = [
        'fastapi',
        'uvicorn',
        'tensorflow',
        'pydantic',
        'PIL',
        'cv2',
        'numpy'
    ]
    
    missing = []
    for module in required_modules:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    
    if missing:
        logger.error(f"Missing dependencies: {', '.join(missing)}")
        logger.error("Install with: pip install -r requirements.txt")
        return False
    
    logger.info("✓ All dependencies installed")
    return True


def check_model():
    """Verify model file exists"""
    logger.info("Checking model file...")
    
    model_path = Path('cotton_model_final.keras')
    if not model_path.exists():
        logger.error(f"Model file not found: {model_path}")
        return False
    
    logger.info(f"✓ Model found: {model_path}")
    return True


def check_xai_modules():
    """Verify XAI modules are available"""
    logger.info("Checking XAI modules...")

    services_dir = Path(__file__).parent / 'services'
    
    required_files = [
        'xai_explainer.py',
        'xai_visualizations.py',
        'model_service.py',
        'severity_engine.py'
    ]
    
    missing = []
    for filename in required_files:
        if not (services_dir / filename).exists():
            missing.append(filename)
    
    if missing:
        logger.error(f"Missing XAI files: {', '.join(missing)}")
        return False
    
    logger.info("✓ All XAI modules available")
    return True


def start_server(host='0.0.0.0', port=8000, reload=False):
    """Start FastAPI server with uvicorn"""
    import uvicorn
    
    logger.info(f"Starting FastAPI server on {host}:{port}")
    logger.info("API Documentation: http://localhost:8000/docs")
    logger.info("Alternative Docs: http://localhost:8000/redoc")
    logger.info("Press Ctrl+C to stop the server")
    
    uvicorn.run(
        'api_xai:app',
        host=host,
        port=port,
        reload=reload,
        log_level='info',
        access_log=True
    )


def main():
    """Main startup sequence"""
    logger.info("="*70)
    logger.info("Cotton Leaf Disease Detection - FastAPI Server Startup")
    logger.info("="*70)
    
    # Pre-flight checks
    checks = [
        ("Dependencies", check_dependencies),
        ("Model File", check_model),
        ("XAI Modules", check_xai_modules),
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        if not check_func():
            all_passed = False
            logger.error(f"✗ {check_name} check failed")
        else:
            logger.info(f"✓ {check_name} check passed")
    
    if not all_passed:
        logger.error("\nFailed pre-flight checks. Fix issues and try again.")
        sys.exit(1)
    
    logger.info("\n✓ All pre-flight checks passed!")
    logger.info("="*70)
    
    # Start server
    try:
        start_server()
    except KeyboardInterrupt:
        logger.info("\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
