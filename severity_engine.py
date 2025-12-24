import numpy as np
from PIL import Image
import cv2

class SeverityEngine:
    def __init__(self):
        self.thresholds = {
            'Aphids': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Army worm': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Bacterial Blight': {'mild': 0.65, 'moderate': 0.80, 'severe': 0.90},
            'Powdery Mildew': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Target spot': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Healthy': {'mild': 0.0, 'moderate': 0.0, 'severe': 0.0}
        }
    
    def calculate_severity(self, disease, confidence):
        if disease == 'Healthy':
            return {'level': 'None', 'score': 0, 'description': 'No disease detected'}
        
        thresholds = self.thresholds[disease]
        
        if confidence < thresholds['mild']:
            level = 'Mild'
            score = 1
            description = 'Early stage, immediate treatment recommended'
        elif confidence < thresholds['moderate']:
            level = 'Moderate'
            score = 2
            description = 'Progressing infection, urgent treatment needed'
        elif confidence < thresholds['severe']:
            level = 'Severe'
            score = 3
            description = 'Advanced stage, intensive treatment required'
        else:
            level = 'Critical'
            score = 4
            description = 'Critical condition, immediate expert consultation needed'
        
        return {
            'level': level,
            'score': score,
            'confidence': round(confidence * 100, 2),
            'description': description
        }
    
    def estimate_affected_area(self, image):
        try:
            img_array = np.array(image)
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
            lower_green = np.array([35, 40, 40])
            upper_green = np.array([85, 255, 255])
            healthy_mask = cv2.inRange(hsv, lower_green, upper_green)
            
            total_pixels = img_array.shape[0] * img_array.shape[1]
            healthy_pixels = np.sum(healthy_mask > 0)
            affected_percentage = ((total_pixels - healthy_pixels) / total_pixels) * 100
            
            return round(affected_percentage, 2)
        except:
            return None

severity_engine = SeverityEngine()
