#!/usr/bin/env python3
"""Script simple para verificar si rental_mode existe"""
import os
import sys

# Configurar variables de entorno
os.environ.setdefault('FIREBASE_AUTH_EMULATOR', 'true')

try:
    from sqlalchemy import create_engine, text
    
    # URL de conexión
    DATABASE_URL = "postgresql://postgres:password@localhost:5432/easy_rent"
    
    # Crear conexión
    engine = create_engine(DATABASE_URL, echo=False)
    
    print("🔍 Verificando columnas rental...")
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'core'
            AND table_name = 'listings'
            AND column_name IN ('rental_mode', 'rental_model')
            ORDER BY column_name
        """))
        
        print("✅ Columnas encontradas:")
        for row in result:
            print(f"  - {row.column_name}: {row.data_type} (default: {row.column_default})")
            
        if not result.rowcount:
            print("❌ No se encontraron columnas rental_mode o rental_model")

except Exception as e:
    print(f"❌ Error: {e}")
