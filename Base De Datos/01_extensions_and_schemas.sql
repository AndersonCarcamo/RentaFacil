-- PostgreSQL 17.6 with Extensions for Security, Full-Text Search, and Geospatial
 
-- Required Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;           -- UUID generation
CREATE EXTENSION IF NOT EXISTS btree_gin;          -- Composite indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;            -- Trigram similarity search
CREATE EXTENSION IF NOT EXISTS citext;             -- Case-insensitive text
CREATE EXTENSION IF NOT EXISTS unaccent;           -- Text normalization for Spanish
CREATE EXTENSION IF NOT EXISTS postgis;            -- Geospatial data

-- Schema Architecture
CREATE SCHEMA IF NOT EXISTS core;        -- Main business tables
CREATE SCHEMA IF NOT EXISTS analytics;   -- Metrics and reporting
CREATE SCHEMA IF NOT EXISTS sec;         -- Security and audit
CREATE SCHEMA IF NOT EXISTS archive;     -- Data retention
