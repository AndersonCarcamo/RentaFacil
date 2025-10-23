# Sistema Automático de Advertiser Type

## 📋 Resumen

Script SQL que implementa la determinación automática del campo `advertiser_type` en la tabla `listings` basándose en el rol del usuario y su asociación con agencias.

## 🎯 Objetivo

Eliminar la necesidad de que el frontend o backend especifiquen manualmente el `advertiser_type` al crear o actualizar propiedades. El sistema lo determina automáticamente mediante un trigger de base de datos.

## 📊 Lógica de Mapeo

| Rol del Usuario | Tiene Agencia (user_agency) | Advertiser Type | Agency ID |
|-----------------|------------------------------|-----------------|-----------|
| `agent` | ✅ Sí | `agency` | Se establece automáticamente |
| `agent` | ❌ No | `broker` | Se limpia (NULL) |
| `landlord` | N/A | `owner` | Se limpia (NULL) |
| `user` | N/A | `owner` | Se limpia (NULL) |
| `admin` | N/A | Mantiene valor o `owner` | Depende del caso |

## 🔧 Componentes Incluidos

### 1. Función Trigger: `core.set_advertiser_type()`

**Propósito:** Se ejecuta automáticamente antes de INSERT/UPDATE en listings.

**Comportamiento:**
- Consulta el rol del usuario desde `core.users`
- Verifica si existe relación en `core.user_agency`
- Determina el `advertiser_type` apropiado
- Establece automáticamente el `agency_id` si corresponde

**Ventajas:**
- ✅ Ejecuta en la base de datos (no requiere lógica en backend)
- ✅ Garantiza consistencia
- ✅ Incluye logs de debugging con RAISE NOTICE
- ✅ Solo actúa cuando es necesario

### 2. Trigger: `trigger_set_advertiser_type`

**Cuándo se ejecuta:**
- BEFORE INSERT: Al crear un nuevo listing
- BEFORE UPDATE OF owner_user_id: Cuando cambia el propietario

**Tipo:** BEFORE (se ejecuta antes de escribir en disco)

### 3. Función Auxiliar: `core.get_user_advertiser_type(UUID)`

**Propósito:** Consultar el advertiser_type esperado para un usuario sin modificar datos.

**Uso:**
```sql
SELECT core.get_user_advertiser_type('550e8400-e29b-41d4-a716-446655440000');
-- Retorna: 'agency', 'broker', o 'owner'
```

**Casos de uso:**
- Validación en el backend
- Mostrar tipo esperado en el frontend
- Reportes y análisis

### 4. Vista: `core.v_users_with_advertiser_type`

**Propósito:** Vista completa de usuarios con su información de agencia y advertiser_type esperado.

**Columnas:**
- `id`, `email`, `first_name`, `last_name`
- `role`: Rol del usuario
- `expected_advertiser_type`: Tipo calculado
- `agency_id`, `agency_name`, `agency_verified`: Info de agencia (si aplica)

**Consultas útiles:**
```sql
-- Ver todos los agentes y su tipo
SELECT * FROM core.v_users_with_advertiser_type 
WHERE role = 'agent';

-- Ver agentes sin agencia (brokers)
SELECT * FROM core.v_users_with_advertiser_type 
WHERE role = 'agent' AND agency_id IS NULL;

-- Ver agentes de inmobiliarias
SELECT * FROM core.v_users_with_advertiser_type 
WHERE role = 'agent' AND agency_id IS NOT NULL;
```

### 5. Actualización Retroactiva (Opcional)

El script incluye un bloque `DO $$` que actualiza todos los listings existentes para corregir su `advertiser_type`.

**⚠️ Importante:** Esta sección está activa por defecto. Si NO quieres actualizar listings existentes, comenta el bloque entre las líneas que dicen "Actualizar listings existentes".

**Qué hace:**
- Recorre todos los listings existentes
- Calcula el `advertiser_type` correcto
- Actualiza solo los que tienen valores incorrectos
- Muestra logs detallados de cada cambio

## 📝 Instalación

### Paso 1: Ejecutar el Script

```bash
psql -U tu_usuario -d tu_basedatos -f backend_doc/17_auto_advertiser_type.sql
```

O desde un cliente SQL:

```sql
-- Copiar y pegar el contenido de 17_auto_advertiser_type.sql
```

### Paso 2: Verificar la Instalación

El script incluye verificación automática al final. Deberías ver:

```
========================================
Verificación de actualización:
- Función set_advertiser_type(): ✓ OK
- Trigger trigger_set_advertiser_type: ✓ OK
- Vista v_users_with_advertiser_type: ✓ OK
- Total listings procesados: 150
========================================
Distribución de advertiser_types:
  - owner: 120
  - agency: 25
  - broker: 5
========================================
```

## 🧪 Testing

### Test 1: Crear listing como propietario (landlord/user)

```sql
-- Usuario con rol 'landlord'
INSERT INTO core.listings (
    owner_user_id, 
    title, 
    description, 
    operation, 
    property_type, 
    price
) VALUES (
    'user_landlord_uuid', 
    'Departamento en Miraflores', 
    'Hermoso departamento', 
    'rent', 
    'apartment', 
    1500
);

-- Verificar advertiser_type
SELECT id, advertiser_type, agency_id 
FROM core.listings 
WHERE title = 'Departamento en Miraflores';
-- Esperado: advertiser_type = 'owner', agency_id = NULL
```

### Test 2: Crear listing como agente de inmobiliaria

```sql
-- Usuario con rol 'agent' asociado a una agencia
INSERT INTO core.listings (
    owner_user_id, 
    title, 
    description, 
    operation, 
    property_type, 
    price
) VALUES (
    'user_agent_con_agencia_uuid', 
    'Casa en San Isidro', 
    'Casa de lujo', 
    'sale', 
    'house', 
    500000
);

-- Verificar advertiser_type y agency_id
SELECT id, advertiser_type, agency_id 
FROM core.listings 
WHERE title = 'Casa en San Isidro';
-- Esperado: advertiser_type = 'agency', agency_id = '<uuid de la agencia>'
```

### Test 3: Crear listing como broker (agente sin agencia)

```sql
-- Usuario con rol 'agent' SIN asociación a agencia
INSERT INTO core.listings (
    owner_user_id, 
    title, 
    description, 
    operation, 
    property_type, 
    price
) VALUES (
    'user_agent_sin_agencia_uuid', 
    'Oficina en Surco', 
    'Oficina comercial', 
    'rent', 
    'commercial', 
    3000
);

-- Verificar advertiser_type
SELECT id, advertiser_type, agency_id 
FROM core.listings 
WHERE title = 'Oficina en Surco';
-- Esperado: advertiser_type = 'broker', agency_id = NULL
```

### Test 4: Validar inconsistencias

```sql
-- Buscar listings con advertiser_type incorrecto
SELECT 
    l.id,
    l.title,
    u.role as user_role,
    l.advertiser_type as current_type,
    v.expected_advertiser_type,
    CASE 
        WHEN l.advertiser_type != v.expected_advertiser_type 
        THEN '❌ INCORRECTO' 
        ELSE '✅ CORRECTO' 
    END as status
FROM core.listings l
JOIN core.users u ON u.id = l.owner_user_id
JOIN core.v_users_with_advertiser_type v ON v.id = l.owner_user_id;
```

## 🔄 Integración con Backend

### Antes (Manual):

```python
# Backend tenía que calcular advertiser_type
def create_listing(user_id, data):
    user = get_user(user_id)
    
    if user.role == 'agent':
        if user.agency:
            advertiser_type = 'agency'
        else:
            advertiser_type = 'broker'
    else:
        advertiser_type = 'owner'
    
    listing = Listing(
        owner_user_id=user_id,
        advertiser_type=advertiser_type,  # ❌ Manual
        **data
    )
    db.add(listing)
    db.commit()
```

### Ahora (Automático):

```python
# Backend NO necesita calcular advertiser_type
def create_listing(user_id, data):
    listing = Listing(
        owner_user_id=user_id,
        # advertiser_type se establece automáticamente ✅
        **data
    )
    db.add(listing)
    db.commit()
    
    # El trigger ya estableció advertiser_type correcto
    db.refresh(listing)
    return listing
```

### Opcional: Validar antes de guardar

```python
# Si quieres validar el tipo esperado antes de crear
def get_expected_advertiser_type(user_id):
    result = db.execute(
        "SELECT core.get_user_advertiser_type(:user_id)",
        {"user_id": user_id}
    ).scalar()
    return result

# Usar para mostrar en frontend o validar
expected_type = get_expected_advertiser_type(user.id)
```

## 📊 Consultas Útiles

### Ver estadísticas de advertiser_types

```sql
SELECT 
    advertiser_type,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM core.listings
GROUP BY advertiser_type
ORDER BY total DESC;
```

### Ver agentes con sus agencias

```sql
SELECT 
    u.email,
    u.first_name || ' ' || u.last_name as name,
    a.name as agency_name,
    v.expected_advertiser_type,
    COUNT(l.id) as total_listings
FROM core.v_users_with_advertiser_type v
JOIN core.users u ON u.id = v.id
LEFT JOIN core.agencies a ON a.id = v.agency_id
LEFT JOIN core.listings l ON l.owner_user_id = v.id
WHERE v.role = 'agent'
GROUP BY u.email, name, a.name, v.expected_advertiser_type
ORDER BY total_listings DESC;
```

### Detectar problemas de consistencia

```sql
-- Listings de agentes sin agency_id cuando deberían tener
SELECT l.id, l.title, u.email, l.advertiser_type, l.agency_id
FROM core.listings l
JOIN core.users u ON u.id = l.owner_user_id
WHERE l.advertiser_type = 'agency' 
  AND l.agency_id IS NULL;

-- Listings con agency_id pero advertiser_type diferente de 'agency'
SELECT l.id, l.title, u.email, l.advertiser_type, l.agency_id, a.name
FROM core.listings l
JOIN core.users u ON u.id = l.owner_user_id
LEFT JOIN core.agencies a ON a.id = l.agency_id
WHERE l.agency_id IS NOT NULL 
  AND l.advertiser_type != 'agency';
```

## 🚨 Troubleshooting

### Problema: El trigger no se ejecuta

**Causa:** El trigger podría no existir.

**Solución:**
```sql
-- Verificar existencia del trigger
SELECT tgname FROM pg_trigger 
WHERE tgname = 'trigger_set_advertiser_type';

-- Si no existe, volver a ejecutar la sección 2 del script
```

### Problema: Advertiser_type incorrecto después de crear listing

**Causa:** La relación user_agency podría no estar actualizada.

**Solución:**
```sql
-- Verificar relaciones del usuario
SELECT u.id, u.role, ua.agency_id, a.name
FROM core.users u
LEFT JOIN core.user_agency ua ON ua.user_id = u.id
LEFT JOIN core.agencies a ON a.id = ua.agency_id
WHERE u.id = 'user_uuid_here';
```

### Problema: Logs de RAISE NOTICE no aparecen

**Causa:** El nivel de logging de PostgreSQL no está configurado.

**Solución:**
```sql
-- En sesión actual
SET client_min_messages TO NOTICE;

-- O comentar las líneas RAISE NOTICE en el script
```

## 📚 Referencias

- Tabla users: `backend_doc/03_core_tables.sql`
- Tabla agencies: `backend_doc/03_core_tables.sql`
- Tabla user_agency: `backend_doc/03_core_tables.sql`
- Enum advertiser_type: `backend_doc/02_enums_and_types.sql`
- Enum user_role: `backend_doc/02_enums_and_types.sql`

## ✅ Checklist de Implementación

- [ ] Ejecutar script `17_auto_advertiser_type.sql`
- [ ] Verificar que todos los componentes se crearon correctamente
- [ ] Revisar logs de actualización retroactiva (si se activó)
- [ ] Ejecutar tests de creación de listings
- [ ] Validar que advertiser_type se establece correctamente
- [ ] Actualizar backend para NO enviar advertiser_type
- [ ] Actualizar frontend para NO mostrar selector de tipo
- [ ] Documentar cambio para el equipo

## 🎯 Próximos Pasos

1. ✅ Sistema automático de advertiser_type implementado
2. ⏳ Actualizar backend para remover lógica manual
3. ⏳ Actualizar frontend para quitar selector
4. ⏳ Testing end-to-end de creación de listings
5. ⏳ Documentar en API docs que advertiser_type es automático
