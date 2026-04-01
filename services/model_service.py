import tensorflow as tf
import numpy as np
from PIL import Image
import logging
from functools import lru_cache
import time
from xai_explainer import XAIExplainer
from xai_visualizations import ComprehensiveVisualization

logger = logging.getLogger(__name__)

class ModelService:
    def __init__(self, model_path='cotton_model_final.keras', enable_xai=True):
        self.model = None
        self.model_path = model_path
        self.classes = ['Aphids', 'Army worm', 'Bacterial Blight', 'Powdery Mildew', 'Target spot', 'Healthy']
        self.enable_xai = enable_xai
        self.xai_explainer = None
        self.load_model()
        
    def load_model(self):
        try:
            self.model = tf.keras.models.load_model(self.model_path)
            logger.info(f"Model loaded from {self.model_path}")
            
            # Initialize XAI explainer if enabled
            if self.enable_xai:
                try:
                    self.xai_explainer = XAIExplainer(self.model, self.classes)
                    logger.info("XAI Explainer initialized successfully")
                except Exception as e:
                    logger.warning(f"XAI Explainer initialization failed: {e}. XAI features disabled.")
                    self.enable_xai = False
        except Exception as e:
            logger.error(f"Model loading failed: {e}")
            raise
    
    def preprocess_image(self, image):
        img = image.resize((380, 380))
        img_array = np.array(img).astype('float32')
        # Try EfficientNet preprocessing
        img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
        return np.expand_dims(img_array, axis=0)
    
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
