-- ===== Database Initial Setup & Configuration =====
-- PostgreSQL 18.x setup
-- Run as PostgreSQL superuser (postgres)

-- Configuration variables (modify these according to your needs)
\set db_name 'renta_facil_test'
\set app_admin_user 'rf_admin'
\set app_admin_password '''clave''' -- clave falsa, reemplazar por una segura en producción
\set app_user 'rf_app'
\set app_user_password '''clave''' -- clave falsa, reemplazar por una segura en producción
\set locale_collate '''es_ES.UTF-8'''
\set locale_ctype '''es_ES.UTF-8'''

-- Create main database
\echo 'Creating main database...'
CREATE DATABASE renta_facil_test
  WITH ENCODING = 'UTF8'
  LC_COLLATE = 'es_ES.UTF-8'
  LC_CTYPE = 'es_ES.UTF-8'
  TEMPLATE = template0;

-- Admin role (for database management, migrations, and admin operations)
CREATE ROLE :app_admin_user WITH
  LOGIN
  PASSWORD :app_admin_password
  CREATEDB
  CREATEROLE
  INHERIT
  CONNECTION LIMIT 10;

-- Application role (for normal application operations)
CREATE ROLE :app_user WITH
  LOGIN
  PASSWORD :app_user_password
  INHERIT
  CONNECTION LIMIT 200;

GRANT ALL PRIVILEGES ON DATABASE :db_name TO :app_admin_user;

\c :db_name

-- Set database owner
ALTER DATABASE :db_name OWNER TO :app_admin_user;

CREATE EXTENSION IF NOT EXISTS pgcrypto;           -- UUID generation and encryption
CREATE EXTENSION IF NOT EXISTS btree_gin;          -- Composite indexes for better performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;            -- Trigram similarity search
CREATE EXTENSION IF NOT EXISTS citext;             -- Case-insensitive text type
CREATE EXTENSION IF NOT EXISTS unaccent;           -- Accent-insensitive full-text search
CREATE EXTENSION IF NOT EXISTS postgis;            -- Geospatial data support (optional)

-- Configure text search for Spanish
ALTER DATABASE :db_name SET default_text_search_config = 'spanish';

-- Create application-specific text search configuration with unaccent
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR word, asciiword WITH unaccent, spanish_stem;

-- Grant usage on extensions to application users
GRANT USAGE ON SCHEMA public TO :app_admin_user, :app_user;

-- Set up default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO :app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO :app_user;

-- Create schemas for the application (will be used by the main installation)
CREATE SCHEMA IF NOT EXISTS core;        -- Main business tables
CREATE SCHEMA IF NOT EXISTS analytics;   -- Metrics and reporting
CREATE SCHEMA IF NOT EXISTS sec;         -- Security and audit
CREATE SCHEMA IF NOT EXISTS archive;     -- Data retention

-- Set schema ownership
ALTER SCHEMA core OWNER TO :app_admin_user;
ALTER SCHEMA analytics OWNER TO :app_admin_user;
ALTER SCHEMA sec OWNER TO :app_admin_user;
ALTER SCHEMA archive OWNER TO :app_admin_user;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA core TO :app_user;
GRANT USAGE ON SCHEMA analytics TO :app_user;
GRANT USAGE ON SCHEMA sec TO :app_user;
GRANT USAGE ON SCHEMA archive TO :app_user;

-- Set up default privileges for the schemas
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA sec GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA sec GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA archive GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA archive GRANT SELECT ON TABLES TO :app_user;

-- Create connection info table for reference
CREATE TABLE IF NOT EXISTS public.database_info (
    setup_date TIMESTAMPTZ DEFAULT now(),
    database_name TEXT,
    postgresql_version TEXT,
    admin_user TEXT,
    app_user TEXT,
    extensions TEXT[],
    schemas TEXT[]
);

-- Insert setup information
INSERT INTO public.database_info (
    database_name,
    postgresql_version,
    admin_user,
    app_user,
    extensions,
    schemas
) VALUES (
    current_database(),
    version(),
    :'app_admin_user',
    :'app_user',
    ARRAY(SELECT extname FROM pg_extension ORDER BY extname),
    ARRAY(SELECT schema_name FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') 
          ORDER BY schema_name)
);


-- Verify setup
SELECT 
    'Database' as component, 
    current_database() as name, 
    'Ready' as status
UNION ALL
SELECT 
    'Extensions', 
    string_agg(extname, ', ' ORDER BY extname), 
    'Installed'
FROM pg_extension 
WHERE extname NOT IN ('plpgsql')
UNION ALL
SELECT 
    'Schemas', 
    string_agg(schema_name, ', ' ORDER BY schema_name), 
    'Created'
FROM information_schema.schemata 
WHERE schema_name IN ('core', 'analytics', 'sec', 'archive');
