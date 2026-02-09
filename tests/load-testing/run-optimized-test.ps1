# Script para aplicar optimizaciones y ejecutar test de carga

Write-Host "🚀 OPTIMIZACIONES DE RENDIMIENTO - RENTA FÁCIL" -ForegroundColor Cyan
Write-Host "=" * 60

# Paso 1: Aplicar índices de base de datos
Write-Host "`n📊 PASO 1: Aplicando índices de optimización en PostgreSQL..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
psql -U postgres -d postgres -f backend_doc/28_performance_indexes.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Índices aplicados correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error aplicando índices (puede ser normal si ya existen)" -ForegroundColor Yellow
}

# Paso 2: Reiniciar servidor backend
Write-Host "`n🔄 PASO 2: Reiniciando servidor backend..." -ForegroundColor Yellow
Write-Host "   Presiona Ctrl+C en la terminal del backend y ejecuta:" -ForegroundColor Gray
Write-Host "   cd D:\Trabajos\benites\Backend" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" -ForegroundColor White

Write-Host "`n⏳ Esperando 10 segundos para que reinicies el backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Paso 3: Ejecutar test de carga
Write-Host "`n🧪 PASO 3: Ejecutando test de carga (500 usuarios concurrentes)..." -ForegroundColor Yellow
Write-Host "   Duración estimada: ~9 minutos" -ForegroundColor Gray

cd tests/load-testing
k6 run load-test-search.js

# Paso 4: Analizar resultados
Write-Host "`n📈 PASO 4: Análisis de resultados" -ForegroundColor Yellow
Write-Host "=" * 60
Write-Host "Compara los resultados con el baseline:" -ForegroundColor White
Write-Host ""
Write-Host "ANTES (sin optimizaciones):" -ForegroundColor Red
Write-Host "  - P95 Latency: 5382ms ❌ (excede 5000ms)" -ForegroundColor Red
Write-Host "  - Error Rate: 39.37% ❌ (excede 10%)" -ForegroundColor Red
Write-Host "  - Estado: SERVIDOR COLAPSADO ❌" -ForegroundColor Red
Write-Host ""
Write-Host "OBJETIVO (con optimizaciones):" -ForegroundColor Green
Write-Host "  - P95 Latency: < 5000ms ✅" -ForegroundColor Green
Write-Host "  - Error Rate: < 10% ✅" -ForegroundColor Green
Write-Host "  - Estado: SERVIDOR ESTABLE ✅" -ForegroundColor Green
Write-Host ""
Write-Host "=" * 60

Write-Host "`n✅ Proceso completado. Revisa los resultados arriba." -ForegroundColor Cyan
