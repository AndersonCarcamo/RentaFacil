#!/bin/bash
# ============================================
# INSTALACIÓN AUTOMATIZADA - BASE DE DATOS EASYRENT
# ============================================
# Este script ejecuta automáticamente todos los archivos SQL
# en el orden correcto para una instalación limpia
#
# Requisitos:
# - PostgreSQL 17.x instalado
# - Usuario postgres con permisos
# - Archivos SQL en backend_doc/
#
# Uso:
#   chmod +x install_database_auto.sh
#   ./install_database_auto.sh
# ============================================

set -e  # Detener en caso de error
set -u  # Detectar variables no definidas

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="easyrent_db"
ADMIN_USER="benites_admin"
APP_USER="benites_app"
POSTGRES_USER="postgres"

# Log file
LOG_FILE="${SCRIPT_DIR}/install_$(date +%Y%m%d_%H%M%S).log"

# ============================================
# FUNCIONES AUXILIARES
# ============================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

execute_sql() {
    local sql_file=$1
    local db_user=$2
    local database=${3:-$DB_NAME}
    
    log_info "Ejecutando: $sql_file"
    
    if [ ! -f "$SCRIPT_DIR/$sql_file" ]; then
        log_error "Archivo no encontrado: $sql_file"
        return 1
    fi
    
    if psql -U "$db_user" -d "$database" -f "$SCRIPT_DIR/$sql_file" >> "$LOG_FILE" 2>&1; then
        log "✅ Completado: $sql_file"
        return 0
    else
        log_error "❌ Error ejecutando: $sql_file"
        log_error "Revisa el log: $LOG_FILE"
        return 1
    fi
}

check_postgres() {
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL no está instalado o no está en el PATH"
        exit 1
    fi
    
    log "PostgreSQL encontrado: $(psql --version)"
}

confirm() {
    local message=$1
    echo -e "${YELLOW}${message}${NC}"
    read -p "¿Continuar? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Instalación cancelada por el usuario"
        exit 0
    fi
}

# ============================================
# INICIO DEL SCRIPT
# ============================================

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  INSTALACIÓN BASE DE DATOS EASYRENT          ║${NC}"
echo -e "${GREEN}║  Instalación Automatizada                    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

log "Iniciando instalación de base de datos EasyRent"
log "Log guardado en: $LOG_FILE"

# Verificar PostgreSQL
check_postgres

# Confirmación
confirm "⚠️  ADVERTENCIA: Este script creará una nueva base de datos '$DB_NAME'"

# ============================================
# FASE 1: USUARIOS Y BASE DE DATOS
# ============================================

echo ""
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 1: Crear usuarios y base de datos${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"

log "FASE 1: Creando usuarios PostgreSQL..."
execute_sql "01_crear_usuarios.sql" "$POSTGRES_USER" "postgres"

log "FASE 1: Creando base de datos..."
execute_sql "00_database_setup.sql" "$POSTGRES_USER" "postgres"

# ============================================
# FASE 2: ESTRUCTURA BASE
# ============================================

echo ""
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 2: Estructura base${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"

log "FASE 2: Instalando extensiones y schemas..."
execute_sql "01_extensions_and_schemas.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 2: Creando ENUMs y tipos personalizados..."
execute_sql "02_enums_and_types.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 2: Creando tablas principales..."
execute_sql "03_core_tables.sql" "$ADMIN_USER" "$DB_NAME"

# ============================================
# FASE 3: FUNCIONALIDADES CORE
# ============================================

echo ""
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 3: Funcionalidades core${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"

log "FASE 3: Configurando interacciones de usuario..."
execute_sql "04_user_interactions.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 3: Configurando analytics..."
execute_sql "05_analytics.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 3: Configurando workflow de verificación..."
execute_sql "06_verification_workflow.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 3: Configurando seguridad y auditoría..."
execute_sql "07_security_audit.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 3: Configurando planes de suscripción..."
execute_sql "08_subscription_plans.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 3: Configurando facturación y pagos..."
execute_sql "09_billing_payments.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 3: Configurando gestión de particiones..."
execute_sql "10_partition_management.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 3: Configurando reglas de negocio..."
execute_sql "11_business_rules.sql" "$ADMIN_USER" "$DB_NAME"

# ============================================
# FASE 4: FEATURES AVANZADAS
# ============================================

echo ""
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 4: Features avanzadas${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"

log "FASE 4: Configurando auto-asignación de plan gratuito..."
execute_sql "14_auto_free_subscription.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 4: Configurando auto-detección de tipo de anunciante..."
execute_sql "17_auto_advertiser_type.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 4: Configurando sistema de invitaciones de agentes..."
execute_sql "18_agent_invitations.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 4: Agregando campo role a user_agency..."
execute_sql "19_add_user_agency_role_field.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 4: Configurando sistema multimedia..."
execute_sql "20_listing_media_system.sql" "$ADMIN_USER" "$DB_NAME"

# ============================================
# FASE 5: SISTEMA AIRBNB
# ============================================

echo ""
read -p "$(echo -e ${YELLOW}¿Deseas instalar el sistema Airbnb? \(y/n\): ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}═════════════════════════════════════════${NC}"
    echo -e "${BLUE}FASE 5: Sistema Airbnb${NC}"
    echo -e "${BLUE}═════════════════════════════════════════${NC}"
    
    log "FASE 5: Configurando sistema de reservas Airbnb..."
    execute_sql "15_airbnb_bookings.sql" "$ADMIN_USER" "$DB_NAME"
    
    log "FASE 5: Agregando campos Airbnb a listings..."
    execute_sql "18_add_listing_airbnb_fields.sql" "$ADMIN_USER" "$DB_NAME"
else
    log_warning "Sistema Airbnb omitido"
fi

# ============================================
# FASE 6: CHAT Y NOTIFICACIONES
# ============================================

echo ""
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 6: Chat y Notificaciones${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"

log "FASE 6: Configurando sistema de chat..."
execute_sql "25_chat_system.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 6: Configurando sistema de notificaciones..."
execute_sql "26_notifications_system.sql" "$ADMIN_USER" "$DB_NAME"

# ============================================
# FASE 7: OPTIMIZACIÓN Y PERFORMANCE
# ============================================

echo ""
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 7: Optimización y Performance${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"

log "FASE 7: Creando índices de rendimiento..."
execute_sql "28_performance_indexes.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 7: Refactorizando analytics..."
execute_sql "29_analytics_refactor.sql" "$ADMIN_USER" "$DB_NAME"

log "FASE 7: Aplicando optimización con índices parciales..."
execute_sql "32_optimize_listings_partial_indices.sql" "$ADMIN_USER" "$DB_NAME"

# ============================================
# FASE 8: DATOS INICIALES (OPCIONAL)
# ============================================

echo ""
read -p "$(echo -e ${YELLOW}¿Deseas cargar datos de ejemplo? \(y/n\): ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}═════════════════════════════════════════${NC}"
    echo -e "${BLUE}FASE 8: Datos de ejemplo${NC}"
    echo -e "${BLUE}═════════════════════════════════════════${NC}"
    
    log "FASE 8: Cargando datos de ejemplo..."
    execute_sql "12_sample_data.sql" "$ADMIN_USER" "$DB_NAME"
else
    log_warning "Datos de ejemplo omitidos"
fi

# ============================================
# VALIDACIÓN FINAL
# ============================================

echo ""
echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${BLUE}VALIDACIÓN FINAL${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}"

log "Validando instalación..."

# Verificar extensiones
log_info "Verificando extensiones instaladas..."
psql -U "$ADMIN_USER" -d "$DB_NAME" -c "SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'postgis', 'pg_trgm', 'citext', 'unaccent', 'btree_gin');" >> "$LOG_FILE"

# Verificar schemas
log_info "Verificando schemas creados..."
psql -U "$ADMIN_USER" -d "$DB_NAME" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('core', 'analytics', 'sec', 'chat', 'archive');" >> "$LOG_FILE"

# Verificar tablas principales
log_info "Verificando tablas principales..."
TABLE_COUNT=$(psql -U "$ADMIN_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'core';")
log "Tablas en schema 'core': ${TABLE_COUNT}"

# Verificar planes de suscripción
log_info "Verificando planes de suscripción..."
PLAN_COUNT=$(psql -U "$ADMIN_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM core.plans;")
log "Planes de suscripción creados: ${PLAN_COUNT}"

# ============================================
# RESUMEN FINAL
# ============================================

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

log "═══════════════════════════════════════════════"
log "INSTALACIÓN COMPLETADA"
log "═══════════════════════════════════════════════"
log ""
log "Base de datos: $DB_NAME"
log "Usuario admin: $ADMIN_USER"
log "Usuario app: $APP_USER"
log "Log completo: $LOG_FILE"
log ""
log "PRÓXIMOS PASOS:"
log "1. Configurar conexión en backend (FastAPI)"
log "2. Configurar Redis para caché"
log "3. Configurar cron para particiones automáticas"
log "4. Configurar backup automático"
log ""
log "═══════════════════════════════════════════════"

echo ""
echo -e "${YELLOW}📝 Credenciales de acceso:${NC}"
echo -e "   Base de datos: ${GREEN}$DB_NAME${NC}"
echo -e "   Usuario admin: ${GREEN}$ADMIN_USER${NC}"
echo -e "   Usuario app:   ${GREEN}$APP_USER${NC}"
echo ""
echo -e "${YELLOW}📋 Log completo guardado en:${NC}"
echo -e "   ${GREEN}$LOG_FILE${NC}"
echo ""

exit 0
