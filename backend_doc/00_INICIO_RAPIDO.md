# 🚀 Inicio Rápido: Configuración de Usuarios PostgreSQL

## Comandos Para Ejecutar (en orden)

### 1️⃣ Crear Usuarios PostgreSQL

```powershell
# Abrir PowerShell como Administrador
cd d:\Trabajos\benites\backend_doc

# Ejecutar script de creación de usuarios
psql -U postgres -f 01_crear_usuarios.sql
```

**Resultado esperado:**
```
✅ Usuario benites_admin creado exitosamente
✅ Usuario benites_app creado exitosamente
```

---

### 2️⃣ Verificar Usuarios Creados

```powershell
# Verificar que los usuarios existen
psql -U postgres -c "\du benites*"
```

**Deberías ver:**
```
              List of roles
   Role name   | Attributes | Member of
---------------+------------+-----------
 benites_admin | Create DB, | {}
               | Create role|
 benites_app   |            | {}
```

---

## 🔑 Credenciales Creadas

| Usuario | Password | Uso |
|---------|----------|-----|
| `benites_admin` | `BeniteS2025!Admin` | Migraciones, crear tablas, índices |
| `benites_app` | `BeniteS2025!App` | Backend FastAPI, operaciones normales |

⚠️ **Guarda estas credenciales** - las necesitarás en los siguientes pasos.

---

## ✅ Validación

Prueba conectarte con cada usuario:

```powershell
# Probar conexión como admin
psql -U benites_admin -d postgres -c "SELECT current_user;"

# Probar conexión como app
psql -U benites_app -d postgres -c "SELECT current_user;"
```

Si ambos comandos muestran el nombre del usuario, ¡listo! ✅

---

## 📚 Documentación Completa

Ver: [01_CREAR_USUARIOS.md](./01_CREAR_USUARIOS.md) para explicación detallada.

---

## 🎯 Próximo Paso

Una vez creados los usuarios, continúa con:

**Crear la base de datos y esquemas** → Ver mi siguiente respuesta
