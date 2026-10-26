-- ============================================
-- CareRoute Bicol — Database Schema
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- ===========================================
-- 1. ENUMS
-- ===========================================

CREATE TYPE facility_type AS ENUM ('BHS', 'RHU', 'TERTIARY');
CREATE TYPE user_role AS ENUM ('super_admin', 'operational');
CREATE TYPE referral_status AS ENUM (
  'PENDING', 'ACKNOWLEDGED', 'ACCEPTED', 'IN_PROGRESS',
  'COMPLETED', 'DECLINED', 'REDIRECTED', 'CANCELLED'
);
CREATE TYPE referral_event_type AS ENUM (
  'CREATED', 'ACKNOWLEDGED', 'ACCEPTED', 'DECLINED',
  'IN_PROGRESS', 'REDIRECTED', 'COMPLETED', 'CANCELLED', 'NOTE_ADDED'
);
CREATE TYPE urgency_level AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');
CREATE TYPE resource_status AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE', 'UNKNOWN');

-- ===========================================
-- 2. FACILITIES TABLE
-- ===========================================

CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  facility_type facility_type NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT DEFAULT 'Albay',
  region TEXT DEFAULT 'Bicol Region',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_number TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_facilities_type ON facilities(facility_type);
CREATE INDEX idx_facilities_active ON facilities(is_active);

-- ===========================================
-- 3. PROFILES TABLE
-- ===========================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operational',
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_facility ON profiles(facility_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ===========================================
-- 4. REFERRALS TABLE
-- ===========================================

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Patient information
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_sex TEXT,
  patient_address TEXT,
  patient_latitude DOUBLE PRECISION,
  patient_longitude DOUBLE PRECISION,
  -- Referral details
  chief_complaint TEXT NOT NULL,
  reason TEXT,
  required_service TEXT,
  required_specialty TEXT,
  urgency urgency_level NOT NULL DEFAULT 'ROUTINE',
  clinical_notes TEXT,
  -- Facility references
  referring_facility_id UUID NOT NULL REFERENCES facilities(id),
  receiving_facility_id UUID NOT NULL REFERENCES facilities(id),
  -- Status tracking
  status referral_status NOT NULL DEFAULT 'PENDING',
  -- Recommendation metadata
  recommendation_score DOUBLE PRECISION,
  recommendation_reason TEXT,
  override_reason TEXT,
  -- Actor tracking
  created_by UUID NOT NULL REFERENCES profiles(id),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referrals_referring ON referrals(referring_facility_id);
CREATE INDEX idx_referrals_receiving ON referrals(receiving_facility_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_urgency ON referrals(urgency);
CREATE INDEX idx_referrals_created_at ON referrals(created_at DESC);

-- ===========================================
-- 5. REFERRAL EVENTS TABLE (Immutable Audit Trail)
-- ===========================================

CREATE TABLE referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  event_type referral_event_type NOT NULL,
  previous_status referral_status,
  new_status referral_status,
  -- For redirections
  previous_receiving_facility_id UUID REFERENCES facilities(id),
  new_receiving_facility_id UUID REFERENCES facilities(id),
  -- Details
  notes TEXT,
  actor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referral_events_referral ON referral_events(referral_id);
CREATE INDEX idx_referral_events_created ON referral_events(created_at);

-- ===========================================
-- 6. FACILITY RESOURCES TABLE
-- ===========================================

CREATE TABLE facility_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  resource_name TEXT NOT NULL,
  resource_category TEXT, -- 'service', 'specialty', 'bed', 'equipment'
  status resource_status NOT NULL DEFAULT 'UNKNOWN',
  quantity INTEGER, -- for beds, equipment count
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_facility_resources_facility ON facility_resources(facility_id);
CREATE INDEX idx_facility_resources_category ON facility_resources(resource_category);
CREATE UNIQUE INDEX idx_facility_resources_unique ON facility_resources(facility_id, resource_name);

-- ===========================================
-- 7. AUDIT LOGS TABLE
-- ===========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT, -- 'user', 'facility', 'referral', 'resource'
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ===========================================
-- 8. AUTO-UPDATE TIMESTAMPS TRIGGER
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_facilities_updated
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_referrals_updated
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_facility_resources_updated
  BEFORE UPDATE ON facility_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
