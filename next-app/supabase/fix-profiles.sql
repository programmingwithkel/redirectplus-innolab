-- ============================================
-- CareRoute Bicol — COMPLETE Fix (Run this one)
-- Inserts facilities FIRST, then profiles & data
-- ============================================

-- Clean slate
DELETE FROM referral_events;
DELETE FROM referrals;
DELETE FROM facility_resources;
DELETE FROM audit_logs;
DELETE FROM profiles;
DELETE FROM facilities;

-- ===========================================
-- 1. FACILITIES (must exist before profiles)
-- ===========================================

INSERT INTO facilities (id, name, facility_type, address, city, province, latitude, longitude, contact_number, email, is_verified, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'Barangay Health Station Daraga', 'BHS', 'Brgy. San Roque, Daraga', 'Daraga', 'Albay', 13.1579, 123.6986, '(052) 742-0001', 'bhs.daraga@careroute.ph', true, true),
('a2222222-2222-2222-2222-222222222222', 'Barangay Health Station Camalig', 'BHS', 'Brgy. Poblacion, Camalig', 'Camalig', 'Albay', 13.1350, 123.6656, '(052) 742-0002', 'bhs.camalig@careroute.ph', true, true),
('b1111111-1111-1111-1111-111111111111', 'Rural Health Unit Legazpi', 'RHU', 'City Health Office, Legazpi City', 'Legazpi City', 'Albay', 13.1391, 123.7438, '(052) 480-0001', 'rhu.legazpi@careroute.ph', true, true),
('b2222222-2222-2222-2222-222222222222', 'Rural Health Unit Tabaco', 'RHU', 'Municipal Health Office, Tabaco City', 'Tabaco City', 'Albay', 13.3586, 123.7353, '(052) 487-0001', 'rhu.tabaco@careroute.ph', true, true),
('c1111111-1111-1111-1111-111111111111', 'Bicol Regional Training and Teaching Hospital', 'TERTIARY', 'Daraga, Albay', 'Daraga', 'Albay', 13.1618, 123.7124, '(052) 483-0001', 'brtth@careroute.ph', true, true);

-- ===========================================
-- 2. PROFILES + REFERRALS + EVENTS + RESOURCES
-- ===========================================

DO $$
DECLARE
  v_admin_id UUID;
  v_bhs_id UUID;
  v_rhu_id UUID;
  v_tertiary_id UUID;
  v_bhs2_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@careroute.ph';
  SELECT id INTO v_bhs_id FROM auth.users WHERE email = 'bhs@careroute.ph';
  SELECT id INTO v_rhu_id FROM auth.users WHERE email = 'rhu@careroute.ph';
  SELECT id INTO v_tertiary_id FROM auth.users WHERE email = 'tertiary@careroute.ph';
  SELECT id INTO v_bhs2_id FROM auth.users WHERE email = 'bhs2@careroute.ph';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Auth users not found! Create them first in Auth Dashboard.';
  END IF;

  -- Profiles
  INSERT INTO profiles (id, email, full_name, role, facility_id, is_active) VALUES
  (v_admin_id, 'admin@careroute.ph', 'Admin CareRoute', 'super_admin', NULL, true),
  (v_bhs_id, 'bhs@careroute.ph', 'Maria Santos', 'operational', 'a1111111-1111-1111-1111-111111111111', true),
  (v_rhu_id, 'rhu@careroute.ph', 'Juan Dela Cruz', 'operational', 'b1111111-1111-1111-1111-111111111111', true),
  (v_tertiary_id, 'tertiary@careroute.ph', 'Dr. Ana Reyes', 'operational', 'c1111111-1111-1111-1111-111111111111', true),
  (v_bhs2_id, 'bhs2@careroute.ph', 'Pedro Gonzales', 'operational', 'a2222222-2222-2222-2222-222222222222', true);

  -- Referrals
  INSERT INTO referrals (id, patient_name, patient_age, patient_sex, patient_address, patient_latitude, patient_longitude, chief_complaint, reason, required_service, urgency, clinical_notes, referring_facility_id, receiving_facility_id, status, created_by, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Ricardo Magsaysay', 45, 'Male', 'Brgy. San Roque, Daraga, Albay', 13.1579, 123.6986, 'Persistent chest pain with shortness of breath', 'Needs cardiology evaluation', 'Cardiology', 'URGENT', 'BP: 160/100. ECG shows ST changes.', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'PENDING', v_bhs_id, now() - interval '2 hours'),
  ('d2222222-2222-2222-2222-222222222222', 'Josefa Rizal', 32, 'Female', 'Brgy. Poblacion, Camalig, Albay', 13.1350, 123.6656, 'Severe abdominal pain, possible appendicitis', 'Surgical evaluation needed', 'General Surgery', 'EMERGENCY', 'RLQ tenderness, rebound positive. Fever 38.5C.', 'a2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'ACKNOWLEDGED', v_bhs2_id, now() - interval '5 hours'),
  ('d3333333-3333-3333-3333-333333333333', 'Elena Bonifacio', 28, 'Female', 'Legazpi City, Albay', 13.1391, 123.7438, 'High-risk pregnancy, preeclampsia symptoms', 'OB-GYN specialist management', 'Obstetrics', 'URGENT', 'BP: 150/95, proteinuria +2, edema.', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'ACCEPTED', v_rhu_id, now() - interval '1 day'),
  ('d4444444-4444-4444-4444-444444444444', 'Manuel Quezon', 67, 'Male', 'Tabaco City, Albay', 13.3586, 123.7353, 'Diabetic foot ulcer, not healing', 'Wound care and surgical debridement', 'General Surgery', 'ROUTINE', 'Type 2 DM 15 years. Non-healing wound 3cm.', 'b2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'COMPLETED', v_rhu_id, now() - interval '3 days');

  -- Referral events
  INSERT INTO referral_events (referral_id, event_type, new_status, notes, actor_id, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'CREATED', 'PENDING', 'Referral created for cardiology evaluation', v_bhs_id, now() - interval '2 hours'),
  ('d2222222-2222-2222-2222-222222222222', 'CREATED', 'PENDING', 'Emergency surgical referral', v_bhs2_id, now() - interval '5 hours'),
  ('d2222222-2222-2222-2222-222222222222', 'ACKNOWLEDGED', 'ACKNOWLEDGED', 'Referral received and being reviewed', v_rhu_id, now() - interval '4 hours'),
  ('d3333333-3333-3333-3333-333333333333', 'CREATED', 'PENDING', 'High-risk OB referral', v_rhu_id, now() - interval '1 day'),
  ('d3333333-3333-3333-3333-333333333333', 'ACKNOWLEDGED', 'ACKNOWLEDGED', 'Referral acknowledged', v_tertiary_id, now() - interval '23 hours'),
  ('d3333333-3333-3333-3333-333333333333', 'ACCEPTED', 'ACCEPTED', 'Patient accepted. OB team ready.', v_tertiary_id, now() - interval '22 hours'),
  ('d4444444-4444-4444-4444-444444444444', 'CREATED', 'PENDING', 'Diabetic foot referral', v_rhu_id, now() - interval '3 days'),
  ('d4444444-4444-4444-4444-444444444444', 'ACKNOWLEDGED', 'ACKNOWLEDGED', 'Scheduling appointment', v_tertiary_id, now() - interval '2 days 20 hours'),
  ('d4444444-4444-4444-4444-444444444444', 'ACCEPTED', 'ACCEPTED', 'Patient scheduled', v_tertiary_id, now() - interval '2 days 18 hours'),
  ('d4444444-4444-4444-4444-444444444444', 'IN_PROGRESS', 'IN_PROGRESS', 'Surgical debridement performed', v_tertiary_id, now() - interval '2 days'),
  ('d4444444-4444-4444-4444-444444444444', 'COMPLETED', 'COMPLETED', 'Treatment completed. Discharged.', v_tertiary_id, now() - interval '1 day');

  RAISE NOTICE 'All data seeded successfully!';
END $$;

-- ===========================================
-- 3. FACILITY RESOURCES (outside DO block, no user ref needed)
-- ===========================================

INSERT INTO facility_resources (facility_id, resource_name, resource_category, status, quantity, description, updated_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'Primary Care', 'service', 'AVAILABLE', NULL, 'Basic primary health care', now() - interval '6 hours'),
('a1111111-1111-1111-1111-111111111111', 'Immunization', 'service', 'AVAILABLE', NULL, 'Childhood and adult immunization', now() - interval '6 hours'),
('a1111111-1111-1111-1111-111111111111', 'Prenatal Care', 'service', 'AVAILABLE', NULL, 'Basic prenatal consultations', now() - interval '6 hours'),
('a1111111-1111-1111-1111-111111111111', 'Blood Pressure Monitoring', 'equipment', 'AVAILABLE', 2, 'Digital BP monitors', now() - interval '6 hours'),
('a2222222-2222-2222-2222-222222222222', 'Primary Care', 'service', 'AVAILABLE', NULL, 'Basic primary health care', now() - interval '1 day'),
('a2222222-2222-2222-2222-222222222222', 'Immunization', 'service', 'LIMITED', NULL, 'Vaccine supply limited', now() - interval '1 day'),
('a2222222-2222-2222-2222-222222222222', 'Wound Care', 'service', 'AVAILABLE', NULL, 'Basic wound dressing', now() - interval '1 day'),
('b1111111-1111-1111-1111-111111111111', 'General Medicine', 'service', 'AVAILABLE', NULL, 'Outpatient general medicine', now() - interval '3 hours'),
('b1111111-1111-1111-1111-111111111111', 'General Surgery', 'service', 'LIMITED', NULL, 'Minor surgical procedures only', now() - interval '3 hours'),
('b1111111-1111-1111-1111-111111111111', 'Obstetrics', 'service', 'AVAILABLE', NULL, 'Normal delivery and prenatal care', now() - interval '3 hours'),
('b1111111-1111-1111-1111-111111111111', 'Laboratory', 'service', 'AVAILABLE', NULL, 'CBC, urinalysis, blood typing', now() - interval '3 hours'),
('b1111111-1111-1111-1111-111111111111', 'Beds', 'bed', 'LIMITED', 5, '5 beds, 3 occupied', now() - interval '3 hours'),
('b1111111-1111-1111-1111-111111111111', 'X-Ray', 'equipment', 'AVAILABLE', 1, 'Basic X-ray machine', now() - interval '3 hours'),
('b2222222-2222-2222-2222-222222222222', 'General Medicine', 'service', 'AVAILABLE', NULL, 'Outpatient consultations', now() - interval '2 days'),
('b2222222-2222-2222-2222-222222222222', 'Pediatrics', 'service', 'AVAILABLE', NULL, 'Pediatric outpatient care', now() - interval '2 days'),
('b2222222-2222-2222-2222-222222222222', 'Dental', 'service', 'UNAVAILABLE', NULL, 'Dentist on leave', now() - interval '2 days'),
('b2222222-2222-2222-2222-222222222222', 'Beds', 'bed', 'AVAILABLE', 8, '8 beds, 2 occupied', now() - interval '2 days'),
('c1111111-1111-1111-1111-111111111111', 'Cardiology', 'specialty', 'AVAILABLE', NULL, 'Full cardiology with ECG, echo', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'General Surgery', 'specialty', 'AVAILABLE', NULL, 'Full surgical suite', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'Obstetrics', 'specialty', 'AVAILABLE', NULL, 'High-risk OB, NICU available', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'Pediatrics', 'specialty', 'AVAILABLE', NULL, 'Pediatric ward and ICU', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'Internal Medicine', 'specialty', 'AVAILABLE', NULL, 'Full internal medicine', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'Emergency Department', 'service', 'AVAILABLE', NULL, '24/7 ER', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'ICU Beds', 'bed', 'LIMITED', 10, '10 ICU beds, 8 occupied', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'Ward Beds', 'bed', 'LIMITED', 120, '120 ward beds, 95 occupied', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'CT Scan', 'equipment', 'AVAILABLE', 1, '64-slice CT scanner', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'MRI', 'equipment', 'UNAVAILABLE', 1, 'Under maintenance', now() - interval '1 hour'),
('c1111111-1111-1111-1111-111111111111', 'Laboratory', 'service', 'AVAILABLE', NULL, 'Full laboratory services', now() - interval '1 hour');
