"""
Script para probar el sistema de envío de emails
"""
import sys
from app.services.email_service import email_service
from app.core.config import settings


def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def verify_configuration():
    """Verificar la configuración del email"""
    print_section("🔍 Verificando Configuración")
    
    print(f"Email Enabled: {settings.email_enabled}")
    print(f"SMTP Host: {settings.smtp_host}")
    print(f"SMTP Port: {settings.smtp_port}")
    print(f"SMTP User: {settings.smtp_user or settings.smtp_username or 'NO CONFIGURADO'}")
    print(f"SMTP Password: {'✅ Configurado' if settings.smtp_password else '❌ NO CONFIGURADO'}")
    print(f"Email From: {settings.email_from}")
    print(f"Email From Name: {settings.email_from_name}")
    
    # Verificar si hay credenciales
    smtp_user = settings.smtp_user or settings.smtp_username
    if not smtp_user or not settings.smtp_password:
        print("\n❌ ERROR: Credenciales SMTP no configuradas")
        print("   Verifica tu archivo .env")
        return False
    
    print("\n✅ Configuración válida")
    return True


def test_simple_email(to_email: str):
    """Enviar email de prueba simple"""
    print_section(f"📧 Enviando Email de Prueba a: {to_email}")
    
    subject = "🧪 Prueba de Sistema de Emails - EasyRent"
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
                border-radius: 10px;
                margin-top: 20px;
            }
            .success-box {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .info-box {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                color: #0c5460;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 12px;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Sistema de Emails Funcionando</h1>
        </div>
        
        <div class="content">
            <div class="success-box">
                <h3 style="margin-top: 0;">✅ ¡Prueba Exitosa!</h3>
                <p style="margin-bottom: 0;">
                    Si estás leyendo este mensaje, significa que el sistema de envío de emails 
                    de EasyRent está configurado correctamente y funcionando.
                </p>
            </div>
            
            <h3>📋 Detalles del Sistema</h3>
            <ul>
                <li><strong>Servidor SMTP:</strong> Gmail (smtp.gmail.com)</li>
                <li><strong>Puerto:</strong> 587 (TLS)</li>
                <li><strong>Remitente:</strong> EasyRent</li>
                <li><strong>Estado:</strong> Operativo ✅</li>
            </ul>
            
            <div class="info-box">
                <h4 style="margin-top: 0;">🚀 Próximos Pasos</h4>
                <p>El sistema ahora puede enviar:</p>
                <ul>
                    <li>Notificaciones de nuevas reservas</li>
                    <li>Confirmaciones de pago</li>
                    <li>Mensajes de chat (próximamente)</li>
                    <li>Recordatorios y alertas</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px; text-align: center; color: #667eea; font-size: 18px;">
                <strong>¡Todo listo para usar! 🎊</strong>
            </p>
        </div>
        
        <div class="footer">
            <p>Este es un email de prueba del sistema EasyRent</p>
            <p>© 2025 EasyRent - Sistema de Gestión de Propiedades</p>
        </div>
    </body>
    </html>
    """
    
    text_content = """
    ¡Sistema de Emails Funcionando!
    
    ✅ Prueba Exitosa
    
    Si estás leyendo este mensaje, el sistema de envío de emails de EasyRent 
    está configurado correctamente.
    
    Detalles:
    - Servidor: Gmail (smtp.gmail.com)
    - Puerto: 587 (TLS)
    - Remitente: EasyRent
    - Estado: Operativo
    
    ¡Todo listo para usar!
    
    ---
    EasyRent - Sistema de Gestión de Propiedades
    """
    
    try:
        success = email_service.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
        
        if success:
            print("✅ Email enviado exitosamente!")
            print(f"   Revisa la bandeja de entrada de: {to_email}")
            print("   (También revisa la carpeta de SPAM si no lo ves)")
            return True
        else:
            print("❌ Error al enviar email")
            print("   Revisa los logs para más detalles")
            return False
            
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False


def test_booking_notification(owner_email: str):
    """Probar notificación de reserva"""
    print_section(f"🏠 Enviando Notificación de Reserva de Prueba")
    
    try:
        success = email_service.send_booking_request_notification(
            owner_email=owner_email,
            owner_name="Propietario Demo",
            guest_name="Cliente de Prueba",
            property_title="Moderno Departamento en San Isidro",
            check_in="2025-12-20",
            check_out="2025-12-25",
            guests=2,
            total_price=1500.00,
            booking_id="test-booking-123",
            message="Hola, estoy interesado en tu propiedad. ¿Tiene estacionamiento?"
        )
        
        if success:
            print("✅ Notificación de reserva enviada!")
            print(f"   Revisa el email: {owner_email}")
            return True
        else:
            print("❌ Error al enviar notificación")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def main():
    """Función principal"""
    print("\n" + "="*60)
    print("  🧪 PRUEBA DEL SISTEMA DE EMAILS - EASYRENT")
    print("="*60)
    
    # Verificar configuración
    if not verify_configuration():
        return
    
    # Solicitar email de prueba
    print("\n📧 Ingresa el email donde quieres recibir las pruebas:")
    print("   (Puedes usar tu email personal para verificar que funciona)")
    test_email = input("Email: ").strip()
    
    if not test_email or '@' not in test_email:
        print("❌ Email inválido")
        return
    
    # Menú de opciones
    print("\n¿Qué tipo de email quieres probar?")
    print("1. Email simple de prueba")
    print("2. Notificación de reserva (similar a producción)")
    print("3. Ambos")
    
    choice = input("\nOpción (1/2/3): ").strip()
    
    if choice in ['1', '3']:
        test_simple_email(test_email)
    
    if choice in ['2', '3']:
        test_booking_notification(test_email)
    
    print_section("✅ Pruebas Completadas")
    print("Revisa tu bandeja de entrada (y SPAM si no ves los emails)")
    print("\n💡 Si funcionó correctamente, el sistema está listo para:")
    print("   - Enviar notificaciones de reservas")
    print("   - Enviar notificaciones de chat (por implementar)")
    print("   - Cualquier otro tipo de email automático")


if __name__ == "__main__":
    main()
