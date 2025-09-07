#!/usr/bin/env python3
"""
🔍 EasyRent API Search Endpoints Testing Script 🔍
Testing all search-related endpoints with comprehensive scenarios.
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
        "email": "testuser_search@mock.com",
        "first_name": "Usuario",
        "last_name": "Search",
        "phone": "+51987654789",
        "role": "user",
        "firebase_uid": "testuser_search",
        "national_id": "87654321",
        "national_id_type": "DNI"
    }
    
    try:
        requests.post(f"{BASE_URL}/auth/register", json=register_data)
    except:
        pass
    
    # Login con token mock
    login_data = {
        "firebase_token": "mock_token_testuser_search"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Token obtenido exitosamente")
            return data['access_token'], data['user']['id']
        else:
            print(f"❌ Error obteniendo token: {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def test_search_endpoints(token, user_id):
    """Probar todos los endpoints de búsqueda"""
    
    headers = {"Authorization": f"Bearer {token}"}
    results = {}
    
    # 1. Test básico de búsqueda
    print("🔍 Testing GET /search - Basic Search")
    print("=== Basic search without parameters ===")
    response = requests.get(f"{BASE_URL}/search/")
    results['basic_search'] = response.status_code == 200
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Response: {response.text[:300]}...")
    else:
        data = response.json()
        print(f"Results found: {data.get('meta', {}).get('total_results', 0)}")
    
    print()
    
    # 2. Test búsqueda con texto
    print("=== Search with text query ===")
    response = requests.get(f"{BASE_URL}/search/?q=departamento")
    results['text_search'] = response.status_code == 200
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Response: {response.text[:300]}...")
    else:
        data = response.json()
        print(f"Results for 'departamento': {data.get('meta', {}).get('total_results', 0)}")
    
    print()
    
    # 3. Test búsqueda con filtros
    print("=== Search with filters ===")
    params = {
        'operation': 'rent',
        'min_price': 500,
        'max_price': 2000,
        'min_bedrooms': 2,
        'page': 1,
        'limit': 10
    }
    response = requests.get(f"{BASE_URL}/search/", params=params)
    results['filtered_search'] = response.status_code == 200
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Response: {response.text[:300]}...")
    else:
        data = response.json()
        print(f"Filtered results: {data.get('meta', {}).get('total_results', 0)}")
    
    print()
    
    # 4. Test búsqueda por ubicación
    print("=== Search by location ===")
    response = requests.get(f"{BASE_URL}/search/?location=lima")
    results['location_search'] = response.status_code == 200
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Response: {response.text[:300]}...")
    else:
        data = response.json()
        print(f"Lima results: {data.get('meta', {}).get('total_results', 0)}")
    
    print()
    
    # 5. Test sugerencias
    print("🔎 Testing GET /search/suggestions - Search Suggestions")
    print("=== Location suggestions ===")
    response = requests.get(f"{BASE_URL}/search/suggestions?q=lim&type=location")
    results['location_suggestions'] = response.status_code == 200
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Response: {response.text[:300]}...")
    else:
        data = response.json()
        print(f"Suggestions count: {len(data.get('suggestions', []))}")
        for suggestion in data.get('suggestions', [])[:3]:
            print(f"  - {suggestion.get('value')} ({suggestion.get('count')} results)")
    
    print()
    
    # 6. Test filtros disponibles
    print("🗂️ Testing GET /search/filters - Available Filters")
    response = requests.get(f"{BASE_URL}/search/filters")
    results['available_filters'] = response.status_code == 200
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Response: {response.text[:300]}...")
    else:
        data = response.json()
        print(f"Departments available: {len(data.get('departments', []))}")
        print(f"Property types available: {len(data.get('property_types', []))}")
        price_range = data.get('price_range', {})
        print(f"Price range: {price_range.get('min', 0):.0f} - {price_range.get('max', 0):.0f}")
    
    print()
    
    # 7. Test búsquedas guardadas (requiere autenticación)
    print("💾 Testing Saved Searches (Authenticated)")
    print("=== Get saved searches ===")
    response = requests.get(f"{BASE_URL}/search/saved", headers=headers)
    results['get_saved_searches'] = response.status_code == 200
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Response: {response.text[:300]}...")
    else:
        saved_searches = response.json()
        print(f"Current saved searches: {len(saved_searches)}")
    
    print()
    
    # 8. Test guardar nueva búsqueda
    print("=== Save new search ===")
    save_data = {
        "name": "Departamento en Lima",
        "filters": {
            "q": "departamento",
            "location": "lima",
            "operation": "rent",
            "min_price": 800,
            "max_price": 1500,
            "min_bedrooms": 2
        },
        "notifications": True
    }
    response = requests.post(f"{BASE_URL}/search/saved", json=save_data, headers=headers)
    results['save_search'] = response.status_code == 201
    print(f"Status: {response.status_code}")
    
    saved_search_id = None
    if response.status_code == 201:
        data = response.json()
        saved_search_id = data.get('id')
        print(f"✅ Search saved with ID: {saved_search_id}")
        print(f"Name: {data.get('name')}")
        print(f"Active: {data.get('is_active')}")
    else:
        print(f"Response: {response.text[:300]}...")
    
    print()
    
    # 9. Test obtener búsqueda guardada específica
    if saved_search_id:
        print("=== Get specific saved search ===")
        response = requests.get(f"{BASE_URL}/search/saved/{saved_search_id}", headers=headers)
        results['get_specific_saved_search'] = response.status_code == 200
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text[:300]}...")
        else:
            data = response.json()
            print(f"✅ Retrieved search: {data.get('name')}")
            print(f"Filters: {len(data.get('search_params', {}))}")
        
        print()
        
        # 10. Test actualizar búsqueda guardada
        print("=== Update saved search ===")
        update_data = {
            "name": "Departamento en Lima - Actualizado",
            "notifications": False
        }
        response = requests.put(f"{BASE_URL}/search/saved/{saved_search_id}", json=update_data, headers=headers)
        results['update_saved_search'] = response.status_code == 200
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text[:300]}...")
        else:
            data = response.json()
            print(f"✅ Updated search name: {data.get('name')}")
            print(f"Notifications: {data.get('is_active')}")
        
        print()
        
        # 11. Test eliminar búsqueda guardada
        print("=== Delete saved search ===")
        response = requests.delete(f"{BASE_URL}/search/saved/{saved_search_id}", headers=headers)
        results['delete_saved_search'] = response.status_code == 200
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text[:300]}...")
        else:
            data = response.json()
            print(f"✅ {data.get('message', 'Search deleted')}")
    else:
        results['get_specific_saved_search'] = False
        results['update_saved_search'] = False
        results['delete_saved_search'] = False
        print("⚠️ Skipping specific saved search tests (no saved search created)")
    
    print()
    
    # 12. Test error handling - búsqueda sin autenticación en endpoint protegido
    print("🚫 Testing Error Handling")
    print("=== Accessing protected endpoint without auth ===")
    response = requests.post(f"{BASE_URL}/search/saved", json=save_data)
    results['unauthorized_access'] = response.status_code == 401
    print(f"Status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Correctly blocked unauthorized access")
    else:
        print(f"Response: {response.text[:300]}...")
    
    print()
    
    # 13. Test sugerencias con parámetros inválidos
    print("=== Invalid suggestions query ===")
    response = requests.get(f"{BASE_URL}/search/suggestions")  # Sin parámetro q requerido
    results['invalid_suggestions'] = response.status_code == 422
    print(f"Status: {response.status_code}")
    if response.status_code == 422:
        print("✅ Correctly rejected invalid request")
    else:
        print(f"Response: {response.text[:200]}...")
    
    return results

def print_results_summary(results):
    """Imprimir resumen de resultados"""
    print("\n📊 RESULTS SUMMARY")
    print("=" * 60)
    
    test_names = {
        'basic_search': 'Basic Search',
        'text_search': 'Text Search',
        'filtered_search': 'Filtered Search', 
        'location_search': 'Location Search',
        'location_suggestions': 'Location Suggestions',
        'available_filters': 'Available Filters',
        'get_saved_searches': 'Get Saved Searches',
        'save_search': 'Save Search',
        'get_specific_saved_search': 'Get Specific Saved Search',
        'update_saved_search': 'Update Saved Search',
        'delete_saved_search': 'Delete Saved Search',
        'unauthorized_access': 'Unauthorized Access Handling',
        'invalid_suggestions': 'Invalid Suggestions Handling'
    }
    
    passed = 0
    failed = 0
    
    for key, name in test_names.items():
        status = "✅ PASSED" if results.get(key, False) else "❌ FAILED"
        print(f"{name:<35} {status}")
        if results.get(key, False):
            passed += 1
        else:
            failed += 1
    
    print("-" * 60)
    print(f"Total Tests: {passed + failed}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed / (passed + failed) * 100):.1f}%")
    print("=" * 60)
    print("🎯 Search Endpoints Testing Complete!")
    print("=" * 60)

def main():
    """Función principal"""
    print("🔍 EasyRent API Search Endpoints Testing Script 🔍")
    print("=" * 60)
    
    # Obtener token de autenticación
    token, user_id = get_auth_token()
    if not token:
        print("❌ Could not obtain authentication token. Exiting.")
        return
    
    print(f"Using user ID for testing: {user_id}")
    print()
    
    print("🔍 SEARCH ENDPOINTS TESTING")
    print("-" * 40)
    
    # Ejecutar pruebas
    results = test_search_endpoints(token, user_id)
    
    # Mostrar resumen
    print_results_summary(results)

if __name__ == "__main__":
    main()
