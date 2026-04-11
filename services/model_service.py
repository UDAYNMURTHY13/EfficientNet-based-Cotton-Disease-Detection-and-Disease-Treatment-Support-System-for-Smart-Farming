import tensorflow as tf
import numpy as np
from PIL import Image
import logging
from functools import lru_cache
import time
import io
import os
from services.xai_explainer import XAIExplainer
from services.xai_visualizations import ComprehensiveVisualization

logger = logging.getLogger(__name__)

class ModelService:
    """
    Service for disease detection and model inference
    Handles model loading, image preprocessing, and prediction with optional XAI analysis
    """
    
    def __init__(self, model_path=None, enable_xai=True):
        self.model = None
        # Use provided path or default to local model file
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), 'cotton_model_final.keras')
        self.model_path = model_path
        self.classes = ['Aphids', 'Army worm', 'Bacterial Blight', 'Powdery Mildew', 'Target spot', 'Healthy']
        self.enable_xai = enable_xai
        self.xai_explainer = None
        self.target_size = (380, 380)  # Model expected input size
        self.load_model()
        
    def load_model(self):
        """Load the Keras model and initialize XAI if enabled"""
        try:
            self.model = tf.keras.models.load_model(self.model_path)
            logger.info(f"✓ Model loaded successfully from {self.model_path}")
            logger.info(f"  Model input shape: {self.model.input_shape}")
            logger.info(f"  Model classes: {len(self.classes)} diseases")
            
            # Initialize XAI explainer if enabled
            if self.enable_xai:
                try:
                    self.xai_explainer = XAIExplainer(self.model, self.classes)
                    logger.info("✓ XAI Explainer initialized successfully")
                except Exception as e:
                    logger.warning(f"⚠ XAI Explainer initialization failed: {e}. XAI features disabled.")
                    self.enable_xai = False
        except Exception as e:
            logger.error(f"✗ Model loading failed: {e}")
            raise
    
    def validate_image(self, image):
        """
        Validate image format and convert to RGB if needed
        
        Args:
            image: PIL Image or bytes
            
        Returns:
            PIL Image in RGB format
            
        Raises:
            ValueError: If image is invalid
        """
        if isinstance(image, bytes):
            try:
                image = Image.open(io.BytesIO(image))
            except Exception as e:
                raise ValueError(f"Failed to open image bytes: {e}")
        
        if not isinstance(image, Image.Image):
            raise ValueError(f"Expected PIL Image, got {type(image)}")
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            try:
                image = image.convert('RGB')
                logger.debug("Image converted to RGB format")
            except Exception as e:
                raise ValueError(f"Failed to convert image to RGB: {e}")
        
        return image
    
    def preprocess_image(self, image):
        """
        Preprocess image for model inference
        
        Args:
            image: PIL Image in RGB format
            
        Returns:
            Preprocessed numpy array with shape (1, 380, 380, 3)
        """
        try:
            # Resize to model input size
            img = image.resize(self.target_size, Image.Resampling.LANCZOS)
            img_array = np.array(img).astype('float32')
            
            # Apply EfficientNet preprocessing
            # This includes normalization specific to EfficientNet
            img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
            
            # Add batch dimension
            processed = np.expand_dims(img_array, axis=0)
            
            logger.debug(f"Image preprocessed: shape {processed.shape}, dtype {processed.dtype}")
            return processed
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise
    
    def predict_single(self, image, include_xai=True):
        """
        Make a single prediction with optional XAI explanations
        
        Args:
            image: PIL Image
            include_xai: Whether to include XAI analysis
            
        Returns:
            Dictionary with prediction and optional XAI data
        """
        start = time.time()
        processed = self.preprocess_image(image)
        predictions = self.model.predict(processed, verbose=0)
        inference_time = time.time() - start
        
        idx = np.argmax(predictions[0])
        confidence = float(predictions[0][idx])
        
        result = {
            'class': self.classes[idx],
            'confidence': confidence,
            'all_predictions': {self.classes[i]: float(predictions[0][i]) for i in range(len(self.classes))},
            'inference_time': inference_time
        }
        
        # Add XAI analysis if enabled and requested
        if include_xai and self.enable_xai and self.xai_explainer:
            try:
                xai_result = self.xai_explainer.explain_prediction(processed, result)
                result['xai'] = xai_result['xai_analysis']
                
                # Generate visualizations
                try:
                    viz = ComprehensiveVisualization.create_xai_report(
                        image, processed, 
                        np.array(xai_result['xai_analysis']['heatmap']),
                        xai_result['xai_analysis']['explanation'],
                        xai_result['xai_analysis']['lesion_analysis']
                    )
                    result['visualizations'] = viz
                except Exception as e:
                    logger.warning(f"Visualization generation failed: {e}")
            except Exception as e:
                logger.warning(f"XAI analysis failed: {e}. Returning prediction without XAI.")
        
        return result
    
    def predict_batch(self, images):
        processed = np.vstack([self.preprocess_image(img) for img in images])
        predictions = self.model.predict(processed, verbose=0)
        
        results = []
        for pred in predictions:
            idx = np.argmax(pred)
            results.append({
                'class': self.classes[idx],
                'confidence': float(pred[idx])
            })
        return results
    
    def health_check(self):
        try:
            dummy = np.random.rand(1, 380, 380, 3)
            self.model.predict(dummy, verbose=0)
            return True
        except:
            return False

model_service = ModelService()
