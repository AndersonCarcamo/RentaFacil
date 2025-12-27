"""
Script de prueba para verificar el flujo completo de notificaciones en reservas Airbnb

Flujo:
1. Guest (usuario normal) hace una solicitud de reserva
   → Notificación al PROPIETARIO con categoria "booking_request"
   
2. Propietario confirma la reserva
   → Notificación al GUEST con categoria "booking_confirmed"
   
3. Propietario rechaza la reserva (alternativa)
   → Notificación al GUEST con categoria "booking_rejected"
"""

import requests
import json
from datetime import datetime, timedelta

# Configuración
BASE_URL = "http://localhost:8000"
API_VERSION = "/v1"

# Usuarios de prueba
GUEST_EMAIL = "test_guest@example.com"
GUEST_PASSWORD = "password123"

OWNER_EMAIL = "test_owner@example.com"  # Debe tener una propiedad tipo Airbnb publicada
OWNER_PASSWORD = "password123"

# IDs de prueba (reemplazar con tus IDs reales)
LISTING_ID = "tu-listing-id-aqui"  # ID de una propiedad con rental_model='airbnb'


def login(email: str, password: str):
    """Login y obtener token"""
    response = requests.post(
        f"{BASE_URL}{API_VERSION}/auth/login",
        json={
            "email": email,
            "password": password
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login exitoso como {email}")
        return data.get("access_token")
    else:
        print(f"❌ Error en login: {response.status_code}")
        print(response.text)
        return None


def get_notifications(token: str):
    """Obtener notificaciones del usuario"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{BASE_URL}{API_VERSION}/notifications?read=false&page=1&size=10",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n📬 Notificaciones no leídas: {data['unread_count']}")
        print(f"Total items: {len(data['items'])}")
        
        for notif in data['items']:
            print(f"\n  🔔 {notif['title']}")
            print(f"     Categoría: {notif.get('category', 'N/A')}")
            print(f"     Mensaje: {notif['message']}")
            print(f"     Prioridad: {notif['priority']}")
            print(f"     Creado: {notif['created_at']}")
        
        return data['items']
    else:
        print(f"❌ Error obteniendo notificaciones: {response.status_code}")
        print(response.text)
        return []


def create_booking(token: str, listing_id: str):
    """Crear una solicitud de reserva como guest"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Fechas de ejemplo: 5 días desde mañana
    check_in = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    check_out = (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d")
    
    booking_data = {
        "listing_id": listing_id,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "number_of_guests": 2,
        "notes": "Prueba de notificaciones"
    }
    
    print(f"\n📝 Creando reserva para listing {listing_id}")
    print(f"   Check-in: {check_in}")
    print(f"   Check-out: {check_out}")
    
    response = requests.post(
        f"{BASE_URL}{API_VERSION}/bookings",
        headers=headers,
        json=booking_data
    )
    
    if response.status_code == 201:
        data = response.json()
        booking_id = data['id']
        print(f"✅ Reserva creada: {booking_id}")
        print(f"   Status: {data['status']}")
        print(f"   Total: S/ {data['total_price']}")
        return booking_id
    else:
        print(f"❌ Error creando reserva: {response.status_code}")
        print(response.text)
        return None


def confirm_booking(token: str, booking_id: str):
    """Confirmar una reserva como propietario"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n✅ Confirmando reserva {booking_id}")
    
    response = requests.patch(
        f"{BASE_URL}{API_VERSION}/bookings/{booking_id}/confirm",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Reserva confirmada")
        print(f"   Mensaje: {data['message']}")
        print(f"   Status: {data['status']}")
        print(f"   Payment deadline: {data.get('payment_deadline', 'N/A')}")
        return True
    else:
        print(f"❌ Error confirmando reserva: {response.status_code}")
        print(response.text)
        return False


def main():
    print("=" * 80)
    print("🧪 TEST DE FLUJO DE NOTIFICACIONES EN RESERVAS AIRBNB")
    print("=" * 80)
    
    # Paso 1: Login como Guest
    print("\n" + "=" * 80)
    print("PASO 1: Login como GUEST")
    print("=" * 80)
    guest_token = login(GUEST_EMAIL, GUEST_PASSWORD)
    if not guest_token:
        print("❌ No se pudo hacer login como guest. Verifica credenciales.")
        return
    
    # Paso 2: Login como Owner
    print("\n" + "=" * 80)
    print("PASO 2: Login como OWNER (propietario)")
    print("=" * 80)
    owner_token = login(OWNER_EMAIL, OWNER_PASSWORD)
    if not owner_token:
        print("❌ No se pudo hacer login como owner. Verifica credenciales.")
        return
    
    # Paso 3: Verificar notificaciones iniciales del owner
    print("\n" + "=" * 80)
    print("PASO 3: Verificar notificaciones del OWNER (antes de solicitud)")
    print("=" * 80)
    get_notifications(owner_token)
    
    # Paso 4: Guest crea una solicitud de reserva
    print("\n" + "=" * 80)
    print("PASO 4: GUEST crea solicitud de reserva")
    print("=" * 80)
    booking_id = create_booking(guest_token, LISTING_ID)
    if not booking_id:
        print("❌ No se pudo crear la reserva. Verifica el LISTING_ID.")
        return
    
    # Paso 5: Verificar que llegó notificación al owner
    print("\n" + "=" * 80)
    print("PASO 5: Verificar notificaciones del OWNER (después de solicitud)")
    print("=" * 80)
    print("⏳ Esperando 2 segundos...")
    import time
    time.sleep(2)
    get_notifications(owner_token)
    
    # Paso 6: Owner confirma la reserva
    print("\n" + "=" * 80)
    print("PASO 6: OWNER confirma la reserva")
    print("=" * 80)
    confirm_booking(owner_token, booking_id)
    
    # Paso 7: Verificar que llegó notificación al guest
    print("\n" + "=" * 80)
    print("PASO 7: Verificar notificaciones del GUEST (después de confirmación)")
    print("=" * 80)
    print("⏳ Esperando 2 segundos...")
    time.sleep(2)
    get_notifications(guest_token)
    
    print("\n" + "=" * 80)
    print("✅ TEST COMPLETADO")
    print("=" * 80)
    print("\nResumen esperado:")
    print("- Owner debería tener notificación de 'booking_request' después del Paso 5")
    print("- Guest debería tener notificación de 'booking_confirmed' después del Paso 7")
    print("\n💡 Si no ves notificaciones:")
    print("   1. Verifica que el LISTING_ID sea válido y tenga rental_model='airbnb'")
    print("   2. Verifica que los usuarios existen y tienen los roles correctos")
    print("   3. Revisa los logs del backend para errores en la creación de notificaciones")


if __name__ == "__main__":
    print("\n⚠️  ANTES DE EJECUTAR:")
    print("1. Actualiza GUEST_EMAIL, GUEST_PASSWORD con un usuario normal")
    print("2. Actualiza OWNER_EMAIL, OWNER_PASSWORD con un usuario propietario")
    print("3. Actualiza LISTING_ID con un ID de propiedad tipo Airbnb válida")
    print("4. Asegúrate de que el backend esté corriendo en localhost:8000")
    print("\n¿Continuar? (y/n): ", end="")
    
    response = input().lower()
    if response == 'y':
        main()
    else:
        print("Cancelado.")
