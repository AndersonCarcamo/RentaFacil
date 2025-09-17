#!/usr/bin/env python3
"""
Script para probar los endpoints de autenticación de la API EasyRent
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Probar endpoint de salud"""
    print("=== Testing Health Endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()

def test_register():
    """Probar endpoint de registro"""
    print("=== Testing Registration Endpoint ===")
    register_data = {
        "email": "testuser2@ejemplo.com",
        "first_name": "Ana",
        "last_name": "García",
        "phone": "+51912345678",
        "role": "user",
        "national_id": "12345678",
        "national_id_type": "DNI"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/auth/register",
            json=register_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print()
        return response.json() if response.status_code == 201 else None
    except Exception as e:
        print(f"Error: {e}")
        print()
        return None

def test_firebase_login():
    """Probar login con token mock de Firebase"""
    print("=== Testing Firebase Login (Mock Token) ===")
    login_data = {
        "firebase_token": "mock_token_testuser456"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print()
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error: {e}")
        print()
        return None

def test_auth_me(access_token):
    """Probar endpoint /auth/me para información básica del usuario"""
    print("=== Testing /auth/me Endpoint ===")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"Using token: {access_token[:50]}...")
        response = requests.get(f"{BASE_URL}/v1/auth/me", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print()
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error: {e}")
        print()
        return None

def test_refresh_token(refresh_token):
    """Probar endpoint de refresh token"""
    print("=== Testing Refresh Token Endpoint ===")
    refresh_data = {
        "refresh_token": refresh_token
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/auth/refresh",
            json=refresh_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print()
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error: {e}")
        print()
        return None

def test_logout(refresh_token):
    """Probar endpoint de logout"""
    print("=== Testing Logout Endpoint ===")
    logout_data = {
        "refresh_token": refresh_token
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/auth/logout",
            json=logout_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print()
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        print()
        return False

def test_create_listing(access_token):
    """Crear un listing de prueba para tests de Airbnb"""
    print("=== Creating Test Listing for Airbnb Tests ===")
    listing_data = {
        "title": "Hermoso Apartamento Moderno",
        "description": "Apartamento completamente amueblado en zona céntrica, perfecto para Airbnb",
        "operation": "rent",
        "property_type": "apartment",
        "price": 800.00,
        "currency": "PEN",
        "area_built": 85.5,
        "bedrooms": 2,
        "bathrooms": 2,
        "furnished": True,
        "rental_mode": "full_property",
        "pet_friendly": True,
        "airbnb_opted_out": False,  # Explicitly test this field
        "address": "Av. Ejemplo 123, Miraflores",
        "department": "Lima",
        "province": "Lima",
        "district": "Miraflores"
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/listings/",
            json=listing_data,
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            listing = response.json()
            print(f"✅ Created listing ID: {listing['id']}")
            print(f"📊 Airbnb eligible: {listing.get('airbnb_eligible', 'N/A')}")
            print(f"❌ Airbnb opted out: {listing.get('airbnb_opted_out', 'N/A')}")
            print(f"🏠 Is Airbnb available: {listing.get('is_airbnb_available', 'N/A')}")
            print(f"🏆 Airbnb score: {listing.get('airbnb_score', 'N/A')}")
            print()
            return listing['id']
        else:
            print(f"❌ Error response: {response.text}")
            print()
            return None
    except Exception as e:
        print(f"Error: {e}")
        print()
        return None

def test_validate_airbnb(listing_id, access_token):
    """Test Airbnb validation endpoint"""
    print("=== Testing Airbnb Validation ===")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/listings/{listing_id}/validate-airbnb",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            validation = response.json()
            print(f"🏆 Can be Airbnb: {validation.get('can_be_airbnb', 'N/A')}")
            print(f"📊 Airbnb score: {validation.get('airbnb_score', 'N/A')}")
            print(f"🏠 Current style: {validation.get('current_style', 'N/A')}")
            print(f"💡 Suggestions: {validation.get('suggestions', [])}")
            if validation.get('missing_requirements'):
                print(f"❌ Missing requirements: {validation.get('missing_requirements', [])}")
            print()
            return validation
        else:
            print(f"❌ Error response: {response.text}")
            print()
            return None
    except Exception as e:
        print(f"Error: {e}")
        print()
        return None

def test_opt_out_airbnb(listing_id, access_token):
    """Test Airbnb opt-out endpoint"""
    print("=== Testing Airbnb Opt-Out ===")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/listings/{listing_id}/opt-out-airbnb",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            listing = response.json()
            print(f"✅ Successfully opted out of Airbnb")
            print(f"Airbnb opted out: {listing.get('airbnb_opted_out', 'N/A')}")
            print(f"Is Airbnb available: {listing.get('is_airbnb_available', 'N/A')}")
            print()
            return listing
        else:
            print(f"❌ Error response: {response.text}")
            print()
            return None
    except Exception as e:
        print(f"Error: {e}")
        print()
        return None

def test_opt_in_airbnb(listing_id, access_token):
    """Test Airbnb opt-in endpoint"""
    print("=== Testing Airbnb Opt-In ===")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/listings/{listing_id}/opt-in-airbnb",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            listing = response.json()
            print(f"✅ Successfully opted back into Airbnb")
            print(f"Airbnb opted out: {listing.get('airbnb_opted_out', 'N/A')}")
            print(f"Airbnb eligible: {listing.get('airbnb_eligible', 'N/A')}")
            print(f"Is Airbnb available: {listing.get('is_airbnb_available', 'N/A')}")
            print()
            return listing
        else:
            print(f"❌ Error response: {response.text}")
            print()
            return None
    except Exception as e:
        print(f"Error: {e}")
        print()
        return None

def test_search_airbnb_filters():
    """Test search with Airbnb filters"""
    print("=== Testing Search with Airbnb Filters ===")
    
    # Test 1: Search for Airbnb eligible properties
    print("🔍 Searching for Airbnb eligible properties...")
    try:
        response = requests.get(f"{BASE_URL}/v1/search/?airbnb_eligible=true&limit=5")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            results = response.json()
            print(f"Found {len(results.get('items', []))} Airbnb eligible properties")
            for item in results.get('items', [])[:2]:  # Show first 2
                print(f"  - {item.get('title', 'N/A')} | Available: {item.get('is_airbnb_available', 'N/A')}")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()
    
    # Test 2: Search for properties with min Airbnb score
    print("🔍 Searching for high-score Airbnb properties...")
    try:
        response = requests.get(f"{BASE_URL}/v1/search/?min_airbnb_score=70&limit=5")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            results = response.json()
            print(f"Found {len(results.get('items', []))} high-score Airbnb properties")
            for item in results.get('items', [])[:2]:  # Show first 2
                print(f"  - {item.get('title', 'N/A')} | Score: {item.get('airbnb_score', 'N/A')}")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()

def test_airbnb_flow(access_token):
    """Test complete Airbnb opt-out/opt-in flow"""
    print("🏠 === AIRBNB OPT-OUT/OPT-IN FLOW TESTING ===")
    print("-" * 50)
    
    # 1. Create a test listing
    listing_id = test_create_listing(access_token)
    if not listing_id:
        print("❌ Failed to create test listing. Aborting Airbnb tests.")
        return
    
    # 2. Validate Airbnb eligibility
    validation = test_validate_airbnb(listing_id, access_token)
    
    # 3. Test opt-out functionality
    opted_out = test_opt_out_airbnb(listing_id, access_token)
    
    # 4. Test opt-in functionality
    opted_in = test_opt_in_airbnb(listing_id, access_token)
    
    # 5. Test search filters
    test_search_airbnb_filters()
    
    print("🎯 Airbnb Flow Testing Complete!")
    print("-" * 50)
    
    return listing_id

def test_invalid_token():
    """Probar con token inválido"""
    print("=== Testing Invalid Token ===")
    headers = {
        "Authorization": "Bearer invalid_token_12345",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/v1/auth/me", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()

def main():
    print("🔥 EasyRent API Authentication Testing Script 🔥")
    print("=" * 60)
    
    # 1. Test health endpoint
    test_health()
    
    # 2. Test user registration
    print("🔐 AUTHENTICATION FLOW TESTING")
    print("-" * 40)
    user_data = test_register()
    
    # 3. Test Firebase login with mock token
    login_data = test_firebase_login()
    
    if login_data and 'access_token' in login_data:
        access_token = login_data['access_token']
        refresh_token = login_data['refresh_token']
        
        # 4. Test /auth/me endpoint
        test_auth_me(access_token)
        
        # 5. Test refresh token
        new_tokens = test_refresh_token(refresh_token)
        
        # 6. Test logout
        test_logout(refresh_token)
        
        # 7. Test invalid token
        test_invalid_token()
        
        # 8. Test Airbnb functionality
        print("\n🏠 AIRBNB FUNCTIONALITY TESTING")
        print("-" * 40)
        test_listing_id = test_airbnb_flow(access_token)
    
    print("=" * 60)
    print("🎯 All Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
