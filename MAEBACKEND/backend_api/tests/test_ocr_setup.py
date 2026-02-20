"""
Script de verificación para el sistema OCR de DNI
Ejecutar después de instalar Tesseract OCR
"""

import sys
from pathlib import Path

def check_tesseract():
    """Verifica que Tesseract esté instalado y disponible"""
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract OCR instalado: versión {version}")
        return True
    except Exception as e:
        print(f"❌ Error con Tesseract: {e}")
        print("\n💡 Solución:")
        print("   1. Instalar Tesseract desde: https://github.com/UB-Mannheim/tesseract/wiki")
        print("   2. Agregar a PATH o configurar TESSERACT_CMD en config.py")
        return False

def check_opencv():
    """Verifica que OpenCV esté instalado"""
    try:
        import cv2
        version = cv2.__version__
        print(f"✅ OpenCV instalado: versión {version}")
        return True
    except ImportError:
        print("❌ OpenCV no instalado")
        print("   Instalar con: pip install opencv-python==4.8.1.78")
        return False

def check_pdf2image():
    """Verifica que pdf2image esté instalado"""
    try:
        import pdf2image
        print("✅ pdf2image instalado")
        return True
    except ImportError:
        print("❌ pdf2image no instalado")
        print("   Instalar con: pip install pdf2image==1.16.3")
        return False

def check_spanish_support():
    """Verifica que Tesseract tenga soporte para español"""
    try:
        import pytesseract
        langs = pytesseract.get_languages()
        if 'spa' in langs:
            print("✅ Paquete de idioma español (spa) disponible")
            return True
        else:
            print("❌ Paquete de idioma español NO encontrado")
            print("   Idiomas disponibles:", langs)
            print("\n💡 Solución:")
            print("   Reinstalar Tesseract seleccionando el paquete 'Spanish (spa)'")
            return False
    except Exception as e:
        print(f"⚠️  No se pudo verificar idiomas: {e}")
        return True  # No bloquear si hay error

def check_media_directory():
    """Verifica que el directorio de media exista"""
    media_dir = Path(__file__).parent.parent / "media" / "verifications"
    if media_dir.exists():
        print(f"✅ Directorio de verificaciones existe: {media_dir}")
        return True
    else:
        print(f"⚠️  Directorio de verificaciones no existe: {media_dir}")
        print("   Se creará automáticamente al iniciar el servidor")
        return True

def test_ocr_service():
    """Intenta importar y usar el servicio OCR"""
    try:
        from app.services.ocr_service import dni_ocr_service
        print("✅ Servicio OCR importado correctamente")
        print(f"   Configuración: {dni_ocr_service.config}")
        return True
    except Exception as e:
        print(f"❌ Error al importar servicio OCR: {e}")
        return False

def main():
    print("=" * 60)
    print("🔍 VERIFICACIÓN DEL SISTEMA DE OCR PARA DNI")
    print("=" * 60)
    print()
    
    results = []
    
    print("📦 Verificando dependencias...")
    print("-" * 60)
    results.append(check_opencv())
    results.append(check_pdf2image())
    results.append(check_tesseract())
    
    print()
    print("🌍 Verificando configuración de idiomas...")
    print("-" * 60)
    results.append(check_spanish_support())
    
    print()
    print("📁 Verificando estructura de archivos...")
    print("-" * 60)
    results.append(check_media_directory())
    
    print()
    print("🔧 Verificando servicio OCR...")
    print("-" * 60)
    results.append(test_ocr_service())
    
    print()
    print("=" * 60)
    if all(results):
        print("✅ SISTEMA LISTO PARA USO")
        print("=" * 60)
        print()
        print("🚀 Siguiente paso:")
        print("   python -m uvicorn app.main:app --reload")
        print()
        return 0
    else:
        print("⚠️  SISTEMA NO ESTÁ COMPLETAMENTE CONFIGURADO")
        print("=" * 60)
        print()
        print("📚 Consulta: Backend/INSTALACION_OCR.md para más detalles")
        print()
        return 1

if __name__ == "__main__":
    sys.exit(main())
