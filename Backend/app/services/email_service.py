"""
Email Service - Envío de correos electrónicos
Soporta múltiples proveedores: SMTP, SendGrid, AWS SES
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from jinja2 import Template
from app.core.config import settings
from app.core.logging import logger


class EmailService:
    """Servicio para envío de correos electrónicos"""
    
    def __init__(self):
        self.from_email = settings.email_from
        self.from_name = settings.email_from_name
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_username or settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.enabled = settings.email_enabled
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Enviar correo electrónico
        
        Args:
            to_email: Email del destinatario
            subject: Asunto del correo
            html_content: Contenido HTML
            text_content: Contenido en texto plano (opcional)
            cc: Lista de emails en copia
            bcc: Lista de emails en copia oculta
            
        Returns:
            bool: True si se envió correctamente
        """
        if not self.enabled:
            logger.info(f"📧 Email disabled - Would send to {to_email}: {subject}")
            return True
        
        try:
            # Crear mensaje
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            if bcc:
                msg['Bcc'] = ', '.join(bcc)
            
            # Agregar contenido
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                msg.attach(text_part)
            
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Enviar email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                
                recipients = [to_email]
                if cc:
                    recipients.extend(cc)
                if bcc:
                    recipients.extend(bcc)
                
                server.sendmail(self.from_email, recipients, msg.as_string())
            
            logger.info(f"✅ Email sent to {to_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sending email to {to_email}: {str(e)}")
            return False
    
    def send_booking_request_notification(
        self,
        owner_email: str,
        owner_name: str,
        guest_name: str,
        property_title: str,
        check_in: str,
        check_out: str,
        guests: int,
        total_price: float,
        booking_id: str,
        message: Optional[str] = None
    ) -> bool:
        """
        Enviar notificación de nueva solicitud de reserva al propietario
        """
        subject = f"🏠 Nueva Solicitud de Reserva - {property_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border: 1px solid #ddd;
                }}
                .booking-details {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }}
                .detail-label {{
                    font-weight: bold;
                    color: #666;
                }}
                .detail-value {{
                    color: #333;
                }}
                .message-box {{
                    background: #fff3cd;
                    padding: 15px;
                    border-left: 4px solid #ffc107;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .cta-button {{
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏠 Nueva Solicitud de Reserva</h1>
            </div>
            
            <div class="content">
                <p>Hola <strong>{owner_name}</strong>,</p>
                
                <p>¡Buenas noticias! Has recibido una nueva solicitud de reserva para tu propiedad:</p>
                
                <div class="booking-details">
                    <h3 style="margin-top: 0; color: #667eea;">📋 Detalles de la Reserva</h3>
                    
                    <div class="detail-row">
                        <span class="detail-label">Propiedad:</span>
                        <span class="detail-value">{property_title}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Huésped:</span>
                        <span class="detail-value">{guest_name}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Check-in:</span>
                        <span class="detail-value">{check_in}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Check-out:</span>
                        <span class="detail-value">{check_out}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Huéspedes:</span>
                        <span class="detail-value">{guests} persona(s)</span>
                    </div>
                    
                    <div class="detail-row" style="border-bottom: none;">
                        <span class="detail-label">Precio Total:</span>
                        <span class="detail-value" style="font-size: 20px; color: #667eea; font-weight: bold;">
                            S/ {total_price:.2f}
                        </span>
                    </div>
                </div>
                
                {f'''
                <div class="message-box">
                    <strong>💬 Mensaje del huésped:</strong>
                    <p style="margin: 10px 0 0 0;">{message}</p>
                </div>
                ''' if message else ''}
                
                <div style="text-align: center; margin: 30px 0;">
                    <p style="font-weight: bold; margin-bottom: 20px; font-size: 16px;">
                        Por favor revisa y gestiona esta solicitud de reserva
                    </p>
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard/bookings/{booking_id}" 
                       class="cta-button"
                       style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; font-size: 16px;">
                        📋 Ver Detalles y Gestionar Reserva
                    </a>
                </div>
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard/bookings" 
                       style="color: #667eea; text-decoration: none; font-size: 14px;">
                        Ver todas tus reservas →
                    </a>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    <strong>⏰ Recuerda:</strong> Es importante responder pronto para mantener una buena 
                    experiencia con tus huéspedes. Puedes confirmar o rechazar la solicitud desde tu panel.
                </p>
            </div>
            
            <div class="footer">
                <p>Este es un correo automático de EasyRent</p>
                <p>Si tienes alguna pregunta, contáctanos en soporte@easyrent.com</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Nueva Solicitud de Reserva
        
        Hola {owner_name},
        
        Has recibido una nueva solicitud de reserva:
        
        Propiedad: {property_title}
        Huésped: {guest_name}
        Check-in: {check_in}
        Check-out: {check_out}
        Huéspedes: {guests}
        Precio Total: S/ {total_price:.2f}
        
        {"Mensaje: " + message if message else ""}
        
        Ver detalles: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/bookings/{booking_id}
        
        Saludos,
        El equipo de EasyRent
        """
        
        return self.send_email(
            to_email=owner_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
    
    def send_payment_request_email(
        self,
        guest_email: str,
        guest_name: str,
        property_title: str,
        check_in: str,
        check_out: str,
        nights: int,
        guests: int,
        total_price: float,
        reservation_amount: float,
        booking_id: str,
        payment_deadline: str,
        owner_name: str
    ) -> bool:
        """
        Enviar email solicitando pago del 50% para confirmar reserva
        El huésped tiene 6 horas para completar el pago
        """
        subject = f"✅ Reserva Aceptada - Completa tu Pago (50%) - {property_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                }}
                .header {{
                    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 0 0 10px 10px;
                }}
                .success-icon {{
                    font-size: 60px;
                    text-align: center;
                    margin: 20px 0;
                }}
                .urgent-box {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .booking-details {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }}
                .detail-label {{
                    font-weight: bold;
                    color: #666;
                }}
                .detail-value {{
                    color: #333;
                }}
                .price-box {{
                    background: #e8f5e9;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 20px 0;
                }}
                .cta-button {{
                    display: inline-block;
                    background: #11998e;
                    color: white;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                    font-size: 16px;
                }}
                .payment-steps {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .step {{
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }}
                .step:last-child {{
                    border-bottom: none;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>✅ ¡Tu Reserva ha sido Aceptada!</h1>
            </div>
            
            <div class="content">
                <div class="success-icon">🎉</div>
                
                <p>Hola <strong>{guest_name}</strong>,</p>
                
                <p>¡Excelentes noticias! <strong>{owner_name}</strong> ha aceptado tu solicitud de reserva para:</p>
                
                <div class="booking-details">
                    <h3 style="margin-top: 0; color: #11998e;">📋 Detalles de tu Reserva</h3>
                    
                    <div class="detail-row">
                        <span class="detail-label">Propiedad:</span>
                        <span class="detail-value">{property_title}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Anfitrión:</span>
                        <span class="detail-value">{owner_name}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Check-in:</span>
                        <span class="detail-value">{check_in}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Check-out:</span>
                        <span class="detail-value">{check_out}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Noches:</span>
                        <span class="detail-value">{nights} noche(s)</span>
                    </div>
                    
                    <div class="detail-row" style="border-bottom: none;">
                        <span class="detail-label">Huéspedes:</span>
                        <span class="detail-value">{guests} persona(s)</span>
                    </div>
                </div>
                
                <div class="urgent-box">
                    <h3 style="margin-top: 0; color: #f57c00;">⏰ Acción Requerida - Plazo: 6 Horas</h3>
                    <p style="margin: 0; font-size: 15px;">
                        <strong>Límite para completar el pago:</strong> {payment_deadline}
                    </p>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                        Si no se recibe el pago en este plazo, la reserva será cancelada automáticamente 
                        y la propiedad volverá a estar disponible para otras fechas.
                    </p>
                </div>
                
                <div class="price-box">
                    <p style="margin: 0; font-size: 14px; color: #666;">Precio Total de la Reserva</p>
                    <p style="margin: 10px 0; font-size: 24px; color: #333; font-weight: bold;">
                        S/ {total_price:.2f}
                    </p>
                    
                    <hr style="border: none; border-top: 2px dashed #ccc; margin: 20px 0;">
                    
                    <p style="margin: 0; font-size: 14px; color: #666;">Monto a Pagar Ahora (50%)</p>
                    <p style="margin: 10px 0; font-size: 32px; color: #11998e; font-weight: bold;">
                        S/ {reservation_amount:.2f}
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
                        El 50% restante (S/ {total_price - reservation_amount:.2f}) se pagará al momento del check-in
                    </p>
                </div>
                
                <div class="payment-steps">
                    <h3 style="margin-top: 0; color: #11998e;">💳 Pasos para Completar tu Pago</h3>
                    
                    <div class="step">
                        <strong>1. Realiza la transferencia bancaria</strong>
                        <p style="margin: 5px 0 0 20px; color: #666;">
                            Banco: BCP<br>
                            Cuenta Corriente: 123-456789-0-00<br>
                            CCI: 00212345678900000000<br>
                            Titular: EasyRent Perú S.A.C.<br>
                            Monto: <strong>S/ {reservation_amount:.2f}</strong>
                        </p>
                    </div>
                    
                    <div class="step">
                        <strong>2. Guarda el comprobante de pago</strong>
                        <p style="margin: 5px 0 0 20px; color: #666;">
                            Toma una captura o foto del voucher de transferencia
                        </p>
                    </div>
                    
                    <div class="step">
                        <strong>3. Envía el comprobante</strong>
                        <p style="margin: 5px 0 0 20px; color: #666;">
                            Sube tu comprobante en la página de tu reserva o envíalo por WhatsApp
                        </p>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/my-bookings/{booking_id}" 
                       class="cta-button">
                        💰 Subir Comprobante de Pago
                    </a>
                </div>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #1976d2;">
                        <strong>ℹ️ Nota Importante:</strong> Una vez que subas tu comprobante, 
                        verificaremos el pago en un máximo de 2 horas. Recibirás una confirmación 
                        por email cuando tu pago sea verificado y tu reserva quede completamente confirmada.
                    </p>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Si tienes alguna pregunta, no dudes en contactarnos o comunicarte directamente con el anfitrión.
                </p>
                
                <p style="color: #666; font-size: 14px;">
                    ¡Esperamos que disfrutes tu estadía! 🏖️
                </p>
            </div>
            
            <div class="footer">
                <p>Este es un correo automático de EasyRent</p>
                <p>Si tienes alguna pregunta, contáctanos en soporte@easyrent.com</p>
                <p style="margin-top: 10px;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/my-bookings" 
                       style="color: #11998e; text-decoration: none;">
                        Ver Mis Reservas
                    </a>
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        ¡Tu Reserva ha sido Aceptada!
        
        Hola {guest_name},
        
        {owner_name} ha aceptado tu solicitud de reserva para {property_title}.
        
        DETALLES DE LA RESERVA:
        - Propiedad: {property_title}
        - Check-in: {check_in}
        - Check-out: {check_out}
        - Noches: {nights}
        - Huéspedes: {guests}
        
        ACCIÓN REQUERIDA - PLAZO: 6 HORAS
        Límite para completar el pago: {payment_deadline}
        
        PAGO:
        - Total: S/ {total_price:.2f}
        - Pagar ahora (50%): S/ {reservation_amount:.2f}
        - Pagar al check-in (50%): S/ {total_price - reservation_amount:.2f}
        
        DATOS BANCARIOS:
        Banco: BCP
        Cuenta: 123-456789-0-00
        CCI: 00212345678900000000
        Titular: EasyRent Perú S.A.C.
        Monto: S/ {reservation_amount:.2f}
        
        IMPORTANTE: Si no se recibe el pago en 6 horas, la reserva será cancelada automáticamente.
        
        Sube tu comprobante: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/my-bookings/{booking_id}
        
        Saludos,
        El equipo de EasyRent
        """
        
        return self.send_email(
            to_email=guest_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
    
    def send_booking_confirmation(
        self,
        guest_email: str,
        guest_name: str,
        property_title: str,
        check_in: str,
        check_out: str,
        guests: int,
        total_price: float,
        owner_name: str,
        owner_phone: Optional[str] = None
    ) -> bool:
        """
        Enviar confirmación de reserva al huésped
        """
        subject = f"✅ Reserva Confirmada - {property_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                }}
                .header {{
                    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border: 1px solid #ddd;
                }}
                .success-icon {{
                    font-size: 60px;
                    text-align: center;
                    margin: 20px 0;
                }}
                .booking-details {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>✅ ¡Reserva Confirmada!</h1>
            </div>
            
            <div class="content">
                <div class="success-icon">🎉</div>
                
                <p>Hola <strong>{guest_name}</strong>,</p>
                
                <p>¡Excelentes noticias! Tu reserva ha sido confirmada por el anfitrión.</p>
                
                <div class="booking-details">
                    <h3 style="margin-top: 0; color: #11998e;">📋 Detalles de tu Reserva</h3>
                    
                    <div class="detail-row">
                        <span><strong>Propiedad:</strong></span>
                        <span>{property_title}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Check-in:</strong></span>
                        <span>{check_in}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Check-out:</strong></span>
                        <span>{check_out}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Huéspedes:</strong></span>
                        <span>{guests}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Anfitrión:</strong></span>
                        <span>{owner_name}</span>
                    </div>
                    
                    {f'''
                    <div class="detail-row">
                        <span><strong>Teléfono:</strong></span>
                        <span>{owner_phone}</span>
                    </div>
                    ''' if owner_phone else ''}
                    
                    <div class="detail-row" style="border-bottom: none;">
                        <span><strong>Total:</strong></span>
                        <span style="font-size: 20px; color: #11998e; font-weight: bold;">
                            S/ {total_price:.2f}
                        </span>
                    </div>
                </div>
                
                <p><strong>💳 Próximos pasos:</strong></p>
                <ol>
                    <li>Completa el pago del 50% (S/ {total_price/2:.2f}) para asegurar tu reserva</li>
                    <li>El 50% restante se pagará al momento del check-in</li>
                    <li>Contacta al anfitrión si tienes preguntas</li>
                </ol>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    ¡Disfruta tu estadía! 🏖️
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=guest_email,
            subject=subject,
            html_content=html_content
        )
    
    def send_payment_expired_notification(
        self,
        guest_email: str,
        listing_title: str,
        deadline: str
    ) -> bool:
        """
        Notificar que la reserva fue cancelada por no pagar a tiempo
        """
        subject = f"❌ Reserva Cancelada - Plazo de Pago Vencido - {listing_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                }}
                .header {{
                    background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 0 0 10px 10px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>❌ Reserva Cancelada</h1>
            </div>
            <div class="content">
                <p>Lamentamos informarte que tu reserva para <strong>{listing_title}</strong> ha sido cancelada.</p>
                <p><strong>Motivo:</strong> No se recibió el pago del 50% antes del plazo límite ({deadline}).</p>
                <p>La propiedad ha vuelto a estar disponible para otras fechas.</p>
                <p>Si deseas hacer una nueva reserva, puedes buscar la propiedad nuevamente en nuestra plataforma.</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=guest_email,
            subject=subject,
            html_content=html_content
        )
    
    def send_payment_deadline_reminder(
        self,
        guest_email: str,
        guest_name: str,
        listing_title: str,
        deadline: str,
        minutes_remaining: int,
        booking_id: str
    ) -> bool:
        """
        Enviar recordatorio de que el plazo de pago está por vencer
        """
        subject = f"⏰ Recordatorio: Tu Pago Vence en {minutes_remaining} minutos - {listing_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                }}
                .header {{
                    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 0 0 10px 10px;
                }}
                .urgent-box {{
                    background: #fff3cd;
                    border-left: 4px solid #ff9800;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .cta-button {{
                    display: inline-block;
                    background: #ff9800;
                    color: white;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                    font-size: 16px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⏰ ¡Tiempo Limitado!</h1>
            </div>
            <div class="content">
                <p>Hola <strong>{guest_name}</strong>,</p>
                <p>Este es un recordatorio de que el plazo para completar el pago de tu reserva está por vencer.</p>
                
                <div class="urgent-box">
                    <h3 style="margin-top: 0; color: #f57c00;">⚠️ Tiempo Restante: {minutes_remaining} minutos</h3>
                    <p><strong>Propiedad:</strong> {listing_title}</p>
                    <p><strong>Plazo límite:</strong> {deadline}</p>
                </div>
                
                <p><strong>Si no recibimos tu pago antes del plazo, la reserva será cancelada automáticamente.</strong></p>
                
                <div style="text-align: center;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/my-bookings/{booking_id}" 
                       class="cta-button">
                        💰 Completar Pago Ahora
                    </a>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=guest_email,
            subject=subject,
            html_content=html_content
        )


# Instancia global del servicio
email_service = EmailService()
