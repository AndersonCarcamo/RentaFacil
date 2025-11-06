#!/bin/bash

echo "🚀 Iniciando Servicio OCR..."

# Verificar si Docker está instalado
if command -v docker &> /dev/null; then
    echo "✅ Docker detectado. Iniciando con Docker Compose..."
    docker-compose up -d
    
    echo "⏳ Esperando a que el servicio esté listo..."
    sleep 5
    
    # Verificar estado
    response=$(curl -s http://localhost:8001/health)
    
    if [ -n "$response" ]; then
        echo "✅ Servicio OCR iniciado correctamente en http://localhost:8001"
        echo "$response"
    else
        echo "⚠️  El servicio se está iniciando. Verifica los logs con: docker-compose logs -f"
    fi
else
    echo "❌ Docker no está instalado. Iniciando en modo local..."
    
    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python no está instalado"
        exit 1
    fi
    
    # Activar venv si existe
    if [ -d "venv" ]; then
        echo "✅ Activando entorno virtual..."
        source venv/bin/activate
    else
        echo "⚠️  No se encontró entorno virtual. Creando uno..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    fi
    
    # Iniciar servidor
    echo "🚀 Iniciando servidor en http://localhost:8001..."
    python main.py
fi
