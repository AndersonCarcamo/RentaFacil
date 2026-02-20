"""
Script de prueba para el sistema de plazo de pago
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/v1"

# Tokens de ejemplo - reemplazar con tokens reales
OWNER_TOKEN = "tu_token_de_propietario"
ADMIN_TOKEN = "tu_token_de_admin"
BOOKING_ID = "uuid_de_la_reserva"


def test_confirm_booking():
    """
    Prueba: Propietario confirma una reserva
    Resultado esperado: Email enviado al huésped con deadline de 6 horas
    """
    print("\n" + "="*60)
    print("TEST 1: Confirmar Reserva")
    print("="*60)
    
    url = f"{BASE_URL}/bookings/{BOOKING_ID}/confirm"
    headers = {"Authorization": f"Bearer {OWNER_TOKEN}"}
    
    try:
        response = requests.patch(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Reserva confirmada exitosamente")
            print(f"📧 Email enviado al huésped")
            print(f"⏰ Deadline de pago: {data.get('payment_deadline')}")
            return True
        else:
            print(f"\n❌ Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        return False


def test_check_payment_status():
    """
    Prueba: Admin consulta estado de pagos
    """
    print("\n" + "="*60)
    print("TEST 2: Consultar Estado de Pagos")
    print("="*60)
    
    url = f"{BASE_URL}/scheduled-tasks/booking-payment-status"
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Total de reservas: {data.get('total')}")
            
            for booking in data.get('bookings', [])[:5]:  # Mostrar primeras 5
                print(f"\nBooking ID: {booking['booking_id']}")
                print(f"  Estado: {booking['status']}")
                print(f"  Estado de pago: {booking['payment_status']}")
                if booking['hours_remaining']:
                    print(f"  Horas restantes: {booking['hours_remaining']:.2f}")
                print(f"  Deadline: {booking['payment_deadline']}")
            
            return True
        else:
            print(f"\n❌ Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        return False


def test_cancel_expired():
    """
    Prueba: Admin ejecuta cancelación de reservas expiradas
    """
    print("\n" + "="*60)
    print("TEST 3: Cancelar Reservas Expiradas")
    print("="*60)
    
    url = f"{BASE_URL}/scheduled-tasks/cancel-expired-payments"
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    try:
        response = requests.post(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Tarea ejecutada exitosamente")
            print(f"📊 Reservas canceladas: {data.get('cancelled_count')}")
            
            if data.get('cancelled_count', 0) > 0:
                print("\nReservas canceladas:")
                for booking in data.get('bookings', []):
                    print(f"  - {booking['listing_title']}")
                    print(f"    Email: {booking['guest_email']}")
                    print(f"    Deadline: {booking['deadline']}")
            else:
                print("No hay reservas expiradas para cancelar")
            
            return True
        else:
            print(f"\n❌ Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        return False


def test_send_reminders():
    """
    Prueba: Admin envía recordatorios de pago
    """
    print("\n" + "="*60)
    print("TEST 4: Enviar Recordatorios de Pago")
    print("="*60)
    
    url = f"{BASE_URL}/scheduled-tasks/send-payment-reminders"
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    try:
        response = requests.post(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Tarea ejecutada exitosamente")
            print(f"📊 Recordatorios pendientes: {data.get('warnings_count')}")
            print(f"📧 Emails enviados: {data.get('sent_count')}")
            
            return True
        else:
            print(f"\n❌ Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        return False


def run_all_tests():
    """
    Ejecuta todas las pruebas
    """
    print("\n" + "="*60)
    print("🧪 SUITE DE PRUEBAS - SISTEMA DE PLAZO DE PAGO")
    print("="*60)
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    
    results = {
        "Confirmar Reserva": test_confirm_booking(),
        "Estado de Pagos": test_check_payment_status(),
        "Cancelar Expiradas": test_cancel_expired(),
        "Enviar Recordatorios": test_send_reminders()
    }
    
    print("\n" + "="*60)
    print("📊 RESULTADOS DE LAS PRUEBAS")
    print("="*60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    total_pass = sum(1 for r in results.values() if r)
    total_tests = len(results)
    
    print(f"\nTotal: {total_pass}/{total_tests} pruebas exitosas")
    print("="*60 + "\n")


if __name__ == "__main__":
    print("\n⚠️  IMPORTANTE: Actualiza los tokens y booking_id antes de ejecutar\n")
    
    # Descomentar para ejecutar todas las pruebas
    # run_all_tests()
    
    # O ejecutar pruebas individuales:
    # test_confirm_booking()
    # test_check_payment_status()
    # test_cancel_expired()
    # test_send_reminders()
    
    print("ℹ️  Para ejecutar las pruebas:")
    print("   1. Actualiza OWNER_TOKEN, ADMIN_TOKEN y BOOKING_ID")
    print("   2. Descomenta run_all_tests() o las pruebas individuales")
    print("   3. Ejecuta: python test_payment_deadline.py\n")
