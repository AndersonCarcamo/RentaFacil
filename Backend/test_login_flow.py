"""
Test login with a freshly generated custom token
"""
import sys
import os
import asyncio
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from firebase_admin import auth as firebase_auth
from app.core.firebase import firebase_service

async def test_login_flow():
    print("=" * 60)
    print("Testing Complete Login Flow")
    print("=" * 60)
    
    email = "adcv159@gmail.com"
    
    # Step 1: Get Firebase user
    print(f"\n1. Getting Firebase user: {email}")
    firebase_user = firebase_auth.get_user_by_email(email)
    print(f"   ✅ UID: {firebase_user.uid}")
    
    # Step 2: Create custom token (for testing)
    print(f"\n2. Creating custom token for testing...")
    custom_token = firebase_auth.create_custom_token(firebase_user.uid)
    print(f"   ✅ Custom token created")
    print(f"   Token (first 80 chars): {custom_token[:80].decode()}...")
    
    # Step 3: Verify the custom token with our service
    print(f"\n3. Verifying custom token with firebase_service...")
    result = await firebase_service.verify_token(custom_token.decode())
    
    if result:
        print(f"   ✅ Token verified successfully!")
        print(f"   - UID: {result.get('uid')}")
        print(f"   - Email: {result.get('email')}")
    else:
        print(f"   ❌ Token verification FAILED")
        print(f"   Note: Custom tokens need to be exchanged for ID tokens first")
    
    # Step 4: Try to make actual login request to backend
    print(f"\n4. Testing actual login endpoint...")
    print(f"   NOTE: Custom tokens cannot be used directly with verify_id_token")
    print(f"   They need to be exchanged for ID tokens via Firebase Auth API")
    print(f"   This is what the frontend does automatically.")
    
    # Step 5: Test if we can verify a real token structure
    print(f"\n5. Testing token verification with mock structure...")
    print(f"   The issue is likely that:")
    print(f"   a) The token from frontend is expired")
    print(f"   b) The token is from a different Firebase project")
    print(f"   c) The token format is incorrect")
    
    print(f"\n6. Firebase configuration:")
    print(f"   - Project ID: renta-facil-d04c7")
    print(f"   - Service Account Email: firebase-adminsdk-fbsvc@renta-facil-d04c7.iam.gserviceaccount.com")
    
    print("\n" + "=" * 60)
    print("Next steps:")
    print("1. Make sure frontend .env.local has: NEXT_PUBLIC_FIREBASE_PROJECT_ID=renta-facil-d04c7")
    print("2. Restart frontend server to load new env vars")
    print("3. Try login again and check browser console for token")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_login_flow())
