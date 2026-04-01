"""
XAI Visualization Utilities
Create visual overlays, heatmaps, and explanation graphics
"""

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import base64
from io import BytesIO
import json
from typing import Tuple, List, Dict, Optional


class HeatmapVisualizer:
    """
    Converts Grad-CAM heatmaps to visual overlays
    """
    
    @staticmethod
    def apply_heatmap_overlay(original_image: np.ndarray, heatmap: np.ndarray,
                             alpha: float = 0.4, colormap: str = 'jet') -> np.ndarray:
        """
        Apply heatmap overlay on original image
        
        Args:
            original_image: Original image (380, 380, 3) or (1, 380, 380, 3)
            heatmap: Grad-CAM heatmap (380, 380)
            alpha: Transparency of heatmap overlay (0-1)
            colormap: OpenCV colormap name
            
        Returns:
            Overlaid image as numpy array
        """
        # Handle batched input
        if len(original_image.shape) == 4:
            image = original_image[0]
        else:
            image = original_image.copy()
        
        # Normalize image to 0-255 if needed
        if image.max() <= 1.0:
            image = (image * 255).astype(np.uint8)
        else:
            image = image.astype(np.uint8)
        
        # Ensure heatmap is in 0-255 range
        heatmap_viz = (heatmap * 255).astype(np.uint8)
        
        # Apply colormap
        colormap_int = getattr(cv2, f'COLORMAP_{colormap.upper()}', cv2.COLORMAP_JET)
        heatmap_colored = cv2.applyColorMap(heatmap_viz, colormap_int)
        
        # Convert original image to BGR for blending with OpenCV
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        else:
            image_bgr = image
        
        # Blend images
        overlaid = cv2.addWeighted(image_bgr, 1 - alpha, heatmap_colored, alpha, 0)
        
        # Convert back to RGB
        overlaid_rgb = cv2.cvtColor(overlaid, cv2.COLOR_BGR2RGB)
        
        return overlaid_rgb
    
    @staticmethod
    def create_heatmap_image(heatmap: np.ndarray, colormap: str = 'jet') -> Image.Image:
        """
        Create PIL Image from heatmap
        
        Args:
            heatmap: Grad-CAM heatmap (380, 380)
            colormap: OpenCV colormap name
            
        Returns:
            PIL Image
        """
        heatmap_viz = (heatmap * 255).astype(np.uint8)
        colormap_int = getattr(cv2, f'COLORMAP_{colormap.upper()}', cv2.COLORMAP_JET)
        heatmap_colored = cv2.applyColorMap(heatmap_viz, colormap_int)
        heatmap_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        
        return Image.fromarray(heatmap_rgb)
    
    @staticmethod
    def image_to_base64(image: np.ndarray) -> str:
        """
        Convert numpy image to base64 string for JSON transmission
        
        Args:
            image: Image as numpy array
            
        Returns:
            Base64 encoded string
        """
        if len(image.shape) == 3 and image.shape[2] == 3:
            pil_image = Image.fromarray(image.astype(np.uint8))
        else:
            pil_image = Image.fromarray(((image * 255).astype(np.uint8)))
        
        buffer = BytesIO()
        pil_image.save(buffer, format='PNG')
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode('utf-8')


class LesionVisualizer:
    """
    Visualizes detected lesions with bounding boxes and masks
    """
    
    @staticmethod
    def draw_lesion_boxes(image: np.ndarray, lesions: List[Dict]) -> np.ndarray:
        """
        Draw bounding boxes around detected lesions
        
        Args:
            image: Original image (380, 380, 3)
            lesions: List of lesion dictionaries with 'position' and 'size'
            
        Returns:
            Image with drawn boxes
        """
        output = image.copy() if len(image.shape) == 3 else image[0].copy()
        
        # Normalize to 0-255 if needed
        if output.max() <= 1.0:
            output = (output * 255).astype(np.uint8)
        else:
            output = output.astype(np.uint8)
        
        # Convert to BGR for OpenCV
        output_bgr = cv2.cvtColor(output, cv2.COLOR_RGB2BGR)
        
        for lesion in lesions:
            pos = lesion['position']
            size = lesion['size']
            
            x1 = max(0, pos[0] - size[0] // 2)
            y1 = max(0, pos[1] - size[1] // 2)
            x2 = min(380, pos[0] + size[0] // 2)
            y2 = min(380, pos[1] + size[1] // 2)
            
            # Draw red rectangle
            cv2.rectangle(output_bgr, (x1, y1), (x2, y2), (0, 0, 255), 2)
            
            # Add lesion size label
            label = f"{lesion['area_percentage']:.1f}%"
            cv2.putText(output_bgr, label, (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
        
        output_rgb = cv2.cvtColor(output_bgr, cv2.COLOR_BGR2RGB)
        return output_rgb
    
    @staticmethod
    def create_lesion_mask_visualization(lesion_mask: np.ndarray) -> Image.Image:
        """
        Create PIL Image from lesion mask
        
        Args:
            lesion_mask: Binary mask of lesions
            
        Returns:
            PIL Image
        """
        mask_viz = (lesion_mask * 255).astype(np.uint8)
        mask_colored = cv2.applyColorMap(mask_viz, cv2.COLORMAP_HOT)
        mask_rgb = cv2.cvtColor(mask_colored, cv2.COLOR_BGR2RGB)
        
        return Image.fromarray(mask_rgb)


class ExplanationVisualizer:
    """
    Creates visual explanations and infographics
    """
    
    @staticmethod
    def create_explanation_card(explanation: Dict, image_width: int = 600) -> Image.Image:
        """
        Create an information card with explanation text
        
        Args:
            explanation: Explanation dictionary from ExplanationGenerator
            image_width: Width of the output image
            
        Returns:
            PIL Image with explanation card
        """
        disease = explanation['disease']
        confidence = explanation['confidence_percentage']
        urgency = explanation['severity_assessment']['urgency']
        summary = explanation['explanation_summary']
        
        # Create image
        card = Image.new('RGB', (image_width, 400), color='white')
        draw = ImageDraw.Draw(card)
        
        # Simple font (uses default if custom font unavailable)
        try:
            title_font = ImageFont.truetype("arial.ttf", 24)
            text_font = ImageFont.truetype("arial.ttf", 14)
            small_font = ImageFont.truetype("arial.ttf", 12)
        except:
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Colors
        red = (220, 20, 60)
        green = (34, 139, 34)
        orange = (255, 140, 0)
        dark_gray = (50, 50, 50)
        light_gray = (200, 200, 200)
        
        y_pos = 20
        
        # Disease name
        draw.text((20, y_pos), f"Disease: {disease}", fill=dark_gray, font=title_font)
        y_pos += 40
        
        # Confidence
        conf_color = green if confidence >= 85 else orange if confidence >= 70 else red
        draw.text((20, y_pos), f"Confidence: {confidence:.1f}%", fill=conf_color, font=text_font)
        y_pos += 30
        
        # Urgency
        draw.text((20, y_pos), f"Urgency: {urgency}", fill=dark_gray, font=text_font)
        y_pos += 35
        
        # Summary
        draw.text((20, y_pos), "Summary:", fill=dark_gray, font=text_font)
        y_pos += 25
        
        # Wrap summary text
        summary_lines = ExplanationVisualizer._wrap_text(summary, max_chars=70)
        for line in summary_lines[:3]:  # Max 3 lines
            draw.text((30, y_pos), line, fill=dark_gray, font=small_font)
            y_pos += 20
        
        return card
    
    @staticmethod
    def _wrap_text(text: str, max_chars: int = 70) -> List[str]:
        """Wrap text to multiple lines"""
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            if len(' '.join(current_line + [word])) <= max_chars:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines
    
    @staticmethod
    def create_confidence_bar(disease: str, confidence: float, 
                            all_predictions: Dict, width: int = 400) -> Image.Image:
        """
        Create confidence level visualization bar
        
        Args:
            disease: Predicted disease
            confidence: Confidence score
            all_predictions: Dictionary of all class predictions
            width: Width of output image
            
        Returns:
            PIL Image with confidence bars
        """
        # Create image
        height = 50 + len(all_predictions) * 40
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("arial.ttf", 12)
        except:
            font = ImageFont.load_default()
        
        y_pos = 20
        
        # Sort predictions by confidence
        sorted_preds = sorted(all_predictions.items(), key=lambda x: x[1], reverse=True)
        
        for disease_name, conf in sorted_preds:
            # Disease label
            draw.text((10, y_pos), disease_name, fill=(50, 50, 50), font=font)
            
            # Confidence bar
            bar_width = int((width - 150) * conf)
            bar_color = (34, 139, 34) if conf >= 0.85 else (255, 140, 0) if conf >= 0.70 else (220, 20, 60)
            
            draw.rectangle([(150, y_pos), (150 + bar_width, y_pos + 20)],
                          fill=bar_color)
            draw.rectangle([(150, y_pos), (150 + (width - 150), y_pos + 20)],
                          outline=(100, 100, 100))
            
            # Percentage
            draw.text((width - 50, y_pos), f"{conf*100:.1f}%", fill=(50, 50, 50), font=font)
            
            y_pos += 35
        
        return img
    
    @staticmethod
    def create_severity_indicator(affected_area: float, lesion_count: int,
                                 confidence: float) -> Image.Image:
        """
        Create visual severity indicator
        
        Args:
            affected_area: Percentage of affected area
            lesion_count: Number of lesions
            confidence: Model confidence
            
        Returns:
            PIL Image with severity visualization
        """
        img = Image.new('RGB', (300, 150), color='white')
        draw = ImageDraw.Draw(img)
        
        try:
            title_font = ImageFont.truetype("arial.ttf", 14)
            text_font = ImageFont.truetype("arial.ttf", 11)
        except:
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
        
        draw.text((20, 10), "Severity Analysis", fill=(50, 50, 50), font=title_font)
        
        y = 40
        draw.text((20, y), f"Affected Area: {affected_area:.1f}%", fill=(50, 50, 50), font=text_font)
        y += 25
        draw.text((20, y), f"Lesions Detected: {lesion_count}", fill=(50, 50, 50), font=text_font)
        y += 25
        draw.text((20, y), f"Model Confidence: {confidence*100:.1f}%", fill=(50, 50, 50), font=text_font)
        
        return img


class ComprehensiveVisualization:
    """
    Combines multiple visualizations into a comprehensive report
    """
    
    @staticmethod
    def create_xai_report(original_image: np.ndarray, processed_image: np.ndarray,
                         heatmap: np.ndarray, explanation: Dict, 
                         lesion_analysis: Dict) -> Dict:
        """
        Create complete XAI visualization report
        
        Args:
            original_image: Original PIL Image or numpy array
            processed_image: Preprocessed image
            heatmap: Grad-CAM heatmap
            explanation: Explanation dictionary
            lesion_analysis: Lesion analysis results
            
        Returns:
            Dictionary with all visualizations as base64
        """
        visualizations = {}
        
        # 1. Heatmap overlay
        overlaid = HeatmapVisualizer.apply_heatmap_overlay(processed_image, heatmap)
        visualizations['heatmap_overlay'] = HeatmapVisualizer.image_to_base64(overlaid)
        
        # 2. Lesion boxes (if lesions detected)
        if lesion_analysis['lesion_count'] > 0:
            lesion_viz = LesionVisualizer.draw_lesion_boxes(
                processed_image,
                lesion_analysis['lesion_details']
            )
            visualizations['lesion_visualization'] = HeatmapVisualizer.image_to_base64(lesion_viz)
        
        # 3. Explanation card
        exp_card = ExplanationVisualizer.create_explanation_card(explanation)
        visualizations['explanation_card'] = HeatmapVisualizer.image_to_base64(np.array(exp_card))
        
        # 4. Confidence bars
        conf_chart = ExplanationVisualizer.create_confidence_bar(
            explanation['disease'],
            explanation['confidence_percentage'] / 100,
            {k: v for k, v in explanation.get('all_predictions', {}).items()}
            if 'all_predictions' in explanation else
            {explanation['disease']: explanation['confidence_percentage'] / 100}
        )
        visualizations['confidence_chart'] = HeatmapVisualizer.image_to_base64(np.array(conf_chart))
        
        # 5. Severity indicator
        sev_indicator = ExplanationVisualizer.create_severity_indicator(
            lesion_analysis['total_affected_percentage'],
            lesion_analysis['lesion_count'],
            explanation['confidence_percentage'] / 100
        )
        visualizations['severity_indicator'] = HeatmapVisualizer.image_to_base64(np.array(sev_indicator))
        
        return visualizations
