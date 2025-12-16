"""
Script de diagnóstico directo de SMTP
Prueba la conexión sin usar el EmailService
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def test_smtp_connection():
    """Probar conexión SMTP paso a paso"""
    
    # Credenciales directas
    SMTP_HOST = "smtp.gmail.com"
    SMTP_PORT = 587
    SMTP_USER = "rentafacildirectoriohomesperu@gmail.com"
    SMTP_PASSWORD = "pemwanckkvwuqhmh"
    
    print("="*60)
    print("  🔍 DIAGNÓSTICO SMTP - CONEXIÓN DIRECTA")
    print("="*60)
    print(f"\nHost: {SMTP_HOST}")
    print(f"Port: {SMTP_PORT}")
    print(f"User: {SMTP_USER}")
    print(f"Password: {SMTP_PASSWORD[:4]}{'*' * (len(SMTP_PASSWORD) - 4)}")
    print(f"Password Length: {len(SMTP_PASSWORD)} caracteres")
    
    try:
        print("\n📡 Paso 1: Conectando al servidor SMTP...")
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        print("   ✅ Conexión establecida")
        
        print("\n🔐 Paso 2: Iniciando TLS...")
        server.starttls()
        print("   ✅ TLS iniciado")
        
        print("\n🔑 Paso 3: Autenticando...")
        print(f"   Usuario: {SMTP_USER}")
        print(f"   Password: {SMTP_PASSWORD}")
        
        server.login(SMTP_USER, SMTP_PASSWORD)
        print("   ✅ Autenticación exitosa!")
        
        print("\n📧 Paso 4: Enviando email de prueba...")
        test_email = input("\n   Ingresa tu email para recibir la prueba: ").strip()
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "🧪 Prueba Directa SMTP - EasyRent"
        msg['From'] = SMTP_USER
        msg['To'] = test_email
        
        html = """
        <html>
            <body style="font-family: Arial; padding: 20px;">
                <h2 style="color: #667eea;">✅ Conexión SMTP Exitosa</h2>
                <p>Este email fue enviado directamente usando SMTP sin el framework.</p>
                <p><strong>Esto confirma que las credenciales son correctas.</strong></p>
                <hr>
                <p style="color: #666; font-size: 12px;">EasyRent - Prueba de Diagnóstico SMTP</p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        
        server.sendmail(SMTP_USER, [test_email], msg.as_string())
        print("   ✅ Email enviado!")
        
        server.quit()
        print("\n🎉 TODAS LAS PRUEBAS EXITOSAS")
        print(f"   Revisa la bandeja de: {test_email}")
        print("   (También revisa SPAM)")
        
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ ERROR DE AUTENTICACIÓN")
        print(f"   Código: {e.smtp_code}")
        print(f"   Mensaje: {e.smtp_error.decode() if hasattr(e.smtp_error, 'decode') else e.smtp_error}")
        print("\n🔍 Posibles soluciones:")
        print("   1. Verifica que 2FA esté habilitado en Gmail")
        print("   2. Genera una nueva App Password")
        print("   3. Revisa: https://myaccount.google.com/apppasswords")
        print("   4. Asegúrate de copiar la password SIN espacios")
        return False
        
    except smtplib.SMTPException as e:
        print(f"\n❌ ERROR SMTP: {str(e)}")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR GENERAL: {str(e)}")
        print(f"   Tipo: {type(e).__name__}")
        return False


def check_app_password_format():
    """Verificar formato de la App Password"""
    password = "tddfqfqkfznbjgvhx"
    
    print("\n🔍 Verificando formato de App Password:")
    print(f"   Password: {password}")
    print(f"   Length: {len(password)}")
    print(f"   Tiene espacios: {'Sí' if ' ' in password else 'No ✅'}")
    print(f"   Solo minúsculas: {'Sí ✅' if password.islower() else 'No'}")
    print(f"   Solo letras: {'Sí ✅' if password.isalpha() else 'No (contiene números/símbolos)'}")
    
    if len(password) == 16 and password.isalpha() and password.islower() and ' ' not in password:
        print("   ✅ Formato de App Password válido")
        return True
    else:
        print("   ⚠️  Formato inusual (pero puede ser válido)")
        return False


if __name__ == "__main__":
    check_app_password_format()
    print("\n" + "="*60)
    input("Presiona ENTER para probar la conexión SMTP...")
    test_smtp_connection()
