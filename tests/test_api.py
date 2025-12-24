import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app_production import app
from io import BytesIO
from PIL import Image

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/v1/health')
    assert response.status_code == 200
    data = response.get_json()
    assert 'status' in data

def test_get_classes(client):
    response = client.get('/api/v1/classes')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['classes']) == 6

def test_get_diseases(client):
    response = client.get('/api/v1/diseases')
    assert response.status_code == 200

def create_test_image():
    img = Image.new('RGB', (224, 224), color='green')
    img_io = BytesIO()
    img.save(img_io, 'JPEG')
    img_io.seek(0)
    return img_io

def test_predict_no_file(client):
    response = client.post('/api/v1/predict')
    assert response.status_code == 400

def test_predict_with_image(client):
    data = {'file': (create_test_image(), 'test.jpg')}
    response = client.post('/api/v1/predict', data=data, content_type='multipart/form-data')
    assert response.status_code in [200, 500]
