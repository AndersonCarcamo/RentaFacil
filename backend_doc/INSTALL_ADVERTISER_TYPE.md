# 🚀 Guía Rápida: Instalación del Sistema de Advertiser Type Automático

## ⚡ Quick Start (5 minutos)

### 1️⃣ Ejecutar Script SQL

**Opción A - Línea de comandos:**
```bash
psql -U tu_usuario -d tu_basedatos -f backend_doc/17_auto_advertiser_type.sql
```

**Opción B - Cliente gráfico (pgAdmin, DBeaver, etc.):**
1. Abrir archivo: `backend_doc/17_auto_advertiser_type.sql`
2. Copiar todo el contenido
3. Pegar en query editor
4. Ejecutar

### 2️⃣ Verificar Instalación

Deberías ver este mensaje al final:

```
========================================
Verificación de actualización:
- Función set_advertiser_type(): ✓ OK
- Trigger trigger_set_advertiser_type: ✓ OK
- Vista v_users_with_advertiser_type: ✓ OK
- Total listings procesados: 150
========================================
```

✅ Si ves "✓ OK" en todo, ¡listo!

### 3️⃣ Probar

```sql
-- Crear un listing de prueba
INSERT INTO core.listings (
    owner_user_id, 
    title, 
    description, 
    operation, 
    property_type, 
    price
) VALUES (
    'tu_user_uuid', 
    'Test Property', 
    'Testing auto advertiser type', 
    'rent', 
    'apartment', 
    1000
);

-- Verificar que advertiser_type se estableció automáticamente
SELECT 
    id, 
    title, 
    advertiser_type, 
    agency_id 
FROM core.listings 
WHERE title = 'Test Property';
```

**Resultado esperado:**
- Si el usuario es `landlord/user` → `advertiser_type = 'owner'`
- Si el usuario es `agent` con agencia → `advertiser_type = 'agency'`
- Si el usuario es `agent` sin agencia → `advertiser_type = 'broker'`

---

## ✅ Checklist de Verificación

Después de ejecutar el script, verifica:

- [ ] ✅ Función `core.set_advertiser_type()` existe
- [ ] ✅ Trigger `trigger_set_advertiser_type` existe
- [ ] ✅ Vista `core.v_users_with_advertiser_type` existe
- [ ] ✅ Listings existentes actualizados (si activaste esa opción)
- [ ] ✅ Test de creación de listing funciona
- [ ] ✅ Frontend muestra mensaje informativo

---

## 🔍 Comandos de Diagnóstico

### Verificar que el trigger existe:
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_set_advertiser_type';
```

### Ver distribución de advertiser_types:
```sql
SELECT 
    advertiser_type,
    COUNT(*) as total
FROM core.listings
GROUP BY advertiser_type;
```

### Ver usuarios con su tipo esperado:
```sql
SELECT 
    email,
    role,
    expected_advertiser_type,
    agency_name
FROM core.v_users_with_advertiser_type
WHERE role = 'agent';
```

---

## ⚠️ Si algo sale mal

### Error: "relation core.listings does not exist"
**Causa:** La base de datos no tiene las tablas creadas.
**Solución:** Ejecutar primero los scripts de setup: `00_master_install.sql`

### Error: "type core.advertiser_type does not exist"
**Causa:** Los enums no están creados.
**Solución:** Ejecutar `02_enums_and_types.sql` primero.

### El trigger no se ejecuta
**Solución:**
```sql
-- Verificar triggers activos
SELECT * FROM pg_trigger WHERE tgrelid = 'core.listings'::regclass;

-- Si no existe, volver a ejecutar sección 2 del script
```

---

## 📞 Soporte

**Documentación completa:**
- `backend_doc/17_auto_advertiser_type_README.md`
- `RESUMEN_ADVERTISER_TYPE_SYSTEM.md`

**Frontend:**
- `Frontend/web/pages/dashboard/CHANGELOG_ADVERTISER_TYPE.md`

---

## 🎉 ¡Listo!

Una vez ejecutado el script:

1. ✅ El sistema establecerá automáticamente `advertiser_type`
2. ✅ No necesitas especificarlo en el backend
3. ✅ El frontend solo muestra un mensaje informativo
4. ✅ Todo está centralizado en la base de datos

**Próximo paso:** Actualizar el backend para remover la lógica manual (opcional).
