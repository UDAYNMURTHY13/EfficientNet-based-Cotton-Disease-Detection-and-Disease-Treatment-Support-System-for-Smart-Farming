#!/usr/bin/env python
"""Debug token encoding/decoding"""

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import get_settings
from app.core.security import create_access_token, decode_token, TokenData
from datetime import datetime, timedelta

# Get settings
settings = get_settings()
print(f"Settings SECRET_KEY: {settings.SECRET_KEY[:30]}...")
print(f"Settings ALGORITHM: {settings.ALGORITHM}")
print()

# Test token creation and decoding
token_payload = {
    "sub": "test-user-id-123",
    "email": "test@example.com",
    "role": "farmer"
}

print(f"Creating token with payload: {token_payload}")
token = create_access_token(token_payload)
print(f"Token created: {token[:50]}...")
print()

print(f"Decoding token...")
decoded = decode_token(token)
if decoded:
    print(f"✅ Token decoded successfully!")
    print(f"   user_id: {decoded.user_id}")
    print(f"   email: {decoded.email}")
    print(f"   role: {decoded.role}")
else:
    print(f"❌ Failed to decode token!")
