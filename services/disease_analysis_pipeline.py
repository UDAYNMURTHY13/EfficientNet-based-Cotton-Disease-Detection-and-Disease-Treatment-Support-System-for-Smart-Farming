"""
Unified Disease Analysis Pipeline
Integrates disease detection → severity estimation in a single workflow
"""

import tensorflow as tf
import numpy as np
from PIL import Image
import cv2
import logging
import time
import io
import os
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class DiseaseAnalysisPipeline:
    """
    Integrated pipeline combining disease detection and severity estimation
    Flow: Image → Disease Detection → Heatmap Analysis → Severity Estimation → Results
    """
    
    def __init__(self, model_path: Optional[str] = None, enable_xai: bool = True):
        """
        Initialize the pipeline
        
        Args:
            model_path: Path to keras model (auto-detects if None)
            enable_xai: Enable XAI explanations
        """
        self.model = None
        self.model_path = model_path
        self.enable_xai = enable_xai
        self.xai_explainer = None
        self.heatmap_generator = None
        self.lesion_detector = None

        # Nutrient and treatment engines
        try:
            from services.nutrient_deficiency import NutrientDeficiencyDetector
            from services.treatment_engine import TreatmentEngine
            self.nutrient_detector = NutrientDeficiencyDetector()
            self.treatment_engine = TreatmentEngine()
            logger.info("✓ Nutrient deficiency detector and treatment engine loaded")
        except Exception as e:
            logger.warning(f"⚠ Nutrient/treatment modules failed to load: {e}")
            self.nutrient_detector = None
            self.treatment_engine = None
        
        # Disease classes
        self.classes = ['Aphids', 'Army worm', 'Bacterial Blight', 'Powdery Mildew', 'Target spot', 'Healthy']
        self.target_size = (380, 380)
        
        # Severity thresholds (disease-specific)
        self.severity_thresholds = {
            'Aphids': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Army worm': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Bacterial Blight': {'mild': 0.65, 'moderate': 0.80, 'severe': 0.90},
            'Powdery Mildew': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Target spot': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Healthy': {'mild': 0.0, 'moderate': 0.0, 'severe': 0.0}
        }
        
        # Area thresholds
        self.area_thresholds = {
            'mild': 10,
            'moderate': 30,
            'severe': 60,
            'critical': 100
        }
        
        self.load_model()
    
    def load_model(self):
        """Load the disease detection model"""
        try:
            if self.model_path is None:
                # Auto-detect model path
                self.model_path = os.path.join(
                    os.path.dirname(__file__), 
                    'cotton_model_final.keras'
                )
            
            self.model = tf.keras.models.load_model(self.model_path)
            logger.info(f"✓ Disease detection model loaded: {self.model_path}")
            
            # Initialize XAI if enabled
            if self.enable_xai:
                try:
                    from services.xai_explainer import XAIExplainer, GradCAM, FeatureDetector
                    self.xai_explainer = XAIExplainer(self.model, self.classes)
                    self.heatmap_generator = GradCAM(self.model)
                    self.lesion_detector = FeatureDetector()
                    logger.info("✓ XAI modules initialized")
                except Exception as e:
                    logger.warning(f"⚠ XAI initialization failed: {e}")
                    self.enable_xai = False
        
        except Exception as e:
            logger.error(f"✗ Model loading failed: {e}")
            raise
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for model inference"""
        try:
            # Resize
            img = image.resize(self.target_size, Image.Resampling.LANCZOS)
            img_array = np.array(img).astype('float32')
            
            # Apply EfficientNet preprocessing
            img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
            
            # Add batch dimension
            processed = np.expand_dims(img_array, axis=0)
            return processed
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise
    
    def detect_disease(self, image: Image.Image) -> Dict[str, Any]:
        """
        Step 1: Detect disease from image
        Returns predictions for all classes with confidence scores
        """
        try:
            processed = self.preprocess_image(image)
            predictions = self.model.predict(processed, verbose=0)
            
            idx = np.argmax(predictions[0])
            confidence = float(predictions[0][idx])
            
            result = {
                'predicted_class': self.classes[idx],
                'confidence': confidence,
                'confidence_percentage': round(confidence * 100, 2),
                'predictions': {self.classes[i]: float(predictions[0][i]) for i in range(len(self.classes))},
                'processed_image': processed,
                'original_image': image
            }
            
            logger.debug(f"Disease detected: {result['predicted_class']} ({result['confidence_percentage']}%)")
            return result
        
        except Exception as e:
            logger.error(f"Disease detection failed: {e}")
            raise
    
    def analyze_affected_area(self, image: Image.Image) -> Dict[str, float]:
        """
        Step 2a: Analyze affected area using color-based detection
        """
        try:
            img_array = np.array(image)
            
            # Convert to HSV
            if len(img_array.shape) == 2:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
            
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
            # Detect healthy green regions
            lower_green = np.array([35, 40, 40])
            upper_green = np.array([85, 255, 255])
            healthy_mask = cv2.inRange(hsv, lower_green, upper_green)
            
            total_pixels = img_array.shape[0] * img_array.shape[1]
            healthy_pixels = np.sum(healthy_mask > 0)
            affected_percentage = ((total_pixels - healthy_pixels) / total_pixels) * 100
            
            result = {
                'affected_percentage': round(affected_percentage, 2),
                'healthy_percentage': round(100 - affected_percentage, 2),
                'total_pixels': int(total_pixels),
                'affected_pixels': int(total_pixels - healthy_pixels),
                'healthy_pixels': int(healthy_pixels)
            }
            
            logger.debug(f"Affected area: {result['affected_percentage']}%")
            return result
        
        except Exception as e:
            logger.error(f"Affected area analysis failed: {e}")
            return {'affected_percentage': None, 'error': str(e)}
    
    def analyze_lesions(self, disease_detection: Dict, area_analysis: Dict) -> Dict[str, Any]:
        """
        Step 2b: Analyze lesions and heatmap (XAI)
        """
        if not self.enable_xai or not self.lesion_detector:
            return {'enabled': False}
        
        try:
            processed = disease_detection['processed_image']
            original = disease_detection['original_image']
            
            # Generate heatmap
            class_idx = self.classes.index(disease_detection['predicted_class'])
            heatmap = self.heatmap_generator.generate_heatmap(processed, class_idx)
            
            # Detect lesions
            lesion_analysis = self.lesion_detector.detect_lesions(processed, heatmap)
            
            result = {
                'enabled': True,
                'heatmap': heatmap,
                'lesion_count': lesion_analysis.get('lesion_count', 0),
                'lesion_details': lesion_analysis.get('lesions', []),
                'total_affected_percentage': lesion_analysis.get('total_affected_percentage', 0)
            }
            
            logger.debug(f"Lesion analysis: {result['lesion_count']} lesions detected")
            return result
        
        except Exception as e:
            logger.error(f"Lesion analysis failed: {e}")
            return {'enabled': False, 'error': str(e)}
    
    def calculate_severity(self, disease_detection: Dict, area_analysis: Dict, lesion_analysis: Dict) -> Dict[str, Any]:
        """
        Step 3: Calculate severity based on all indicators
        Integrates confidence, affected area, and lesion data
        """
        disease = disease_detection['predicted_class']
        confidence = disease_detection['confidence']
        
        if disease == 'Healthy':
            return {
                'level': 'None',
                'score': 0,
                'description': 'No disease detected',
                'reasoning': 'Leaf appears completely healthy'
            }
        
        # Calculate severity from confidence
        thresholds = self.severity_thresholds.get(disease, self.severity_thresholds['Target spot'])
        
        if confidence < thresholds['mild']:
            conf_level, conf_score = 'Mild', 1
        elif confidence < thresholds['moderate']:
            conf_level, conf_score = 'Moderate', 2
        elif confidence < thresholds['severe']:
            conf_level, conf_score = 'Severe', 3
        else:
            conf_level, conf_score = 'Critical', 4
        
        # Aggregate multiple indicators
        indicators = {'confidence': conf_score}
        
        # Area-based severity
        affected_pct = area_analysis.get('affected_percentage')
        if affected_pct is not None:
            if affected_pct < self.area_thresholds['mild']:
                area_score = 1
            elif affected_pct < self.area_thresholds['moderate']:
                area_score = 2
            elif affected_pct < self.area_thresholds['severe']:
                area_score = 3
            else:
                area_score = 4
            indicators['area'] = area_score
        
        # Lesion-based severity
        lesion_count = lesion_analysis.get('lesion_count', 0) if lesion_analysis.get('enabled') else 0
        if lesion_count > 0:
            if lesion_count < 5:
                lesion_score = 1
            elif lesion_count < 15:
                lesion_score = 2
            elif lesion_count < 30:
                lesion_score = 3
            else:
                lesion_score = 4
            indicators['lesions'] = lesion_score
        
        # Calculate weighted average
        weights = {'confidence': 0.40, 'area': 0.35, 'lesions': 0.25}
        total_score = 0.0
        total_weight = 0.0
        
        for ind, score in indicators.items():
            if ind in weights:
                total_score += score * weights[ind]
                total_weight += weights[ind]
        
        if total_weight == 0:
            final_score = conf_score
        else:
            final_score = total_score / total_weight
        
        # Map to level
        if final_score < 1.5:
            level = 'Mild'
        elif final_score < 2.5:
            level = 'Moderate'
        elif final_score < 3.5:
            level = 'Severe'
        else:
            level = 'Critical'
        
        # Generate description
        desc_parts = [f'{disease} detected', f'{affected_pct:.1f}% affected' if affected_pct else None]
        desc_parts = [p for p in desc_parts if p]
        description = f'{level}: {", ".join(desc_parts)}'
        
        # Generate reasoning
        reasons = [
            f'Confidence: {disease_detection["confidence_percentage"]}%',
            f'Affected area: {affected_pct:.1f}%' if affected_pct else None,
            f'Lesions: {lesion_count}' if lesion_count > 0 else None
        ]
        reasons = [r for r in reasons if r]
        reasoning = ' | '.join(reasons)
        
        return {
            'level': level,
            'score': round(final_score, 2),
            'description': description,
            'reasoning': reasoning,
            'indicators': indicators,
            'details': {
                'confidence_score': conf_score,
                'area_score': indicators.get('area'),
                'lesion_score': indicators.get('lesions')
            }
        }
    
    def analyze(self, image_input) -> Dict[str, Any]:
        """
        Main pipeline: Image → Disease Detection → Severity Estimation
        
        Args:
            image_input: PIL Image, file path, or bytes
            
        Returns:
            Complete analysis result
        """
        start_time = time.time()
        
        try:
            # Load image if needed
            if isinstance(image_input, str):
                image = Image.open(image_input).convert('RGB')
            elif isinstance(image_input, bytes):
                image = Image.open(io.BytesIO(image_input)).convert('RGB')
            else:
                image = image_input.convert('RGB')
            
            logger.info("Starting disease analysis pipeline...")
            
            # Step 1: Disease Detection
            logger.info("  Step 1: Disease detection...")
            disease_result = self.detect_disease(image)
            
            # Step 2a: Affected Area Analysis (skip for healthy leaves)
            logger.info("  Step 2a: Affected area analysis...")
            is_healthy = disease_result['predicted_class'] == 'Healthy'
            if is_healthy:
                area_result = {'affected_percentage': 0.0, 'healthy_percentage': 100.0, 'skipped': True}
            else:
                area_result = self.analyze_affected_area(image)

            # Step 2b: Lesion & Heatmap Analysis (skip for healthy leaves)
            logger.info("  Step 2b: Lesion analysis...")
            if is_healthy:
                lesion_result = {'enabled': False, 'skipped': True}
            else:
                lesion_result = self.analyze_lesions(disease_result, area_result)
            
            # Step 3: Severity Estimation
            logger.info("  Step 3: Severity estimation...")
            severity_result = self.calculate_severity(disease_result, area_result, lesion_result)
            
            inference_time = time.time() - start_time
            
            # Encode Grad-CAM heatmap overlay if available
            grad_cam_overlay = None
            grad_cam_heatmap = None
            if lesion_result.get('enabled') and lesion_result.get('heatmap') is not None:
                try:
                    from services.xai_visualizations import HeatmapVisualizer
                    heatmap = lesion_result['heatmap']
                    # Resize original to model input size for overlay
                    orig_array = np.array(
                        disease_result['original_image'].resize(self.target_size)
                    )
                    # Overlay (jet colormap blended on original)
                    overlay_arr = HeatmapVisualizer.apply_heatmap_overlay(
                        orig_array, heatmap, alpha=0.5
                    )
                    grad_cam_overlay = 'data:image/png;base64,' + HeatmapVisualizer.image_to_base64(overlay_arr)
                    # Pure colorized heatmap
                    heatmap_img = np.array(HeatmapVisualizer.create_heatmap_image(heatmap))
                    grad_cam_heatmap = 'data:image/png;base64,' + HeatmapVisualizer.image_to_base64(heatmap_img)
                    logger.info("✓ Grad-CAM heatmap encoded")
                except Exception as e:
                    logger.warning(f"Heatmap encoding failed: {e}")

            # Step 4: Nutrient Deficiency Detection
            nutrient_result = None
            if self.nutrient_detector is not None and not is_healthy:
                logger.info("  Step 4: Nutrient deficiency detection...")
                try:
                    img_array = np.array(image)
                    # PIL is RGB; convert to BGR for cv2-based detector
                    bgr_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                    nutrient_result = self.nutrient_detector.detect(bgr_image)
                    logger.debug(f"Nutrient result: {nutrient_result.get('deficiency')}")
                except Exception as e:
                    logger.warning(f"Nutrient deficiency detection failed: {e}")

            # Step 5: Treatment Recommendation
            treatment_result = None
            if self.treatment_engine is not None and not is_healthy:
                logger.info("  Step 5: Treatment recommendation...")
                try:
                    # Gather detected visual features from lesion details (if XAI ran)
                    detected_features: list = []
                    if lesion_result.get('enabled') and lesion_result.get('lesion_details'):
                        for lesion in lesion_result['lesion_details']:
                            if isinstance(lesion, dict) and lesion.get('type'):
                                detected_features.append(lesion['type'])

                    treatment_result = self.treatment_engine.recommend(
                        disease=disease_result['predicted_class'],
                        severity=severity_result.get('level', 'Mild'),
                        affected_area_pct=area_result.get('affected_percentage') or 0.0,
                        lesion_count=lesion_result.get('lesion_count', 0) if lesion_result.get('enabled') else 0,
                        detected_features=detected_features,
                    )
                    logger.debug(f"Treatment urgency: {treatment_result.get('urgency')}")
                except Exception as e:
                    logger.warning(f"Treatment recommendation failed: {e}")

            # Compile complete result
            result = {
                'disease': disease_result['predicted_class'],
                'confidence': disease_result['confidence'],
                'confidence_percentage': disease_result['confidence_percentage'],
                'all_predictions': disease_result['predictions'],
                'affected_area': None if is_healthy else area_result.get('affected_percentage'),
                'severity': severity_result,
                'lesion_analysis': None if is_healthy else (
                    {
                        'count': lesion_result.get('lesion_count', 0),
                        'details': lesion_result.get('lesion_details', [])
                    } if lesion_result.get('enabled') else None
                ),
                'grad_cam_overlay': None if is_healthy else grad_cam_overlay,
                'grad_cam_heatmap': None if is_healthy else grad_cam_heatmap,
                'inference_time': round(inference_time, 3),
                'xai_available': self.enable_xai,
                # Nutrient deficiency (None when healthy or detection skipped)
                'nutrient_deficiency': nutrient_result,
                # Severity-aware treatment plan (None when healthy or skipped)
                'treatment': treatment_result,
            }
            
            logger.info(f"✓ Analysis complete: {disease_result['predicted_class']} - {severity_result['level']}")
            return result
        
        except Exception as e:
            logger.error(f"Pipeline execution failed: {e}")
            raise


# Global instance
pipeline = None


def get_pipeline() -> DiseaseAnalysisPipeline:
    """Get or create the global pipeline instance"""
    global pipeline
    if pipeline is None:
        pipeline = DiseaseAnalysisPipeline()
    return pipeline
