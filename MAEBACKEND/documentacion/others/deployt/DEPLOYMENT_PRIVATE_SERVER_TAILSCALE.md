# Deployment Backend en servidor privado (Tailscale + Frontend local/Vercel)

## 1) Objetivo de esta guía

Esta guía está pensada para este escenario:

- Backend en este Ubuntu server (sin IP pública).
- Frontend temporal en local, pero en **otro equipo**.
- Frontend final en Vercel.
- Se desea seguridad en producción y evitar exposición incorrecta de base de datos.

---

## 2) Arquitectura recomendada

```text
Cliente (browser) -> Frontend (local/Vercel) -> Nginx (este server) -> FastAPI (Docker)
                                                      |
                                                      +-> PostgreSQL (host Ubuntu)
                                                      +-> Redis (Docker)
```

Regla clave:

- **Solo Nginx/API se publica**.
- **PostgreSQL y Redis NO se publican a internet**.

---

## 3) Qué hace cada archivo ya creado

- `Dockerfile`: construye la imagen de la API.
- `docker-compose.prod.yml`: levanta `app`, `redis`, `nginx` en Docker y usa PostgreSQL del host.
- `.env.production`: variables reales de producción.
- `app/main.py`: CORS por ambiente y `TrustedHostMiddleware`.
- `nginx/nginx.conf`: reverse proxy y media.

---

## 4) Requisitos mínimos

En el servidor Ubuntu:

- Docker o Podman con soporte compose.
- Tailscale instalado y conectado (`tailscale up`).
- Carpeta del backend con `.env.production` completo.

En el equipo del frontend local (temporal):

- Tailscale también instalado y conectado a la misma tailnet.

---

## 5) Variables críticas en `.env.production`

Configurar obligatoriamente:

- `ENVIRONMENT=production`
- `DEBUG=false`
- `SECRET_KEY` (largo, aleatorio)
- `POSTGRES_PASSWORD` fuerte
- `DATABASE_URL` con credenciales reales
- `CORS_ALLOWED_ORIGINS` (orígenes exactos del frontend)
- `ALLOWED_HOSTS` (hostnames válidos que atenderá FastAPI)

Para opción B (PostgreSQL en host Ubuntu), usar:

```env
DATABASE_URL=postgresql://rf_app:<password>@host.docker.internal:5432/renta_facil_test
DATABASE_URL_TEST=postgresql://rf_app:<password>@host.docker.internal:5432/renta_facil_test
```

Estado actual recomendado para esta etapa: desplegar con `renta_facil_test` (datos reales de prueba) y migrar a `renta_facil` al cierre de validación.

Ejemplo temporal (frontend en otro equipo por tailnet):

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ALLOWED_HOSTS=localhost,127.0.0.1,<host-backend>.tailnet-xyz.ts.net
```

Ejemplo cuando migres a Vercel:

```env
CORS_ALLOWED_ORIGINS=https://tuapp.vercel.app,https://app.tudominio.com
ALLOWED_HOSTS=<host-publicado>.ts.net,app.tudominio.com
```

> Importante: si usas `TrustedHostMiddleware`, el host recibido por la API debe estar en `ALLOWED_HOSTS`.

---

## 6) Levantar backend en el servidor

Desde `MAEBACKEND/backend_api`:

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Validaciones:

```bash
curl -i http://localhost/health
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
```

---

## 7) Acceso desde frontend local (otro equipo) con Tailscale

### Opción A: solo privada (tailnet)

Sirve para pruebas internas sin internet público.

1. Ambos equipos (backend y frontend) dentro de la misma tailnet.
2. El frontend usa URL de backend por Tailscale (IP `100.x` o MagicDNS).
3. Ajustar CORS para el origen real del frontend.

Ejemplo frontend env local:

```env
NEXT_PUBLIC_API_URL=http://<tailscale-ip-o-hostname>
```

### Opción B: pública para Vercel (Funnel)

Vercel no puede llamar recursos privados de tailnet. Para eso usa Funnel.

Pasos generales:

1. Publicar servicio local con `tailscale serve` hacia `http://127.0.0.1:80`.
2. Habilitar salida pública con `tailscale funnel`.
3. Obtener URL HTTPS `*.ts.net`.
4. Poner esa URL en frontend (Vercel) y en `CORS_ALLOWED_ORIGINS`.

Comandos pueden variar según versión de Tailscale; verificar:

```bash
tailscale serve --help
tailscale funnel --help
```

---

## 8) Base de datos “expuesta correctamente” (Opción B)

Para producción segura, la BD **no debe estar expuesta públicamente**.

En esta configuración queda protegida porque:

- PostgreSQL corre en el host y escucha solo en red local/Tailscale según tu `postgresql.conf`.
- `docker-compose.prod.yml` no publica `5432`.
- Solo `nginx` publica `80/443`.

### ¿Cómo administrar DB de forma segura?

Opciones recomendadas:

1. **Desde el propio servidor**:
   - `psql -U <user> -d <db>`
2. **Túnel SSH temporal** (si tienen acceso SSH):
   - abrir túnel local solo para mantenimiento.
3. **Nunca** abrir `5432` a todo internet.

---

## 9) Checklist de seguridad mínima

- [ ] `SECRET_KEY` robusta y única.
- [ ] Claves de Culqi en modo `live` (si aplica).
- [ ] `DEBUG=false`.
- [ ] CORS solo dominios necesarios.
- [ ] `ALLOWED_HOSTS` correcto.
- [ ] Backups de Postgres.
- [ ] Logs y monitoreo básicos.

---

## 10) Plan de transición recomendado

Fase 1 (hoy):

- Backend arriba en server privado con Compose.
- Frontend local en otro equipo via Tailscale privada.

### Migrar de `renta_facil_test` a `renta_facil`

1. Crear DB productiva en host PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE renta_facil OWNER rf_app;"
```

2. Aplicar esquema/migraciones en `renta_facil`:

```bash
docker compose -f docker-compose.prod.yml run --rm app alembic upgrade head
```

3. (Opcional) Copiar datos de prueba a productiva:

```bash
pg_dump -U rf_app -d renta_facil_test --no-owner --no-privileges | psql -U rf_app -d renta_facil
```

4. Actualizar `.env.production` para que `DATABASE_URL` apunte a `renta_facil`.

5. Reiniciar servicios:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Fase 2:

- Publicar backend con Tailscale Funnel (`https://...ts.net`).
- Integrar frontend en Vercel contra esa URL.

Fase 3:

- Dominio propio para frontend (y opcionalmente backend público).
- Reforzar monitoreo, backups y rotación de secretos.


