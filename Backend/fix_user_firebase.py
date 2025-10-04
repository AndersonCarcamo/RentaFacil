"""
Get current Firebase user info and update database
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from firebase_admin import auth as firebase_auth
from app.core.database import SessionLocal
from app.models.auth import User
from app.core.firebase import firebase_service  # This will initialize Firebase

def fix_user_firebase_uid():
    db = SessionLocal()
    try:
        email = "adcv159@gmail.com"
        
        print("=" * 60)
        print("Fixing Firebase UID for User")
        print("=" * 60)
        
        # Get user from Firebase
        print(f"\n1. Getting user from Firebase: {email}")
        firebase_user = firebase_auth.get_user_by_email(email)
        print(f"   ✅ Firebase User:")
        print(f"   - UID: {firebase_user.uid}")
        print(f"   - Email: {firebase_user.email}")
        print(f"   - Email Verified: {firebase_user.email_verified}")
        
        # Get user from database
        print(f"\n2. Getting user from database: {email}")
        db_user = db.query(User).filter(User.email == email.lower()).first()
        
        if not db_user:
            print(f"   ❌ User not found in database!")
            return
        
        print(f"   ✅ Database User:")
        print(f"   - ID: {db_user.id}")
        print(f"   - Email: {db_user.email}")
        print(f"   - Current Firebase UID: {db_user.firebase_uid}")
        
        # Check if UIDs match
        if db_user.firebase_uid == firebase_user.uid:
            print(f"\n3. ✅ Firebase UIDs already match! No update needed.")
        else:
            print(f"\n3. ⚠️  Firebase UIDs DO NOT match!")
            print(f"   - Database UID: {db_user.firebase_uid}")
            print(f"   - Firebase UID: {firebase_user.uid}")
            print(f"\n4. Updating database...")
            
            db_user.firebase_uid = firebase_user.uid
            db.commit()
            db.refresh(db_user)
            
            print(f"   ✅ Updated! New Firebase UID: {db_user.firebase_uid}")
        
        print("\n" + "=" * 60)
        print("Done!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(traceback.format_exc())
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_user_firebase_uid()
