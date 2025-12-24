#!/usr/bin/env python
"""Quick test to verify XAI prediction works"""

import requests
import numpy as np
from PIL import Image
import io

# Create a simple test image (random noise as placeholder)
test_image = Image.new('RGB', (380, 380), color=(73, 109, 137))

# Convert to bytes
img_bytes = io.BytesIO()
test_image.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Test the endpoint
url = "http://localhost:8000/predict/xai"
files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}

print("Testing /predict/xai endpoint...")
print(f"URL: {url}")
print(f"Sending test image...")

try:
    response = requests.post(url, files=files, timeout=30)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ SUCCESS!")
        print(f"Disease: {data.get('disease', 'Unknown')}")
        print(f"Confidence: {data.get('confidence_percentage', 'N/A')}%")
        print(f"Severity: {data.get('severity', 'Unknown')}")
        print(f"XAI Analysis available: {'xai_analysis' in data}")
        print(f"\nFull response keys: {list(data.keys())}")
    else:
        print(f"\n❌ Error Response:")
        print(response.text)
        
except Exception as e:
    print(f"\n❌ Error: {e}")
