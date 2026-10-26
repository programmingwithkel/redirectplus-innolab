-- ============================================
-- CareRoute Bicol — Smart Routing (Part 2 of 2)
-- Tables, lookups, indexes, RLS, audit triggers
--
-- RUN AFTER 002_smart_routing_enums.sql has been committed.
-- Safe to re-run (idempotent).
-- ============================================

-- ===========================================
-- 1. CONTROLLED VOCABULARIES
--    Free-text names can't drive matching; codes can.
-- ===========================================

CREATE TABLE IF NOT EXISTS service_catalog (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
  label TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS resource_types (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
  label TEXT NOT NULL,
  freshness_group freshness_group NOT NULL,
  is_countable BOOLEAN NOT NULL DEFAULT false,
  description TEXT
);

-- Clinical requirement profiles: case category → required capabilities.
-- MUST be reviewed by qualified healthcare personnel before production use.
CREATE TABLE IF NOT EXISTS care_requirement_profiles (
  case_category TEXT PRIMARY KEY CHECK (case_category ~ '^[A-Z][A-Z0-9_]*$'),
  label TEXT NOT NULL,
  description TEXT,
  required_services TEXT[] NOT NULL DEFAULT '{}',
  mandatory_resources TEXT[] NOT NULL DEFAULT '{}',
  requires_hospital_emergency BOOLEAN NOT NULL DEFAULT false,
  is_emergency_category BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  is_clinically_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT review_metadata_consistent CHECK (
    NOT is_clinically_reviewed OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

-- ===========================================
-- 2. FACILITIES — extend existing table
-- ===========================================

ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS operating_status operating_status NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS operating_status_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_sample_data BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_facilities_operating_status
  ON facilities(operating_status) WHERE is_active;

-- Stamp operating_status_updated_at whenever the status column is written.
-- Re-confirming the same value also refreshes the timestamp (that is intended:
-- it is how staff attest the status is still current).
CREATE OR REPLACE FUNCTION stamp_operating_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.operating_status_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_facilities_operating_status ON facilities;
CREATE TRIGGER trigger_facilities_operating_status
  BEFORE INSERT OR UPDATE OF operating_status ON facilities
  FOR EACH ROW EXECUTE FUNCTION stamp_operating_status();

-- ===========================================
-- 3. FACILITY RESOURCES — add machine-readable type
--    Rows with resource_type NULL are legacy/display-only and
--    are NEVER used to satisfy a clinical requirement.
-- ===========================================

ALTER TABLE facility_resources
  ADD COLUMN IF NOT EXISTS resource_type TEXT REFERENCES resource_types(code);

CREATE UNIQUE INDEX IF NOT EXISTS idx_facility_resources_type_unique
  ON facility_resources(facility_id, resource_type) WHERE resource_type IS NOT NULL;

ALTER TABLE facility_resources
  DROP CONSTRAINT IF EXISTS facility_resources_quantity_non_negative;
ALTER TABLE facility_resources
  ADD CONSTRAINT facility_resources_quantity_non_negative CHECK (quantity IS NULL OR quantity >= 0);

-- ===========================================
-- 4. FACILITY SERVICES (structural capability)
-- ===========================================

CREATE TABLE IF NOT EXISTS facility_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  service_code TEXT NOT NULL REFERENCES service_catalog(code),
  capability_level capability_level NOT NULL DEFAULT 'BASIC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (facility_id, service_code)
);

CREATE INDEX IF NOT EXISTS idx_facility_services_code_active
  ON facility_services(service_code) WHERE is_active;

DROP TRIGGER IF EXISTS trigger_facility_services_updated ON facility_services;
CREATE TRIGGER trigger_facility_services_updated
  BEFORE UPDATE ON facility_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- 5. FACILITY ACCEPTANCE STATUS (per case category, expiring)
-- ===========================================

CREATE TABLE IF NOT EXISTS facility_acceptance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  case_category TEXT NOT NULL REFERENCES care_requirement_profiles(case_category),
  acceptance_status acceptance_status NOT NULL DEFAULT 'UNKNOWN',
  reason_code TEXT CHECK (reason_code IN (
    'NO_BEDS', 'NO_SPECIALIST', 'EQUIPMENT_UNAVAILABLE',
    'ED_DIVERSION', 'STAFF_SHORTAGE', 'OTHER'
  )),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (facility_id, case_category),
  CONSTRAINT acceptance_expiry_after_update CHECK (expires_at > last_updated_at)
);

CREATE INDEX IF NOT EXISTS idx_acceptance_facility_category
  ON facility_acceptance_status(facility_id, case_category);

-- ===========================================
-- 6. RECOMMENDATION RUNS (de-identified audit of every recommendation)
--    No patient names or complaint text are stored here.
-- ===========================================

CREATE TABLE IF NOT EXISTS recommendation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requester_facility_id UUID REFERENCES facilities(id),
  case_category TEXT NOT NULL REFERENCES care_requirement_profiles(case_category),
  urgency urgency_level NOT NULL,
  origin_latitude DOUBLE PRECISION NOT NULL CHECK (origin_latitude BETWEEN -90 AND 90),
  origin_longitude DOUBLE PRECISION NOT NULL CHECK (origin_longitude BETWEEN -180 AND 180),
  requirement_snapshot JSONB NOT NULL,
  candidates_snapshot JSONB NOT NULL,
  recommended_facility_id UUID REFERENCES facilities(id),
  outcome recommendation_outcome NOT NULL,
  travel_source travel_source NOT NULL,
  profile_version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recommended_matches_outcome CHECK (
    (outcome = 'RECOMMENDED') = (recommended_facility_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_recommendation_runs_facility_created
  ON recommendation_runs(requester_facility_id, created_at DESC);

-- ===========================================
-- 7. REFERRALS — link to recommendation run
-- ===========================================

ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS recommendation_run_id UUID REFERENCES recommendation_runs(id);

CREATE INDEX IF NOT EXISTS idx_referrals_recommendation_run
  ON referrals(recommendation_run_id) WHERE recommendation_run_id IS NOT NULL;

-- ===========================================
-- 8. AUDIT TRAIL for availability changes
--    Writes into the EXISTING audit_logs table.
-- ===========================================

CREATE OR REPLACE FUNCTION log_availability_change()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_id UUID;
BEGIN
  v_entity_id := COALESCE(NEW.id, OLD.id);

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'AVAILABILITY_' || TG_OP,
    TG_TABLE_NAME,
    v_entity_id,
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS audit_facility_resources ON facility_resources;
CREATE TRIGGER audit_facility_resources
  AFTER INSERT OR UPDATE OR DELETE ON facility_resources
  FOR EACH ROW EXECUTE FUNCTION log_availability_change();

DROP TRIGGER IF EXISTS audit_facility_services ON facility_services;
CREATE TRIGGER audit_facility_services
  AFTER INSERT OR UPDATE OR DELETE ON facility_services
  FOR EACH ROW EXECUTE FUNCTION log_availability_change();

DROP TRIGGER IF EXISTS audit_facility_acceptance ON facility_acceptance_status;
CREATE TRIGGER audit_facility_acceptance
  AFTER INSERT OR UPDATE OR DELETE ON facility_acceptance_status
  FOR EACH ROW EXECUTE FUNCTION log_availability_change();

DROP TRIGGER IF EXISTS audit_facility_operating_status ON facilities;
CREATE TRIGGER audit_facility_operating_status
  AFTER UPDATE OF operating_status ON facilities
  FOR EACH ROW EXECUTE FUNCTION log_availability_change();

-- ===========================================
-- 9. ROW LEVEL SECURITY
--    Reuses get_user_role() / get_user_facility_id() from rls-policies.sql
-- ===========================================

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_requirement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_acceptance_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_runs ENABLE ROW LEVEL SECURITY;

-- Lookups: read for all authenticated, write for super_admin
DROP POLICY IF EXISTS "service_catalog_select" ON service_catalog;
CREATE POLICY "service_catalog_select" ON service_catalog FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "service_catalog_admin" ON service_catalog;
CREATE POLICY "service_catalog_admin" ON service_catalog FOR ALL
  USING (get_user_role() = 'super_admin') WITH CHECK (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "resource_types_select" ON resource_types;
CREATE POLICY "resource_types_select" ON resource_types FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "resource_types_admin" ON resource_types;
CREATE POLICY "resource_types_admin" ON resource_types FOR ALL
  USING (get_user_role() = 'super_admin') WITH CHECK (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "care_profiles_select" ON care_requirement_profiles;
CREATE POLICY "care_profiles_select" ON care_requirement_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "care_profiles_admin" ON care_requirement_profiles;
CREATE POLICY "care_profiles_admin" ON care_requirement_profiles FOR ALL
  USING (get_user_role() = 'super_admin') WITH CHECK (get_user_role() = 'super_admin');

-- Facility services: read all, write own facility or super_admin
DROP POLICY IF EXISTS "facility_services_select" ON facility_services;
CREATE POLICY "facility_services_select" ON facility_services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "facility_services_write_staff" ON facility_services;
CREATE POLICY "facility_services_write_staff" ON facility_services FOR ALL
  USING (facility_id = get_user_facility_id() OR get_user_role() = 'super_admin')
  WITH CHECK (facility_id = get_user_facility_id() OR get_user_role() = 'super_admin');

-- Acceptance status: read all, write own facility or super_admin
DROP POLICY IF EXISTS "acceptance_select" ON facility_acceptance_status;
CREATE POLICY "acceptance_select" ON facility_acceptance_status FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "acceptance_write_staff" ON facility_acceptance_status;
CREATE POLICY "acceptance_write_staff" ON facility_acceptance_status FOR ALL
  USING (facility_id = get_user_facility_id() OR get_user_role() = 'super_admin')
  WITH CHECK (facility_id = get_user_facility_id() OR get_user_role() = 'super_admin');

-- Recommendation runs: immutable; read own facility or super_admin
DROP POLICY IF EXISTS "recommendation_runs_select" ON recommendation_runs;
CREATE POLICY "recommendation_runs_select" ON recommendation_runs FOR SELECT
  USING (requester_facility_id = get_user_facility_id() OR get_user_role() = 'super_admin');
DROP POLICY IF EXISTS "recommendation_runs_insert" ON recommendation_runs;
CREATE POLICY "recommendation_runs_insert" ON recommendation_runs FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND (requester_facility_id IS NULL OR requester_facility_id = get_user_facility_id())
  );
-- No UPDATE / DELETE policies → immutable

-- ===========================================
-- 10. REFERENCE DATA (vocabularies + DRAFT clinical profiles)
-- ===========================================

INSERT INTO service_catalog (code, label, description) VALUES
  ('PRIMARY_CARE',      'Primary Care',            'General consultations and basic care'),
  ('EMERGENCY_CARE',    'Emergency Care',          'Hospital emergency department care'),
  ('TRAUMA_CARE',       'Trauma Care',             'Trauma assessment and management'),
  ('GENERAL_SURGERY',   'General Surgery',         'Surgical evaluation and operations'),
  ('OBSTETRICS',        'Obstetrics',              'Obstetric and high-risk pregnancy care'),
  ('MATERNITY_CARE',    'Maternity Care',          'Prenatal care and normal delivery'),
  ('PEDIATRICS',        'Pediatrics',              'Care for infants and children'),
  ('INTENSIVE_CARE',    'Intensive Care',          'Critical care unit'),
  ('RESPIRATORY_CARE',  'Respiratory Care',        'Respiratory support and stabilization'),
  ('NEUROLOGY',         'Neurology',               'Neurological assessment incl. stroke'),
  ('CARDIOLOGY',        'Cardiology',              'Cardiac assessment and treatment'),
  ('INTERNAL_MEDICINE', 'Internal Medicine',       'Adult medical care'),
  ('LABORATORY',        'Laboratory',              'Diagnostic laboratory'),
  ('IMAGING',           'Diagnostic Imaging',      'X-ray, CT, ultrasound')
ON CONFLICT (code) DO NOTHING;

INSERT INTO resource_types (code, label, freshness_group, is_countable, description) VALUES
  ('ED_OPERATIONAL',        'Emergency Department Open', 'CRITICAL_CAPACITY', false, 'ED is open and receiving'),
  ('TRAUMA_TEAM',           'Trauma Team Available',     'CRITICAL_CAPACITY', false, NULL),
  ('OPERATING_ROOM',        'Operating Room Available',  'CRITICAL_CAPACITY', true,  NULL),
  ('DELIVERY_ROOM',         'Delivery Room Available',   'CRITICAL_CAPACITY', true,  NULL),
  ('AMBULANCE',             'Ambulance / Transfer',      'CRITICAL_CAPACITY', true,  NULL),
  ('ICU_BED',               'ICU Bed',                   'BEDS',              true,  NULL),
  ('WARD_BED',              'Ward Bed',                  'BEDS',              true,  NULL),
  ('OB_BED',                'Obstetric Bed',             'BEDS',              true,  NULL),
  ('NICU_BED',              'NICU Bed',                  'BEDS',              true,  NULL),
  ('PEDIATRIC_BED',         'Pediatric Bed',             'BEDS',              true,  NULL),
  ('BLOOD_BANK',            'Blood Supply',              'EQUIPMENT_STAFF',   false, NULL),
  ('OXYGEN_SUPPLY',         'Oxygen Supply',             'EQUIPMENT_STAFF',   false, NULL),
  ('MECHANICAL_VENTILATOR', 'Mechanical Ventilator',     'EQUIPMENT_STAFF',   true,  NULL),
  ('CT_SCAN',               'CT Scanner',                'EQUIPMENT_STAFF',   true,  NULL),
  ('X_RAY',                 'X-Ray',                     'EQUIPMENT_STAFF',   true,  NULL),
  ('ECG_MACHINE',           'ECG Machine',               'EQUIPMENT_STAFF',   true,  NULL),
  ('SURGEON_ON_CALL',       'Surgeon On Call',           'EQUIPMENT_STAFF',   false, NULL),
  ('OBSTETRICIAN_ON_DUTY',  'Obstetrician On Duty',      'EQUIPMENT_STAFF',   false, NULL),
  ('NEUROLOGIST_ON_CALL',   'Neurologist On Call',       'EQUIPMENT_STAFF',   false, NULL),
  ('CARDIOLOGIST_ON_CALL',  'Cardiologist On Call',      'EQUIPMENT_STAFF',   false, NULL)
ON CONFLICT (code) DO NOTHING;

-- DRAFT clinical mappings — is_clinically_reviewed = false.
-- The UI shows a warning until a qualified clinician reviews and
-- a super_admin sets is_clinically_reviewed, reviewed_by, reviewed_at.
INSERT INTO care_requirement_profiles
  (case_category, label, required_services, mandatory_resources, requires_hospital_emergency, is_emergency_category) VALUES
  ('EMERGENCY_GENERAL',    'General Emergency',
     '{EMERGENCY_CARE}', '{ED_OPERATIONAL}', true, true),
  ('TRAUMA',               'Trauma / Injury',
     '{EMERGENCY_CARE,TRAUMA_CARE,GENERAL_SURGERY}', '{ED_OPERATIONAL,TRAUMA_TEAM,OPERATING_ROOM,BLOOD_BANK}', true, true),
  ('OBSTETRIC_EMERGENCY',  'Pregnancy Emergency',
     '{EMERGENCY_CARE,OBSTETRICS}', '{ED_OPERATIONAL,OBSTETRICIAN_ON_DUTY,DELIVERY_ROOM}', true, true),
  ('RESPIRATORY_DISTRESS', 'Severe Respiratory Distress',
     '{EMERGENCY_CARE,RESPIRATORY_CARE}', '{ED_OPERATIONAL,OXYGEN_SUPPLY,MECHANICAL_VENTILATOR}', true, true),
  ('SUSPECTED_STROKE',     'Suspected Stroke',
     '{EMERGENCY_CARE,NEUROLOGY,IMAGING}', '{ED_OPERATIONAL,CT_SCAN,NEUROLOGIST_ON_CALL}', true, true),
  ('CARDIAC_EMERGENCY',    'Cardiac Emergency',
     '{EMERGENCY_CARE,CARDIOLOGY}', '{ED_OPERATIONAL,ECG_MACHINE,CARDIOLOGIST_ON_CALL}', true, true),
  ('INTENSIVE_CARE',       'Intensive Care Needed',
     '{INTENSIVE_CARE}', '{ICU_BED}', true, true),
  ('SURGERY',              'Surgical Evaluation',
     '{GENERAL_SURGERY}', '{SURGEON_ON_CALL,WARD_BED}', false, false),
  ('MATERNITY',            'Maternity / Delivery',
     '{MATERNITY_CARE}', '{DELIVERY_ROOM}', false, false),
  ('PEDIATRICS',           'Pediatric Care',
     '{PEDIATRICS}', '{}', false, false),
  ('GENERAL_CONSULTATION', 'General Consultation',
     '{PRIMARY_CARE}', '{}', false, false)
ON CONFLICT (case_category) DO NOTHING;
