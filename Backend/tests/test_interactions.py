#!/usr/bin/env python3
"""
Script de prueba para User Interactions endpoints
Prueba las funcionalidades de favoritos, leads y reseñas
"""
import requests
import json
import uuid
from datetime import datetime

BASE_URL = "http://localhost:8000/v1"

# Test data
test_data = {
    "listing_id": str(uuid.uuid4()),
    "user_id": str(uuid.uuid4()),
    "agency_id": str(uuid.uuid4())
}

# Headers de prueba (simular autenticación)
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer test-token"  # Token de prueba
}

def print_test_result(test_name: str, response):
    """Imprimir resultado de prueba"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code < 400:
        print("✅ SUCCESS")
    else:
        print("❌ ERROR")
    
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2, default=str)}")
    except:
        print(f"Raw Response: {response.text}")


def test_health_check():
    """Verificar que el servidor esté funcionando"""
    print("\n🏥 HEALTH CHECK")
    response = requests.get(f"{BASE_URL.replace('/v1', '')}/health")
    print_test_result("Health Check", response)
    return response.status_code == 200


def test_favorites():
    """Probar endpoints de favoritos"""
    print("\n❤️ TESTING FAVORITES")
    
    # 1. Agregar a favoritos
    response = requests.post(
        f"{BASE_URL}/favorites/{test_data['listing_id']}", 
        headers=headers
    )
    print_test_result("Add to Favorites", response)
    
    # 2. Obtener favoritos
    response = requests.get(f"{BASE_URL}/favorites", headers=headers)
    print_test_result("Get Favorites", response)
    
    # 3. Remover de favoritos
    response = requests.delete(
        f"{BASE_URL}/favorites/{test_data['listing_id']}", 
        headers=headers
    )
    print_test_result("Remove from Favorites", response)


def test_leads():
    """Probar endpoints de leads"""
    print("\n🎯 TESTING LEADS")
    
    # 1. Crear lead
    lead_data = {
        "listing_id": test_data["listing_id"],
        "contact_name": "Juan Pérez",
        "contact_email": "juan@test.com",
        "contact_phone": "+51987654321",
        "message": "Me interesa esta propiedad",
        "source": "website",
        "preferred_contact_time": "afternoon"
    }
    
    response = requests.post(f"{BASE_URL}/leads", json=lead_data, headers=headers)
    print_test_result("Create Lead", response)
    
    if response.status_code == 201:
        lead_id = response.json().get("id")
        
        # 2. Obtener leads
        response = requests.get(f"{BASE_URL}/leads", headers=headers)
        print_test_result("Get Leads", response)
        
        # 3. Obtener lead específico
        if lead_id:
            response = requests.get(f"{BASE_URL}/leads/{lead_id}", headers=headers)
            print_test_result("Get Specific Lead", response)
            
            # 4. Actualizar lead
            update_data = {
                "status": "contacted",
                "notes": "Cliente contactado por teléfono"
            }
            response = requests.put(f"{BASE_URL}/leads/{lead_id}", json=update_data, headers=headers)
            print_test_result("Update Lead", response)
            
            # 5. Agregar nota
            note_data = {
                "content": "Cliente muy interesado, programar visita"
            }
            response = requests.post(f"{BASE_URL}/leads/{lead_id}/notes", json=note_data, headers=headers)
            print_test_result("Add Lead Note", response)


def test_reviews():
    """Probar endpoints de reseñas"""
    print("\n⭐ TESTING REVIEWS")
    
    # 1. Crear reseña
    review_data = {
        "target_type": "listing",
        "target_id": test_data["listing_id"],
        "rating": 5,
        "comment": "Excelente propiedad, muy recomendada"
    }
    
    response = requests.post(f"{BASE_URL}/reviews", json=review_data, headers=headers)
    print_test_result("Create Review", response)
    
    if response.status_code == 201:
        review_id = response.json().get("id")
        
        # 2. Obtener reseñas
        response = requests.get(f"{BASE_URL}/reviews", headers=headers)
        print_test_result("Get Reviews", response)
        
        # 3. Actualizar reseña
        if review_id:
            update_data = {
                "rating": 4,
                "comment": "Buena propiedad, pero el precio podría ser mejor"
            }
            response = requests.put(f"{BASE_URL}/reviews/{review_id}", json=update_data, headers=headers)
            print_test_result("Update Review", response)
            
            # 4. Eliminar reseña
            response = requests.delete(f"{BASE_URL}/reviews/{review_id}", headers=headers)
            print_test_result("Delete Review", response)


def test_pagination():
    """Probar paginación"""
    print("\n📄 TESTING PAGINATION")
    
    # Probar paginación en favoritos
    response = requests.get(f"{BASE_URL}/favorites?page=1&limit=5", headers=headers)
    print_test_result("Favorites Pagination", response)
    
    # Probar paginación en leads
    response = requests.get(f"{BASE_URL}/leads?page=1&limit=10", headers=headers)
    print_test_result("Leads Pagination", response)
    
    # Probar paginación en reviews
    response = requests.get(f"{BASE_URL}/reviews?page=1&limit=15", headers=headers)
    print_test_result("Reviews Pagination", response)


def test_filters():
    """Probar filtros"""
    print("\n🔍 TESTING FILTERS")
    
    # Filtros en leads
    response = requests.get(f"{BASE_URL}/leads?status=new&source=website", headers=headers)
    print_test_result("Leads Filters", response)
    
    # Filtros en reviews
    response = requests.get(f"{BASE_URL}/reviews?listing_id={test_data['listing_id']}", headers=headers)
    print_test_result("Reviews Filters", response)


def main():
    """Ejecutar todas las pruebas"""
    print("🧪 INICIANDO PRUEBAS DE USER INTERACTIONS")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Data: {json.dumps(test_data, indent=2)}")
    
    # Verificar que el servidor esté funcionando
    if not test_health_check():
        print("\n❌ El servidor no está disponible. Asegúrate de que esté ejecutándose en http://localhost:8000")
        return
    
    try:
        # Ejecutar todas las pruebas
        test_favorites()
        test_leads()
        test_reviews()
        test_pagination()
        test_filters()
        
        print(f"\n{'='*60}")
        print("✅ PRUEBAS COMPLETADAS")
        print("📋 Revisa los resultados arriba para identificar posibles errores")
        print("💡 Los errores 401/403 son esperados si la autenticación no está configurada")
        
    except Exception as e:
        print(f"\n❌ ERROR EN LAS PRUEBAS: {e}")
        print("🔧 Verifica que el servidor esté funcionando correctamente")


if __name__ == "__main__":
    main()
