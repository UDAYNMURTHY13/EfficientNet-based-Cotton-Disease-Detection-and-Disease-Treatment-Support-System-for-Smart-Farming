#!/usr/bin/env python
"""
API Testing Script - Test all XAI endpoints
Comprehensive test suite for FastAPI with example requests
"""

import requests
import json
import base64
import time
from pathlib import Path
from typing import Dict, Any
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class APITester:
    """Test suite for Cotton Leaf Disease Detection API"""
    
    def __init__(self, base_url: str = 'http://localhost:8000'):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {
            'passed': 0,
            'failed': 0,
            'tests': []
        }
    
    def log_test(self, name: str, status: str, details: str = ''):
        """Log test result"""
        result = {
            'name': name,
            'status': status,
            'details': details,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.results['tests'].append(result)
        
        symbol = '✓' if status == 'PASS' else '✗'
        logger.info(f"{symbol} {name}: {status}")
        if details:
            logger.info(f"  └─ {details}")
        
        if status == 'PASS':
            self.results['passed'] += 1
        else:
            self.results['failed'] += 1
    
    def test_health(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f'{self.base_url}/health')
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    'Health Check',
                    'PASS',
                    f"Status: {data['status']}, Model: {data['model_loaded']}, XAI: {data['xai_enabled']}"
                )
                return True
            else:
                self.log_test('Health Check', 'FAIL', f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test('Health Check', 'FAIL', str(e))
            return False
    
    def test_info(self):
        """Test API info endpoint"""
        try:
            response = self.session.get(f'{self.base_url}/info')
            
            if response.status_code == 200:
                data = response.json()
                diseases = ', '.join(data.get('diseases', [])[:3])
                self.log_test(
                    'API Info',
                    'PASS',
                    f"Diseases: {diseases}... Features: XAI={data['features']['xai_enabled']}"
                )
                return True
            else:
                self.log_test('API Info', 'FAIL', f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test('API Info', 'FAIL', str(e))
            return False
    
    def create_test_image(self) -> bytes:
        """Create a test image (green square representing healthy leaf)"""
        from PIL import Image
        import io
        
        # Create a simple green image
        img = Image.new('RGB', (380, 380), color=(60, 120, 40))
        
        # Save to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        return img_bytes.getvalue()
    
    def test_predict(self):
        """Test standard prediction endpoint"""
        try:
            image_bytes = self.create_test_image()
            files = {'file': ('test_leaf.jpg', image_bytes, 'image/jpeg')}
            
            response = self.session.post(f'{self.base_url}/predict', files=files)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    'Standard Prediction',
                    'PASS',
                    f"Disease: {data['disease']}, Confidence: {data['confidence_percentage']:.1f}%"
                )
                return True
            else:
                self.log_test('Standard Prediction', 'FAIL', f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test('Standard Prediction', 'FAIL', str(e))
            return False
    
    def test_predict_xai(self):
        """Test full XAI prediction endpoint"""
        try:
            image_bytes = self.create_test_image()
            files = {'file': ('test_leaf.jpg', image_bytes, 'image/jpeg')}
            
            response = self.session.post(f'{self.base_url}/predict/xai', files=files)
            
            if response.status_code == 200:
                data = response.json()
                has_xai = 'xai_analysis' in data
                has_viz = 'visualizations' in data
                
                self.log_test(
                    'XAI Prediction',
                    'PASS',
                    f"Disease: {data['disease']}, XAI: {has_xai}, Visualizations: {has_viz}"
                )
                return True
            elif response.status_code == 503:
                self.log_test('XAI Prediction', 'FAIL', 'XAI features not available')
                return False
            else:
                self.log_test('XAI Prediction', 'FAIL', f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test('XAI Prediction', 'FAIL', str(e))
            return False
    
    def test_analyze_heatmap(self):
        """Test heatmap analysis endpoint"""
        try:
            image_bytes = self.create_test_image()
            files = {'file': ('test_leaf.jpg', image_bytes, 'image/jpeg')}
            
            response = self.session.post(f'{self.base_url}/analyze/heatmap', files=files)
            
            if response.status_code == 200:
                data = response.json()
                has_heatmap = 'heatmap_base64' in data
                
                self.log_test(
                    'Heatmap Analysis',
                    'PASS',
                    f"Disease: {data['disease']}, Heatmap: {has_heatmap}"
                )
                return True
            elif response.status_code == 503:
                self.log_test('Heatmap Analysis', 'FAIL', 'XAI features not available')
                return False
            else:
                self.log_test('Heatmap Analysis', 'FAIL', f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test('Heatmap Analysis', 'FAIL', str(e))
            return False
    
    def test_analyze_lesions(self):
        """Test lesion analysis endpoint"""
        try:
            image_bytes = self.create_test_image()
            files = {'file': ('test_leaf.jpg', image_bytes, 'image/jpeg')}
            
            response = self.session.post(f'{self.base_url}/analyze/lesions', files=files)
            
            if response.status_code == 200:
                data = response.json()
                lesion_info = data.get('lesion_analysis', {})
                
                self.log_test(
                    'Lesion Analysis',
                    'PASS',
                    f"Affected: {lesion_info.get('total_affected_percentage', 0):.1f}%, Lesions: {lesion_info.get('lesion_count', 0)}"
                )
                return True
            elif response.status_code == 503:
                self.log_test('Lesion Analysis', 'FAIL', 'XAI features not available')
                return False
            else:
                self.log_test('Lesion Analysis', 'FAIL', f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test('Lesion Analysis', 'FAIL', str(e))
            return False
    
    def test_analyze_features(self):
        """Test feature analysis endpoint"""
        try:
            image_bytes = self.create_test_image()
            files = {'file': ('test_leaf.jpg', image_bytes, 'image/jpeg')}
            
            response = self.session.post(f'{self.base_url}/analyze/features', files=files)
            
            if response.status_code == 200:
                data = response.json()
                indicators = data.get('detected_indicators', [])
                
                self.log_test(
                    'Feature Analysis',
                    'PASS',
                    f"Disease: {data['disease']}, Features: {len(indicators)} detected"
                )
                return True
            elif response.status_code == 503:
                self.log_test('Feature Analysis', 'FAIL', 'XAI features not available')
                return False
            else:
                self.log_test('Feature Analysis', 'FAIL', f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test('Feature Analysis', 'FAIL', str(e))
            return False
    
    def test_batch_predict(self):
        """Test batch prediction endpoint"""
        try:
            image_bytes = self.create_test_image()
            files = [
                ('files', ('leaf1.jpg', image_bytes, 'image/jpeg')),
                ('files', ('leaf2.jpg', image_bytes, 'image/jpeg')),
            ]
            
            response = self.session.post(f'{self.base_url}/batch', files=files)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    'Batch Prediction',
                    'PASS',
                    f"Processed: {data['total_images']}, Successful: {data['successful']}"
                )
                return True
            else:
                self.log_test('Batch Prediction', 'FAIL', f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test('Batch Prediction', 'FAIL', str(e))
            return False
    
    def run_all_tests(self):
        """Run complete test suite"""
        logger.info("\n" + "="*70)
        logger.info("COTTON LEAF DISEASE DETECTION - API TEST SUITE")
        logger.info("="*70 + "\n")
        
        logger.info(f"Testing API at: {self.base_url}")
        logger.info("Waiting for API to be ready...\n")
        
        # Wait for API to be ready
        max_retries = 10
        for i in range(max_retries):
            try:
                response = self.session.get(f'{self.base_url}/health')
                if response.status_code == 200:
                    logger.info("✓ API is ready!\n")
                    break
            except:
                if i < max_retries - 1:
                    logger.info(f"  Retrying... ({i+1}/{max_retries})")
                    time.sleep(2)
        
        # Run all tests
        tests = [
            self.test_health,
            self.test_info,
            self.test_predict,
            self.test_predict_xai,
            self.test_analyze_heatmap,
            self.test_analyze_lesions,
            self.test_analyze_features,
            self.test_batch_predict,
        ]
        
        for test in tests:
            test()
            time.sleep(0.5)  # Brief pause between tests
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        logger.info("\n" + "="*70)
        logger.info("TEST SUMMARY")
        logger.info("="*70)
        
        total = self.results['passed'] + self.results['failed']
        logger.info(f"Total Tests: {total}")
        logger.info(f"Passed: {self.results['passed']} ✓")
        logger.info(f"Failed: {self.results['failed']} ✗")
        
        if self.results['failed'] == 0:
            logger.info("\n🎉 ALL TESTS PASSED!")
        else:
            logger.info(f"\n⚠️  {self.results['failed']} test(s) failed")
        
        logger.info("="*70 + "\n")
        
        # API Documentation
        logger.info("API Documentation:")
        logger.info("  • Swagger UI: http://localhost:8000/docs")
        logger.info("  • ReDoc: http://localhost:8000/redoc")
        logger.info("  • OpenAPI JSON: http://localhost:8000/openapi.json")
        logger.info("\nKey Endpoints:")
        logger.info("  • POST /predict - Standard prediction")
        logger.info("  • POST /predict/xai - Full XAI analysis")
        logger.info("  • POST /analyze/heatmap - Heatmap only")
        logger.info("  • POST /analyze/lesions - Lesion detection")
        logger.info("  • POST /analyze/features - Feature extraction")
        logger.info("  • POST /batch - Batch predictions")


def main():
    """Main test runner"""
    import sys
    
    # Get API URL from command line or use default
    base_url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000'
    
    tester = APITester(base_url)
    tester.run_all_tests()


if __name__ == '__main__':
    main()
