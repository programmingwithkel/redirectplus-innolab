-- ============================================
-- CareRoute Bicol — Row Level Security Policies
-- Run this AFTER schema.sql
-- ============================================

-- ===========================================
-- Enable RLS on ALL tables
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- Helper function: get current user's role
-- ===========================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===========================================
-- Helper function: get current user's facility_id
-- ===========================================

CREATE OR REPLACE FUNCTION get_user_facility_id()
RETURNS UUID AS $$
  SELECT facility_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===========================================
-- PROFILES POLICIES
-- ===========================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Super admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (get_user_role() = 'super_admin');

-- Only super admins can insert profiles (via admin client)
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (get_user_role() = 'super_admin');

-- Users can update their own profile (limited fields handled in app)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent self-role change and facility change
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND facility_id = (SELECT facility_id FROM profiles WHERE id = auth.uid())
  );

-- Super admins can update any profile
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (get_user_role() = 'super_admin');

-- Only super admins can delete profiles
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (get_user_role() = 'super_admin');

-- ===========================================
-- FACILITIES POLICIES
-- ===========================================

-- All authenticated users can view facilities
CREATE POLICY "facilities_select_authenticated"
  ON facilities FOR SELECT
  TO authenticated
  USING (true);

-- Only super admins can insert facilities
CREATE POLICY "facilities_insert_admin"
  ON facilities FOR INSERT
  WITH CHECK (get_user_role() = 'super_admin');

-- Facility staff or super admins can update
CREATE POLICY "facilities_update_staff"
  ON facilities FOR UPDATE
  USING (
    id = get_user_facility_id()
    OR get_user_role() = 'super_admin'
  );

-- Only super admins can delete facilities
CREATE POLICY "facilities_delete_admin"
  ON facilities FOR DELETE
  USING (get_user_role() = 'super_admin');

-- ===========================================
-- REFERRALS POLICIES
-- ===========================================

-- Users can view referrals where their facility is sender OR receiver
CREATE POLICY "referrals_select_facility"
  ON referrals FOR SELECT
  USING (
    referring_facility_id = get_user_facility_id()
    OR receiving_facility_id = get_user_facility_id()
  );

-- Super admins can view all referrals
CREATE POLICY "referrals_select_admin"
  ON referrals FOR SELECT
  USING (get_user_role() = 'super_admin');

-- Operational users can create referrals for their own facility
CREATE POLICY "referrals_insert_operational"
  ON referrals FOR INSERT
  WITH CHECK (
    referring_facility_id = get_user_facility_id()
    AND created_by = auth.uid()
  );

-- Receiving facility staff can update referrals (acknowledge, accept, etc.)
CREATE POLICY "referrals_update_receiver"
  ON referrals FOR UPDATE
  USING (receiving_facility_id = get_user_facility_id());

-- Referring facility can update their own referrals (cancel)
CREATE POLICY "referrals_update_sender"
  ON referrals FOR UPDATE
  USING (referring_facility_id = get_user_facility_id());

-- Super admins can update any referral
CREATE POLICY "referrals_update_admin"
  ON referrals FOR UPDATE
  USING (get_user_role() = 'super_admin');

-- No deletes on referrals (use status changes instead)

-- ===========================================
-- REFERRAL EVENTS POLICIES
-- ===========================================

-- Users can view events for referrals they can access
CREATE POLICY "referral_events_select"
  ON referral_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referrals r
      WHERE r.id = referral_events.referral_id
      AND (
        r.referring_facility_id = get_user_facility_id()
        OR r.receiving_facility_id = get_user_facility_id()
        OR get_user_role() = 'super_admin'
      )
    )
  );

-- Users can insert events for referrals they can access
CREATE POLICY "referral_events_insert"
  ON referral_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM referrals r
      WHERE r.id = referral_id
      AND (
        r.referring_facility_id = get_user_facility_id()
        OR r.receiving_facility_id = get_user_facility_id()
      )
    )
    AND actor_id = auth.uid()
  );

-- Super admins can insert events
CREATE POLICY "referral_events_insert_admin"
  ON referral_events FOR INSERT
  WITH CHECK (get_user_role() = 'super_admin');

-- No updates or deletes on events (immutable)

-- ===========================================
-- FACILITY RESOURCES POLICIES
-- ===========================================

-- All authenticated users can view resources (for recommendations)
CREATE POLICY "facility_resources_select"
  ON facility_resources FOR SELECT
  TO authenticated
  USING (true);

-- Facility staff can insert resources for their own facility
CREATE POLICY "facility_resources_insert"
  ON facility_resources FOR INSERT
  WITH CHECK (facility_id = get_user_facility_id());

-- Facility staff can update their own facility's resources
CREATE POLICY "facility_resources_update"
  ON facility_resources FOR UPDATE
  USING (facility_id = get_user_facility_id());

-- Super admins can manage all resources
CREATE POLICY "facility_resources_insert_admin"
  ON facility_resources FOR INSERT
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "facility_resources_update_admin"
  ON facility_resources FOR UPDATE
  USING (get_user_role() = 'super_admin');

-- Facility staff can delete their own resources
CREATE POLICY "facility_resources_delete"
  ON facility_resources FOR DELETE
  USING (facility_id = get_user_facility_id());

CREATE POLICY "facility_resources_delete_admin"
  ON facility_resources FOR DELETE
  USING (get_user_role() = 'super_admin');

-- ===========================================
-- AUDIT LOGS POLICIES
-- ===========================================

-- Only super admins can read audit logs
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  USING (get_user_role() = 'super_admin');

-- System can insert audit logs (via service role or triggers)
-- Operational users can insert audit logs for their own actions
CREATE POLICY "audit_logs_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (actor_id = auth.uid() OR get_user_role() = 'super_admin');

-- No updates or deletes on audit logs (immutable)
