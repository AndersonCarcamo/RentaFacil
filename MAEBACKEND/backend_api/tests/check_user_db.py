"""
Check if user exists in database
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.auth import User

def check_user():
    db = SessionLocal()
    try:
        email = "adcv159@gmail.com"
        firebase_uid = "PLGlyyVIIvSHUmiUdRdDt7tsz0w1"
        
        print("=" * 60)
        print("Checking Database for User")
        print("=" * 60)
        
        print(f"\n1. Looking for user by email: {email}")
        user_by_email = db.query(User).filter(User.email == email.lower()).first()
        
        if user_by_email:
            print(f"   ✅ Found user by email!")
            print(f"   - ID: {user_by_email.id}")
            print(f"   - Email: {user_by_email.email}")
            print(f"   - Firebase UID: {user_by_email.firebase_uid}")
            print(f"   - Role: {user_by_email.role}")
            print(f"   - Active: {user_by_email.is_active}")
        else:
            print(f"   ❌ No user found with email: {email}")
        
        print(f"\n2. Looking for user by Firebase UID: {firebase_uid}")
        user_by_uid = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        
        if user_by_uid:
            print(f"   ✅ Found user by Firebase UID!")
            print(f"   - ID: {user_by_uid.id}")
            print(f"   - Email: {user_by_uid.email}")
            print(f"   - Firebase UID: {user_by_uid.firebase_uid}")
        else:
            print(f"   ❌ No user found with Firebase UID: {firebase_uid}")
        
        print(f"\n3. Total users in database:")
        total_users = db.query(User).count()
        print(f"   - Total: {total_users}")
        
        if total_users > 0:
            print(f"\n4. Sample users:")
            sample_users = db.query(User).limit(5).all()
            for u in sample_users:
                print(f"   - {u.email} (Firebase UID: {u.firebase_uid or 'None'})")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(traceback.format_exc())
    finally:
        db.close()

if __name__ == "__main__":
    check_user()
