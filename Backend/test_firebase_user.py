"""
Script to test Firebase token verification with a real test user
"""
import sys
import os
import asyncio

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.firebase import firebase_service, verify_firebase_token
from app.core.config import settings

async def test_real_token():
    print("=" * 60)
    print("Testing Firebase Token Verification")
    print("=" * 60)
    
    print(f"\n1. Configuration:")
    print(f"   - FIREBASE_PROJECT_ID: {settings.firebase_project_id}")
    print(f"   - Service Account Path: {settings.firebase_service_account_path}")
    print(f"   - Mock mode: {getattr(firebase_service, '_mock_mode', 'Unknown')}")
    
    print(f"\n2. Please provide a REAL Firebase ID token from the frontend:")
    print(f"   (You can get this by adding console.log in useAuth.tsx line 87)")
    print(f"   (Or open browser console and check the 'Got Firebase ID token' log)")
    
    # For testing purposes, let's try to authenticate with Firebase directly
    print(f"\n3. Alternatively, let's check if we can get a user by email:")
    test_email = "adcv159@gmail.com"
    
    try:
        # Try to get user by email from Firebase
        from firebase_admin import auth as firebase_auth
        
        print(f"   - Looking up user by email: {test_email}")
        firebase_user = firebase_auth.get_user_by_email(test_email)
        print(f"   ✅ User found in Firebase!")
        print(f"   - UID: {firebase_user.uid}")
        print(f"   - Email: {firebase_user.email}")
        print(f"   - Email verified: {firebase_user.email_verified}")
        
        # Try to create a custom token
        print(f"\n4. Creating custom token for testing:")
        custom_token = firebase_auth.create_custom_token(firebase_user.uid)
        print(f"   ✅ Custom token created (first 50 chars): {custom_token[:50].decode()}...")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print(f"   - Type: {type(e).__name__}")
        import traceback
        print(f"   - Full trace:\n{traceback.format_exc()}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_real_token())
