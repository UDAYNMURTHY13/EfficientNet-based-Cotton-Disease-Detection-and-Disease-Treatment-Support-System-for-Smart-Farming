import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    MODEL_PATH = os.getenv('MODEL_PATH', 'cotton_model_final.keras')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}
    
class ProductionConfig(Config):
    DEBUG = False
    
class DevelopmentConfig(Config):
    DEBUG = True

config = {
    'production': ProductionConfig,
    'development': DevelopmentConfig,
    'default': DevelopmentConfig
}
