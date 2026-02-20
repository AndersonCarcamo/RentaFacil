#!/usr/bin/env python3
"""
Verificar columnas rental_mode y rental_model en la tabla listings
"""
from app.core.database import get_db
from sqlalchemy import text

def check_listing_columns():
    try:
        db = next(get_db())
        
        print("🔍 Verificando columnas rental en core.listings...")
        
        # Verificar columnas
        query = text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'core' 
            AND table_name = 'listings' 
            AND column_name IN ('rental_mode', 'rental_model')
            ORDER BY column_name
        """)
        
        result = db.execute(query)
        columns = result.fetchall()
        
        if columns:
            print("✅ Columnas encontradas:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (default: {col[3]})")
        else:
            print("❌ No se encontraron columnas rental_mode o rental_model")
        
        # Verificar enums
        print("\n📋 Verificando enums disponibles:")
        enum_query = text("""
            SELECT t.typname as enum_name, 
                   array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname IN ('rental_mode', 'rental_model')
            GROUP BY t.typname
            ORDER BY t.typname
        """)
        
        enum_result = db.execute(enum_query)
        enums = enum_result.fetchall()
        
        for enum in enums:
            values = ', '.join(enum[1])
            print(f"  - {enum[0]}: [{values}]")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_listing_columns()
