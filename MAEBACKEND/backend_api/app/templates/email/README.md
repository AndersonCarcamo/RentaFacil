# Sistema de Plantillas de Email - Renta Fácil

Este directorio contiene las plantillas HTML personalizadas para los correos electrónicos de notificación del sistema Renta Fácil.

## 🎨 Diseño y Branding

Todas las plantillas utilizan la identidad visual de **Renta Fácil**:

### Paleta de Colores

- **Amarillo Principal (CTA)**: `#F5C842`
- **Amarillo Claro**: `#FFE488`
- **Amarillo Oscuro**: `#D4A926`
- **Azul Principal**: `#22ACF5` (Informacional)
- **Azul Oscuro**: `#1D7FAF`
- **Navy (Textos oscuros)**: `#0C2D55`

### Elementos de Diseño

- Gradientes en headers con colores de marca
- Logo de Renta Fácil en header y footer
- Botones CTA con gradiente amarillo
- Tarjetas de información con borde azul
- Diseño responsive optimizado para móviles

## 📧 Plantillas Disponibles

### 1. `base.html`
Plantilla base que contiene:
- Estructura HTML común
- Estilos CSS reutilizables
- Header y footer estandarizados
- Variables comunes (logo_url, frontend_url)

**Uso**: Puede extenderse para crear nuevas plantillas consistentes.

### 2. `booking_request.html`
**Propósito**: Notificar al propietario sobre una nueva solicitud de reserva.

**Variables requeridas**:
- `owner_name`: Nombre del propietario
- `guest_name`: Nombre del huésped
- `property_title`: Título de la propiedad
- `check_in`: Fecha de entrada
- `check_out`: Fecha de salida
- `guests`: Número de huéspedes
- `total_price`: Precio total
- `booking_id`: ID de la reserva
- `message` (opcional): Mensaje del huésped

**Características**:
- Detalles completos de la reserva
- Precio destacado en gradiente amarillo
- Botón CTA para gestionar la reserva
- Mensaje del huésped (si existe)
- Recordatorio de tiempo de respuesta

### 3. `payment_request.html`
**Propósito**: Solicitar al huésped que complete el pago de su reserva aprobada.

**Variables requeridas**:
- `guest_name`: Nombre del huésped
- `property_title`: Título de la propiedad
- `check_in`: Fecha de entrada
- `check_out`: Fecha de salida
- `guests`: Número de huéspedes
- `total_price`: Precio total
- `payment_deadline`: Fecha límite de pago
- `payment_url`: URL para realizar el pago
- `booking_id`: ID de la reserva

**Características**:
- Detalles de la reserva
- Precio total destacado
- Fecha límite de pago prominente
- Métodos de pago aceptados
- Advertencia sobre cancelación automática
- Botón CTA para pagar
- Información de seguridad

### 4. `booking_confirmation.html`
**Propósito**: Confirmar al huésped que su reserva está completa y pagada.

**Variables requeridas**:
- `guest_name`: Nombre del huésped
- `property_title`: Título de la propiedad
- `check_in`: Fecha de entrada
- `check_out`: Fecha de salida
- `guests`: Número de huéspedes
- `total_price`: Precio pagado
- `owner_name`: Nombre del anfitrión
- `owner_phone` (opcional): Teléfono del anfitrión
- `booking_id`: ID de la reserva

**Características**:
- Badge de confirmación exitosa
- Detalles completos de la reserva
- Información de contacto del anfitrión
- Precio total pagado
- Preparativos para la estadía
- Animación de celebración

## 🔧 Uso en el Código

### Renderizar una Plantilla

```python
from app.services.email_service import email_service

# Ejemplo: Enviar notificación de reserva
email_service.send_booking_request_notification(
    owner_email="propietario@example.com",
    owner_name="Juan Pérez",
    guest_name="María García",
    property_title="Departamento en Miraflores",
    check_in="15 Enero 2024",
    check_out="20 Enero 2024",
    guests=2,
    total_price=500.00,
    booking_id="12345",
    message="Nos gustaría llegar temprano"
)
```

### Crear una Nueva Plantilla

1. Crea un nuevo archivo HTML en este directorio
2. Usa la estructura y estilos de `base.html` como referencia
3. Incluye las variables de Jinja2: `{{ variable_name }}`
4. Agrega el método correspondiente en `EmailService`

```python
def send_new_notification(self, **kwargs):
    html_content = self.render_template(
        'new_template.html',
        **kwargs
    )
    
    return self.send_email(
        to_email=kwargs['recipient_email'],
        subject="Asunto del correo",
        html_content=html_content
    )
```

## 🎯 Variables Comunes Automáticas

Estas variables están disponibles en todas las plantillas automáticamente:

- `frontend_url`: URL del frontend (ej: https://rentafacil.com)
- `logo_url`: URL del logo de Renta Fácil

## 📱 Responsive Design

Todas las plantillas incluyen media queries para optimizar la visualización en dispositivos móviles:

```css
@media only screen and (max-width: 600px) {
    /* Ajustes para móvil */
    .email-header, .email-content {
        padding: 30px 20px;
    }
    
    .detail-row {
        flex-direction: column;
    }
}
```

## ✨ Mejores Prácticas

1. **Consistencia**: Usa siempre los colores de la paleta de marca
2. **Claridad**: Los CTAs deben ser evidentes y usar gradiente amarillo
3. **Accesibilidad**: Incluye texto alternativo y versión text/plain
4. **Testing**: Prueba en múltiples clientes de correo (Gmail, Outlook, etc.)
5. **Tamaño**: Mantén las imágenes optimizadas y usa CDN cuando sea posible

## 🔄 Actualizaciones Futuras

Plantillas pendientes de crear:
- Recordatorio de check-in
- Solicitud de reseña post-estadía
- Notificación de cancelación
- Bienvenida a nuevos usuarios
- Recuperación de contraseña
- Verificación de email

## 📞 Soporte

Para preguntas sobre las plantillas, contacta al equipo de desarrollo o revisa la documentación en:
- Backend: `app/services/email_service.py`
- Configuración: `app/core/config.py`
