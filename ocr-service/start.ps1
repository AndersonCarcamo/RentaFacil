# Script para iniciar el servicio OCR

Write-Host "🚀 Iniciando Servicio OCR..." -ForegroundColor Cyan

# Verificar si Docker está instalado
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    Write-Host "✅ Docker detectado. Iniciando con Docker Compose..." -ForegroundColor Green
    docker-compose up -d
    
    Write-Host "`n⏳ Esperando a que el servicio esté listo..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Verificar estado
    $response = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method Get -ErrorAction SilentlyContinue
    
    if ($response) {
        Write-Host "✅ Servicio OCR iniciado correctamente en http://localhost:8001" -ForegroundColor Green
        Write-Host "📊 Versión de Tesseract: $($response.tesseract_version)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  El servicio se está iniciando. Verifica los logs con: docker-compose logs -f" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Docker no está instalado. Iniciando en modo local..." -ForegroundColor Yellow
    
    # Verificar Python
    $pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
    
    if (-not $pythonInstalled) {
        Write-Host "❌ Python no está instalado" -ForegroundColor Red
        exit 1
    }
    
    # Activar venv si existe
    if (Test-Path ".\venv\Scripts\Activate.ps1") {
        Write-Host "✅ Activando entorno virtual..." -ForegroundColor Green
        .\venv\Scripts\Activate.ps1
    } else {
        Write-Host "⚠️  No se encontró entorno virtual. Creando uno..." -ForegroundColor Yellow
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        pip install -r requirements.txt
    }
    
    # Iniciar servidor
    Write-Host "🚀 Iniciando servidor en http://localhost:8001..." -ForegroundColor Cyan
    python main.py
}
