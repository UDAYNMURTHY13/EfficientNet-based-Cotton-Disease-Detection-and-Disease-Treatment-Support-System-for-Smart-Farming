#!/usr/bin/env python
"""
Database initialization script
Creates all tables from SQLAlchemy models
Run this after adding new models or modifying schema
"""

import os
import sys
import logging

# Set SQLite database for development BEFORE importing config
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'sqlite:///./cottoncare_dev.db')

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from app.models.db_models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    """Initialize database by creating all tables"""
    
    logger.info("=" * 60)
    logger.info("🗄️  Database Initialization - CottonCare AI")
    logger.info("=" * 60)
    
    try:
        # Create all tables
        logger.info(f"Database URL: {engine.url}")
        logger.info("Creating all tables from models...")
        
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ Database initialized successfully!")
        logger.info("\nTables created:")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        for table_name in inspector.get_table_names():
            columns = inspector.get_columns(table_name)
            logger.info(f"  • {table_name}")
            for col in columns:
                col_type = str(col['type'])
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                logger.info(f"      - {col['name']}: {col_type} ({nullable})")
        
        logger.info("\n" + "=" * 60)
        logger.info("✨ Ready to use! Start the server with: python run_server.py")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        logger.exception(e)
        return False


if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
