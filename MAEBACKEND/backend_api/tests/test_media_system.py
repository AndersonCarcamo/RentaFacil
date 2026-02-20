#!/usr/bin/env python3
"""
Script de prueba para el sistema de media
Verifica que todos los componentes estén funcionando correctamente
"""

import os
import sys
import requests
import json

# Configuración
API_BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = "test_avatar.jpg"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.ENDC}")

def test_health():
    """Prueba el health check general"""
    print_info("Probando health check general...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print_success("Backend está corriendo")
            return True
        else:
            print_error(f"Backend respondió con código {response.status_code}")
            return False
    except Exception as e:
        print_error(f"No se pudo conectar al backend: {e}")
        return False

def test_media_health():
    """Prueba el health check del sistema de media"""
    print_info("Probando health check de media...")
    try:
        response = requests.get(f"{API_BASE_URL}/v1/media/health")
        if response.status_code == 200:
            data = response.json()
            print_success("Sistema de media está activo")
            print(f"  - Status: {data.get('status')}")
            print(f"  - Database: {data.get('services', {}).get('database')}")
            print(f"  - Cache: {data.get('services', {}).get('cache')}")
            print(f"  - Storage: {data.get('services', {}).get('storage')}")
            return True
        else:
            print_error(f"Media health check falló: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error al verificar media health: {e}")
        return False

def test_media_stats():
    """Prueba obtener estadísticas (requiere auth)"""
    print_info("Probando endpoint de estadísticas...")
    try:
        response = requests.get(f"{API_BASE_URL}/v1/media/stats")
        if response.status_code == 401:
            print_warning("Endpoint requiere autenticación (esperado)")
            return True
        elif response.status_code == 200:
            print_success("Estadísticas obtenidas")
            return True
        else:
            print_error(f"Respuesta inesperada: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error al obtener estadísticas: {e}")
        return False

def test_directories():
    """Verifica que los directorios de media existan"""
    print_info("Verificando directorios de media...")
    
    base_dir = os.path.join(os.path.dirname(__file__), "media")
    dirs_to_check = [
        "avatars",
        "listings/images",
        "listings/videos",
        "listings/thumbs"
    ]
    
    all_exist = True
    for dir_path in dirs_to_check:
        full_path = os.path.join(base_dir, dir_path)
        if os.path.exists(full_path):
            print_success(f"Directorio existe: {dir_path}")
        else:
            print_error(f"Directorio no existe: {dir_path}")
            all_exist = False
    
    return all_exist

def test_swagger_docs():
    """Verifica que la documentación esté disponible"""
    print_info("Verificando documentación Swagger...")
    try:
        response = requests.get(f"{API_BASE_URL}/docs")
        if response.status_code == 200:
            print_success("Documentación Swagger disponible")
            print_info(f"Ver en: {API_BASE_URL}/docs")
            return True
        else:
            print_error(f"Documentación no disponible: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error al verificar documentación: {e}")
        return False

def test_redis_connection():
    """Verifica conexión a Redis"""
    print_info("Verificando conexión a Redis...")
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=1)
        r.ping()
        print_success("Redis está corriendo y accesible")
        
        # Obtener info básica
        info = r.info()
        print(f"  - Versión: {info.get('redis_version', 'unknown')}")
        print(f"  - Memoria usada: {info.get('used_memory_human', 'unknown')}")
        return True
    except Exception as e:
        print_warning(f"Redis no está disponible: {e}")
        print_info("El sistema funcionará sin cache")
        return True  # No es crítico

def test_media_endpoints_structure():
    """Verifica que los endpoints de media estén registrados"""
    print_info("Verificando endpoints de media...")
    
    endpoints_to_check = [
        "/v1/media/health",
        "/v1/users/me/avatar",
    ]
    
    all_available = True
    for endpoint in endpoints_to_check:
        try:
            response = requests.options(f"{API_BASE_URL}{endpoint}")
            if response.status_code in [200, 405, 401]:  # 405 = Method not allowed (esperado para OPTIONS)
                print_success(f"Endpoint disponible: {endpoint}")
            else:
                print_error(f"Endpoint no disponible: {endpoint} ({response.status_code})")
                all_available = False
        except Exception as e:
            print_error(f"Error al verificar {endpoint}: {e}")
            all_available = False
    
    return all_available

def create_test_image():
    """Crea una imagen de prueba simple"""
    try:
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(TEST_IMAGE_PATH)
        return True
    except Exception as e:
        print_warning(f"No se pudo crear imagen de prueba: {e}")
        return False

def cleanup_test_files():
    """Limpia archivos de prueba"""
    if os.path.exists(TEST_IMAGE_PATH):
        os.remove(TEST_IMAGE_PATH)

def main():
    print("=" * 60)
    print("🧪 PRUEBAS DEL SISTEMA DE MEDIA")
    print("=" * 60)
    print()
    
    results = []
    
    # Ejecutar pruebas
    results.append(("Health Check", test_health()))
    results.append(("Media Health Check", test_media_health()))
    results.append(("Directorios de Media", test_directories()))
    results.append(("Documentación Swagger", test_swagger_docs()))
    results.append(("Conexión Redis", test_redis_connection()))
    results.append(("Estructura de Endpoints", test_media_endpoints_structure()))
    results.append(("Estadísticas (Auth)", test_media_stats()))
    
    # Resumen
    print()
    print("=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status}{Colors.ENDC} - {test_name}")
    
    print()
    print(f"Resultado: {passed}/{total} pruebas pasaron")
    
    if passed == total:
        print_success("¡Todos los componentes están funcionando correctamente!")
        print()
        print_info("Próximos pasos:")
        print("  1. Ver documentación en: http://localhost:8000/docs")
        print("  2. Probar upload de avatar con un token válido")
        print("  3. Implementar componente de upload en el frontend")
        return 0
    else:
        print_error("Algunas pruebas fallaron. Revisa los mensajes arriba.")
        print()
        print_info("Problemas comunes:")
        print("  - Backend no está corriendo: uvicorn app.main:app --reload")
        print("  - Redis no está corriendo: redis-server")
        print("  - Directorios no existen: se crean automáticamente al iniciar")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print()
        print_warning("Pruebas interrumpidas por el usuario")
        sys.exit(1)
    finally:
        cleanup_test_files()
