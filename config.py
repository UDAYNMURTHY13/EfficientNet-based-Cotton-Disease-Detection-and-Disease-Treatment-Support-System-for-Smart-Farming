import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    MODEL_PATH = os.getenv('MODEL_PATH', 'cotton_model_final.keras')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}
    
    # Database Configuration
    # Using SQLite for development (file-based, no setup needed)
    SQLALCHEMY_DATABASE_URL = os.getenv(
        'DATABASE_URL', 
        'sqlite:///./cottoncare.db'
    )
    
    # For PostgreSQL in production, use:
    # postgresql://user:password@localhost/cottoncare_db
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload folder
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Logging
    LOG_FILE = os.path.join(BASE_DIR, 'logs', 'cottoncare.log')
    os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    # SQLite for development
    SQLALCHEMY_DATABASE_URL = 'sqlite:///./cottoncare_dev.db'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    # Use environment variable for production database
    SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./cottoncare.db')

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    # In-memory SQLite for testing
    SQLALCHEMY_DATABASE_URL = 'sqlite:///:memory:'

config = {
    'production': ProductionConfig,
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
