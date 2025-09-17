#!/usr/bin/env python3
from app.main import app

print("=== VERIFICACIÓN DE IMPLEMENTACIÓN AIRBNB ===")
print()

# Obtener todas las rutas
routes = []
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        routes.append({
            'path': route.path,
            'methods': list(route.methods)
        })

# Filtrar rutas relevantes
listings_routes = [r for r in routes if '/listings' in r['path']]
search_routes = [r for r in routes if '/search' in r['path']]

print("📋 RUTAS DE LISTINGS:")
for route in listings_routes:
    methods_str = ', '.join(route['methods'])
    print(f"  {methods_str:<15} {route['path']}")

print()
print("🔍 RUTAS DE SEARCH:")
for route in search_routes:
    methods_str = ', '.join(route['methods'])
    print(f"  {methods_str:<15} {route['path']}")

# Verificar endpoints específicos de Airbnb
airbnb_endpoints = [
    "/v1/listings/{listing_id}/validate-airbnb",
    "/v1/listings/{listing_id}/optimize-for-airbnb"
]

print()
print("✅ ENDPOINTS DE AIRBNB:")
for endpoint in airbnb_endpoints:
    found = any(endpoint in route['path'] for route in listings_routes)
    status = "✅ ENCONTRADO" if found else "❌ NO ENCONTRADO"
    print(f"  {status} {endpoint}")

print()
print("🏠 VERIFICANDO MODELOS Y ESQUEMAS...")

# Verificar modelo Listing
try:
    from app.models.listing import Listing
    listing_fields = [field for field in dir(Listing) if not field.startswith('_')]
    airbnb_model_fields = [f for f in listing_fields if 'airbnb' in f.lower()]
    print(f"  Campos de Airbnb en modelo Listing: {airbnb_model_fields}")
except Exception as e:
    print(f"  ❌ Error al verificar modelo Listing: {e}")

# Verificar esquema de búsqueda
try:
    from app.schemas.search import SearchFilters
    search_fields = SearchFilters.model_fields.keys()
    airbnb_search_fields = [f for f in search_fields if 'airbnb' in f.lower()]
    print(f"  Campos de Airbnb en SearchRequest: {list(airbnb_search_fields)}")
except Exception as e:
    print(f"  ❌ Error al verificar esquema SearchRequest: {e}")

print()
print("📊 RESUMEN:")
print(f"  Total rutas listings: {len(listings_routes)}")
print(f"  Total rutas search: {len(search_routes)}")
print(f"  ¿Endpoints Airbnb implementados? {'✅ SÍ' if any('airbnb' in r['path'] for r in listings_routes) else '❌ NO'}")
print()
