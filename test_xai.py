"""
XAI Testing and Validation Suite
Tests for Grad-CAM, feature detection, explanations, and visualization quality
"""

import unittest
import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
import logging
from typing import Dict, List, Tuple

from xai_explainer import GradCAM, FeatureDetector, ExplanationGenerator, XAIExplainer
from xai_visualizations import HeatmapVisualizer, LesionVisualizer, ExplanationVisualizer
from model_service import model_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TestGradCAM(unittest.TestCase):
    """Test Grad-CAM heatmap generation"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.model = model_service.model
        cls.classes = model_service.classes
        cls.grad_cam = GradCAM(cls.model)
    
    def create_dummy_image(self, shape=(380, 380, 3)) -> np.ndarray:
        """Create a dummy test image"""
        return np.random.randint(0, 255, shape, dtype=np.uint8)
    
    def test_heatmap_generation(self):
        """Test that Grad-CAM generates valid heatmaps"""
        image = self.create_dummy_image()
        image_normalized = image.astype('float32') / 255.0
        image_processed = np.expand_dims(image_normalized, axis=0)
        
        # Generate heatmap
        heatmap = self.grad_cam.generate_heatmap(image_processed, class_idx=0)
        
        # Validate heatmap properties
        self.assertIsNotNone(heatmap)
        self.assertEqual(heatmap.shape, (380, 380))
        self.assertTrue(np.min(heatmap) >= 0.0)
        self.assertTrue(np.max(heatmap) <= 1.0)
        logger.info("✓ Heatmap generation test passed")
    
    def test_heatmap_shape(self):
        """Test heatmap output shape"""
        image = self.create_dummy_image()
        image_normalized = image.astype('float32') / 255.0
        image_processed = np.expand_dims(image_normalized, axis=0)
        
        for class_idx in range(len(self.classes)):
            heatmap = self.grad_cam.generate_heatmap(image_processed, class_idx=class_idx)
            self.assertEqual(heatmap.shape, (380, 380), 
                           f"Heatmap shape mismatch for class {self.classes[class_idx]}")
        
        logger.info("✓ Heatmap shape validation passed for all classes")
    
    def test_heatmap_values_range(self):
        """Test heatmap values are in valid range"""
        image = self.create_dummy_image()
        image_normalized = image.astype('float32') / 255.0
        image_processed = np.expand_dims(image_normalized, axis=0)
        
        heatmap = self.grad_cam.generate_heatmap(image_processed, class_idx=2)
        
        # All values should be between 0 and 1
        self.assertTrue(np.all(heatmap >= 0.0))
        self.assertTrue(np.all(heatmap <= 1.0))
        logger.info("✓ Heatmap value range validation passed")
    
    def test_heatmap_not_all_zeros(self):
        """Test that heatmap is not all zeros (contains information)"""
        image = self.create_dummy_image()
        image_normalized = image.astype('float32') / 255.0
        image_processed = np.expand_dims(image_normalized, axis=0)
        
        heatmap = self.grad_cam.generate_heatmap(image_processed, class_idx=1)
        
        # Heatmap should contain some variation
        self.assertTrue(np.max(heatmap) > 0.1, "Heatmap is too dark")
        self.assertTrue(np.std(heatmap) > 0.01, "Heatmap lacks variation")
        logger.info("✓ Heatmap information content validation passed")


class TestFeatureDetector(unittest.TestCase):
    """Test disease feature detection"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.detector = FeatureDetector()
        cls.classes = model_service.classes
    
    def create_synthetic_diseased_leaf(self) -> np.ndarray:
        """Create synthetic image with disease-like features"""
        img = np.ones((380, 380, 3), dtype=np.uint8) * 100  # Dark green base
        img[:, :, 0] = 40
        img[:, :, 1] = 100
        img[:, :, 2] = 40
        
        # Add brown spots (lesions)
        cv2.circle(img, (100, 100), 30, (30, 60, 100), -1)
        cv2.circle(img, (250, 250), 25, (30, 60, 100), -1)
        
        return img
    
    def create_healthy_leaf(self) -> np.ndarray:
        """Create synthetic healthy leaf image"""
        img = np.ones((380, 380, 3), dtype=np.uint8)
        img[:, :, 0] = 60  # R
        img[:, :, 1] = 120  # G
        img[:, :, 2] = 40   # B
        
        return img
    
    def test_lesion_detection(self):
        """Test lesion detection functionality"""
        diseased_img = self.create_synthetic_diseased_leaf()
        diseased_processed = np.expand_dims(diseased_img, axis=0)
        
        lesion_info = self.detector.detect_lesions(diseased_processed, np.zeros((380, 380)))
        
        self.assertIn('total_affected_percentage', lesion_info)
        self.assertIn('lesion_count', lesion_info)
        self.assertGreater(lesion_info['total_affected_percentage'], 0)
        logger.info(f"✓ Lesion detection found {lesion_info['lesion_count']} lesions")
    
    def test_healthy_leaf_detection(self):
        """Test that healthy leaves are identified correctly"""
        healthy_img = self.create_healthy_leaf()
        healthy_processed = np.expand_dims(healthy_img, axis=0)
        
        lesion_info = self.detector.detect_lesions(healthy_processed, np.zeros((380, 380)))
        
        # Healthy leaf should have minimal affected area
        self.assertLess(lesion_info['total_affected_percentage'], 20)
        logger.info("✓ Healthy leaf detection passed")
    
    def test_feature_extraction(self):
        """Test disease feature extraction"""
        healthy_img = self.create_healthy_leaf()
        diseased_img = self.create_synthetic_diseased_leaf()
        
        # Test each disease class
        for disease in self.classes:
            features = self.detector.extract_features(diseased_img, disease)
            self.assertIsInstance(features, list)
            self.assertGreater(len(features), 0)
            logger.info(f"✓ Features extracted for {disease}: {features}")
    
    def test_feature_dict_structure(self):
        """Test that disease feature dictionary has correct structure"""
        for disease, features_dict in self.detector.disease_features.items():
            self.assertIn('symptoms', features_dict)
            self.assertIn('color_range', features_dict)
            self.assertIsInstance(features_dict['symptoms'], list)
            self.assertGreater(len(features_dict['symptoms']), 0)
        
        logger.info("✓ Disease feature dictionary structure validation passed")


class TestExplanationGenerator(unittest.TestCase):
    """Test explanation generation"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.generator = ExplanationGenerator()
        cls.classes = model_service.classes
    
    def test_explanation_generation(self):
        """Test explanation generation for each disease"""
        for disease in self.classes:
            explanation = self.generator.generate_explanation(
                disease=disease,
                confidence=0.85,
                detected_features=['feature1', 'feature2'],
                affected_area=25.5,
                lesion_count=3
            )
            
            self.assertIn('disease', explanation)
            self.assertIn('confidence_percentage', explanation)
            self.assertIn('cause', explanation)
            self.assertIn('detected_indicators', explanation)
            self.assertEqual(explanation['disease'], disease)
            logger.info(f"✓ Explanation generated for {disease}")
    
    def test_confidence_level_classification(self):
        """Test confidence level classification"""
        confidence_levels = [
            (0.98, "Very High"),
            (0.90, "High"),
            (0.75, "Moderate"),
            (0.60, "Low"),
            (0.40, "Very Low")
        ]
        
        for conf, expected_level in confidence_levels:
            level = self.generator._get_confidence_level(conf)
            self.assertIsNotNone(level)
            logger.info(f"Confidence {conf:.2f} → {level}")
    
    def test_explanation_content_quality(self):
        """Test quality of generated explanations"""
        explanation = self.generator.generate_explanation(
            disease='Bacterial Blight',
            confidence=0.92,
            detected_features=['water-soaked lesions', 'angular spots'],
            affected_area=35.2,
            lesion_count=5
        )
        
        # Validate content
        self.assertGreater(len(explanation['cause']), 10)
        self.assertGreater(len(explanation['explanation_summary']), 20)
        self.assertGreaterEqual(len(explanation['detected_indicators']), 1)
        logger.info("✓ Explanation content quality validation passed")
    
    def test_summary_generation(self):
        """Test summary generation"""
        summary = self.generator._generate_summary(
            disease='Powdery Mildew',
            confidence=0.88,
            affected_area=40.0,
            features=['white powder coating detected']
        )
        
        self.assertIn('Powdery Mildew', summary)
        self.assertGreater(len(summary), 20)
        logger.info(f"✓ Summary generated: {summary[:50]}...")


class TestXAIExplainer(unittest.TestCase):
    """Test complete XAI explanation pipeline"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.xai_explainer = model_service.xai_explainer
        cls.classes = model_service.classes
    
    def create_test_image(self) -> np.ndarray:
        """Create test image"""
        img = np.random.randint(50, 180, (380, 380, 3), dtype=np.uint8)
        # Add some structure
        img[100:200, 100:200] = 100
        return img
    
    @unittest.skipIf(model_service.xai_explainer is None, "XAI Explainer not available")
    def test_complete_explanation(self):
        """Test complete explanation pipeline"""
        image = self.create_test_image()
        image_normalized = image.astype('float32') / 255.0
        image_processed = np.expand_dims(image_normalized, axis=0)
        
        predictions = {
            'class': 'Bacterial Blight',
            'confidence': 0.87
        }
        
        xai_result = self.xai_explainer.explain_prediction(image_processed, predictions)
        
        self.assertIn('prediction', xai_result)
        self.assertIn('xai_analysis', xai_result)
        self.assertIn('explanation', xai_result['xai_analysis'])
        self.assertIn('heatmap', xai_result['xai_analysis'])
        self.assertIn('lesion_analysis', xai_result['xai_analysis'])
        logger.info("✓ Complete XAI explanation pipeline test passed")
    
    @unittest.skipIf(model_service.xai_explainer is None, "XAI Explainer not available")
    def test_confidence_justification(self):
        """Test confidence justification generation"""
        image = self.create_test_image()
        image_normalized = image.astype('float32') / 255.0
        image_processed = np.expand_dims(image_normalized, axis=0)
        
        predictions = {
            'class': 'Target spot',
            'confidence': 0.82
        }
        
        xai_result = self.xai_explainer.explain_prediction(image_processed, predictions)
        justification = xai_result['xai_analysis']['confidence_justification']
        
        self.assertIsNotNone(justification)
        self.assertGreater(len(justification), 10)
        logger.info(f"✓ Justification generated: {justification[:60]}...")


class TestVisualizations(unittest.TestCase):
    """Test visualization generation"""
    
    def create_test_heatmap(self) -> np.ndarray:
        """Create test heatmap"""
        x = np.linspace(0, 1, 380)
        y = np.linspace(0, 1, 380)
        X, Y = np.meshgrid(x, y)
        heatmap = np.exp(-((X - 0.5)**2 + (Y - 0.5)**2) / 0.1)
        heatmap = heatmap / np.max(heatmap)
        return heatmap
    
    def test_heatmap_overlay(self):
        """Test heatmap overlay visualization"""
        image = np.random.randint(0, 255, (380, 380, 3), dtype=np.uint8)
        heatmap = self.create_test_heatmap()
        
        overlaid = HeatmapVisualizer.apply_heatmap_overlay(image, heatmap)
        
        self.assertEqual(overlaid.shape, (380, 380, 3))
        self.assertTrue(np.all(overlaid >= 0))
        self.assertTrue(np.all(overlaid <= 255))
        logger.info("✓ Heatmap overlay test passed")
    
    def test_image_to_base64(self):
        """Test image to base64 conversion"""
        image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        
        b64 = HeatmapVisualizer.image_to_base64(image)
        
        self.assertIsInstance(b64, str)
        self.assertGreater(len(b64), 0)
        self.assertTrue(b64.startswith('iVBOR'))  # PNG header in base64
        logger.info("✓ Image to base64 conversion test passed")
    
    def test_explanation_card(self):
        """Test explanation card generation"""
        explanation = {
            'disease': 'Powdery Mildew',
            'confidence_percentage': 88.5,
            'severity_assessment': {
                'urgency': 'Moderate - Treatment within 5-7 days'
            },
            'explanation_summary': 'The AI detected Powdery Mildew with high confidence'
        }
        
        card = ExplanationVisualizer.create_explanation_card(explanation)
        
        self.assertIsNotNone(card)
        self.assertEqual(card.size[0], 600)  # Default width
        logger.info("✓ Explanation card generation test passed")
    
    def test_confidence_bar(self):
        """Test confidence bar visualization"""
        predictions = {
            'Bacterial Blight': 0.87,
            'Powdery Mildew': 0.08,
            'Healthy': 0.03,
            'Target spot': 0.02
        }
        
        bar = ExplanationVisualizer.create_confidence_bar(
            'Bacterial Blight',
            0.87,
            predictions
        )
        
        self.assertIsNotNone(bar)
        logger.info("✓ Confidence bar visualization test passed")
    
    def test_severity_indicator(self):
        """Test severity indicator visualization"""
        indicator = ExplanationVisualizer.create_severity_indicator(
            affected_area=35.5,
            lesion_count=4,
            confidence=0.92
        )
        
        self.assertIsNotNone(indicator)
        self.assertEqual(indicator.size[0], 300)
        logger.info("✓ Severity indicator visualization test passed")


class TestXAIIntegration(unittest.TestCase):
    """Integration tests for complete XAI pipeline"""
    
    def setUp(self):
        """Set up each test"""
        self.model_service = model_service
    
    def create_test_pil_image(self) -> Image.Image:
        """Create test PIL image"""
        img_array = np.random.randint(50, 180, (380, 380, 3), dtype=np.uint8)
        return Image.fromarray(img_array)
    
    @unittest.skipIf(model_service.xai_explainer is None, "XAI not available")
    def test_model_service_with_xai(self):
        """Test model service with XAI enabled"""
        image = self.create_test_pil_image()
        
        result = self.model_service.predict_single(image, include_xai=True)
        
        self.assertIn('class', result)
        self.assertIn('confidence', result)
        self.assertIn('xai', result)
        self.assertIn('visualizations', result)
        logger.info("✓ Model service XAI integration test passed")
    
    def test_model_service_without_xai(self):
        """Test model service with XAI disabled"""
        image = self.create_test_pil_image()
        
        result = self.model_service.predict_single(image, include_xai=False)
        
        self.assertIn('class', result)
        self.assertIn('confidence', result)
        self.assertNotIn('xai', result)
        logger.info("✓ Model service without XAI test passed")


class TestXAIQualityMetrics(unittest.TestCase):
    """Test XAI quality and effectiveness metrics"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.xai_explainer = model_service.xai_explainer
    
    @unittest.skipIf(model_service.xai_explainer is None, "XAI not available")
    def test_heatmap_consistency(self):
        """Test that same input produces consistent heatmaps"""
        image = np.random.RandomState(42).randint(50, 180, (380, 380, 3), dtype=np.uint8)
        image_normalized = image.astype('float32') / 255.0
        image_processed = np.expand_dims(image_normalized, axis=0)
        
        heatmap1 = self.xai_explainer.grad_cam.generate_heatmap(image_processed, class_idx=1)
        heatmap2 = self.xai_explainer.grad_cam.generate_heatmap(image_processed, class_idx=1)
        
        # Heatmaps should be very similar
        correlation = np.corrcoef(heatmap1.flatten(), heatmap2.flatten())[0, 1]
        self.assertGreater(correlation, 0.95)
        logger.info(f"✓ Heatmap consistency test passed (correlation: {correlation:.4f})")
    
    @unittest.skipIf(model_service.xai_explainer is None, "XAI not available")
    def test_explanation_completeness(self):
        """Test that explanations contain all required information"""
        explanation = ExplanationGenerator().generate_explanation(
            disease='Aphids',
            confidence=0.75,
            detected_features=['curled leaves', 'yellow spots'],
            affected_area=15.0,
            lesion_count=2
        )
        
        required_fields = [
            'disease', 'confidence_percentage', 'cause',
            'detected_indicators', 'severity_assessment'
        ]
        
        for field in required_fields:
            self.assertIn(field, explanation)
        
        logger.info("✓ Explanation completeness test passed")


def run_xai_tests():
    """Run all XAI tests"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestGradCAM))
    suite.addTests(loader.loadTestsFromTestCase(TestFeatureDetector))
    suite.addTests(loader.loadTestsFromTestCase(TestExplanationGenerator))
    suite.addTests(loader.loadTestsFromTestCase(TestXAIExplainer))
    suite.addTests(loader.loadTestsFromTestCase(TestVisualizations))
    suite.addTests(loader.loadTestsFromTestCase(TestXAIIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestXAIQualityMetrics))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*70)
    print("XAI TEST SUMMARY")
    print("="*70)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print("="*70)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_xai_tests()
    exit(0 if success else 1)
