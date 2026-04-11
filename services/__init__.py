"""
CottonCare AI Services Module
Integrated pipeline for disease detection and severity estimation
"""

from .disease_analysis_pipeline import DiseaseAnalysisPipeline, get_pipeline
from .api_xai import app as api_app

__all__ = ['DiseaseAnalysisPipeline', 'get_pipeline', 'api_app']

