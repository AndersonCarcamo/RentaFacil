#!/usr/bin/env python3
"""
Script de prueba para Subscription Plans endpoints
Prueba las funcionalidades de planes y suscripciones
"""
import requests
import json
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/v1"

# Test data
test_data = {
    "plan_id": str(uuid.uuid4()),
    "user_id": str(uuid.uuid4()),
    "subscription_id": None  # Se llenará después de crear una suscripción
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


def test_plans():
    """Probar endpoints de planes"""
    print("\n📋 TESTING PLANS")
    
    # 1. Obtener planes (sin autenticación requerida)
    response = requests.get(f"{BASE_URL}/plans")
    print_test_result("Get Plans", response)
    
    # 2. Obtener planes solo activos
    response = requests.get(f"{BASE_URL}/plans?active_only=true")
    print_test_result("Get Active Plans Only", response)
    
    # 3. Obtener plan específico (usando un ID de prueba)
    if response.status_code == 200:
        plans = response.json()
        if plans:
            plan_id = plans[0]["id"]
            response = requests.get(f"{BASE_URL}/plans/{plan_id}")
            print_test_result("Get Specific Plan", response)
            test_data["plan_id"] = plan_id
        else:
            print("⚠️  No plans available for testing")


def test_subscriptions():
    """Probar endpoints de suscripciones"""
    print("\n💰 TESTING SUBSCRIPTIONS")
    
    # 1. Obtener suscripciones del usuario
    response = requests.get(f"{BASE_URL}/subscriptions", headers=headers)
    print_test_result("Get User Subscriptions", response)
    
    # 2. Crear suscripción
    subscription_data = {
        "plan_id": test_data["plan_id"],
        "billing_cycle": "monthly",
        "payment_method_id": "pm_test_123456"
    }
    
    response = requests.post(f"{BASE_URL}/subscriptions", json=subscription_data, headers=headers)
    print_test_result("Create Subscription", response)
    
    if response.status_code == 201:
        subscription_id = response.json().get("id")
        test_data["subscription_id"] = subscription_id
        
        # 3. Obtener suscripción específica
        if subscription_id:
            response = requests.get(f"{BASE_URL}/subscriptions/{subscription_id}", headers=headers)
            print_test_result("Get Specific Subscription", response)
            
            # 4. Actualizar suscripción
            update_data = {
                "billing_cycle": "yearly"
            }
            response = requests.put(f"{BASE_URL}/subscriptions/{subscription_id}", json=update_data, headers=headers)
            print_test_result("Update Subscription", response)


def test_subscription_management():
    """Probar gestión de suscripciones"""
    print("\n⚙️ TESTING SUBSCRIPTION MANAGEMENT")
    
    if not test_data["subscription_id"]:
        print("⚠️  No subscription ID available for management tests")
        return
    
    subscription_id = test_data["subscription_id"]
    
    # 1. Pausar suscripción
    pause_data = {
        "pause_until": (datetime.utcnow() + timedelta(days=30)).isoformat()
    }
    response = requests.post(f"{BASE_URL}/subscriptions/{subscription_id}/pause", json=pause_data, headers=headers)
    print_test_result("Pause Subscription", response)
    
    # 2. Reanudar suscripción
    response = requests.post(f"{BASE_URL}/subscriptions/{subscription_id}/resume", headers=headers)
    print_test_result("Resume Subscription", response)
    
    # 3. Cancelar suscripción
    cancel_data = {
        "reason": "No longer needed for testing",
        "cancel_at_period_end": True
    }
    response = requests.delete(f"{BASE_URL}/subscriptions/{subscription_id}", json=cancel_data, headers=headers)
    print_test_result("Cancel Subscription", response)


def test_usage_and_payments():
    """Probar endpoints de uso y pagos"""
    print("\n📊 TESTING USAGE AND PAYMENTS")
    
    if not test_data["subscription_id"]:
        print("⚠️  No subscription ID available for usage and payment tests")
        return
    
    subscription_id = test_data["subscription_id"]
    
    # 1. Obtener uso de suscripción
    response = requests.get(f"{BASE_URL}/subscriptions/{subscription_id}/usage", headers=headers)
    print_test_result("Get Subscription Usage", response)
    
    # 2. Obtener historial de pagos
    response = requests.get(f"{BASE_URL}/subscriptions/{subscription_id}/payments", headers=headers)
    print_test_result("Get Payment History", response)
    
    # 3. Obtener historial de pagos con paginación
    response = requests.get(f"{BASE_URL}/subscriptions/{subscription_id}/payments?page=1&limit=5", headers=headers)
    print_test_result("Get Payment History with Pagination", response)


def test_pagination_and_filters():
    """Probar paginación y filtros"""
    print("\n🔍 TESTING PAGINATION AND FILTERS")
    
    # 1. Suscripciones con paginación
    response = requests.get(f"{BASE_URL}/subscriptions?page=1&limit=10", headers=headers)
    print_test_result("Subscriptions with Pagination", response)
    
    # 2. Planes con filtro de activos/inactivos
    response = requests.get(f"{BASE_URL}/plans?active_only=false")
    print_test_result("Plans Including Inactive", response)


def test_error_cases():
    """Probar casos de error"""
    print("\n❌ TESTING ERROR CASES")
    
    # 1. Plan inexistente
    fake_plan_id = str(uuid.uuid4())
    response = requests.get(f"{BASE_URL}/plans/{fake_plan_id}")
    print_test_result("Get Non-existent Plan", response)
    
    # 2. Suscripción inexistente
    fake_subscription_id = str(uuid.uuid4())
    response = requests.get(f"{BASE_URL}/subscriptions/{fake_subscription_id}", headers=headers)
    print_test_result("Get Non-existent Subscription", response)
    
    # 3. Crear suscripción con plan inexistente
    bad_subscription_data = {
        "plan_id": fake_plan_id,
        "billing_cycle": "monthly"
    }
    response = requests.post(f"{BASE_URL}/subscriptions", json=bad_subscription_data, headers=headers)
    print_test_result("Create Subscription with Invalid Plan", response)


def main():
    """Ejecutar todas las pruebas"""
    print("🧪 INICIANDO PRUEBAS DE SUBSCRIPTION PLANS")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Data: {json.dumps(test_data, indent=2)}")
    
    # Verificar que el servidor esté funcionando
    if not test_health_check():
        print("\n❌ El servidor no está disponible. Asegúrate de que esté ejecutándose en http://localhost:8000")
        return
    
    try:
        # Ejecutar todas las pruebas
        test_plans()
        test_subscriptions()
        test_subscription_management()
        test_usage_and_payments()
        test_pagination_and_filters()
        test_error_cases()
        
        print(f"\n{'='*60}")
        print("✅ PRUEBAS COMPLETADAS")
        print("📋 Revisa los resultados arriba para identificar posibles errores")
        print("💡 Los errores 401/403 son esperados si la autenticación no está configurada")
        print("💡 Los errores 404 en casos de prueba son esperados")
        
    except Exception as e:
        print(f"\n❌ ERROR EN LAS PRUEBAS: {e}")
        print("🔧 Verifica que el servidor esté funcionando correctamente")


if __name__ == "__main__":
    main()
