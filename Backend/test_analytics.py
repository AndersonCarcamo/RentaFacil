#!/usr/bin/env python3
"""
Script de prueba para Analytics & Reports endpoints
Prueba las funcionalidades de analytics, métricas y reportes
"""
import requests
import json
import uuid
from datetime import datetime, date, timedelta

BASE_URL = "http://localhost:8000/v1"

# Test data
test_data = {
    "listing_id": str(uuid.uuid4()),
    "session_id": str(uuid.uuid4()),
    "report_id": None
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
        print(f"Response: {json.dumps(data, indent=2, default=str)[:500]}...")
    except:
        print(f"Raw Response: {response.text[:500]}...")


def test_health_check():
    """Verificar que el servidor esté funcionando"""
    print("\n🏥 HEALTH CHECK")
    response = requests.get(f"{BASE_URL.replace('/v1', '')}/health")
    print_test_result("Health Check", response)
    return response.status_code == 200


def test_dashboard_analytics():
    """Probar dashboard de analytics"""
    print("\n📊 TESTING DASHBOARD ANALYTICS")
    
    # 1. Dashboard con período por defecto
    response = requests.get(f"{BASE_URL}/analytics/dashboard", headers=headers)
    print_test_result("Dashboard Default Period", response)
    
    # 2. Dashboard con diferentes períodos
    periods = ["7d", "30d", "90d", "1y"]
    for period in periods:
        response = requests.get(f"{BASE_URL}/analytics/dashboard?period={period}", headers=headers)
        print_test_result(f"Dashboard Period {period}", response)


def test_listing_analytics():
    """Probar analytics de listings"""
    print("\n🏠 TESTING LISTING ANALYTICS")
    
    # 1. Analytics generales de listings
    response = requests.get(f"{BASE_URL}/analytics/listings", headers=headers)
    print_test_result("General Listing Analytics", response)
    
    # 2. Analytics de listing específico
    response = requests.get(f"{BASE_URL}/analytics/listings?listing_id={test_data['listing_id']}", headers=headers)
    print_test_result("Specific Listing Analytics", response)
    
    # 3. Analytics con diferentes períodos
    response = requests.get(f"{BASE_URL}/analytics/listings?period=7d", headers=headers)
    print_test_result("Listing Analytics 7 Days", response)


def test_performance_analytics():
    """Probar analytics de rendimiento"""
    print("\n📈 TESTING PERFORMANCE ANALYTICS")
    
    # 1. Performance general
    response = requests.get(f"{BASE_URL}/analytics/performance", headers=headers)
    print_test_result("General Performance Analytics", response)
    
    # 2. Métricas específicas
    metrics = ["views", "leads", "conversion_rate", "avg_days_on_market"]
    for metric in metrics:
        response = requests.get(f"{BASE_URL}/analytics/performance?metric={metric}", headers=headers)
        print_test_result(f"Performance Metric: {metric}", response)


def test_admin_analytics():
    """Probar analytics de administrador"""
    print("\n👥 TESTING ADMIN ANALYTICS")
    
    # 1. User analytics (requiere permisos admin)
    response = requests.get(f"{BASE_URL}/analytics/users", headers=headers)
    print_test_result("User Analytics (Admin)", response)
    
    # 2. Revenue analytics (requiere permisos admin)
    response = requests.get(f"{BASE_URL}/analytics/revenue", headers=headers)
    print_test_result("Revenue Analytics (Admin)", response)
    
    # 3. Revenue con granularidad
    granularities = ["daily", "weekly", "monthly"]
    for granularity in granularities:
        response = requests.get(f"{BASE_URL}/analytics/revenue?granularity={granularity}", headers=headers)
        print_test_result(f"Revenue Analytics - {granularity}", response)


def test_reports():
    """Probar generación de reportes"""
    print("\n📄 TESTING REPORTS")
    
    # Fechas de prueba
    from_date = (datetime.now() - timedelta(days=30)).date().isoformat()
    to_date = datetime.now().date().isoformat()
    
    # 1. Reporte de listings en diferentes formatos
    formats = ["json", "csv", "pdf"]
    for format_type in formats:
        response = requests.get(
            f"{BASE_URL}/reports/listings?format={format_type}&from_date={from_date}&to_date={to_date}",
            headers=headers
        )
        print_test_result(f"Listings Report - {format_type.upper()}", response)
        
        if response.status_code == 200 and format_type == "json":
            data = response.json()
            if data.get("id"):
                test_data["report_id"] = data["id"]
    
    # 2. Reporte de revenue (admin)
    for format_type in formats:
        response = requests.get(
            f"{BASE_URL}/reports/revenue?format={format_type}&from_date={from_date}&to_date={to_date}",
            headers=headers
        )
        print_test_result(f"Revenue Report - {format_type.upper()}", response)


def test_analytics_tracking():
    """Probar tracking de eventos de analytics"""
    print("\n🎯 TESTING ANALYTICS TRACKING")
    
    # 1. Tracking de evento general
    event_data = {
        "event_type": "interaction",
        "event_category": "listing",
        "event_action": "view",
        "event_label": "property_detail_page",
        "listing_id": test_data["listing_id"],
        "session_id": test_data["session_id"],
        "page_url": f"/listings/{test_data['listing_id']}",
        "referrer": "https://google.com",
        "duration": 120,
        "value": 0.0,
        "properties": {
            "scroll_depth": 75,
            "images_viewed": 3
        }
    }
    
    response = requests.post(f"{BASE_URL}/analytics/track", json=event_data, headers=headers)
    print_test_result("Track Analytics Event", response)
    
    # 2. Tracking de vista de listing
    response = requests.post(
        f"{BASE_URL}/analytics/track/view/{test_data['listing_id']}?session_id={test_data['session_id']}&referrer=https://facebook.com",
        headers=headers
    )
    print_test_result("Track Listing View", response)


def test_search_analytics():
    """Probar analytics de búsquedas"""
    print("\n🔍 TESTING SEARCH ANALYTICS")
    
    # 1. Analytics de búsquedas
    response = requests.get(f"{BASE_URL}/analytics/search", headers=headers)
    print_test_result("Search Analytics", response)
    
    # 2. Analytics de búsquedas con período
    response = requests.get(f"{BASE_URL}/analytics/search?period=7d", headers=headers)
    print_test_result("Search Analytics - 7 Days", response)


def test_realtime_analytics():
    """Probar analytics en tiempo real"""
    print("\n⚡ TESTING REALTIME ANALYTICS")
    
    response = requests.get(f"{BASE_URL}/analytics/realtime", headers=headers)
    print_test_result("Realtime Analytics", response)


def test_report_download():
    """Probar descarga de reportes"""
    print("\n📥 TESTING REPORT DOWNLOAD")
    
    if test_data.get("report_id"):
        response = requests.get(f"{BASE_URL}/reports/{test_data['report_id']}/download", headers=headers)
        print_test_result("Download Report", response)
    else:
        print("⚠️  No report ID available for download test")


def test_error_cases():
    """Probar casos de error"""
    print("\n❌ TESTING ERROR CASES")
    
    # 1. Período inválido
    response = requests.get(f"{BASE_URL}/analytics/dashboard?period=invalid", headers=headers)
    print_test_result("Invalid Period", response)
    
    # 2. Métrica inválida
    response = requests.get(f"{BASE_URL}/analytics/performance?metric=invalid", headers=headers)
    print_test_result("Invalid Metric", response)
    
    # 3. Formato de reporte inválido
    response = requests.get(f"{BASE_URL}/reports/listings?format=invalid", headers=headers)
    print_test_result("Invalid Report Format", response)
    
    # 4. Evento de analytics malformado
    bad_event = {
        "event_type": "",  # Campo requerido vacío
        "event_category": "listing"
    }
    response = requests.post(f"{BASE_URL}/analytics/track", json=bad_event, headers=headers)
    print_test_result("Malformed Analytics Event", response)


def main():
    """Ejecutar todas las pruebas"""
    print("🧪 INICIANDO PRUEBAS DE ANALYTICS & REPORTS")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Data: {json.dumps(test_data, indent=2)}")
    
    # Verificar que el servidor esté funcionando
    if not test_health_check():
        print("\n❌ El servidor no está disponible. Asegúrate de que esté ejecutándose en http://localhost:8000")
        return
    
    try:
        # Ejecutar todas las pruebas
        test_dashboard_analytics()
        test_listing_analytics()
        test_performance_analytics()
        test_admin_analytics()
        test_reports()
        test_analytics_tracking()
        test_search_analytics()
        test_realtime_analytics()
        test_report_download()
        test_error_cases()
        
        print(f"\n{'='*60}")
        print("✅ PRUEBAS COMPLETADAS")
        print("📋 Revisa los resultados arriba para identificar posibles errores")
        print("💡 Los errores 401/403 son esperados si la autenticación no está configurada")
        print("💡 Los errores 403 en endpoints de admin son esperados sin permisos")
        print("💡 Algunos endpoints devuelven placeholders hasta implementar la lógica completa")
        
    except Exception as e:
        print(f"\n❌ ERROR EN LAS PRUEBAS: {e}")
        print("🔧 Verifica que el servidor esté funcionando correctamente")


if __name__ == "__main__":
    main()
