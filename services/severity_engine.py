import numpy as np
from PIL import Image
import cv2
import logging

logger = logging.getLogger(__name__)

class SeverityEngine:
    """
    Enhanced Severity Engine that integrates confidence, heatmap data, and lesion analysis
    for more accurate disease severity estimation
    """
    
    def __init__(self):
        # Confidence-based thresholds - primary indicator
        self.confidence_thresholds = {
            'Aphids': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Army worm': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Bacterial Blight': {'mild': 0.65, 'moderate': 0.80, 'severe': 0.90},
            'Powdery Mildew': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Target spot': {'mild': 0.70, 'moderate': 0.85, 'severe': 0.95},
            'Healthy': {'mild': 0.0, 'moderate': 0.0, 'severe': 0.0}
        }
        
        # Affected area thresholds - secondary indicator
        self.area_thresholds = {
            'mild': 10,      # Less than 10% affected
            'moderate': 30,   # 10-30% affected
            'severe': 60,     # 30-60% affected
            'critical': 100   # More than 60% affected
        }
        
        # Lesion count thresholds - tertiary indicator
        self.lesion_thresholds = {
            'mild': 5,
            'moderate': 15,
            'severe': 30,
            'critical': 50
        }
    
    def calculate_severity_from_confidence(self, disease, confidence):
        """
        Calculate severity based on confidence score alone
        
        Args:
            disease: Disease name
            confidence: Model confidence (0-1)
            
        Returns:
            Tuple of (level, score)
        """
        if disease == 'Healthy':
            return 'None', 0
        
        thresholds = self.confidence_thresholds.get(disease, self.confidence_thresholds['Target spot'])
        
        if confidence < thresholds['mild']:
            return 'Mild', 1
        elif confidence < thresholds['moderate']:
            return 'Moderate', 2
        elif confidence < thresholds['severe']:
            return 'Severe', 3
        else:
            return 'Critical', 4
    
    def calculate_severity_from_area(self, affected_percentage):
        """
        Calculate severity level based on affected area percentage
        
        Args:
            affected_percentage: Percentage of affected area (0-100)
            
        Returns:
            Tuple of (level, score)
        """
        if affected_percentage < self.area_thresholds['mild']:
            return 'Mild', 1
        elif affected_percentage < self.area_thresholds['moderate']:
            return 'Moderate', 2
        elif affected_percentage < self.area_thresholds['severe']:
            return 'Severe', 3
        else:
            return 'Critical', 4
    
    def calculate_severity_from_lesions(self, lesion_count):
        """
        Calculate severity based on lesion count
        
        Args:
            lesion_count: Number of detected lesions
            
        Returns:
            Tuple of (level, score)
        """
        if lesion_count < self.lesion_thresholds['mild']:
            return 'Mild', 1
        elif lesion_count < self.lesion_thresholds['moderate']:
            return 'Moderate', 2
        elif lesion_count < self.lesion_thresholds['severe']:
            return 'Severe', 3
        else:
            return 'Critical', 4
    
    def aggregate_severity(self, scores_dict):
        """
        Aggregate multiple severity indicators using weighted average
        
        Args:
            scores_dict: Dictionary with keys 'confidence', 'area', 'lesions' and their scores
            
        Returns:
            Final severity score (1-4)
        """
        weights = {
            'confidence': 0.40,   # 40% weight
            'area': 0.35,         # 35% weight
            'lesions': 0.25       # 25% weight
        }
        
        total_score = 0.0
        available_weights = 0.0
        
        for indicator, score in scores_dict.items():
            if score is not None and indicator in weights:
                total_score += score * weights[indicator]
                available_weights += weights[indicator]
        
        if available_weights == 0:
            return 2.0  # Default to Moderate if no data
        
        return total_score / available_weights
    
    def calculate_severity(self, disease, confidence, heatmap_data=None, lesion_analysis=None):
        """
        Calculate comprehensive severity using multiple indicators
        
        Args:
            disease: Disease name
            confidence: Model confidence (0-1)
            heatmap_data: Dictionary with 'affected_percentage' (optional)
            lesion_analysis: Dictionary with 'lesion_count' (optional)
            
        Returns:
            Dictionary with detailed severity assessment
        """
        if disease == 'Healthy':
            return {
                'level': 'None',
                'score': 0,
                'confidence': round(confidence * 100, 2),
                'description': 'No disease detected',
                'reasoning': 'Leaf appears healthy with no visible symptoms'
            }
        
        # Calculate severity from confidence
        conf_level, conf_score = self.calculate_severity_from_confidence(disease, confidence)
        
        # Initialize severity indicators
        indicators = {'confidence': conf_score}
        
        # Calculate severity from heatmap/affected area
        area_score = None
        affected_percentage = None
        if heatmap_data and 'affected_percentage' in heatmap_data:
            affected_percentage = heatmap_data['affected_percentage']
            area_level, area_score = self.calculate_severity_from_area(affected_percentage)
            indicators['area'] = area_score
        
        # Calculate severity from lesion analysis
        lesion_score = None
        lesion_count = 0
        if lesion_analysis and 'lesion_count' in lesion_analysis:
            lesion_count = lesion_analysis['lesion_count']
            lesion_level, lesion_score = self.calculate_severity_from_lesions(lesion_count)
            indicators['lesions'] = lesion_score
        
        # Aggregate scores
        final_score = self.aggregate_severity(indicators)
        
        # Map score to level
        if final_score < 1.5:
            level = 'Mild'
        elif final_score < 2.5:
            level = 'Moderate'
        elif final_score < 3.5:
            level = 'Severe'
        else:
            level = 'Critical'
        
        # Generate description
        description = self._get_severity_description(level, disease, affected_percentage, lesion_count)
        
        # Generate reasoning
        reasoning = self._get_severity_reasoning(disease, confidence, affected_percentage, lesion_count, indicators)
        
        return {
            'level': level,
            'score': round(final_score, 2),
            'confidence': round(confidence * 100, 2),
            'affected_area_percentage': round(affected_percentage, 2) if affected_percentage else None,
            'lesion_count': lesion_count,
            'description': description,
            'reasoning': reasoning,
            'indicators': {
                'confidence_based': conf_score,
                'area_based': area_score,
                'lesion_based': lesion_score
            }
        }
    
    def _get_severity_description(self, level, disease, affected_percentage, lesion_count):
        """Get human-readable severity description"""
        descriptions = {
            'Mild': f'{disease} detected in early stage - localized symptoms, treatment recommended soon',
            'Moderate': f'{disease} showing clear progression - significant spread, urgent treatment needed',
            'Severe': f'{disease} in advanced stage - extensive coverage, intensive treatment required',
            'Critical': f'{disease} critical condition - extensive damage, immediate expert intervention needed'
        }
        
        base_desc = descriptions.get(level, 'Unknown severity level')
        
        # Add specific indicators
        details = []
        if affected_percentage and affected_percentage > 0:
            details.append(f'{affected_percentage}% of leaf affected')
        if lesion_count and lesion_count > 0:
            details.append(f'{lesion_count} lesions detected')
        
        if details:
            base_desc += f' ({", ".join(details)})'
        
        return base_desc
    
    def _get_severity_reasoning(self, disease, confidence, affected_percentage, lesion_count, indicators):
        """Generate detailed reasoning for severity assessment"""
        reasons = []
        
        # Confidence-based reasoning
        if indicators.get('confidence') == 1:
            reasons.append(f'Model confidence ({confidence*100:.1f}%) suggests early-stage {disease}')
        elif indicators.get('confidence') == 2:
            reasons.append(f'Moderate model confidence ({confidence*100:.1f}%) indicates developing infection')
        elif indicators.get('confidence') == 3:
            reasons.append(f'High model confidence ({confidence*100:.1f}%) indicates advanced infection')
        else:
            reasons.append(f'Very high model confidence ({confidence*100:.1f}%) indicates critical condition')
        
        # Area-based reasoning
        if affected_percentage is not None:
            if indicators.get('area') == 1:
                reasons.append(f'Limited affected area ({affected_percentage:.1f}%) indicates localized damage')
            elif indicators.get('area') == 2:
                reasons.append(f'Moderate affected area ({affected_percentage:.1f}%) shows spreading infection')
            elif indicators.get('area') == 3:
                reasons.append(f'Large affected area ({affected_percentage:.1f}%) indicates extensive damage')
            else:
                reasons.append(f'Very large affected area ({affected_percentage:.1f}%) indicates critical damage')
        
        # Lesion-based reasoning
        if lesion_count is not None and lesion_count > 0:
            if indicators.get('lesions') == 1:
                reasons.append(f'Few lesions detected ({lesion_count}) suggest early infection')
            elif indicators.get('lesions') == 2:
                reasons.append(f'Multiple lesions ({lesion_count}) indicate active infection')
            elif indicators.get('lesions') == 3:
                reasons.append(f'Many lesions ({lesion_count}) show advanced progression')
            else:
                reasons.append(f'Extensive lesions ({lesion_count}) indicate critical condition')
        
        return ' | '.join(reasons) if reasons else 'Severity assessment based on model analysis'
    
    def estimate_affected_area(self, image):
        """
        Estimate affected area using color-based analysis
        
        Args:
            image: PIL Image or numpy array
            
        Returns:
            Dictionary with affected area percentage and analysis
        """
        try:
            # Convert to numpy array if PIL Image
            if isinstance(image, Image.Image):
                img_array = np.array(image)
            else:
                img_array = image
            
            # Ensure RGB format
            if len(img_array.shape) == 2:  # Grayscale
                img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
            elif img_array.shape[2] == 4:  # RGBA
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
            
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
            # Define healthy green range
            lower_green = np.array([35, 40, 40])
            upper_green = np.array([85, 255, 255])
            healthy_mask = cv2.inRange(hsv, lower_green, upper_green)
            
            total_pixels = img_array.shape[0] * img_array.shape[1]
            healthy_pixels = np.sum(healthy_mask > 0)
            affected_percentage = ((total_pixels - healthy_pixels) / total_pixels) * 100
            
            return {
                'affected_percentage': round(affected_percentage, 2),
                'healthy_percentage': round(100 - affected_percentage, 2),
                'total_pixels': total_pixels,
                'healthy_pixels': int(healthy_pixels),
                'affected_pixels': int(total_pixels - healthy_pixels)
            }
        except Exception as e:
            logger.error(f"Error estimating affected area: {e}")
            return {'affected_percentage': None, 'error': str(e)}

severity_engine = SeverityEngine()
