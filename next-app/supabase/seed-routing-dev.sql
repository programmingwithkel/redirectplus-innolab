-- ============================================
-- CareRoute Bicol — Smart Routing DEVELOPMENT SAMPLE DATA
--
-- ⚠ DEVELOPMENT ONLY. NOT LIVE HOSPITAL DATA. ⚠
-- Every facility touched here is flagged is_sample_data = true
-- and the UI shows a "Development sample" badge on it.
-- All availability values below are fictional.
--
-- Run AFTER 002 + 003 migrations and the original seed.sql.
--
-- Reproduces the spec's trauma scenario from an origin near
-- BHS Daraga (13.1579, 123.6986):
--   Hospital A  = BRTTH (closest hospital)  → trauma team UNAVAILABLE → excluded
--   Hospital B  = [SAMPLE] Legazpi Secondary → trauma confirmed      → recommended
--   Hospital C  = [SAMPLE] Ligao District    → trauma confirmed      → alternative
--   RHU D       = RHU Legazpi                → no trauma capability  → excluded
--   [SAMPLE] Guinobatan → capable but STALE data  → unverified
--
-- Availability records age out (freshness windows). To re-stamp
-- sample data before a demo, run:   SELECT refresh_sample_availability();
-- ============================================

-- ===========================================
-- 1. Flag existing seed facilities as sample data and add sample hospitals
-- ===========================================

UPDATE facilities SET is_sample_data = true, verified_at = now(), operating_status = 'OPERATIONAL'
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'b1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c1111111-1111-1111-1111-111111111111'
);

INSERT INTO facilities
  (id, name, facility_type, address, city, province, latitude, longitude,
   contact_number, is_verified, is_active, operating_status, verified_at, is_sample_data)
VALUES
  ('e1111111-1111-1111-1111-111111111111', '[SAMPLE] Legazpi Secondary Hospital', 'SECONDARY',
   'Rizal St., Legazpi City', 'Legazpi City', 'Albay', 13.1449, 123.7518,
   '(052) 000-0101', true, true, 'OPERATIONAL', now(), true),
  ('e2222222-2222-2222-2222-222222222222', '[SAMPLE] Ligao District Hospital', 'SECONDARY',
   'National Rd., Ligao City', 'Ligao City', 'Albay', 13.2214, 123.5241,
   '(052) 000-0102', true, true, 'OPERATIONAL', now(), true),
  ('e3333333-3333-3333-3333-333333333333', '[SAMPLE] Guinobatan Community Hospital', 'SECONDARY',
   'Poblacion, Guinobatan', 'Guinobatan', 'Albay', 13.1897, 123.5993,
   '(052) 000-0103', true, true, 'OPERATIONAL', now(), true)
ON CONFLICT (id) DO UPDATE SET is_sample_data = true, operating_status = 'OPERATIONAL';

-- ===========================================
-- 2. Backfill resource_type on legacy rows where the name is unambiguous
-- ===========================================

UPDATE facility_resources SET resource_type = 'ED_OPERATIONAL' WHERE resource_name = 'Emergency Department' AND resource_type IS NULL;
UPDATE facility_resources SET resource_type = 'ICU_BED'        WHERE resource_name = 'ICU Beds'             AND resource_type IS NULL;
UPDATE facility_resources SET resource_type = 'WARD_BED'       WHERE resource_name IN ('Ward Beds', 'Beds') AND resource_type IS NULL;
UPDATE facility_resources SET resource_type = 'CT_SCAN'        WHERE resource_name = 'CT Scan'              AND resource_type IS NULL;
UPDATE facility_resources SET resource_type = 'X_RAY'          WHERE resource_name = 'X-Ray'                AND resource_type IS NULL;

-- ===========================================
-- 3. Services (structural capability)
-- ===========================================

INSERT INTO facility_services (facility_id, service_code, capability_level, is_active, last_verified_at)
SELECT f.id, s.code, s.lvl::capability_level, true, now() - interval '1 day'
FROM (VALUES
  -- BHS Daraga / Camalig
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'PRIMARY_CARE', 'BASIC'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'PRIMARY_CARE', 'BASIC'),
  -- RHU Legazpi (RHU D)
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'PRIMARY_CARE',   'STANDARD'),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY_CARE', 'BASIC'),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'LABORATORY',     'BASIC'),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'IMAGING',        'BASIC'),
  -- RHU Tabaco
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'PRIMARY_CARE', 'STANDARD'),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'PEDIATRICS',   'BASIC'),
  -- BRTTH (Hospital A)
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'EMERGENCY_CARE',    'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA_CARE',       'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'GENERAL_SURGERY',   'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICS',        'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY_CARE',    'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'PEDIATRICS',        'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'INTENSIVE_CARE',    'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'RESPIRATORY_CARE',  'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'NEUROLOGY',         'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'CARDIOLOGY',        'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'INTERNAL_MEDICINE', 'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'LABORATORY',        'ADVANCED'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'IMAGING',           'ADVANCED'),
  -- [SAMPLE] Legazpi Secondary (Hospital B)
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'EMERGENCY_CARE',   'STANDARD'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA_CARE',      'STANDARD'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'GENERAL_SURGERY',  'STANDARD'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICS',       'STANDARD'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY_CARE',   'STANDARD'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'PEDIATRICS',       'STANDARD'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'RESPIRATORY_CARE', 'BASIC'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'LABORATORY',       'STANDARD'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'IMAGING',          'STANDARD'),
  -- [SAMPLE] Ligao District (Hospital C)
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'EMERGENCY_CARE',  'STANDARD'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'TRAUMA_CARE',     'STANDARD'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'GENERAL_SURGERY', 'STANDARD'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'LABORATORY',      'BASIC'),
  -- [SAMPLE] Guinobatan (stale)
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'EMERGENCY_CARE',  'BASIC'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'TRAUMA_CARE',     'BASIC'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'GENERAL_SURGERY', 'BASIC')
) AS s(fid, code, lvl)
JOIN facilities f ON f.id = s.fid
ON CONFLICT (facility_id, service_code) DO UPDATE
  SET capability_level = EXCLUDED.capability_level, is_active = true,
      last_verified_at = EXCLUDED.last_verified_at;

-- ===========================================
-- 4. Typed resources (live availability)
-- ===========================================

INSERT INTO facility_resources (facility_id, resource_name, resource_category, resource_type, status, quantity, description, updated_at)
SELECT s.fid, rt.label, s.cat, s.rtype, s.status::resource_status, s.qty, '[SAMPLE] fictional availability', now() - s.age
FROM (VALUES
  -- BRTTH (Hospital A): trauma team UNAVAILABLE
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'ED_OPERATIONAL',        'service',   'AVAILABLE',   NULL::int, interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA_TEAM',           'specialty', 'UNAVAILABLE', NULL,      interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OPERATING_ROOM',        'equipment', 'AVAILABLE',   2,         interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'BLOOD_BANK',            'equipment', 'AVAILABLE',   NULL,      interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'ICU_BED',               'bed',       'LIMITED',     2,         interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'WARD_BED',              'bed',       'LIMITED',     25,        interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'CT_SCAN',               'equipment', 'AVAILABLE',   1,         interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'DELIVERY_ROOM',         'equipment', 'AVAILABLE',   2,         interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OXYGEN_SUPPLY',         'equipment', 'AVAILABLE',   NULL,      interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'MECHANICAL_VENTILATOR', 'equipment', 'LIMITED',     1,         interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'ECG_MACHINE',           'equipment', 'AVAILABLE',   3,         interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'SURGEON_ON_CALL',       'specialty', 'AVAILABLE',   NULL,      interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICIAN_ON_DUTY',  'specialty', 'AVAILABLE',   NULL,      interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'NEUROLOGIST_ON_CALL',   'specialty', 'AVAILABLE',   NULL,      interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'CARDIOLOGIST_ON_CALL',  'specialty', 'AVAILABLE',   NULL,      interval '10 minutes'),
  -- [SAMPLE] Legazpi Secondary (Hospital B): trauma-ready, ventilator unavailable
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'ED_OPERATIONAL',        'service',   'AVAILABLE',   NULL,      interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA_TEAM',           'specialty', 'AVAILABLE',   NULL,      interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OPERATING_ROOM',        'equipment', 'AVAILABLE',   1,         interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'BLOOD_BANK',            'equipment', 'AVAILABLE',   NULL,      interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'WARD_BED',              'bed',       'LIMITED',     6,         interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'DELIVERY_ROOM',         'equipment', 'AVAILABLE',   1,         interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OXYGEN_SUPPLY',         'equipment', 'AVAILABLE',   NULL,      interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'MECHANICAL_VENTILATOR', 'equipment', 'UNAVAILABLE', 0,         interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'SURGEON_ON_CALL',       'specialty', 'AVAILABLE',   NULL,      interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICIAN_ON_DUTY',  'specialty', 'AVAILABLE',   NULL,      interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'X_RAY',                 'equipment', 'AVAILABLE',   1,         interval '15 minutes'),
  -- [SAMPLE] Ligao District (Hospital C): trauma-ready
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'ED_OPERATIONAL',        'service',   'AVAILABLE',   NULL,      interval '20 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'TRAUMA_TEAM',           'specialty', 'AVAILABLE',   NULL,      interval '20 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'OPERATING_ROOM',        'equipment', 'AVAILABLE',   1,         interval '20 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'BLOOD_BANK',            'equipment', 'AVAILABLE',   NULL,      interval '20 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'WARD_BED',              'bed',       'AVAILABLE',   10,        interval '20 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'SURGEON_ON_CALL',       'specialty', 'AVAILABLE',   NULL,      interval '20 minutes'),
  -- [SAMPLE] Guinobatan: records are 2 days old → STALE → unverified
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'ED_OPERATIONAL',        'service',   'AVAILABLE',   NULL,      interval '2 days'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'TRAUMA_TEAM',           'specialty', 'AVAILABLE',   NULL,      interval '2 days'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'OPERATING_ROOM',        'equipment', 'AVAILABLE',   1,         interval '2 days'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'BLOOD_BANK',            'equipment', 'AVAILABLE',   NULL,      interval '2 days'),
  -- RHU Legazpi (RHU D)
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'DELIVERY_ROOM',         'equipment', 'AVAILABLE',   1,         interval '30 minutes')
) AS s(fid, rtype, cat, status, qty, age)
JOIN resource_types rt ON rt.code = s.rtype
ON CONFLICT (facility_id, resource_name) DO UPDATE
  SET resource_type = EXCLUDED.resource_type, status = EXCLUDED.status,
      quantity = EXCLUDED.quantity, description = EXCLUDED.description;

-- ===========================================
-- 5. Acceptance status per case category
-- ===========================================

INSERT INTO facility_acceptance_status (facility_id, case_category, acceptance_status, reason_code, last_updated_at, expires_at)
SELECT s.fid, s.cat, s.status::acceptance_status, s.reason, now() - interval '10 minutes', now() + interval '4 hours'
FROM (VALUES
  -- BRTTH (Hospital A): NOT accepting trauma, accepting the rest
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA',               'NOT_ACCEPTING', 'STAFF_SHORTAGE'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'EMERGENCY_GENERAL',    'ACCEPTING',     NULL),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRIC_EMERGENCY',  'ACCEPTING',     NULL),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'RESPIRATORY_DISTRESS', 'ACCEPTING',     NULL),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'SUSPECTED_STROKE',     'ACCEPTING',     NULL),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'CARDIAC_EMERGENCY',    'ACCEPTING',     NULL),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'INTENSIVE_CARE',       'ACCEPTING_WITH_CONDITIONS', NULL),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'SURGERY',              'ACCEPTING',     NULL),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY',            'ACCEPTING',     NULL),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'PEDIATRICS',           'ACCEPTING',     NULL),
  -- [SAMPLE] Legazpi Secondary (Hospital B)
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA',               'ACCEPTING',     NULL),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'EMERGENCY_GENERAL',    'ACCEPTING',     NULL),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRIC_EMERGENCY',  'ACCEPTING',     NULL),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'RESPIRATORY_DISTRESS', 'NOT_ACCEPTING', 'EQUIPMENT_UNAVAILABLE'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'SURGERY',              'ACCEPTING',     NULL),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY',            'ACCEPTING',     NULL),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'PEDIATRICS',           'ACCEPTING',     NULL),
  -- [SAMPLE] Ligao District (Hospital C)
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'TRAUMA',               'ACCEPTING',     NULL),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'EMERGENCY_GENERAL',    'ACCEPTING',     NULL),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'SURGERY',              'ACCEPTING',     NULL),
  -- RHU / BHS
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY',            'ACCEPTING',     NULL),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'GENERAL_CONSULTATION', 'ACCEPTING',     NULL),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'PEDIATRICS',           'ACCEPTING',     NULL),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'GENERAL_CONSULTATION', 'ACCEPTING',     NULL),
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'GENERAL_CONSULTATION', 'ACCEPTING',     NULL),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'GENERAL_CONSULTATION', 'ACCEPTING',     NULL)
  -- Guinobatan intentionally has NO acceptance records → UNKNOWN
) AS s(fid, cat, status, reason)
ON CONFLICT (facility_id, case_category) DO UPDATE
  SET acceptance_status = EXCLUDED.acceptance_status, reason_code = EXCLUDED.reason_code,
      last_updated_at = EXCLUDED.last_updated_at, expires_at = EXCLUDED.expires_at;

-- ===========================================
-- 6. Demo helper: re-stamp SAMPLE availability as fresh
--    Guinobatan is deliberately excluded so it keeps demonstrating
--    stale-data handling. Never touches non-sample facilities.
-- ===========================================

CREATE OR REPLACE FUNCTION refresh_sample_availability()
RETURNS void AS $$
BEGIN
  UPDATE facility_resources r SET status = r.status
  FROM facilities f
  WHERE f.id = r.facility_id AND f.is_sample_data
    AND r.resource_type IS NOT NULL
    AND f.id <> 'e3333333-3333-3333-3333-333333333333';

  UPDATE facility_acceptance_status a
  SET last_updated_at = now(), expires_at = now() + interval '4 hours'
  FROM facilities f
  WHERE f.id = a.facility_id AND f.is_sample_data;

  UPDATE facilities SET operating_status = operating_status
  WHERE is_sample_data;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION refresh_sample_availability() FROM PUBLIC, anon, authenticated;
