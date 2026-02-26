# Análisis de Tablas a Mejorar para Carga Asíncrona

Fecha: 2026-02-25
Contexto: Backend FastAPI + PostgreSQL (Docker Prod)

## 0) Alcance y lectura correcta del documento

Este documento mezcla dos tipos de trabajo:

1. Tablas que YA existen y requieren optimización (índices, patrón de consumo, retención).
2. Tablas que aún NO existen en esta BD y deben crearse primero, y luego optimizarse.

Importante: el estado puede variar por entorno (dev/staging/prod). Este análisis refleja el estado de la BD revisada en Docker Prod al momento de crear el documento.

## 0.1 Estado actual por tabla (existencia)

### Existen actualmente

- `core.notifications`
- `chat.messages`
- `chat.conversations`
- `chat.user_presence`
- `chat.push_notifications`
- `public.webhooks`
- `public.webhook_deliveries`
- `public.webhook_event_logs`
- `core.bookings`
- `core.booking_payments`
- `core.booking_calendar`

### No existen actualmente

- `core.notification_queue`
- `core.notification_deliveries`
- `core.analytics_events`
- `public.external_api_logs`
- `core.user_activity`
- `core.listing_views`

Interpretación práctica:
- Para tablas existentes: aplicar mejoras de performance/operación.
- Para tablas no existentes: primero crear, luego aplicar mejoras recomendadas.

## 1) Objetivo

Documentar qué tablas requieren mejoras para soportar mejor patrones asíncronos (colas, workers, reintentos, eventos, chat en tiempo real), priorizando:

- Menor latencia en lectura/escritura concurrente.
- Menor contención/locks en workers.
- Mejor throughput en colas de procesamiento.
- Mejor mantenibilidad y observabilidad operativa.

## 2) Tablas priorizadas

### P0 (impacto inmediato)

1. `core.notification_queue`
2. `core.notification_deliveries`
3. `chat.messages`
4. `chat.conversations`

### P1 (impacto alto, segunda ola)

5. `public.webhook_deliveries`
6. `public.webhook_event_logs`
7. `public.webhooks`
8. `core.bookings`
9. `core.booking_payments`

### P2 (escalabilidad y costo operativo)

10. `core.analytics_events`
11. `external_api_logs`
12. `core.user_activity`
13. `core.listing_views`
14. `chat.user_presence`
15. `chat.push_notifications`

## 3) Hallazgos técnicos

## 3.1 Colas de notificación (`core.notification_queue`)

### Estado actual
- En esta BD la tabla NO existe actualmente.
- Cuando exista, debe incluir estructura de cola (`priority_score`, `scheduled_for`, `processing`, `retry_count`) y patrón robusto de lease/locking para múltiples workers.

### Riesgo
- Workers concurrentes pueden competir por filas similares.
- Riesgo de doble procesamiento en escenarios de alta concurrencia.

### Mejora recomendada
- Añadir columnas de lease:
  - `locked_at TIMESTAMPTZ NULL`
  - `lock_owner TEXT NULL`
  - `available_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Consumir con `FOR UPDATE SKIP LOCKED`.
- Índice compuesto para barrido eficiente:
  - `(processing, available_at, priority_score DESC, created_at)`

## 3.2 Entregas de notificación (`core.notification_deliveries`)

### Estado actual
- En esta BD la tabla NO existe actualmente.
- Cuando exista, el flujo de reintentos debe depender de `next_attempt_at` con índices adecuados.

### Mejora recomendada
- Índice compuesto de reintentos:
  - `(status, next_attempt_at, attempt_count)`
- Índice de consulta histórica por notificación:
  - `(notification_id, created_at DESC)`

## 3.3 Chat: mensajes (`chat.messages`) y conversaciones (`chat.conversations`)

### Estado actual
- Uso intensivo de:
  - Filtros por `conversation_id`
  - Orden por `created_at DESC`
  - Conteo de no leídos por `status != READ`
- Actualmente no están materializados índices específicos en la migración baseline para estas tablas.

### Riesgo
- Degradación por scans frecuentes al crecer volumen de mensajes.

### Mejora recomendada

`chat.messages`
- Índice para timeline:
  - `(conversation_id, created_at DESC)`
- Índice parcial para no leídos:
  - `(conversation_id, status, sender_user_id)` `WHERE is_deleted = false`
- Índice para marcación masiva de leídos:
  - `(conversation_id, sender_user_id, status)`

`chat.conversations`
- Índice inbox cliente:
  - `(client_user_id, updated_at DESC)`
- Índice inbox owner:
  - `(owner_user_id, updated_at DESC)`
- Opcional para archivado:
  - `(client_user_id, archived_by_client, updated_at DESC)`
  - `(owner_user_id, archived_by_owner, updated_at DESC)`

## 3.4 Webhooks (`public.webhooks`, `public.webhook_deliveries`, `public.webhook_event_logs`)

### Estado actual
- Se filtra por `webhook_id`, `status` y orden por `created_at DESC`.
- Búsqueda de suscripciones por `events` en JSON.

### Riesgo
- Filtros por JSON (`events`) escalan peor que una tabla relacional de suscripciones.
- Reintentos pueden volverse costosos sin índice por `next_retry_at`.

### Mejora recomendada

`public.webhook_deliveries`
- Índice consulta operativa:
  - `(webhook_id, status, created_at DESC)`
- Índice para worker de retries:
  - `(status, next_retry_at, attempt_count)`

`public.webhook_event_logs`
- Índice de procesamiento:
  - `(processed, created_at)`
- Índice de trazabilidad:
  - `(event_type, created_at DESC)`

`public.webhooks`
- Índice operativo:
  - `(active, user_id)`

Recomendación de diseño (mediano plazo):
- Reemplazar JSON `events` por tabla:
  - `webhook_subscriptions(webhook_id, event_type)`
- Beneficio: búsquedas exactas por evento sin funciones JSON en cada trigger.

## 3.5 Reservas y pagos (`core.bookings`, `core.booking_payments`)

### Estado actual
- Se consulta por `host_user_id`, `guest_user_id`, `status`, `created_at` y `payment_deadline`.
- No hay índices explícitos en la migración para estos patrones.

### Mejora recomendada

`core.bookings`
- `(host_user_id, created_at DESC)`
- `(guest_user_id, created_at DESC)`
- `(status, payment_deadline)` para jobs de expiración.
- `(listing_id, check_in_date, check_out_date)` para calendario/disponibilidad.

`core.booking_payments`
- `(booking_id, created_at DESC)`
- `(status, created_at DESC)`
- `(payment_type, status)`

## 4) Retención y particionado (P2)

Tablas de alto volumen temporal:
- `core.analytics_events`
- `external_api_logs`
- `core.user_activity`
- `core.listing_views`

Nota de estado actual: en esta BD estas tablas NO existen al momento del análisis.

### Mejora recomendada
- Política de retención (ejemplo):
  - crudo 90 días, agregado 12 meses.
- Particionado por mes (`created_at` / `viewed_at` / `occurred_at`).
- Jobs nocturnos para compactación/agregados.

## 5) Consistencia de esquemas

Actualmente hay tablas nuevas en `public` y dominio principal en `core` / `chat`.

### Recomendación
- Definir convención única por dominio:
  - Core de negocio en `core`
  - Chat en `chat`
  - Integraciones en `integration` (opcional)
- Evitar mezcla accidental `public`/`core` para simplificar permisos, backups y auditoría.

## 6) Plan de ejecución sugerido

## Fase 1 (rápida, bajo riesgo)
- Solo índices nuevos (sin tocar lógica de negocio).
- Objetivo: reducción de latencia de lectura y filtros críticos.

## Fase 2 (cola robusta)
- Añadir lease fields en `notification_queue`.
- Ajustar worker a `SKIP LOCKED`.

## Fase 3 (webhooks escalables)
- Índices de retries/eventos.
- Evaluar migración `events JSON -> webhook_subscriptions`.

## Fase 4 (volumen histórico)
- Retención + particionado en tablas de analytics/logs.

## 7) KPIs para validar mejora

- p95/p99 de endpoints de chat y notificaciones.
- Tiempo promedio de vaciado de cola (`notification_queue`).
- Tasa de retries exitosos en webhooks.
- QPS sostenido sin incremento de lock waits.
- Tamaño de tablas históricas y costo de queries por período.

## 8) Entregable técnico siguiente

Siguiente paso recomendado:
- Crear migración `P0` con índices críticos + lease fields de `notification_queue`.
- Ejecutar en staging y comparar métricas de p95 y lock contention.
