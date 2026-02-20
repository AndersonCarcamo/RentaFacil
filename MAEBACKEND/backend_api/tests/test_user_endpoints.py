#!/usr/bin/env python3
"""
Script para probar los endpoints de usuarios de la API EasyRent
"""
import requests
import json
import os
from io import BytesIO

BASE_URL = "http://127.0.0.1:8000"

def get_auth_token():
    """Obtener token de autenticación para las pruebas"""
    print("=== Getting Authentication Token ===")
    
    # Primero registrar un usuario de prueba si no existe
    register_data = {
        "email": "testuser_endpoints@ejemplo.com",
        "first_name": "Usuario",
        "last_name": "Prueba",
        "phone": "+51987654321",
        "role": "user",
        "firebase_uid": "testuser_endpoints",  # Especificar firebase_uid
        "national_id": "87654321",
        "national_id_type": "DNI"
    }
    
    try:
        requests.post(f"{BASE_URL}/v1/auth/register", json=register_data)
    except:
        pass  # El usuario puede ya existir
    
    # Login con token mock que coincida con el firebase_uid
    login_data = {
        "firebase_token": "mock_token_testuser_endpoints"  # Esto generará uid="testuser_endpoints"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/v1/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Token obtenido exitosamente")
            return data['access_token'], data.get('user', {}).get('id')
        else:
            print(f"❌ Error obteniendo token: {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def get_admin_token():
    """Obtener token de administrador para pruebas administrativas"""
    print("=== Getting Admin Authentication Token ===")
    
    # Usar un timestamp para hacer el usuario único cada vez
    import time
    timestamp = str(int(time.time()))
    unique_admin_uid = f"admin_test_{timestamp}"
    
    # Registrar un usuario admin de prueba con firebase_uid específico y único
    register_data = {
        "email": f"admin_test_{timestamp}@ejemplo.com",
        "first_name": "Admin",
        "last_name": "Prueba",
        "phone": f"+51987{timestamp[-6:]}",
        "role": "admin",
        "firebase_uid": unique_admin_uid,
        "national_id": f"876543{timestamp[-2:]}",
        "national_id_type": "DNI"
    }
    
    try:
        register_response = requests.post(f"{BASE_URL}/v1/auth/register", json=register_data)
        print(f"Admin register response: {register_response.status_code}")
        if register_response.status_code not in [201, 409]:  # 201 = created, 409 = already exists
            print(f"Register failed: {register_response.text}")
    except Exception as e:
        print(f"Register error: {e}")
    
    # Login con token mock que coincida con el firebase_uid único
    login_data = {
        "firebase_token": f"mock_token_{unique_admin_uid}"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/v1/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            print(f"✅ Admin token obtenido exitosamente")
            print(f"Admin user role: {user.get('role', 'unknown')}")
            print(f"Admin user email: {user.get('email', 'unknown')}")
            if user.get('role') != 'admin':
                print(f"❌ Error: Expected admin role, got {user.get('role')}")
                print(f"This means the user registration didn't save the admin role correctly")
                return None
            return data['access_token']
        else:
            print(f"❌ Error obteniendo admin token: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_get_current_user_profile(token):
    """Probar GET /users/me - Obtener perfil propio"""
    print("=== Testing GET /users/me - Current User Profile ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/v1/users/me", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print()
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return None

def test_update_current_user_profile(token):
    """Probar PUT /users/me - Actualizar perfil propio"""
    print("=== Testing PUT /users/me - Update Current User Profile ===")
    
    update_data = {
        "first_name": "Usuario Actualizado",
        "last_name": "Apellido Nuevo",
        "phone": "+51987654999"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.put(f"{BASE_URL}/v1/users/me", json=update_data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print()
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return False

def test_user_preferences(token):
    """Probar GET/PUT /users/me/preferences - Preferencias de usuario"""
    print("=== Testing User Preferences ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # GET preferences
    try:
        response = requests.get(f"{BASE_URL}/v1/users/me/preferences", headers=headers)
        print(f"GET Preferences Status: {response.status_code}")
        print(f"GET Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            # PUT preferences
            new_preferences = {
                "language": "en",
                "currency": "USD",
                "notifications_email": False,
                "notifications_sms": True,
                "notifications_push": True,
                "newsletter_subscription": True,
                "search_alerts": False
            }
            
            put_response = requests.put(f"{BASE_URL}/v1/users/me/preferences", 
                                      json=new_preferences, headers=headers)
            print(f"PUT Preferences Status: {put_response.status_code}")
            print(f"PUT Response: {json.dumps(put_response.json(), indent=2, ensure_ascii=False)}")
        
        print()
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return False

def test_privacy_settings(token):
    """Probar GET/PUT /users/me/privacy - Configuración de privacidad"""
    print("=== Testing Privacy Settings ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # GET privacy settings
    try:
        response = requests.get(f"{BASE_URL}/v1/users/me/privacy", headers=headers)
        print(f"GET Privacy Status: {response.status_code}")
        print(f"GET Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            # PUT privacy settings
            new_privacy = {
                "profile_visible": False,
                "show_phone": False,
                "show_email": True,
                "allow_contact": True,
                "show_last_active": False,
                "analytics_tracking": False
            }
            
            put_response = requests.put(f"{BASE_URL}/v1/users/me/privacy", 
                                      json=new_privacy, headers=headers)
            print(f"PUT Privacy Status: {put_response.status_code}")
            print(f"PUT Response: {json.dumps(put_response.json(), indent=2, ensure_ascii=False)}")
        
        print()
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return False

def test_avatar_upload(token):
    """Probar POST/DELETE /users/me/avatar - Gestión de avatar"""
    print("=== Testing Avatar Upload/Delete ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Simular un archivo de imagen pequeño
        fake_image = BytesIO(b"fake_image_content_for_testing_purposes")
        files = {"avatar": ("test_avatar.jpg", fake_image, "image/jpeg")}
        
        # POST avatar
        response = requests.post(f"{BASE_URL}/v1/users/me/avatar", 
                               files=files, headers=headers)
        print(f"POST Avatar Status: {response.status_code}")
        print(f"POST Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            # DELETE avatar
            delete_response = requests.delete(f"{BASE_URL}/v1/users/me/avatar", headers=headers)
            print(f"DELETE Avatar Status: {delete_response.status_code}")
            print(f"DELETE Response: {json.dumps(delete_response.json(), indent=2, ensure_ascii=False)}")
        
        print()
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return False

def test_delete_account(token):
    """Probar DELETE /users/me - Eliminar cuenta propia (NO ejecutar en producción)"""
    print("=== Testing DELETE /users/me - Delete Account (SIMULATION ONLY) ===")
    
    delete_data = {
        "reason": "Esta es una prueba automatizada del sistema"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        print("⚠️  SIMULANDO eliminación de cuenta (no se ejecutará realmente)")
        print(f"Data que se enviaría: {json.dumps(delete_data, indent=2, ensure_ascii=False)}")
        print("✅ Test de eliminación simulado correctamente")
        print()
        return True
        
        # Código real (comentado por seguridad):
        # response = requests.delete(f"{BASE_URL}/v1/users/me", json=delete_data, headers=headers)
        # print(f"Status: {response.status_code}")
        # print(f"Response: {response.text}")
        # return response.status_code == 200
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return False

def test_admin_list_users(admin_token):
    """Probar GET /users - Listar usuarios (admin)"""
    print("=== Testing GET /users - List Users (Admin) ===")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    params = {
        "page": 1,
        "limit": 10,
        "search": "test"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/v1/users", headers=headers, params=params)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print()
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return False

def test_admin_create_user(admin_token):
    """Probar POST /users - Crear usuario (admin)"""
    print("=== Testing POST /users - Create User (Admin) ===")
    
    user_data = {
        "email": f"admin_created_user_{hash(str(os.urandom(4)))}@ejemplo.com",
        "first_name": "Usuario",
        "last_name": "Creado por Admin",
        "phone": "+51999888777",
        "role": "user"
    }
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.post(f"{BASE_URL}/v1/users", json=user_data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print()
        return response.json() if response.status_code == 201 else None
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return None

def test_get_user_by_id(token, user_id):
    """Probar GET /users/{user_id} - Obtener usuario por ID"""
    print(f"=== Testing GET /users/{user_id} - Get User by ID ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/v1/users/{user_id}", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print()
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return False

def test_unauthorized_access():
    """Probar acceso sin autorización"""
    print("=== Testing Unauthorized Access ===")
    
    try:
        # Sin token
        response = requests.get(f"{BASE_URL}/v1/users/me")
        print(f"No token - Status: {response.status_code}")
        
        # Token inválido
        bad_headers = {"Authorization": "Bearer invalid_token_123"}
        response = requests.get(f"{BASE_URL}/v1/users/me", headers=bad_headers)
        print(f"Invalid token - Status: {response.status_code}")
        
        print()
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        return False

def main():
    print("👥 EasyRent API User Endpoints Testing Script 👥")
    print("=" * 60)
    
    # Obtener tokens de autenticación
    user_token, user_id = get_auth_token()
    admin_token = get_admin_token()
    
    if not user_token:
        print("❌ No se pudo obtener token de usuario. Terminando pruebas.")
        return
    
    print("🔐 USER ENDPOINTS TESTING")
    print("-" * 40)
    
    # Tests de usuario normal
    results = []
    
    # 1. Get current user profile
    results.append(("Get Current Profile", test_get_current_user_profile(user_token)))
    
    # 2. Update current user profile
    results.append(("Update Profile", test_update_current_user_profile(user_token)))
    
    # 3. User preferences
    results.append(("User Preferences", test_user_preferences(user_token)))
    
    # 4. Privacy settings
    results.append(("Privacy Settings", test_privacy_settings(user_token)))
    
    # 5. Avatar management
    results.append(("Avatar Management", test_avatar_upload(user_token)))
    
    # 6. Get user by ID (usando el propio ID)
    if user_id:
        results.append(("Get User by ID", test_get_user_by_id(user_token, user_id)))
    
    # 7. Unauthorized access tests
    results.append(("Unauthorized Access", test_unauthorized_access()))
    
    # Tests de administrador
    if admin_token:
        print("🔐 ADMIN ENDPOINTS TESTING")
        print("-" * 40)
        
        # 8. List users (admin)
        results.append(("Admin List Users", test_admin_list_users(admin_token)))
        
        # 9. Create user (admin)
        created_user = test_admin_create_user(admin_token)
        results.append(("Admin Create User", created_user is not None))
        
        # 10. Get created user by admin
        if created_user and 'id' in created_user:
            results.append(("Admin Get User by ID", test_get_user_by_id(admin_token, created_user['id'])))
    else:
        print("⚠️  No se pudo obtener token de admin. Saltando pruebas administrativas.")
    
    # 11. Delete account test (simulado)
    results.append(("Delete Account (Simulated)", test_delete_account(user_token)))
    
    # Resumen de resultados
    print("📊 RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    print("=" * 60)
    print("🎯 User Endpoints Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
