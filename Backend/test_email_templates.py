"""
Script de prueba para las plantillas de email personalizadas
Genera archivos HTML de ejemplo sin enviar correos
"""
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

# Configurar Jinja2
template_dir = Path(__file__).parent / "app" / "templates" / "email"
output_dir = Path(__file__).parent / "email_previews"
output_dir.mkdir(exist_ok=True)

jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))

# Variables comunes
common_context = {
    'frontend_url': 'https://rentafacil.com',
    'logo_url': 'https://rentafacil.com/images/logo_sin_fondo.png'
}

# 1. Probar booking_request.html
print("📧 Generando preview de booking_request...")
booking_request_context = {
    **common_context,
    'owner_name': 'Carlos Rodríguez',
    'guest_name': 'María García',
    'property_title': 'Departamento Moderno en Miraflores',
    'check_in': '15 de Enero, 2024',
    'check_out': '20 de Enero, 2024',
    'guests': 2,
    'total_price': 850.00,
    'booking_id': 'BK-12345',
    'message': '¡Hola! Somos una pareja que viene de viaje por trabajo. Nos gustaría saber si es posible hacer check-in un poco más temprano, alrededor de las 12pm. ¡Muchas gracias!'
}

template = jinja_env.get_template('booking_request.html')
html = template.render(**booking_request_context)
output_file = output_dir / 'preview_booking_request.html'
output_file.write_text(html, encoding='utf-8')
print(f"✅ Guardado en: {output_file}")

# 2. Probar payment_request.html
print("\n💳 Generando preview de payment_request...")
payment_request_context = {
    **common_context,
    'guest_name': 'María García',
    'property_title': 'Departamento Moderno en Miraflores',
    'check_in': '15 de Enero, 2024',
    'check_out': '20 de Enero, 2024',
    'guests': 2,
    'total_price': 850.00,
    'payment_deadline': '15 de Diciembre, 2023 - 18:00',
    'payment_url': 'https://rentafacil.com/my-bookings/BK-12345',
    'booking_id': 'BK-12345'
}

template = jinja_env.get_template('payment_request.html')
html = template.render(**payment_request_context)
output_file = output_dir / 'preview_payment_request.html'
output_file.write_text(html, encoding='utf-8')
print(f"✅ Guardado en: {output_file}")

# 3. Probar booking_confirmation.html
print("\n🎉 Generando preview de booking_confirmation...")
confirmation_context = {
    **common_context,
    'guest_name': 'María García',
    'property_title': 'Departamento Moderno en Miraflores',
    'check_in': '15 de Enero, 2024',
    'check_out': '20 de Enero, 2024',
    'guests': 2,
    'total_price': 850.00,
    'owner_name': 'Carlos Rodríguez',
    'owner_phone': '+51 987 654 321',
    'booking_id': 'BK-12345'
}

template = jinja_env.get_template('booking_confirmation.html')
html = template.render(**confirmation_context)
output_file = output_dir / 'preview_booking_confirmation.html'
output_file.write_text(html, encoding='utf-8')
print(f"✅ Guardado en: {output_file}")

print(f"\n✨ ¡Listo! Abre los archivos en {output_dir} para ver las plantillas.")
print("   Puedes abrirlos en tu navegador para ver cómo se ven los correos.")
