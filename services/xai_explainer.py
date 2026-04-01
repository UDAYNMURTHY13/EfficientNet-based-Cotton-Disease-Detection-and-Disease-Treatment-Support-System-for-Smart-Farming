"""
XAI (Explainable AI) Module for Cotton Leaf Disease Detection
Implements Grad-CAM visualization, feature detection, and explanation generation
"""

import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import logging
from typing import Dict, List, Tuple, Optional
import json

logger = logging.getLogger(__name__)


class GradCAM:
    """
    Grad-CAM (Gradient-weighted Class Activation Mapping) implementation
    Generates heatmaps showing which regions of the leaf influenced the prediction
    """
    
    def __init__(self, model, layer_name: str = 'top_activation'):
        """
        Initialize Grad-CAM
        
        Args:
            model: Trained Keras model
            layer_name: Name of the layer to visualize (typically the last convolutional layer)
        """
        self.model = model
        self.layer_name = layer_name
        self.grad_model = self._build_grad_model()
    
    def _build_grad_model(self):
        """Create a model that outputs gradients and activations"""
        try:
            # Try to find the layer
            layer = self.model.get_layer(self.layer_name)
        except ValueError:
            # If layer not found, use the last convolutional layer
            for layer in reversed(self.model.layers):
                if 'conv' in layer.name.lower():
                    logger.info(f"Using layer: {layer.name}")
                    break
        
        # Create model that returns activations and gradients
        # Use inputs directly without wrapping in list
        grad_model = tf.keras.models.Model(
            inputs=self.model.inputs,
            outputs=[layer.output, self.model.output]
        )
        return grad_model
    
    def compute_gradients(self, inputs, class_idx):
        """Compute gradients with respect to the input"""
        with tf.GradientTape() as tape:
            tape.watch(inputs)
            grad_outputs = self.grad_model(inputs, training=False)
            
            # Handle different output formats
            if isinstance(grad_outputs, (list, tuple)):
                activations, predictions = grad_outputs[0], grad_outputs[1]
            else:
                # If single output, something is wrong
                logger.error(f"Unexpected grad_model output: {type(grad_outputs)}")
                activations = grad_outputs
                predictions = grad_outputs
            
            # Ensure predictions is a tensor
            if isinstance(predictions, (list, tuple)):
                predictions = tf.convert_to_tensor(predictions)
            
            # Squeeze extra dimensions but keep batch dimension
            # Expected shape: [batch, num_classes]
            while len(predictions.shape) > 2:
                # Remove extra middle dimensions
                predictions = tf.squeeze(predictions, axis=1)
            
            # Handle 1D predictions (no batch dimension)
            if len(predictions.shape) == 1:
                predictions = tf.expand_dims(predictions, 0)
            
            # Select the class channel
            if class_idx < predictions.shape[-1]:
                class_channel = predictions[:, class_idx]
            else:
                # If class_idx is out of bounds, use argmax
                logger.warning(f"class_idx {class_idx} out of bounds for predictions shape {predictions.shape}, using argmax")
                class_channel = tf.reduce_max(predictions, axis=-1)
        
        gradients = tape.gradient(class_channel, activations)
        return gradients, activations
    
    def generate_heatmap(self, processed_image: np.ndarray, class_idx: int) -> np.ndarray:
        """
        Generate Grad-CAM heatmap for the given image
        
        Args:
            processed_image: Preprocessed image (1, 380, 380, 3)
            class_idx: Index of the predicted class
            
        Returns:
            Heatmap as numpy array (380, 380)
        """
        # Ensure input is float32
        inputs = tf.cast(processed_image, tf.float32)
        
        # Compute gradients and activations
        gradients, activations = self.compute_gradients(inputs, class_idx)
        
        # Compute weights
        weights = tf.reduce_mean(gradients, axis=(1, 2))[0]
        
        # Generate heatmap
        activations = activations[0]
        heatmap = tf.reduce_sum(activations * weights, axis=-1)
        
        # Convert tensor to numpy if needed
        if isinstance(heatmap, tf.Tensor):
            heatmap = heatmap.numpy()
        
        # Normalize heatmap
        heatmap = np.maximum(heatmap, 0)
        heatmap = heatmap / (np.max(heatmap) + 1e-8)
        
        # Resize to original image size
        heatmap = cv2.resize(heatmap, (380, 380))
        
        return heatmap


class FeatureDetector:
    """
    Detects disease-specific features in the leaf image
    Identifies lesions, color changes, and other symptoms
    """
    
    def __init__(self):
        self.disease_features = {
            'Aphids': {
                'symptoms': ['curled leaves', 'sticky residue', 'yellow spots'],
                'color_range': {'h': (0, 40), 'white': (200, 255)}
            },
            'Army worm': {
                'symptoms': ['irregular holes', 'skeletonized leaves', 'dark droppings'],
                'color_range': {'h': (0, 50), 's': (0, 100)}
            },
            'Bacterial Blight': {
                'symptoms': ['water-soaked lesions', 'angular spots', 'yellow halo'],
                'color_range': {'h': (0, 30), 'brown': (10, 25)}
            },
            'Powdery Mildew': {
                'symptoms': ['white powder', 'surface coating', 'affected leaves'],
                'color_range': {'h': (0, 180), 's': (0, 50), 'v': (200, 255)}
            },
            'Target spot': {
                'symptoms': ['circular lesions', 'concentric rings', 'dark center'],
                'color_range': {'h': (0, 40), 'brown': (10, 30)}
            },
            'Healthy': {
                'symptoms': ['uniform green color', 'no lesions', 'normal structure'],
                'color_range': {'h': (35, 85), 's': (40, 255), 'v': (40, 255)}
            }
        }
    
    def detect_lesions(self, image: np.ndarray, heatmap: np.ndarray) -> Dict:
        """
        Detect lesions and abnormalities in the image
        
        Args:
            image: Original image (380, 380, 3) or (1, 380, 380, 3)
            heatmap: Grad-CAM heatmap
            
        Returns:
            Dictionary with lesion information
        """
        # Handle batched input
        if len(image.shape) == 4:
            image = image[0]
        
        # Normalize image to 0-255 range if needed
        if image.max() <= 1.0:
            image = (image * 255).astype(np.uint8)
        else:
            image = image.astype(np.uint8)
        
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        
        # Detect non-green regions (potential disease)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        
        # Find lesions (non-green regions)
        lesion_mask = cv2.bitwise_not(green_mask)
        
        # Apply morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        lesion_mask = cv2.morphologyEx(lesion_mask, cv2.MORPH_CLOSE, kernel)
        lesion_mask = cv2.morphologyEx(lesion_mask, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(lesion_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Calculate affected area
        total_pixels = image.shape[0] * image.shape[1]
        lesion_pixels = np.sum(lesion_mask > 0)
        affected_percentage = (lesion_pixels / total_pixels) * 100 if total_pixels > 0 else 0
        
        # Detect largest lesions
        largest_lesions = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
        lesion_info = []
        
        for lesion in largest_lesions:
            area = cv2.contourArea(lesion)
            if area > 50:  # Minimum area threshold
                x, y, w, h = cv2.boundingRect(lesion)
                center_x, center_y = x + w // 2, y + h // 2
                lesion_info.append({
                    'position': (int(center_x), int(center_y)),
                    'size': (int(w), int(h)),
                    'area_pixels': int(area),
                    'area_percentage': round((area / total_pixels) * 100, 2)
                })
        
        return {
            'total_affected_percentage': round(affected_percentage, 2),
            'lesion_count': len(lesion_info),
            'lesions': lesion_info,
            'masks': {
                'lesion_mask': lesion_mask,
                'green_mask': green_mask
            }
        }
    
    def extract_features(self, image: np.ndarray, disease: str) -> List[str]:
        """
        Extract visible disease features from the image
        
        Args:
            image: Original image
            disease: Disease class name
            
        Returns:
            List of detected features
        """
        detected_features = []
        
        if disease not in self.disease_features:
            return detected_features
        
        # Get disease-specific features
        expected_features = self.disease_features[disease]['symptoms']
        
        # Handle batched input
        if len(image.shape) == 4:
            image = image[0]
        
        if image.max() <= 1.0:
            image = (image * 255).astype(np.uint8)
        else:
            image = image.astype(np.uint8)
        
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        
        # Feature-specific detection
        if disease == 'Powdery Mildew':
            # Check for white powder (high brightness, low saturation)
            white_mask = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([180, 50, 255]))
            if np.sum(white_mask) > image.shape[0] * image.shape[1] * 0.05:
                detected_features.append('white powder coating detected')
                detected_features.append('affected leaves visible')
        
        elif disease == 'Bacterial Blight':
            # Check for water-soaked appearance (specific color range)
            brown_mask = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([30, 255, 200]))
            if np.sum(brown_mask) > image.shape[0] * image.shape[1] * 0.03:
                detected_features.append('water-soaked lesions detected')
                detected_features.append('brown to black lesions')
        
        elif disease == 'Target spot':
            # Check for circular patterns (use Hough circles)
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 20,
                                       param1=50, param2=30, minRadius=5, maxRadius=50)
            if circles is not None and len(circles[0]) > 0:
                detected_features.append('circular lesions detected')
                detected_features.append('concentric ring pattern')
        
        elif disease in ['Aphids', 'Army worm']:
            # Check for irregular holes
            lower_green = np.array([35, 40, 40])
            upper_green = np.array([85, 255, 255])
            green_mask = cv2.inRange(hsv, lower_green, upper_green)
            non_green = cv2.bitwise_not(green_mask)
            
            if np.sum(non_green) > image.shape[0] * image.shape[1] * 0.08:
                detected_features.append('irregular damage patterns')
                detected_features.append('leaf tissue loss detected')
        
        elif disease == 'Healthy':
            lower_green = np.array([35, 40, 40])
            upper_green = np.array([85, 255, 255])
            green_mask = cv2.inRange(hsv, lower_green, upper_green)
            green_percentage = (np.sum(green_mask > 0) / (image.shape[0] * image.shape[1])) * 100
            
            if green_percentage > 80:
                detected_features.append('uniform green coloration')
                detected_features.append('no visible lesions')
        
        return detected_features if detected_features else [expected_features[0]]


class ExplanationGenerator:
    """
    Generates human-readable explanations for model predictions
    """
    
    def __init__(self):
        self.disease_explanations = {
            'Aphids': {
                'cause': 'Infestation by small sap-sucking insects',
                'indicators': [
                    'Curled or distorted leaves',
                    'Sticky honeydew residue on leaves',
                    'Yellow or pale spots',
                    'Presence of ants (attracted to honeydew)'
                ],
                'urgency': 'Moderate - Treatment within 3-5 days recommended'
            },
            'Army worm': {
                'cause': 'Caterpillar infestation feeding on leaf tissue',
                'indicators': [
                    'Irregular holes in leaves',
                    'Skeletonized leaf appearance',
                    'Dark droppings on leaves',
                    'Ragged leaf margins'
                ],
                'urgency': 'High - Immediate treatment recommended'
            },
            'Bacterial Blight': {
                'cause': 'Bacterial infection caused by Xanthomonas species',
                'indicators': [
                    'Water-soaked, oily-looking lesions',
                    'Angular brown spots with yellow halo',
                    'Lesions often start at leaf edges',
                    'Can spread rapidly in wet conditions'
                ],
                'urgency': 'High - Treatment within 1-2 days critical'
            },
            'Powdery Mildew': {
                'cause': 'Fungal infection creating white powdery coating',
                'indicators': [
                    'White powder coating on leaf surfaces',
                    'Affects both upper and lower leaf sides',
                    'Leaves may curl or distort',
                    'Reduces photosynthesis capability'
                ],
                'urgency': 'Moderate - Treatment within 5-7 days recommended'
            },
            'Target spot': {
                'cause': 'Fungal infection with characteristic circular lesions',
                'indicators': [
                    'Circular lesions with dark center',
                    'Concentric ring pattern (target appearance)',
                    'Usually starts from lower leaves',
                    'Spreads upward in humid conditions'
                ],
                'urgency': 'Moderate - Treatment within 3-5 days recommended'
            },
            'Healthy': {
                'cause': 'No disease detected',
                'indicators': [
                    'Uniform green coloration',
                    'No visible lesions or spots',
                    'Normal leaf structure and texture',
                    'No pest damage'
                ],
                'urgency': 'None - Continue regular monitoring'
            }
        }
    
    def generate_explanation(self, disease: str, confidence: float, 
                           detected_features: List[str], affected_area: float,
                           lesion_count: int = 0) -> Dict:
        """
        Generate comprehensive explanation for the prediction
        
        Args:
            disease: Disease class name
            confidence: Model confidence score
            detected_features: List of detected visual features
            affected_area: Percentage of affected area
            lesion_count: Number of lesions detected
            
        Returns:
            Dictionary with detailed explanation
        """
        if disease not in self.disease_explanations:
            return {'error': 'Unknown disease'}
        
        exp = self.disease_explanations[disease]
        
        return {
            'disease': disease,
            'confidence_percentage': round(confidence * 100, 2),
            'confidence_level': self._get_confidence_level(confidence),
            'cause': exp['cause'],
            'detected_indicators': detected_features,
            'all_possible_indicators': exp['indicators'],
            'severity_assessment': {
                'affected_area_percentage': round(affected_area, 2),
                'lesion_count': lesion_count,
                'urgency': exp['urgency']
            },
            'explanation_summary': self._generate_summary(disease, confidence, affected_area, 
                                                         detected_features)
        }
    
    def _get_confidence_level(self, confidence: float) -> str:
        """Categorize confidence score"""
        if confidence >= 0.95:
            return 'Very High'
        elif confidence >= 0.85:
            return 'High'
        elif confidence >= 0.70:
            return 'Moderate'
        elif confidence >= 0.50:
            return 'Low'
        else:
            return 'Very Low - Expert verification recommended'
    
    def _generate_summary(self, disease: str, confidence: float, 
                         affected_area: float, features: List[str]) -> str:
        """Generate human-readable summary"""
        if disease == 'Healthy':
            return "The leaf appears to be healthy with no visible signs of disease. Continue regular monitoring and maintain preventive practices."
        
        feature_text = ', '.join(features[:2]) if features else 'visual symptoms'
        
        if confidence >= 0.85:
            return f"The AI detected {disease} with high confidence ({confidence*100:.1f}%) based on observed {feature_text}. {affected_area:.1f}% of the leaf area is affected."
        else:
            return f"The AI detected {disease} with moderate confidence ({confidence*100:.1f}%). {feature_text} are visible. Expert verification is recommended."


class XAIExplainer:
    """
    Main XAI coordinator class
    Orchestrates Grad-CAM, feature detection, and explanation generation
    """
    
    def __init__(self, model, classes: List[str]):
        """
        Initialize XAI Explainer
        
        Args:
            model: Trained Keras model
            classes: List of disease class names
        """
        self.model = model
        self.classes = classes
        self.grad_cam = GradCAM(model)
        self.feature_detector = FeatureDetector()
        self.explanation_generator = ExplanationGenerator()
    
    def explain_prediction(self, processed_image: np.ndarray, predictions: Dict) -> Dict:
        """
        Generate complete explanation for a prediction
        
        Args:
            processed_image: Preprocessed image (1, 380, 380, 3)
            predictions: Dictionary with 'class' and 'confidence' keys
            
        Returns:
            Complete XAI analysis
        """
        disease = predictions['class']
        confidence = predictions['confidence']
        class_idx = self.classes.index(disease)
        
        # Generate Grad-CAM heatmap
        heatmap = self.grad_cam.generate_heatmap(processed_image, class_idx)
        
        # Detect lesions and affected area
        lesion_info = self.feature_detector.detect_lesions(processed_image, heatmap)
        affected_area = lesion_info['total_affected_percentage']
        lesion_count = lesion_info['lesion_count']
        
        # Extract detected features
        detected_features = self.feature_detector.extract_features(processed_image, disease)
        
        # Generate explanation
        explanation = self.explanation_generator.generate_explanation(
            disease=disease,
            confidence=confidence,
            detected_features=detected_features,
            affected_area=affected_area,
            lesion_count=lesion_count
        )
        
        return {
            'prediction': {
                'disease': disease,
                'confidence': round(confidence, 4)
            },
            'xai_analysis': {
                'explanation': explanation,
                'heatmap': heatmap.tolist(),  # Convert to list for JSON serialization
                'lesion_analysis': {
                    'total_affected_percentage': lesion_info['total_affected_percentage'],
                    'lesion_count': lesion_count,
                    'lesion_details': lesion_info['lesions']
                },
                'confidence_justification': self._generate_confidence_justification(
                    disease, confidence, detected_features, affected_area, lesion_count
                )
            }
        }
    
    def _generate_confidence_justification(self, disease: str, confidence: float,
                                          features: List[str], affected_area: float,
                                          lesion_count: int) -> str:
        """Generate justification for the confidence score"""
        reasons = []
        
        if confidence >= 0.90:
            reasons.append(f"Strong match with {disease} characteristics")
        elif confidence >= 0.75:
            reasons.append(f"Good match with {disease} characteristics")
        else:
            reasons.append(f"Moderate match with {disease} characteristics")
        
        if len(features) >= 2:
            reasons.append(f"Multiple disease indicators detected ({', '.join(features[:2])})")
        
        if affected_area > 30:
            reasons.append(f"Significant affected area ({affected_area:.1f}%) confirms severity")
        elif affected_area > 10:
            reasons.append(f"Visible affected area ({affected_area:.1f}%) supports diagnosis")
        
        if lesion_count >= 3:
            reasons.append(f"Multiple lesions detected ({lesion_count})")
        
        return " | ".join(reasons)
