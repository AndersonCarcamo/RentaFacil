# Cambio: Tipo de Anunciante Automático

## 📋 Resumen

El tipo de anunciante ahora se determina automáticamente basado en el rol del usuario, en lugar de ser un campo seleccionable manualmente.

## 🔄 Cambios Realizados

### 1. Backend - Modelo de Usuario
**Archivo:** `Backend/app/models/auth.py`

El usuario ya tiene el campo `agency_name` en el modelo que identifica a qué inmobiliaria pertenece un agente.

### 2. Frontend - Interface AuthUser
**Archivo:** `Frontend/web/lib/api/auth.ts`

```typescript
export interface AuthUser {
  // ... campos existentes
  agency_name?: string  // ✨ AGREGADO para agentes inmobiliarios
  role: string
  // ...
}
```

### 3. Formulario de Crear Propiedad
**Archivo:** `Frontend/web/pages/dashboard/create-listing.tsx`

#### Removido:
- ❌ Campo de selección manual "Tipo de Anunciante"
- ❌ Constante `ADVERTISER_TYPES`
- ❌ `advertiser_type` del estado `formData`

#### Agregado:
- ✅ Lógica automática de detección en `handleSubmit()`
- ✅ Banner informativo que muestra cómo se publicará
- ✅ Import de `InformationCircleIcon`

## 🎯 Lógica de Determinación

### Mapeo Rol → Advertiser Type

```typescript
// En handleSubmit()
let advertiser_type = 'owner'; // Por defecto

if (user?.role === 'agent') {
  // Si tiene agency_name, es de una inmobiliaria, sino es broker
  advertiser_type = user?.agency_name ? 'agency' : 'broker';
} else if (user?.role === 'landlord' || user?.role === 'user') {
  advertiser_type = 'owner';
}
```

| Rol del Usuario | `agency_name` | Advertiser Type | Descripción |
|-----------------|---------------|-----------------|-------------|
| `landlord` | - | `owner` | Propietario |
| `user` | - | `owner` | Usuario básico (propietario) |
| `agent` | ✅ Tiene | `agency` | Agente de inmobiliaria |
| `agent` | ❌ No tiene | `broker` | Corredor independiente |
| `admin` | - | `owner` | Admin (por defecto propietario) |

## 💬 Mensaje Informativo

El formulario ahora muestra un banner azul informativo en el Paso 1:

```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <InformationCircleIcon />
  <div>
    <p className="font-medium">Tipo de anunciante</p>
    <p>
      {user?.role === 'agent' 
        ? user?.agency_name 
          ? `Publicarás como agente de ${user.agency_name}`
          : 'Publicarás como corredor independiente'
        : 'Publicarás como propietario'
      }
    </p>
  </div>
</div>
```

### Ejemplos de Mensajes:

- **Propietario:** "Publicarás como propietario"
- **Agente de Inmobiliaria:** "Publicarás como agente de Inmobiliaria XYZ"
- **Corredor:** "Publicarás como corredor independiente"

## 🔧 Impacto en la API

### Antes:
```json
{
  "advertiser_type": "owner" // Seleccionado manualmente
}
```

### Ahora:
```json
{
  // advertiser_type se determina en el backend basado en:
  // - El rol del usuario (user.role)
  // - La agencia del usuario (user.agency_name)
}
```

**Nota:** El backend debe implementar la misma lógica de determinación al crear el listing.

## ✅ Beneficios

1. **Menos errores:** Los usuarios no pueden seleccionar un tipo incorrecto
2. **Mejor UX:** Un campo menos que llenar
3. **Más seguro:** No se puede hacer fraude de identidad
4. **Automático:** Se basa en datos verificados del perfil
5. **Transparente:** El usuario ve cómo se publicará

## 🧪 Testing

### Casos de Prueba:

1. **Usuario con rol `landlord`:**
   - ✅ Debe mostrar: "Publicarás como propietario"
   - ✅ `advertiser_type` = `owner`

2. **Usuario con rol `agent` + `agency_name="Inmobiliaria ABC"`:**
   - ✅ Debe mostrar: "Publicarás como agente de Inmobiliaria ABC"
   - ✅ `advertiser_type` = `agency`

3. **Usuario con rol `agent` + sin `agency_name`:**
   - ✅ Debe mostrar: "Publicarás como corredor independiente"
   - ✅ `advertiser_type` = `broker`

4. **Usuario con rol `user`:**
   - ✅ Debe mostrar: "Publicarás como propietario"
   - ✅ `advertiser_type` = `owner`

## 📝 Notas

- El campo `advertiser_type` ya no se envía desde el frontend
- El backend debe calcular `advertiser_type` automáticamente al crear/actualizar listings
- Los listings existentes mantienen su `advertiser_type` original

## 🚀 Próximos Pasos

### Backend (Completado): ✅
1. ✅ **Script SQL creado**: `backend_doc/17_auto_advertiser_type.sql`
2. ✅ **Trigger automático**: `trigger_set_advertiser_type` establece `advertiser_type` en la BD
3. ✅ **Función auxiliar**: `core.get_user_advertiser_type(UUID)` para consultas
4. ✅ **Vista**: `core.v_users_with_advertiser_type` para reportes
5. ⏳ **Ejecutar script**: Aplicar `17_auto_advertiser_type.sql` en la base de datos
6. ⏳ **Actualizar API**: Remover `advertiser_type` de `CreateListingRequest` (opcional)

### Frontend (Completado): ✅
1. ✅ Remover selector manual
2. ✅ Agregar mensaje informativo
3. ✅ Actualizar interface `AuthUser`
4. ✅ Implementar lógica de determinación (client-side)
5. ⏳ **Actualizar después de ejecutar SQL**: Remover lógica client-side ya que BD lo manejará

## 🐛 Problemas Conocidos

Ninguno.

## 📚 Referencias

- Modelo User: `Backend/app/models/auth.py`
- Enum AdvertiserType: `Backend/app/models/listing.py`
- Interface AuthUser: `Frontend/web/lib/api/auth.ts`
- Formulario: `Frontend/web/pages/dashboard/create-listing.tsx`
