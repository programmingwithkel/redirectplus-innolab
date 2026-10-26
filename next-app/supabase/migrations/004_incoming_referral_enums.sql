-- ============================================
-- CareRoute Bicol — Incoming Referral Management (Part 1 of 2)
-- Enum additions
--
-- RUN THIS FIRST, ON ITS OWN, in the Supabase SQL Editor.
-- PostgreSQL does not allow a newly added enum value to be
-- used in the same transaction that created it, so this
-- must be committed before 005_incoming_referral_archive.sql runs.
-- ============================================

-- Receiver edited triage / patient details on an incoming referral
ALTER TYPE referral_event_type ADD VALUE IF NOT EXISTS 'DETAILS_UPDATED';

-- Receiver hid / restored a closed referral in its inbox (soft delete)
ALTER TYPE referral_event_type ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE referral_event_type ADD VALUE IF NOT EXISTS 'UNARCHIVED';
