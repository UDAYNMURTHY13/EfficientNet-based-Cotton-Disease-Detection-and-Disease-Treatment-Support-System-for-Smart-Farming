"""
SQLAlchemy ORM models for CottonCare AI
Re-exports models from db_models for consistency
"""

from app.models.db_models import Base, User, Analysis

__all__ = ["Base", "User", "Analysis"]
