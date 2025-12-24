import pytest
from PIL import Image
import numpy as np
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from model_service import ModelService

def create_test_image():
    return Image.new('RGB', (224, 224), color='green')

def test_model_loading():
    service = ModelService()
    assert service.model is not None
    assert len(service.classes) == 6

def test_preprocess_image():
    service = ModelService()
    img = create_test_image()
    processed = service.preprocess_image(img)
    assert processed.shape == (1, 380, 380, 3)
    assert processed.max() <= 1.0

def test_predict_single():
    service = ModelService()
    img = create_test_image()
    result = service.predict_single(img)
    assert 'class' in result
    assert 'confidence' in result
    assert result['class'] in service.classes

def test_health_check():
    service = ModelService()
    assert service.health_check() == True
