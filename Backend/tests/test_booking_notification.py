"""
Script de prueba para verificar el sistema de notificaciones por email
en la creación de reservas.

Uso:
    python Backend/test_booking_notification.py
"""

import sys
import os
from pathlib import Path

# Agregar el directorio Backend al path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.services.email_service import EmailService
from datetime import datetime

def test_email_notification():
    """Prueba el envío de email de notificación de reserva"""
    
    print("=" * 60)
    print("🧪 TEST: Sistema de Notificación de Reservas")
    print("=" * 60)
    
    # Inicializar servicio de email
    email_service = EmailService()
    
    # Datos de prueba
    test_data = {
        "owner_email": input("\n📧 Email del propietario (para prueba): ").strip(),
        "owner_name": "Juan Pérez (Propietario)",
        "guest_name": "María García (Huésped)",
        "property_title": "Hermoso Departamento en Miraflores con Vista al Mar",
        "check_in": "15/12/2025",
        "check_out": "20/12/2025",
        "guests": 3,
        "total_price": 750.00,
        "booking_id": "test-booking-" + datetime.now().strftime("%Y%m%d-%H%M%S"),
        "message": "Hola, me gustaría reservar tu propiedad para pasar unos días con mi familia. Somos personas tranquilas y cuidadosas."
    }
    
    print("\n📋 Datos de la prueba:")
    print(f"   Propietario: {test_data['owner_name']}")
    print(f"   Email: {test_data['owner_email']}")
    print(f"   Huésped: {test_data['guest_name']}")
    print(f"   Propiedad: {test_data['property_title']}")
    print(f"   Check-in: {test_data['check_in']}")
    print(f"   Check-out: {test_data['check_out']}")
    print(f"   Huéspedes: {test_data['guests']}")
    print(f"   Precio Total: S/ {test_data['total_price']:.2f}")
    print(f"   Booking ID: {test_data['booking_id']}")
    
    # Confirmar envío
    confirm = input("\n¿Deseas enviar el email de prueba? (s/n): ").strip().lower()
    
    if confirm != 's':
        print("\n❌ Prueba cancelada")
        return
    
    print("\n📤 Enviando email de notificación...")
    
    try:
        result = email_service.send_booking_request_notification(
            owner_email=test_data["owner_email"],
            owner_name=test_data["owner_name"],
            guest_name=test_data["guest_name"],
            property_title=test_data["property_title"],
            check_in=test_data["check_in"],
            check_out=test_data["check_out"],
            guests=test_data["guests"],
            total_price=test_data["total_price"],
            booking_id=test_data["booking_id"],
            message=test_data["message"]
        )
        
        if result:
            print("\n✅ EMAIL ENVIADO EXITOSAMENTE")
            print(f"\n📧 Revisa la bandeja de entrada de: {test_data['owner_email']}")
            print(f"\n🔗 El email debería contener un enlace a:")
            print(f"   {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard/bookings/{test_data['booking_id']}")
        else:
            print("\n❌ ERROR: El email no pudo ser enviado")
            print("   Verifica la configuración SMTP en el archivo .env")
            
    except Exception as e:
        print(f"\n❌ ERROR al enviar email: {str(e)}")
        print("\n🔍 Posibles causas:")
        print("   1. Configuración SMTP incorrecta en .env")
        print("   2. Credenciales de email inválidas")
        print("   3. Email bloqueado por Gmail (usar contraseña de aplicación)")
        print("   4. Variables de entorno no cargadas")
    
    print("\n" + "=" * 60)
    print("Prueba finalizada")
    print("=" * 60)

def check_email_config():
    """Verifica la configuración de email"""
    print("\n🔍 Verificando configuración de email...")
    
    required_vars = [
        'EMAIL_ENABLED',
        'SMTP_HOST',
        'SMTP_PORT', 
        'SMTP_USERNAME',
        'SMTP_PASSWORD',
        'EMAIL_FROM',
        'EMAIL_FROM_NAME',
        'FRONTEND_URL'
    ]
    
    missing = []
    configured = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Ocultar contraseña
            if 'PASSWORD' in var:
                display_value = '*' * 8
            else:
                display_value = value
            print(f"   ✅ {var}: {display_value}")
            configured.append(var)
        else:
            print(f"   ❌ {var}: NO CONFIGURADO")
            missing.append(var)
    
    if missing:
        print(f"\n⚠️ FALTAN {len(missing)} variable(s) de entorno:")
        for var in missing:
            print(f"   - {var}")
        print("\n📝 Agrega estas variables en Backend/.env")
        return False
    
    print(f"\n✅ Todas las variables configuradas ({len(configured)}/{len(required_vars)})")
    return True

if __name__ == "__main__":
    # Cargar variables de entorno
    from dotenv import load_dotenv
    load_dotenv()
    
    print("\n" + "=" * 60)
    print("🏠 Sistema de Notificaciones de Reserva - EasyRent")
    print("=" * 60)
    
    # Verificar configuración primero
    if check_email_config():
        print("\n" + "-" * 60)
        test_email_notification()
    else:
        print("\n❌ No se puede continuar sin configuración completa")
        sys.exit(1)
