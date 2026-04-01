"""
CottonCare AI Services Module
Contains all backend services for ML prediction and API endpoints
"""

from .api_xai import app as api_app
from .ml_prediction_service import create_app as create_ml_app

__all__ = ['api_app', 'create_ml_app']
