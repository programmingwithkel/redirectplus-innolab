-- ============================================
-- CareRoute Bicol — Smart Routing (Part 1 of 2)
-- Enum additions
--
-- RUN THIS FIRST, ON ITS OWN, in the Supabase SQL Editor.
-- PostgreSQL does not allow a newly added enum value to be
-- used in the same transaction that created it, so this
-- must be committed before 003_smart_routing.sql runs.
-- ============================================

ALTER TYPE facility_type ADD VALUE IF NOT EXISTS 'SECONDARY' BEFORE 'TERTIARY';

DO $$ BEGIN
  CREATE TYPE operating_status AS ENUM ('OPERATIONAL', 'LIMITED_OPERATIONS', 'CLOSED', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE capability_level AS ENUM ('BASIC', 'STANDARD', 'ADVANCED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE acceptance_status AS ENUM ('ACCEPTING', 'ACCEPTING_WITH_CONDITIONS', 'NOT_ACCEPTING', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE freshness_group AS ENUM ('CRITICAL_CAPACITY', 'BEDS', 'EQUIPMENT_STAFF');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE travel_source AS ENUM ('ROUTES_API', 'APPROX_FALLBACK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_outcome AS ENUM ('RECOMMENDED', 'UNVERIFIED_ONLY', 'NONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
