# ============================================
# INSTALACIÓN AUTOMATIZADA - BASE DE DATOS EASYRENT
# ============================================
# PowerShell Script for Windows
# Este script ejecuta automáticamente todos los archivos SQL
# en el orden correcto para una instalación limpia
#
# Requisitos:
# - PostgreSQL 17.x instalado
# - psql.exe en el PATH
# - PowerShell 5.1 o superior
# - Archivos SQL en backend_doc/
#
# Uso:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\install_database_auto.ps1
# ============================================

# Configuración
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DBName = "easyrent_db"
$AdminUser = "benites_admin"
$AppUser = "benites_app"
$PostgresUser = "postgres"
$LogFile = Join-Path $ScriptDir "install_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# ============================================
# FUNCIONES AUXILIARES
# ============================================

function Write-Log {
    param([string]$Message, [string]$Type = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Type) {
        "ERROR"   { "Red" }
        "WARNING" { "Yellow" }
        "SUCCESS" { "Green" }
        "INFO"    { "Cyan" }
        default   { "White" }
    }
    
    $logMessage = "[$timestamp] [$Type] $Message"
    Write-Host $logMessage -ForegroundColor $color
    Add-Content -Path $LogFile -Value $logMessage
}

function Execute-SQL {
    param(
        [string]$SQLFile,
        [string]$DBUser,
        [string]$Database = $DBName
    )
    
    $fullPath = Join-Path $ScriptDir $SQLFile
    
    Write-Log "Ejecutando: $SQLFile" -Type "INFO"
    
    if (-not (Test-Path $fullPath)) {
        Write-Log "Archivo no encontrado: $SQLFile" -Type "ERROR"
        throw "Archivo no encontrado: $SQLFile"
    }
    
    try {
        $env:PGPASSWORD = ""  # Asume autenticación trust o configurada
        $output = & psql -U $DBUser -d $Database -f $fullPath 2>&1
        Add-Content -Path $LogFile -Value $output
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Completado: $SQLFile" -Type "SUCCESS"
        } else {
            Write-Log "❌ Error ejecutando: $SQLFile" -Type "ERROR"
            Write-Log "Código de salida: $LASTEXITCODE" -Type "ERROR"
            throw "Error ejecutando SQL"
        }
    } catch {
        Write-Log "Error: $_" -Type "ERROR"
        throw
    }
}

function Test-PostgreSQL {
    try {
        $version = & psql --version 2>&1
        Write-Log "PostgreSQL encontrado: $version" -Type "SUCCESS"
        return $true
    } catch {
        Write-Log "PostgreSQL no está instalado o no está en el PATH" -Type "ERROR"
        return $false
    }
}

function Show-Header {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  INSTALACIÓN BASE DE DATOS EASYRENT          ║" -ForegroundColor Green
    Write-Host "║  Instalación Automatizada (Windows)          ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
}

function Confirm-Action {
    param([string]$Message)
    
    Write-Host $Message -ForegroundColor Yellow
    $response = Read-Host "¿Continuar? (y/n)"
    
    if ($response -notmatch '^[Yy]$') {
        Write-Log "Instalación cancelada por el usuario" -Type "WARNING"
        exit 0
    }
}

# ============================================
# INICIO DEL SCRIPT
# ============================================

Show-Header

Write-Log "Iniciando instalación de base de datos EasyRent" -Type "INFO"
Write-Log "Log guardado en: $LogFile" -Type "INFO"

# Verificar PostgreSQL
if (-not (Test-PostgreSQL)) {
    Write-Log "No se puede continuar sin PostgreSQL" -Type "ERROR"
    exit 1
}

# Confirmación
Confirm-Action "⚠️  ADVERTENCIA: Este script creará una nueva base de datos '$DBName'"

# ============================================
# FASE 1: USUARIOS Y BASE DE DATOS
# ============================================

Write-Host ""
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
Write-Host "FASE 1: Crear usuarios y base de datos" -ForegroundColor Blue
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue

Write-Log "FASE 1: Creando usuarios PostgreSQL..." -Type "INFO"
Execute-SQL -SQLFile "01_crear_usuarios.sql" -DBUser $PostgresUser -Database "postgres"

Write-Log "FASE 1: Creando base de datos..." -Type "INFO"
Execute-SQL -SQLFile "00_database_setup.sql" -DBUser $PostgresUser -Database "postgres"

# ============================================
# FASE 2: ESTRUCTURA BASE
# ============================================

Write-Host ""
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
Write-Host "FASE 2: Estructura base" -ForegroundColor Blue
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue

Write-Log "FASE 2: Instalando extensiones y schemas..." -Type "INFO"
Execute-SQL -SQLFile "01_extensions_and_schemas.sql" -DBUser $AdminUser

Write-Log "FASE 2: Creando ENUMs y tipos personalizados..." -Type "INFO"
Execute-SQL -SQLFile "02_enums_and_types.sql" -DBUser $AdminUser

Write-Log "FASE 2: Creando tablas principales..." -Type "INFO"
Execute-SQL -SQLFile "03_core_tables.sql" -DBUser $AdminUser

# ============================================
# FASE 3: FUNCIONALIDADES CORE
# ============================================

Write-Host ""
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
Write-Host "FASE 3: Funcionalidades core" -ForegroundColor Blue
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue

$coreFiles = @(
    "04_user_interactions.sql",
    "05_analytics.sql",
    "06_verification_workflow.sql",
    "07_security_audit.sql",
    "08_subscription_plans.sql",
    "09_billing_payments.sql",
    "10_partition_management.sql",
    "11_business_rules.sql"
)

foreach ($file in $coreFiles) {
    Write-Log "FASE 3: Ejecutando $file..." -Type "INFO"
    Execute-SQL -SQLFile $file -DBUser $AdminUser
}

# ============================================
# FASE 4: FEATURES AVANZADAS
# ============================================

Write-Host ""
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
Write-Host "FASE 4: Features avanzadas" -ForegroundColor Blue
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue

$featureFiles = @(
    "14_auto_free_subscription.sql",
    "17_auto_advertiser_type.sql",
    "18_agent_invitations.sql",
    "19_add_user_agency_role_field.sql",
    "20_listing_media_system.sql"
)

foreach ($file in $featureFiles) {
    Write-Log "FASE 4: Ejecutando $file..." -Type "INFO"
    Execute-SQL -SQLFile $file -DBUser $AdminUser
}

# ============================================
# FASE 5: SISTEMA AIRBNB
# ============================================

Write-Host ""
$airbnbResponse = Read-Host "¿Deseas instalar el sistema Airbnb? (y/n)"

if ($airbnbResponse -match '^[Yy]$') {
    Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
    Write-Host "FASE 5: Sistema Airbnb" -ForegroundColor Blue
    Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
    
    Write-Log "FASE 5: Configurando sistema de reservas Airbnb..." -Type "INFO"
    Execute-SQL -SQLFile "15_airbnb_bookings.sql" -DBUser $AdminUser
    
    Write-Log "FASE 5: Agregando campos Airbnb a listings..." -Type "INFO"
    Execute-SQL -SQLFile "18_add_listing_airbnb_fields.sql" -DBUser $AdminUser
} else {
    Write-Log "Sistema Airbnb omitido" -Type "WARNING"
}

# ============================================
# FASE 6: CHAT Y NOTIFICACIONES
# ============================================

Write-Host ""
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
Write-Host "FASE 6: Chat y Notificaciones" -ForegroundColor Blue
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue

Write-Log "FASE 6: Configurando sistema de chat..." -Type "INFO"
Execute-SQL -SQLFile "25_chat_system.sql" -DBUser $AdminUser

Write-Log "FASE 6: Configurando sistema de notificaciones..." -Type "INFO"
Execute-SQL -SQLFile "26_notifications_system.sql" -DBUser $AdminUser

# ============================================
# FASE 7: OPTIMIZACIÓN Y PERFORMANCE
# ============================================

Write-Host ""
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
Write-Host "FASE 7: Optimización y Performance" -ForegroundColor Blue
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue

$optimizationFiles = @(
    "28_performance_indexes.sql",
    "29_analytics_refactor.sql",
    "32_optimize_listings_partial_indices.sql"
)

foreach ($file in $optimizationFiles) {
    Write-Log "FASE 7: Ejecutando $file..." -Type "INFO"
    Execute-SQL -SQLFile $file -DBUser $AdminUser
}

# ============================================
# FASE 8: DATOS INICIALES (OPCIONAL)
# ============================================

Write-Host ""
$sampleDataResponse = Read-Host "¿Deseas cargar datos de ejemplo? (y/n)"

if ($sampleDataResponse -match '^[Yy]$') {
    Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
    Write-Host "FASE 8: Datos de ejemplo" -ForegroundColor Blue
    Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
    
    Write-Log "FASE 8: Cargando datos de ejemplo..." -Type "INFO"
    Execute-SQL -SQLFile "12_sample_data.sql" -DBUser $AdminUser
} else {
    Write-Log "Datos de ejemplo omitidos" -Type "WARNING"
}

# ============================================
# VALIDACIÓN FINAL
# ============================================

Write-Host ""
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue
Write-Host "VALIDACIÓN FINAL" -ForegroundColor Blue
Write-Host "════════════════════════════════════════=" -ForegroundColor Blue

Write-Log "Validando instalación..." -Type "INFO"

# Verificar extensiones
Write-Log "Verificando extensiones instaladas..." -Type "INFO"
& psql -U $AdminUser -d $DBName -c "SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'postgis', 'pg_trgm', 'citext', 'unaccent', 'btree_gin');" | Out-File -Append -FilePath $LogFile

# Verificar schemas
Write-Log "Verificando schemas creados..." -Type "INFO"
& psql -U $AdminUser -d $DBName -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('core', 'analytics', 'sec', 'chat', 'archive');" | Out-File -Append -FilePath $LogFile

# Verificar tablas
Write-Log "Verificando tablas principales..." -Type "INFO"
$tableCount = & psql -U $AdminUser -d $DBName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'core';"
Write-Log "Tablas en schema 'core': $($tableCount.Trim())" -Type "SUCCESS"

# Verificar planes
Write-Log "Verificando planes de suscripción..." -Type "INFO"
$planCount = & psql -U $AdminUser -d $DBName -t -c "SELECT COUNT(*) FROM core.plans;"
Write-Log "Planes de suscripción creados: $($planCount.Trim())" -Type "SUCCESS"

# ============================================
# RESUMEN FINAL
# ============================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE      ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Log "═══════════════════════════════════════════════" -Type "SUCCESS"
Write-Log "INSTALACIÓN COMPLETADA" -Type "SUCCESS"
Write-Log "═══════════════════════════════════════════════" -Type "SUCCESS"
Write-Log "" -Type "INFO"
Write-Log "Base de datos: $DBName" -Type "INFO"
Write-Log "Usuario admin: $AdminUser" -Type "INFO"
Write-Log "Usuario app: $AppUser" -Type "INFO"
Write-Log "Log completo: $LogFile" -Type "INFO"
Write-Log "" -Type "INFO"
Write-Log "PRÓXIMOS PASOS:" -Type "INFO"
Write-Log "1. Configurar conexión en backend (FastAPI)" -Type "INFO"
Write-Log "2. Configurar Redis para caché" -Type "INFO"
Write-Log "3. Configurar cron/Scheduled Task para particiones automáticas" -Type "INFO"
Write-Log "4. Configurar backup automático" -Type "INFO"
Write-Log "" -Type "INFO"
Write-Log "═══════════════════════════════════════════════" -Type "SUCCESS"

Write-Host ""
Write-Host "📝 Credenciales de acceso:" -ForegroundColor Yellow
Write-Host "   Base de datos: " -NoNewline
Write-Host $DBName -ForegroundColor Green
Write-Host "   Usuario admin: " -NoNewline
Write-Host $AdminUser -ForegroundColor Green
Write-Host "   Usuario app:   " -NoNewline
Write-Host $AppUser -ForegroundColor Green
Write-Host ""
Write-Host "📋 Log completo guardado en:" -ForegroundColor Yellow
Write-Host "   $LogFile" -ForegroundColor Green
Write-Host ""

exit 0
