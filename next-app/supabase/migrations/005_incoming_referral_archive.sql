-- ============================================
-- CareRoute Bicol — Incoming Referral Management (Part 2 of 2)
-- Receiver-side soft archive
--
-- Referrals are never hard-deleted (see rls-policies.sql). Instead the
-- receiving facility can archive a CLOSED referral to hide it from its
-- inbox. The referral and its audit trail remain intact and visible to
-- the referring facility and super admins.
--
-- Run AFTER 004_incoming_referral_enums.sql has been committed.
-- ============================================

ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS receiver_archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receiver_archived_by UUID REFERENCES profiles(id);

-- Inbox queries filter by receiver + archive state, newest first
CREATE INDEX IF NOT EXISTS idx_referrals_receiving_inbox
  ON referrals (receiving_facility_id, receiver_archived_at, created_at DESC);

-- Archiving is a receiver concern only. Clear the flag whenever a referral
-- moves to a different receiving facility so it shows up in the new inbox.
CREATE OR REPLACE FUNCTION clear_receiver_archive_on_redirect()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receiving_facility_id IS DISTINCT FROM OLD.receiving_facility_id THEN
    NEW.receiver_archived_at = NULL;
    NEW.receiver_archived_by = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_referrals_clear_receiver_archive ON referrals;
CREATE TRIGGER trigger_referrals_clear_receiver_archive
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION clear_receiver_archive_on_redirect();
