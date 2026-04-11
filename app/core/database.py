"""
Database connection and session management
Handles PostgreSQL connection using SQLAlchemy
"""

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from app.core.config import get_settings
from collections.abc import Iterator
import logging

logger = logging.getLogger(__name__)

settings = get_settings()

# Create database engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Test connections before using
    echo=settings.SQLALCHEMY_ECHO,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Iterator[Session]:
    """Dependency to get database session"""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Event listeners for connection management
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set PostgreSQL connection parameters"""
    # Enable UUID extension if using PostgreSQL
    if "postgresql" in settings.DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
        cursor.close()


def init_db():
    """Initialize database - create all tables"""
    from app.models.db_models import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


def drop_db():
    """Drop all tables (for development/testing only)"""
    from app.models.db_models import Base
    Base.metadata.drop_all(bind=engine)
    logger.warning("All database tables dropped")


def health_check() -> bool:
    """Check if database is accessible"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
