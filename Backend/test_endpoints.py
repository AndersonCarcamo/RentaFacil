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
    
    print("=" * 60)
    print("🎯 Authentication Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
