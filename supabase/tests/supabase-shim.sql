-- ============================================================
-- Supabase-simulatie voor lokale validatie
-- ============================================================
-- Dit bestand bouwt de onderdelen na die Supabase standaard levert,
-- zodat de migraties van ArtroCare op een echte PostgreSQL 16 kunnen
-- draaien zonder Supabase-project.
--
-- Belangrijk: Supabase geeft `anon` en `authenticated` standaard
-- volledige tabelrechten. Row Level Security is dan de ENIGE grens.
-- Die situatie wordt hier nagebouwd, want precies daar zaten de gaten.
-- ============================================================

-- ─── Extensies die Supabase standaard aanzet ────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Rollen ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    -- service_role omzeilt RLS, net als bij Supabase
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

-- ─── auth-schema ────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text UNIQUE,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Zoals Supabase: leest de claims uit de request-instellingen.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.role', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

CREATE OR REPLACE FUNCTION auth.email() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.email', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

-- ─── storage-schema ─────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id                 text PRIMARY KEY,
  name               text,
  owner              uuid,
  public             boolean NOT NULL DEFAULT false,
  avif_autodetection boolean NOT NULL DEFAULT false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id        text REFERENCES storage.buckets(id),
  name             text,
  owner            uuid,
  owner_id         text,
  metadata         jsonb,
  path_tokens      text[],
  version          text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ─── Standaardrechten zoals Supabase die zet ────────────────
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

GRANT ALL ON storage.buckets TO anon, authenticated, service_role;
GRANT ALL ON storage.objects TO anon, authenticated, service_role;

SELECT 'supabase shim geplaatst' AS resultaat;
