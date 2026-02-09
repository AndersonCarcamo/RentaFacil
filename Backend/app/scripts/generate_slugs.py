"""
Script CLI para generar slugs para propiedades existentes

Uso:
    python -m app.scripts.generate_slugs
    python -m app.scripts.generate_slugs --force  # Regenerar todos incluso si tienen slug
"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import get_db_url
from app.utils.slug_generator import regenerate_all_slugs
import argparse


def main():
    parser = argparse.ArgumentParser(description='Generar slugs para propiedades')
    parser.add_argument(
        '--force',
        action='store_true',
        help='Regenerar slugs incluso para propiedades que ya tienen uno'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simular sin hacer cambios en la base de datos'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🔧 GENERADOR DE SLUGS PARA PROPIEDADES")
    print("=" * 60)
    
    if args.dry_run:
        print("⚠️  MODO DRY-RUN: No se realizarán cambios en la base de datos")
    
    if args.force:
        print("🔄 MODO FORCE: Se regenerarán TODOS los slugs")
    else:
        print("📝 Generando slugs solo para propiedades sin slug")
    
    print()
    
    # Crear conexión a la base de datos
    try:
        DATABASE_URL = get_db_url()
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("✓ Conexión a base de datos establecida")
        print()
        
        # Contar propiedades totales
        from app.models.listing import Listing
        total_count = db.query(Listing).count()
        without_slug_count = db.query(Listing).filter(
            (Listing.slug == None) | (Listing.slug == '')
        ).count()
        
        print(f"📊 Estadísticas:")
        print(f"   - Total de propiedades: {total_count}")
        print(f"   - Sin slug: {without_slug_count}")
        print()
        
        if not args.dry_run:
            # Generar slugs
            print("🚀 Iniciando generación de slugs...")
            print()
            
            count = regenerate_all_slugs(db, force=args.force)
            
            print()
            print("=" * 60)
            print(f"✅ COMPLETADO: {count} slugs generados exitosamente")
            print("=" * 60)
        else:
            print("💡 Ejecuta sin --dry-run para generar los slugs")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
