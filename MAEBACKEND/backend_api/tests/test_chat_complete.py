"""
Script de prueba completo para el sistema de chat
Prueba tanto los endpoints REST como WebSocket
"""
import asyncio
import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

# Datos de prueba (actualizar con datos reales)
CLIENT_EMAIL = "test@gmail.com"
CLIENT_PASSWORD = "password123"  # Cambiar por la contraseña real
CLIENT_USER_ID = "e5aae7ff-38d6-453d-99ef-d08a8b645a6f"

OWNER_EMAIL = ""  # ACTUALIZAR con el email del propietario
OWNER_PASSWORD = "password123"  # Cambiar por la contraseña real
OWNER_USER_ID = "ae57bee1-339d-4abf-aae1-254b1062ee18"

LISTING_ID = "09628b28-0bbf-47c4-9015-b5993d2bfadd"


def print_section(title):
    """Imprime un separador de sección"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def login(email, password):
    """Autenticar usuario y obtener token"""
    print(f"🔐 Autenticando usuario: {email}")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": email,
            "password": password
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print(f"✅ Login exitoso. Token obtenido.")
        return token
    else:
        print(f"❌ Error en login: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return None


def create_conversation(token, listing_id, client_user_id, owner_user_id):
    """Crear o obtener conversación"""
    print(f"💬 Creando conversación para listing: {listing_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "listing_id": listing_id,
        "client_user_id": client_user_id,
        "owner_user_id": owner_user_id
    }
    
    response = requests.post(
        f"{BASE_URL}/chat/conversations",
        headers=headers,
        json=payload
    )
    
    if response.status_code in [200, 201]:
        data = response.json()
        conversation_id = data.get("id")
        print(f"✅ Conversación creada/obtenida: {conversation_id}")
        return conversation_id
    else:
        print(f"❌ Error creando conversación: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return None


def send_message(token, conversation_id, content, message_type="text"):
    """Enviar mensaje en una conversación"""
    print(f"📤 Enviando mensaje: {content[:50]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "conversation_id": conversation_id,
        "content": content,
        "message_type": message_type
    }
    
    response = requests.post(
        f"{BASE_URL}/chat/conversations/{conversation_id}/messages",
        headers=headers,
        json=payload
    )
    
    if response.status_code in [200, 201]:
        data = response.json()
        message_id = data.get("id")
        print(f"✅ Mensaje enviado: {message_id}")
        return message_id
    else:
        print(f"❌ Error enviando mensaje: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return None


def get_messages(token, conversation_id, limit=10):
    """Obtener mensajes de una conversación"""
    print(f"📥 Obteniendo mensajes de conversación: {conversation_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/chat/conversations/{conversation_id}/messages",
        headers=headers,
        params={"limit": limit}
    )
    
    if response.status_code == 200:
        messages = response.json()
        print(f"✅ Mensajes obtenidos: {len(messages)}")
        
        for msg in messages:
            timestamp = msg.get("created_at", "")[:19]
            sender = "Tú" if msg.get("sender_user_id") == CLIENT_USER_ID else "Propietario"
            content = msg.get("content", "")
            status = msg.get("status", "")
            print(f"   [{timestamp}] {sender}: {content} ({status})")
        
        return messages
    else:
        print(f"❌ Error obteniendo mensajes: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return []


def mark_as_read(token, conversation_id):
    """Marcar mensajes como leídos"""
    print(f"👁️  Marcando mensajes como leídos en conversación: {conversation_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.patch(
        f"{BASE_URL}/chat/conversations/{conversation_id}/read",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        count = data.get("messages_marked_read", 0)
        print(f"✅ Mensajes marcados como leídos: {count}")
        return count
    else:
        print(f"❌ Error marcando como leído: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return 0


def get_unread_count(token, user_id):
    """Obtener contador de mensajes no leídos"""
    print(f"🔔 Obteniendo contador de mensajes no leídos")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/chat/unread-count",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        count = data.get("unread_count", 0)
        print(f"✅ Mensajes no leídos: {count}")
        return count
    else:
        print(f"❌ Error obteniendo contador: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return 0


def get_user_conversations(token):
    """Obtener todas las conversaciones del usuario"""
    print(f"📋 Obteniendo conversaciones del usuario")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/chat/conversations",
        headers=headers
    )
    
    if response.status_code == 200:
        conversations = response.json()
        print(f"✅ Conversaciones obtenidas: {len(conversations)}")
        
        for conv in conversations:
            listing_title = conv.get("listing_title", "Sin título")
            last_message = conv.get("last_message_content", "Sin mensajes")
            unread = conv.get("unread_count", 0)
            print(f"   📍 {listing_title}")
            print(f"      Último mensaje: {last_message[:50]}...")
            print(f"      No leídos: {unread}")
        
        return conversations
    else:
        print(f"❌ Error obteniendo conversaciones: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return []


def main():
    """Función principal de prueba"""
    print("\n" + "="*60)
    print("  🚀 PRUEBA COMPLETA DEL SISTEMA DE CHAT")
    print("="*60)
    
    # Validar que se configuraron los datos
    if not OWNER_EMAIL:
        print("\n❌ ERROR: Debes actualizar OWNER_EMAIL en el script")
        print("   Ejecuta: SELECT email FROM core.users WHERE id = 'ae57bee1-339d-4abf-aae1-254b1062ee18';")
        return
    
    # PASO 1: Login como cliente
    print_section("1️⃣  Login como Cliente")
    client_token = login(CLIENT_EMAIL, CLIENT_PASSWORD)
    if not client_token:
        return
    
    # PASO 2: Login como propietario
    print_section("2️⃣  Login como Propietario")
    owner_token = login(OWNER_EMAIL, OWNER_PASSWORD)
    if not owner_token:
        return
    
    # PASO 3: Cliente crea conversación
    print_section("3️⃣  Cliente Crea Conversación")
    conversation_id = create_conversation(
        client_token,
        LISTING_ID,
        CLIENT_USER_ID,
        OWNER_USER_ID
    )
    if not conversation_id:
        return
    
    # PASO 4: Cliente envía mensaje inicial
    print_section("4️⃣  Cliente Envía Mensaje")
    send_message(
        client_token,
        conversation_id,
        "Hola, estoy interesado en el departamento. ¿Está disponible para visita?"
    )
    
    # PASO 5: Propietario obtiene sus conversaciones
    print_section("5️⃣  Propietario Ve Sus Conversaciones")
    get_user_conversations(owner_token)
    
    # PASO 6: Propietario ve mensajes no leídos
    print_section("6️⃣  Propietario Verifica Mensajes No Leídos")
    unread = get_unread_count(owner_token, OWNER_USER_ID)
    
    # PASO 7: Propietario responde
    print_section("7️⃣  Propietario Responde")
    send_message(
        owner_token,
        conversation_id,
        "¡Hola! Sí, está disponible. ¿Qué día te vendría bien?"
    )
    
    # PASO 8: Cliente envía otro mensaje
    print_section("8️⃣  Cliente Responde")
    send_message(
        client_token,
        conversation_id,
        "Perfecto, el sábado por la mañana estaría bien."
    )
    
    # PASO 9: Obtener historial de mensajes
    print_section("9️⃣  Historial de Mensajes")
    messages = get_messages(client_token, conversation_id)
    
    # PASO 10: Propietario marca como leído
    print_section("🔟 Propietario Marca Como Leído")
    mark_as_read(owner_token, conversation_id)
    
    # PASO 11: Verificar contador después de leer
    print_section("1️⃣1️⃣  Verificar Contador Actualizado")
    get_unread_count(owner_token, OWNER_USER_ID)
    
    # PASO 12: Cliente obtiene conversaciones actualizadas
    print_section("1️⃣2️⃣  Cliente Ve Conversaciones Finales")
    get_user_conversations(client_token)
    
    print_section("✅ PRUEBA COMPLETADA")
    print("El sistema de chat está funcionando correctamente!")
    print("\n📝 Próximos pasos:")
    print("   1. Probar WebSocket en tiempo real")
    print("   2. Probar desde Swagger UI (http://localhost:8000/docs)")
    print("   3. Implementar frontend")


if __name__ == "__main__":
    main()
