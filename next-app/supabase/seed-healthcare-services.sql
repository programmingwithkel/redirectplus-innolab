-- ============================================
-- CareRoute Bicol — Healthcare Services Seed Data
-- Populates doctors/specialists, bed/room monitoring, and
-- healthcare services across Bicol facilities.
--
-- Safe to run multiple times (idempotent).
-- ============================================

-- Ensure resource_types exist
INSERT INTO resource_types (code, label, freshness_group, is_countable, description) VALUES
  ('SURGEON_ON_CALL',       'Surgeon On Call',           'EQUIPMENT_STAFF',   false, 'On-call general and trauma surgeon'),
  ('OBSTETRICIAN_ON_DUTY',  'Obstetrician On Duty',      'EQUIPMENT_STAFF',   false, 'On-duty obstetrician/gynecologist'),
  ('NEUROLOGIST_ON_CALL',   'Neurologist On Call',       'EQUIPMENT_STAFF',   false, 'On-call neurologist for stroke/head injury'),
  ('CARDIOLOGIST_ON_CALL',  'Cardiologist On Call',      'EQUIPMENT_STAFF',   false, 'On-call cardiologist'),
  ('TRAUMA_TEAM',           'Trauma Team Available',     'CRITICAL_CAPACITY', false, 'Dedicated multidisciplinary trauma team'),
  ('ICU_BED',               'ICU Bed',                   'BEDS',              true,  'Intensive care unit bed'),
  ('WARD_BED',              'Ward Bed',                  'BEDS',              true,  'General inpatient ward bed'),
  ('OB_BED',                'Obstetric Bed',             'BEDS',              true,  'Obstetric and postpartum care bed'),
  ('NICU_BED',              'NICU Bed',                  'BEDS',              true,  'Neonatal intensive care bed'),
  ('PEDIATRIC_BED',         'Pediatric Bed',             'BEDS',              true,  'Pediatric inpatient bed'),
  ('OPERATING_ROOM',        'Operating Room Available',  'CRITICAL_CAPACITY', true,  'Fully equipped surgical operating theater'),
  ('DELIVERY_ROOM',         'Delivery Room Available',   'CRITICAL_CAPACITY', true,  'Labor and delivery suite')
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  freshness_group = EXCLUDED.freshness_group,
  is_countable = EXCLUDED.is_countable;

-- Ensure sample secondary facilities exist if not already seeded
INSERT INTO facilities
  (id, name, facility_type, address, city, province, latitude, longitude,
   contact_number, is_verified, is_active, operating_status, verified_at, is_sample_data)
VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Legazpi Secondary Hospital', 'SECONDARY',
   'Rizal St., Legazpi City', 'Legazpi City', 'Albay', 13.1449, 123.7518,
   '(052) 000-0101', true, true, 'OPERATIONAL', now(), true),
  ('e2222222-2222-2222-2222-222222222222', 'Ligao District Hospital', 'SECONDARY',
   'National Rd., Ligao City', 'Ligao City', 'Albay', 13.2214, 123.5241,
   '(052) 000-0102', true, true, 'OPERATIONAL', now(), true),
  ('e3333333-3333-3333-3333-333333333333', 'Guinobatan Community Hospital', 'SECONDARY',
   'Poblacion, Guinobatan', 'Guinobatan', 'Albay', 13.1897, 123.5993,
   '(052) 000-0103', true, true, 'OPERATIONAL', now(), true)
ON CONFLICT (id) DO UPDATE SET is_active = true, operating_status = 'OPERATIONAL';

-- ===========================================
-- 1. DOCTORS / SPECIALISTS & BEDS / ROOMS
--    Inserted into facility_resources
-- ===========================================

INSERT INTO facility_resources (facility_id, resource_name, resource_category, resource_type, status, quantity, description, updated_at)
SELECT s.fid, rt.label, s.cat, s.rtype, s.status::resource_status, s.qty, s.descrip, now() - s.age
FROM (VALUES
  -- ─── BRTTH (Tertiary Hospital) ───────────────────────────────
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'SURGEON_ON_CALL',       'specialty', 'AVAILABLE',   NULL::int, 'General & trauma surgeon on active shift', interval '8 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICIAN_ON_DUTY',  'specialty', 'AVAILABLE',   NULL,      'High-risk OB specialist on duty', interval '12 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'NEUROLOGIST_ON_CALL',   'specialty', 'AVAILABLE',   NULL,      'Neurology attending on call', interval '25 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'CARDIOLOGIST_ON_CALL',  'specialty', 'AVAILABLE',   NULL,      'Cardiologist on call for acute coronary syndromes', interval '15 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA_TEAM',           'specialty', 'UNAVAILABLE', NULL,      'Trauma surgical team engaged in emergency procedure', interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'ICU_BED',               'bed',       'LIMITED',     4,         '4 critical care beds available out of 20', interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'WARD_BED',              'bed',       'AVAILABLE',   32,        '32 inpatient ward beds vacant', interval '10 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OB_BED',                'bed',       'AVAILABLE',   8,         '8 obstetric postpartum beds open', interval '12 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'NICU_BED',              'bed',       'LIMITED',     2,         '2 neonatal intensive care incubators available', interval '15 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'PEDIATRIC_BED',         'bed',       'AVAILABLE',   14,        '14 pediatric ward beds open', interval '15 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OPERATING_ROOM',        'equipment', 'AVAILABLE',   2,         '2 major operating rooms ready', interval '8 minutes'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'DELIVERY_ROOM',         'equipment', 'AVAILABLE',   2,         '2 delivery suites active', interval '12 minutes'),

  -- ─── Legazpi Secondary Hospital ──────────────────────────────
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA_TEAM',           'specialty', 'AVAILABLE',   NULL,      'Secondary trauma response team on active status', interval '14 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'SURGEON_ON_CALL',       'specialty', 'AVAILABLE',   NULL,      'General surgeon on call', interval '20 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICIAN_ON_DUTY',  'specialty', 'AVAILABLE',   NULL,      'Obstetrician on duty', interval '18 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'CARDIOLOGIST_ON_CALL',  'specialty', 'UNAVAILABLE', NULL,      'Cardiologist currently off-duty', interval '45 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'ICU_BED',               'bed',       'LIMITED',     2,         '2 intermediate ICU beds open', interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'WARD_BED',              'bed',       'AVAILABLE',   16,        '16 general ward beds open', interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OB_BED',                'bed',       'AVAILABLE',   6,         '6 maternal beds available', interval '18 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OPERATING_ROOM',        'equipment', 'AVAILABLE',   1,         '1 general OR available', interval '15 minutes'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'DELIVERY_ROOM',         'equipment', 'AVAILABLE',   1,         '1 delivery suite available', interval '15 minutes'),

  -- ─── Ligao District Hospital ─────────────────────────────────
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'TRAUMA_TEAM',           'specialty', 'AVAILABLE',   NULL,      'District trauma team ready', interval '30 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'SURGEON_ON_CALL',       'specialty', 'AVAILABLE',   NULL,      'Surgeon on call for emergency appendectomy & lacerations', interval '25 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'OBSTETRICIAN_ON_DUTY',  'specialty', 'LIMITED',     NULL,      'OB on duty handling delivery in progress', interval '35 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'WARD_BED',              'bed',       'AVAILABLE',   10,        '10 district ward beds available', interval '20 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'OPERATING_ROOM',        'equipment', 'AVAILABLE',   1,         '1 surgical suite available', interval '20 minutes'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'DELIVERY_ROOM',         'equipment', 'UNAVAILABLE', 0,         'Delivery room currently occupied and undergoing cleaning', interval '30 minutes'),

  -- ─── Guinobatan Community Hospital ───────────────────────────
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'TRAUMA_TEAM',           'specialty', 'AVAILABLE',   NULL,      'Community emergency trauma triage team', interval '2 hours'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'SURGEON_ON_CALL',       'specialty', 'LIMITED',     NULL,      'Consulting surgeon visiting on call', interval '2 hours'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'WARD_BED',              'bed',       'AVAILABLE',   6,         '6 community beds available', interval '1 hour'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'DELIVERY_ROOM',         'equipment', 'AVAILABLE',   1,         '1 birthing room available', interval '1 hour'),

  -- ─── RHU Legazpi ─────────────────────────────────────────────
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICIAN_ON_DUTY',  'specialty', 'AVAILABLE',   NULL,      'Maternal health physician on duty', interval '40 minutes'),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'WARD_BED',              'bed',       'LIMITED',     2,         '2 observation beds available', interval '35 minutes'),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'DELIVERY_ROOM',         'equipment', 'AVAILABLE',   1,         'BEmONC delivery room open', interval '35 minutes'),

  -- ─── RHU Tabaco ──────────────────────────────────────────────
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'WARD_BED',              'bed',       'AVAILABLE',   6,         '6 primary observation beds available', interval '50 minutes')
) AS s(fid, rtype, cat, status, qty, descrip, age)
JOIN resource_types rt ON rt.code = s.rtype
ON CONFLICT (facility_id, resource_name) DO UPDATE
  SET resource_type = EXCLUDED.resource_type,
      resource_category = EXCLUDED.resource_category,
      status = EXCLUDED.status,
      quantity = EXCLUDED.quantity,
      description = EXCLUDED.description,
      updated_at = EXCLUDED.updated_at;

-- ===========================================
-- 2. HEALTHCARE SERVICES (Structural Capability)
--    Inserted into facility_services
-- ===========================================

INSERT INTO facility_services (facility_id, service_code, capability_level, is_active, last_verified_at)
SELECT s.fid, s.code, s.lvl::capability_level, true, now() - s.verified_ago
FROM (VALUES
  -- ─── BRTTH (Tertiary Hospital) ───────────────────────────────
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'EMERGENCY_CARE',    'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA_CARE',       'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'GENERAL_SURGERY',   'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICS',        'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY_CARE',    'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'PEDIATRICS',        'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'INTENSIVE_CARE',    'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'RESPIRATORY_CARE',  'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'NEUROLOGY',         'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'CARDIOLOGY',        'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'INTERNAL_MEDICINE', 'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'LABORATORY',        'ADVANCED', interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'IMAGING',           'ADVANCED', interval '1 hour'),

  -- ─── Legazpi Secondary Hospital ──────────────────────────────
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'EMERGENCY_CARE',   'STANDARD', interval '2 hours'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'TRAUMA_CARE',      'STANDARD', interval '2 hours'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'GENERAL_SURGERY',  'STANDARD', interval '2 hours'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'OBSTETRICS',       'STANDARD', interval '2 hours'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY_CARE',   'STANDARD', interval '2 hours'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'PEDIATRICS',       'STANDARD', interval '2 hours'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'RESPIRATORY_CARE', 'BASIC',    interval '2 hours'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'LABORATORY',        'STANDARD', interval '2 hours'),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'IMAGING',           'STANDARD', interval '2 hours'),

  -- ─── Ligao District Hospital ─────────────────────────────────
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'EMERGENCY_CARE',  'STANDARD', interval '3 hours'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'TRAUMA_CARE',     'STANDARD', interval '3 hours'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'GENERAL_SURGERY', 'STANDARD', interval '3 hours'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'LABORATORY',      'BASIC',    interval '3 hours'),

  -- ─── RHU Legazpi ─────────────────────────────────────────────
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'PRIMARY_CARE',   'STANDARD', interval '4 hours'),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'MATERNITY_CARE', 'BASIC',    interval '4 hours'),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'LABORATORY',     'BASIC',    interval '4 hours'),
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'IMAGING',        'BASIC',    interval '4 hours'),

  -- ─── RHU Tabaco ──────────────────────────────────────────────
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'PRIMARY_CARE', 'STANDARD', interval '5 hours'),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'PEDIATRICS',   'BASIC',    interval '5 hours'),

  -- ─── BHS Daraga / Camalig ────────────────────────────────────
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'PRIMARY_CARE', 'BASIC', interval '6 hours'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'PRIMARY_CARE', 'BASIC', interval '6 hours')
) AS s(fid, code, lvl, verified_ago)
JOIN facilities f ON f.id = s.fid
JOIN service_catalog sc ON sc.code = s.code
ON CONFLICT (facility_id, service_code) DO UPDATE
  SET capability_level = EXCLUDED.capability_level,
      is_active = true,
      last_verified_at = EXCLUDED.last_verified_at;
