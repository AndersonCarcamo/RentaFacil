"""
Script to test Firebase initialization
"""
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.firebase import firebase_service
from app.core.config import settings

def test_firebase_init():
    print("=" * 60)
    print("Testing Firebase Initialization")
    print("=" * 60)
    
    print(f"\n1. Configuration:")
    print(f"   - FIREBASE_PROJECT_ID: {settings.firebase_project_id}")
    print(f"   - FIREBASE_SERVICE_ACCOUNT_PATH: {settings.firebase_service_account_path}")
    print(f"   - Path exists: {os.path.exists(settings.firebase_service_account_path) if settings.firebase_service_account_path else 'N/A'}")
    
    print(f"\n2. Firebase Service:")
    print(f"   - Instance created: {firebase_service is not None}")
    print(f"   - Mock mode: {getattr(firebase_service, '_mock_mode', 'Unknown')}")
    
    print(f"\n3. Testing token verification (with mock token):")
    import asyncio
    
    async def test_verify():
        # Test with mock token
        result = await firebase_service.verify_token("mock_token_test123")
        print(f"   - Mock token result: {result}")
        
    asyncio.run(test_verify())
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)

if __name__ == "__main__":
    test_firebase_init()
