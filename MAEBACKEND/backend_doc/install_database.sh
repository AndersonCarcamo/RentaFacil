#!/bin/bash
# ================================================================================
# Script de Instalación Automática - EasyRent Database
# ================================================================================
# Ejecuta todos los scripts SQL en el orden correcto
# Uso: ./install_database.sh
# ================================================================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración de la base de datos
DB_USER="${DB_USER:-easyrent_app}"
DB_NAME="${DB_NAME:-easyrent_db}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║           EasyRent Database Installation Script           ║"
echo "║                    Version 1.0.0                           ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Función para ejecutar SQL y mostrar progreso
execute_sql() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}[EJECUTANDO]${NC} $description"
    echo -e "             Archivo: $file"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}[ERROR]${NC} Archivo no encontrado: $file"
        return 1
    fi
    
    if psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}[OK]${NC} $description completado\n"
        return 0
    else
        echo -e "${RED}[ERROR]${NC} Falló la ejecución de $file"
        echo "Ejecuta manualmente para ver el error:"
        echo "psql -U $DB_USER -d $DB_NAME -f $file"
        return 1
    fi
}

# Verificar que estamos en el directorio correcto
if [ ! -f "00_database_setup.sql" ]; then
    echo -e "${RED}[ERROR]${NC} No se encontró 00_database_setup.sql"
    echo "Ejecuta este script desde el directorio backend_doc/"
    exit 1
fi

# Verificar conexión a la base de datos
echo -e "${BLUE}[INFO]${NC} Verificando conexión a PostgreSQL..."
if ! psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} No se puede conectar a la base de datos"
    echo "Verifica las credenciales y que PostgreSQL esté corriendo"
    echo "DB_USER=$DB_USER, DB_NAME=$DB_NAME, DB_HOST=$DB_HOST, DB_PORT=$DB_PORT"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Conexión exitosa a PostgreSQL\n"

# Preguntar confirmación
echo -e "${YELLOW}[ADVERTENCIA]${NC} Este script ejecutará todos los scripts de migración"
echo "Base de datos: $DB_NAME"
echo "Usuario: $DB_USER"
echo ""
read -p "¿Continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Instalación cancelada"
    exit 0
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Iniciando instalación de base de datos...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Timestamp de inicio
START_TIME=$(date +%s)

# ================================================================================
# PASO 1: Configuración Base
# ================================================================================
echo -e "${BLUE}[PASO 1]${NC} Configuración Base"
echo "─────────────────────────────────────────────────────────────"

execute_sql "00_database_setup.sql" "Database setup inicial" || exit 1
execute_sql "01_extensions_and_schemas.sql" "Extensiones y schemas" || exit 1

# ================================================================================
# PASO 2: Tipos y Enums
# ================================================================================
echo -e "${BLUE}[PASO 2]${NC} Tipos y Enums"
echo "─────────────────────────────────────────────────────────────"

execute_sql "02_enums_and_types.sql" "Crear enums y tipos personalizados" || exit 1

# ================================================================================
# PASO 3: Tablas Core
# ================================================================================
echo -e "${BLUE}[PASO 3]${NC} Tablas Core"
echo "─────────────────────────────────────────────────────────────"

execute_sql "03_core_tables.sql" "Crear tablas principales" || exit 1
execute_sql "04_user_interactions.sql" "Tablas de interacciones de usuario" || exit 1

# ================================================================================
# PASO 4: Analytics y Verificación
# ================================================================================
echo -e "${BLUE}[PASO 4]${NC} Analytics y Verificación"
echo "─────────────────────────────────────────────────────────────"

execute_sql "05_analytics.sql" "Sistema de analytics" || exit 1
execute_sql "06_verification_workflow.sql" "Flujo de verificación" || exit 1
execute_sql "07_security_audit.sql" "Auditoría de seguridad" || exit 1

# ================================================================================
# PASO 5: Planes y Pagos
# ================================================================================
echo -e "${BLUE}[PASO 5]${NC} Planes de Suscripción y Pagos"
echo "─────────────────────────────────────────────────────────────"

execute_sql "08_subscription_plans.sql" "Planes de suscripción base" || exit 1
execute_sql "09_billing_payments.sql" "Sistema de pagos" || exit 1
execute_sql "13_subscription_plans.sql" "Actualización de planes" || exit 1
execute_sql "14_add_plan_target_type.sql" "Agregar plan target type" || exit 1
execute_sql "14_auto_free_subscription.sql" "Suscripción gratuita automática" || exit 1

# ================================================================================
# PASO 6: Particionamiento y Reglas de Negocio
# ================================================================================
echo -e "${BLUE}[PASO 6]${NC} Particionamiento y Reglas"
echo "─────────────────────────────────────────────────────────────"

execute_sql "10_partition_management.sql" "Gestión de particiones" || exit 1
execute_sql "11_business_rules.sql" "Reglas de negocio" || exit 1

# ================================================================================
# PASO 7: Sistema Airbnb
# ================================================================================
echo -e "${BLUE}[PASO 7]${NC} Sistema Airbnb (Crítico)"
echo "─────────────────────────────────────────────────────────────"

execute_sql "15_add_rating_reviews_system.sql" "Sistema de ratings y reviews" || exit 1
execute_sql "15_airbnb_bookings.sql" "Sistema de reservas Airbnb" || exit 1
execute_sql "17_add_max_guests.sql" "Agregar max_guests" || exit 1
execute_sql "17_add_max_guests_to_listings.sql" "Max guests en listings" || exit 1
execute_sql "18_add_listing_airbnb_fields.sql" "Campos adicionales Airbnb" || exit 1
execute_sql "add_rental_model_column.sql" "Columna rental_model" || exit 1

# ================================================================================
# PASO 8: Agencias y Roles
# ================================================================================
echo -e "${BLUE}[PASO 8]${NC} Sistema de Agencias"
echo "─────────────────────────────────────────────────────────────"

execute_sql "17_auto_advertiser_type.sql" "Auto advertiser type" || exit 1
execute_sql "18_agent_invitations.sql" "Invitaciones de agentes" || exit 1
execute_sql "19_add_user_agency_role_field.sql" "Roles de agencia" || exit 1

# ================================================================================
# PASO 9: Media y Comunicación
# ================================================================================
echo -e "${BLUE}[PASO 9]${NC} Media y Comunicación"
echo "─────────────────────────────────────────────────────────────"

execute_sql "20_listing_media_system.sql" "Sistema de media" || exit 1
execute_sql "25_chat_system.sql" "Sistema de chat" || exit 1
execute_sql "26_notifications_system.sql" "Sistema de notificaciones" || exit 1

# ================================================================================
# PASO 10: Mejoras de Pagos
# ================================================================================
echo -e "${BLUE}[PASO 10]${NC} Mejoras de Sistema de Pagos"
echo "─────────────────────────────────────────────────────────────"

execute_sql "26_add_payment_deadline.sql" "Payment deadline" || exit 1
execute_sql "27_add_payment_proof.sql" "Comprobante de pago" || exit 1

# ================================================================================
# PASO 11: Performance y Optimización
# ================================================================================
echo -e "${BLUE}[PASO 11]${NC} Performance y Optimización"
echo "─────────────────────────────────────────────────────────────"

execute_sql "28_performance_indexes.sql" "Índices de performance" || exit 1
execute_sql "29_analytics_refactor.sql" "Refactor de analytics" || exit 1
execute_sql "30_generate_slugs.sql" "Generación de slugs" || exit 1

# ================================================================================
# PASO 12: OPTIMIZACIÓN DE LISTINGS (NUEVO) ⭐
# ================================================================================
echo -e "${BLUE}[PASO 12]${NC} Optimización de Listings con Herencia ⭐"
echo "─────────────────────────────────────────────────────────────"

execute_sql "31_optimize_listings_inheritance.sql" "Vistas materializadas y separación Airbnb/Traditional" || exit 1

# ================================================================================
# PASO 13: Datos de Prueba (Opcional)
# ================================================================================
echo -e "${BLUE}[PASO 13]${NC} Datos de Prueba (Opcional)"
echo "─────────────────────────────────────────────────────────────"

read -p "¿Deseas cargar datos de prueba? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    execute_sql "12_sample_data.sql" "Datos de ejemplo base" || echo "Advertencia: Falló la carga de datos de ejemplo"
    execute_sql "sample_data_new_features.sql" "Datos de ejemplo (features nuevos)" || echo "Advertencia: Falló la carga de datos de ejemplo"
else
    echo -e "${YELLOW}[SKIP]${NC} Datos de prueba omitidos"
fi

# ================================================================================
# Verificación Final
# ================================================================================
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Verificando instalación...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Contar tablas
TABLE_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -t -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'core'
" | xargs)

# Contar vistas materializadas
MATVIEW_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -t -c "
    SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'core'
" | xargs)

# Contar funciones
FUNCTION_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -t -c "
    SELECT COUNT(*) FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'core'
" | xargs)

# Contar listings
LISTING_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -t -c "
    SELECT COUNT(*) FROM core.listings
" | xargs)

# Timestamp de fin
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Reporte Final
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║          ✓ INSTALACIÓN COMPLETADA EXITOSAMENTE            ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Estadísticas:${NC}"
echo "  • Tablas creadas:              $TABLE_COUNT"
echo "  • Vistas materializadas:       $MATVIEW_COUNT"
echo "  • Funciones:                   $FUNCTION_COUNT"
echo "  • Listings:                    $LISTING_COUNT"
echo "  • Tiempo de instalación:       ${MINUTES}m ${SECONDS}s"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "  1. Configurar Celery workers para tareas asíncronas"
echo "  2. Configurar cron job para refresh de vistas:"
echo "     */2 * * * * psql -U $DB_USER -d $DB_NAME -c \"SELECT core.refresh_listings_views();\""
echo "  3. Configurar Redis para cache"
echo "  4. Revisar GUIA_INSTALACION_COMPLETA.md para más detalles"
echo ""
echo -e "${GREEN}¡Todo listo para comenzar a usar EasyRent!${NC}"
echo ""
