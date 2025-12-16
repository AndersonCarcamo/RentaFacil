"""
Script para probar el envío de emails de notificación de reservas
Ejecutar desde la raíz del proyecto Backend: python test_email.py
"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.email_service import EmailService


def test_booking_notification():
    """Prueba el envío de notificación de reserva"""
    
    print("=" * 60)
    print("🧪 TEST DE NOTIFICACIÓN DE RESERVA")
    print("=" * 60)
    
    # Verificar configuración
    print("\n📋 Configuración actual:")
    print(f"  SMTP_HOST: {os.getenv('SMTP_HOST', 'No configurado')}")
    print(f"  SMTP_PORT: {os.getenv('SMTP_PORT', 'No configurado')}")
    print(f"  SMTP_USER: {os.getenv('SMTP_USER', 'No configurado')}")
    print(f"  EMAIL_FROM: {os.getenv('EMAIL_FROM', 'No configurado')}")
    print(f"  EMAIL_ENABLED: {os.getenv('EMAIL_ENABLED', 'false')}")
    print(f"  FRONTEND_URL: {os.getenv('FRONTEND_URL', 'No configurado')}")
    
    # Solicitar email de prueba
    print("\n" + "=" * 60)
    owner_email = input("📧 Ingresa el email del PROPIETARIO (quien recibirá la notificación): ").strip()
    
    if not owner_email:
        print("❌ Email requerido")
        return
    
    print("\n🔄 Creando servicio de email...")
    email_service = EmailService()
    
    print("📤 Enviando email de prueba...")
    print(f"   Destinatario: {owner_email}")
    print("   Asunto: 🏠 Nueva Solicitud de Reserva - Departamento Moderno en Miraflores")
    
    # Datos de prueba
    result = email_service.send_booking_request_notification(
        owner_email=owner_email,
        owner_name="Juan Pérez",
        guest_name="María López",
        property_title="Departamento Moderno en Miraflores - Vista al Parque",
        check_in="15/12/2025",
        check_out="20/12/2025",
        guests=2,
        total_price=1000.00,
        booking_id="test-booking-123456",
        message="Hola! Me gustaría reservar tu hermoso departamento para mis vacaciones. Viajaré con mi pareja y nos encantaría disfrutar de la vista al parque. ¿Está disponible?"
    )
    
    print("\n" + "=" * 60)
    if result:
        print("✅ EMAIL ENVIADO EXITOSAMENTE!")
        print(f"📧 Revisa la bandeja de entrada de: {owner_email}")
        print("💡 Si no lo ves, revisa la carpeta de SPAM")
    else:
        print("❌ ERROR AL ENVIAR EMAIL")
        print("💡 Revisa la configuración en el archivo .env")
        print("💡 Verifica los logs arriba para más detalles")
    print("=" * 60)


def test_simple_email():
    """Prueba básica de envío de email"""
    
    print("\n" + "=" * 60)
    print("🧪 TEST BÁSICO DE EMAIL")
    print("=" * 60)
    
    email = input("📧 Ingresa un email de prueba: ").strip()
    
    if not email:
        print("❌ Email requerido")
        return
    
    email_service = EmailService()
    
    html_content = """
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #667eea;">✅ Email de Prueba</h1>
        <p>Este es un email de prueba desde EasyRent.</p>
        <p>Si recibes este mensaje, significa que el sistema de emails está funcionando correctamente.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
            EasyRent - Sistema de Gestión de Propiedades
        </p>
    </body>
    </html>
    """
    
    result = email_service.send_email(
        to_email=email,
        subject="🧪 Test de Email - EasyRent",
        html_content=html_content,
        text_content="Este es un email de prueba desde EasyRent."
    )
    
    print("\n" + "=" * 60)
    if result:
        print("✅ EMAIL ENVIADO EXITOSAMENTE!")
        print(f"📧 Revisa: {email}")
    else:
        print("❌ ERROR AL ENVIAR EMAIL")
    print("=" * 60)


if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           📧 SISTEMA DE EMAILS - EASYRENT                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    print("Selecciona una opción:")
    print("1. Probar notificación de reserva (email completo)")
    print("2. Probar envío básico de email")
    print("0. Salir")
    
    choice = input("\nOpción: ").strip()
    
    if choice == "1":
        test_booking_notification()
    elif choice == "2":
        test_simple_email()
    elif choice == "0":
        print("👋 ¡Hasta luego!")
    else:
        print("❌ Opción inválida")
