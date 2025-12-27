"""
Script de prueba para verificar las llaves de Culqi
"""
import requests
import json

# Llaves de Culqi
PUBLIC_KEY = "pk_test_SsNSbc4aceAySSp3"
SECRET_KEY = "sk_test_yrsjDrloVOls3E62"

print("=" * 60)
print("PRUEBA DE LLAVES DE CULQI")
print("=" * 60)
print()

# Test 1: Crear un token con la llave pública
print("TEST 1: Crear Token con Llave Pública")
print("-" * 60)

token_data = {
    "card_number": "4111111111111111",
    "cvv": "123",
    "expiration_month": "12",
    "expiration_year": "2030",
    "email": "test@example.com"
}

try:
    response = requests.post(
        "https://api.culqi.com/v2/tokens",
        headers={
            "Authorization": f"Bearer {PUBLIC_KEY}",
            "Content-Type": "application/json"
        },
        json=token_data
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        print("TOKEN CREADO EXITOSAMENTE")
        token_response = response.json()
        print(f"Token ID: {token_response.get('id', 'N/A')}")
        token_id = token_response.get('id')
    else:
        print("ERROR AL CREAR TOKEN")
        print(f"Response: {response.text}")
        token_id = None
        
except Exception as e:
    print(f" EXCEPCIÓN: {str(e)}")
    token_id = None

print()

# Test 2: Crear un cargo con la llave secreta (solo si el token fue creado)
if token_id:
    print(" TEST 2: Crear Cargo con Llave Secreta")
    print("-" * 60)
    
    charge_data = {
        "amount": 10000,  # 100.00 PEN
        "currency_code": "PEN",
        "email": "test@example.com",
        "source_id": token_id,
        "description": "Test de integración"
    }
    
    try:
        response = requests.post(
            "https://api.culqi.com/v2/charges",
            headers={
                "Authorization": f"Bearer {SECRET_KEY}",
                "Content-Type": "application/json"
            },
            json=charge_data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ CARGO CREADO EXITOSAMENTE")
            charge_response = response.json()
            print(f"Charge ID: {charge_response.get('id', 'N/A')}")
            print(f"Outcome: {charge_response.get('outcome', {}).get('type', 'N/A')}")
        else:
            print("ERROR AL CREAR CARGO")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"EXCEPCIÓN: {str(e)}")

print()
print("=" * 60)
print("FIN DE LAS PRUEBAS")
print("=" * 60)
