-- PostgreSQL 17.6 with Extensions for Security, Full-Text Search, and Geospatial
 
\set app_admin_user 'rf_admin'
\set app_user 'rf_app'

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;           -- UUID generation
CREATE EXTENSION IF NOT EXISTS btree_gin;          -- Composite indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;            -- Trigram similarity search
CREATE EXTENSION IF NOT EXISTS citext;             -- Case-insensitive text
CREATE EXTENSION IF NOT EXISTS unaccent;           -- Text normalization for Spanish
CREATE EXTENSION IF NOT EXISTS postgis;            -- Geospatial data

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


-- Schema Architecture
CREATE SCHEMA IF NOT EXISTS core;        -- Main business tables
CREATE SCHEMA IF NOT EXISTS analytics;   -- Metrics and reporting
CREATE SCHEMA IF NOT EXISTS sec;         -- Security and audit
CREATE SCHEMA IF NOT EXISTS archive;     -- Data retention
CREATE SCHEMA IF NOT EXISTS chat;        -- Chat and messaging

-- Set schema ownership
ALTER SCHEMA core OWNER TO :app_admin_user;
ALTER SCHEMA analytics OWNER TO :app_admin_user;
ALTER SCHEMA sec OWNER TO :app_admin_user;
ALTER SCHEMA archive OWNER TO :app_admin_user;

-- Set up default privileges for the schemas
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA sec GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA sec GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA archive GRANT ALL ON TABLES TO :app_admin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA archive GRANT SELECT ON TABLES TO :app_user;
