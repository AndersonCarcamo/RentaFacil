# Guía: Planes para Agencias vs Usuarios Individuales

## 📋 Resumen

Se ha implementado la distinción entre planes para **usuarios individuales** y **agencias** en el sistema de suscripciones.

## 🗄️ Base de Datos

### Enum Creado
```sql
CREATE TYPE core.plan_target_type AS ENUM ('individual', 'agency', 'both');
```

### Columna Agregada
```sql
ALTER TABLE core.plans 
ADD COLUMN target_user_type core.plan_target_type NOT NULL DEFAULT 'individual';
```

### Índice para Optimización
```sql
CREATE INDEX plans_target_type_idx ON core.plans(target_user_type, is_active);
```

## 🎯 Valores del Enum

| Valor | Descripción |
|-------|-------------|
| `individual` | Plan exclusivo para usuarios individuales |
| `agency` | Plan exclusivo para agencias |
| `both` | Plan disponible para ambos tipos |

## 🔧 Backend

### Endpoint de Consulta
```
GET /v1/plans/?target_user_type={tipo}
```

**Parámetros disponibles:**
- `target_user_type`: `individual` | `agency` | `both`
- `include_inactive`: `true` | `false`
- `tier`: `free` | `basic` | `premium` | `enterprise`

### Lógica de Filtrado Inteligente

El backend implementa filtrado **incluyente con "both"**:

```python
# Si buscas planes para 'individual':
# → Devuelve planes 'individual' + planes 'both'

# Si buscas planes para 'agency':
# → Devuelve planes 'agency' + planes 'both'
```

**Ejemplo:**
```bash
curl "http://localhost:8000/v1/plans/?target_user_type=agency"
# Retorna: planes con target_user_type = 'agency' OR 'both'
```

## 🎨 Frontend (SystemPlansManager)

### Filtros Visuales

En la parte superior del gestor de planes hay 4 botones:

- **Todos** (azul): Muestra todos los planes
- **Individuales** (naranja): Muestra planes `individual` + `both`
- **Agencias** (morado): Muestra planes `agency` + `both`
- **Ambos** (verde): Muestra solo planes marcados como `both`

### Badges de Identificación

Cada plan muestra un badge de color según su tipo:

- 🟠 **Naranja**: Planes para usuarios individuales
- 🟣 **Morado**: Planes para agencias
- 🟢 **Verde**: Planes para ambos tipos

### Crear/Editar Planes

En el modal de creación/edición hay un selector:

```
Tipo de Usuario *
┌──────────────────────────┐
│ Usuarios Individuales  ▼ │
├──────────────────────────┤
│ Usuarios Individuales    │
│ Agencias                 │
│ Ambos                    │
└──────────────────────────┘
```

## 📊 Ejemplos de Uso

### Escenario 1: Plan Gratuito para Agencias

```json
{
  "code": "agency-free",
  "name": "Plan Gratuito Agencia",
  "tier": "free",
  "period": "permanent",
  "target_user_type": "agency",
  "max_active_listings": 10,
  "price_amount": 0
}
```

### Escenario 2: Plan Premium Universal

```json
{
  "code": "premium-monthly",
  "name": "Premium Mensual Universal",
  "tier": "premium",
  "period": "monthly",
  "target_user_type": "both",
  "price_amount": 99.90
}
```

### Escenario 3: Plan Empresarial Solo Agencias

```json
{
  "code": "enterprise-yearly",
  "name": "Empresarial Anual",
  "tier": "enterprise",
  "period": "yearly",
  "target_user_type": "agency",
  "max_active_listings": 1000,
  "price_amount": 9999.00
}
```

## ✅ Testing

### 1. Verificar en Base de Datos

```sql
-- Ver todos los planes con su tipo
SELECT 
  name, 
  tier, 
  period, 
  target_user_type,
  is_active 
FROM core.plans 
ORDER BY target_user_type, tier;
```

### 2. Probar API

```bash
# Planes para individuales
curl "http://localhost:8000/v1/plans/?target_user_type=individual"

# Planes para agencias
curl "http://localhost:8000/v1/plans/?target_user_type=agency"

# Todos los planes
curl "http://localhost:8000/v1/plans/"
```

### 3. Probar Frontend

1. Abrir el panel de administración
2. Ir a "Planes del Sistema"
3. Hacer clic en **"Agencias"** → Debe mostrar solo planes de agencias + ambos
4. Hacer clic en **"Individuales"** → Debe mostrar solo planes individuales + ambos
5. Crear un nuevo plan con tipo "Agencias"
6. Verificar que aparece el badge morado

## 🎯 Casos de Uso

### Para Página de Registro de Usuario Individual
```javascript
fetch('http://localhost:8000/v1/plans/?target_user_type=individual')
// Muestra: planes individual + both
```

### Para Página de Registro de Agencia
```javascript
fetch('http://localhost:8000/v1/plans/?target_user_type=agency')
// Muestra: planes agency + both
```

### Para Comparativa General
```javascript
fetch('http://localhost:8000/v1/plans/')
// Muestra: todos los planes
```

## 📝 Notas Importantes

1. **Los planes existentes** fueron creados con `target_user_type = 'individual'` por defecto
2. **Los planes enterprise** fueron actualizados a `target_user_type = 'agency'` en la migración
3. **El filtrado es inclusivo**: al buscar un tipo específico siempre incluye planes marcados como 'both'
4. **Es retrocompatible**: el endpoint sin el parámetro `target_user_type` devuelve todos los planes

## 🔄 Migración Ejecutada

La migración `14_add_plan_target_type.sql` ya fue ejecutada e incluye:

- ✅ Creación del enum `plan_target_type`
- ✅ Adición de la columna `target_user_type`
- ✅ Valor por defecto `'individual'`
- ✅ Índice de optimización
- ✅ Actualización de planes enterprise a `'agency'`

## 🚀 Próximos Pasos Sugeridos

1. Crear plan gratuito específico para agencias
2. Ajustar límites de planes según tipo de usuario
3. Implementar lógica de negocio diferenciada:
   - Usuarios individuales: límites más bajos
   - Agencias: límites más altos, características adicionales
4. Considerar precios diferenciados por tipo de usuario

---

**Implementado:** 2024
**Archivos Modificados:**
- `Backend/app/models/subscription.py`
- `Backend/app/schemas/plans.py`
- `Backend/app/services/plan_service.py`
- `Backend/app/api/endpoints/plans.py`
- `Frontend/web/components/admin/SystemPlansManager.tsx`
- `backend_doc/14_add_plan_target_type.sql`
