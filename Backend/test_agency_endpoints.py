#!/usr/bin/env python3
"""
🏢 EasyRent API Agency Endpoints Testing Script 🏢
Testing all agency-related endpoints with comprehensive scenarios.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/v1"

def get_auth_token():
    """Obtener token de autenticación para pruebas"""
    print("=== Getting Authentication Token ===")
    
    # Registrar un usuario de prueba con firebase_uid específico
    register_data = {
        "email": "testuser_agencies@mock.com",
        "first_name": "Usuario",
        "last_name": "Agencias",
        "phone": "+51987654321",
        "role": "user",
        "firebase_uid": "testuser_agencies",
        "national_id": "12345678",
        "national_id_type": "DNI"
    }
    
    try:
        requests.post(f"{BASE_URL}/auth/register", json=register_data)
    except:
        pass
    
    # Login con token mock
    login_data = {
        "firebase_token": "mock_token_testuser_agencies"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Token obtenido exitosamente")
            return data['access_token']
        else:
            print(f"❌ Error obteniendo token: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def get_user_id():
    """Obtener el ID del usuario autenticado para usar en pruebas de agentes"""
    token = get_auth_token()
    if not token:
        return None
    
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/users/me", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            return user_data['id']
    except:
        pass
    return None

def print_response(title, response):
    """Imprimir respuesta de la API de forma bonita"""
    print(f"=== {title} ===")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response (text): {response.text}")
    print()

def test_list_agencies():
    """Probar GET /agencies - Listar agencias"""
    print("🔍 Testing GET /agencies - List Agencies")
    
    # Sin filtros
    response = requests.get(f"{BASE_URL}/agencies")
    print_response("List all agencies", response)
    
    # Con filtro verified
    response = requests.get(f"{BASE_URL}/agencies?verified=true")
    print_response("List verified agencies only", response)
    
    # Con filtro verified=false
    response = requests.get(f"{BASE_URL}/agencies?verified=false")
    print_response("List unverified agencies only", response)
    
    return response.status_code == 200

def test_create_agency():
    """Probar POST /agencies - Crear agencia"""
    print("✨ Testing POST /agencies - Create Agency")
    
    # Datos válidos
    agency_data = {
        "name": "Inmobiliaria Test API",
        "email": "test@inmobiliariaapi.com",
        "phone": "+51987654321",
        "website": "https://inmobiliariaapi.com",
        "address": "Av. Test 123, Lima",
        "description": "Agencia de pruebas para API testing",
        "logo_url": "https://example.com/logo.png"
    }
    
    response = requests.post(f"{BASE_URL}/agencies", json=agency_data)
    print_response("Create agency with all fields", response)
    
    created_agency_id = None
    if response.status_code == 201:
        created_agency_id = response.json().get('id')
    
    # Datos mínimos requeridos
    minimal_data = {
        "name": "Agencia Mínima Test"
    }
    
    response = requests.post(f"{BASE_URL}/agencies", json=minimal_data)
    print_response("Create agency with minimal data", response)
    
    # Datos inválidos - nombre muy corto
    invalid_data = {
        "name": "A"
    }
    
    response = requests.post(f"{BASE_URL}/agencies", json=invalid_data)
    print_response("Create agency with invalid data (name too short)", response)
    
    return created_agency_id

def test_get_agency(agency_id):
    """Probar GET /agencies/{id} - Obtener agencia por ID"""
    print("🔍 Testing GET /agencies/{id} - Get Agency by ID")
    
    if not agency_id:
        print("⚠️  No agency ID available for testing")
        return False
    
    # ID válido
    response = requests.get(f"{BASE_URL}/agencies/{agency_id}")
    print_response(f"Get agency {agency_id}", response)
    
    # ID inválido
    fake_id = "123e4567-e89b-12d3-a456-426614174999"
    response = requests.get(f"{BASE_URL}/agencies/{fake_id}")
    print_response("Get agency with non-existent ID", response)
    
    # ID mal formateado
    response = requests.get(f"{BASE_URL}/agencies/invalid-id")
    print_response("Get agency with malformed ID", response)
    
    return response.status_code in [200, 404, 400]

def test_update_agency(agency_id):
    """Probar PUT /agencies/{id} - Actualizar agencia"""
    print("📝 Testing PUT /agencies/{id} - Update Agency")
    
    if not agency_id:
        print("⚠️  No agency ID available for testing")
        return False
    
    # Actualización parcial
    update_data = {
        "name": "Inmobiliaria Test API Actualizada",
        "description": "Descripción actualizada para testing"
    }
    
    response = requests.put(f"{BASE_URL}/agencies/{agency_id}", json=update_data)
    print_response(f"Update agency {agency_id}", response)
    
    # Actualización completa
    complete_update = {
        "name": "Inmobiliaria Complete Update",
        "email": "updated@inmobiliaria.com",
        "phone": "+51999888777",
        "website": "https://updated-website.com",
        "address": "Av. Updated 456, Lima",
        "description": "Completely updated description",
        "logo_url": "https://example.com/new-logo.png"
    }
    
    response = requests.put(f"{BASE_URL}/agencies/{agency_id}", json=complete_update)
    print_response(f"Complete update agency {agency_id}", response)
    
    return response.status_code == 200

def test_agency_agents(agency_id, user_id):
    """Probar endpoints relacionados con agentes de agencia"""
    print("👥 Testing Agency Agents Endpoints")
    
    if not agency_id or not user_id:
        print("⚠️  No agency ID or user ID available for testing")
        return False
    
    # Listar agentes (debería estar vacío al principio)
    response = requests.get(f"{BASE_URL}/agencies/{agency_id}/agents")
    print_response(f"List agents for agency {agency_id}", response)
    
    # Agregar agente
    add_agent_data = {
        "user_id": user_id
    }
    
    response = requests.post(f"{BASE_URL}/agencies/{agency_id}/agents", json=add_agent_data)
    print_response(f"Add agent {user_id} to agency {agency_id}", response)
    
    # Listar agentes (ahora debería tener 1)
    response = requests.get(f"{BASE_URL}/agencies/{agency_id}/agents")
    print_response(f"List agents after adding one", response)
    
    # Intentar agregar el mismo agente (debería fallar con 409)
    response = requests.post(f"{BASE_URL}/agencies/{agency_id}/agents", json=add_agent_data)
    print_response(f"Try to add same agent again (should fail)", response)
    
    # Remover agente
    response = requests.delete(f"{BASE_URL}/agencies/{agency_id}/agents/{user_id}")
    print_response(f"Remove agent {user_id} from agency {agency_id}", response)
    
    # Listar agentes (debería estar vacío de nuevo)
    response = requests.get(f"{BASE_URL}/agencies/{agency_id}/agents")
    print_response(f"List agents after removing", response)
    
    return True

def test_agency_verification(agency_id):
    """Probar POST /agencies/{id}/verification - Solicitar verificación"""
    print("✅ Testing POST /agencies/{id}/verification - Request Verification")
    
    if not agency_id:
        print("⚠️  No agency ID available for testing")
        return False
    
    # Solicitar verificación con documentos
    verification_data = {
        "documents": [
            "https://example.com/ruc-certificate.pdf",
            "https://example.com/business-license.pdf",
            "https://example.com/tax-certificate.pdf"
        ]
    }
    
    response = requests.post(f"{BASE_URL}/agencies/{agency_id}/verification", json=verification_data)
    print_response(f"Request verification for agency {agency_id}", response)
    
    # Sin documentos (debería fallar)
    invalid_verification = {
        "documents": []
    }
    
    response = requests.post(f"{BASE_URL}/agencies/{agency_id}/verification", json=invalid_verification)
    print_response("Request verification without documents", response)
    
    return response.status_code in [200, 400]

def test_delete_agency(agency_id):
    """Probar DELETE /agencies/{id} - Eliminar agencia"""
    print("🗑️  Testing DELETE /agencies/{id} - Delete Agency")
    
    if not agency_id:
        print("⚠️  No agency ID available for testing")
        return False
    
    # Eliminar agencia
    response = requests.delete(f"{BASE_URL}/agencies/{agency_id}")
    print_response(f"Delete agency {agency_id}", response)
    
    # Verificar que ya no existe
    response = requests.get(f"{BASE_URL}/agencies/{agency_id}")
    print_response(f"Verify agency {agency_id} is deleted", response)
    
    return response.status_code == 404

def test_unauthorized_access():
    """Probar acceso sin autorización donde sea necesario"""
    print("🚫 Testing Unauthorized Access")
    
    # Crear agencia sin token (debería funcionar según la especificación)
    agency_data = {
        "name": "Test Unauthorized Agency"
    }
    
    response = requests.post(f"{BASE_URL}/agencies", json=agency_data)
    print_response("Create agency without token", response)
    
    return True

def main():
    """Función principal del script de pruebas"""
    print("🏢 EasyRent API Agency Endpoints Testing Script 🏢")
    print("=" * 60)
    
    # Get user ID for agent testing
    user_id = get_user_id()
    print(f"Using user ID for testing: {user_id}")
    print()
    
    print("🏢 AGENCY ENDPOINTS TESTING")
    print("-" * 40)
    
    results = {
        "List Agencies": False,
        "Create Agency": False,
        "Get Agency by ID": False,
        "Update Agency": False,
        "Agency Agents Management": False,
        "Agency Verification": False,
        "Delete Agency": False,
        "Unauthorized Access": False
    }
    
    # Test sequence
    try:
        # 1. List agencies
        results["List Agencies"] = test_list_agencies()
        
        # 2. Create agency
        created_agency_id = test_create_agency()
        results["Create Agency"] = created_agency_id is not None
        
        if created_agency_id:
            # 3. Get agency by ID
            results["Get Agency by ID"] = test_get_agency(created_agency_id)
            
            # 4. Update agency
            results["Update Agency"] = test_update_agency(created_agency_id)
            
            # 5. Agency agents management
            results["Agency Agents Management"] = test_agency_agents(created_agency_id, user_id)
            
            # 6. Agency verification
            results["Agency Verification"] = test_agency_verification(created_agency_id)
            
            # 7. Delete agency (at the end)
            results["Delete Agency"] = test_delete_agency(created_agency_id)
        
        # 8. Test unauthorized access
        results["Unauthorized Access"] = test_unauthorized_access()
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
    
    # Print results summary
    print("📊 RESULTS SUMMARY")
    print("=" * 60)
    passed = 0
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name:<30} {status}")
        if success:
            passed += 1
    
    print("-" * 60)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print("=" * 60)
    print("🎯 Agency Endpoints Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
