# CareRoute Bicol — Smart Hospital Routing Setup & Architecture Guide

## 1. Overview

CareRoute Bicol features a multi-tiered, intelligent healthcare facility routing engine designed to recommend the nearest hospital capable of accommodating a patient's medical needs.

The recommendation engine strictly implements the **core rule**:
> **Recommend the nearest verified, suitable, and available hospital.** If that hospital cannot accommodate the patient, automatically recommend the next nearest suitable hospital with confirmed availability.

### Three-State Availability Model
Unknown availability is **never** presented as confirmed availability:
1. **Confirmed Available (`CONFIRMED_AVAILABLE`):** Hospital possesses active, verified clinical services and equipment, and has confirmed live acceptance within the freshness window.
2. **Confirmed Unavailable (`CONFIRMED_UNAVAILABLE`):** Hospital explicitly reports diversion, lack of beds, or specialist unavailability.
3. **Unverified (`UNKNOWN`):** Records are stale (past freshness window), expired, or unconfirmed.

---

## 2. Google Maps Platform Setup

### Required APIs to Enable in Google Cloud Console
In [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview), enable:
1. **Maps JavaScript API** — Renders the interactive map with hospital markers and polyline overlays.
2. **Routes API** — Calculates realistic driving travel times, distances, and traffic-aware navigation routes.
3. **Places API (New)** — Location search and hospital verification.
4. **Geocoding API** — Converts manual address queries into coordinates when GPS is not permitted.

### Recommended Key Restrictions
For production security and HIPPA/patient privacy compliance:
- **Browser Key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):**
  - Application restrictions: **HTTP referrers (web sites)**
  - Allowed referrers: `http://localhost:3000/*`, `https://your-production-domain.ph/*`
  - API restrictions: **Maps JavaScript API**, **Places API (New)**
- **Server Key (`GOOGLE_MAPS_SERVER_KEY`):**
  - Application restrictions: **IP addresses** (your Next.js production host IPs)
  - API restrictions: **Routes API**, **Geocoding API**

---

## 3. Database Migration Sequence

In the **Supabase Dashboard → SQL Editor**, run these files in order:

### Step 1: `supabase/migrations/002_smart_routing_enums.sql`
Creates new enum types (`operating_status`, `capability_level`, `acceptance_status`, `freshness_group`, `travel_source`, `recommendation_outcome`) and adds `'SECONDARY'` to `facility_type`.

### Step 2: `supabase/migrations/003_smart_routing.sql`
Creates:
- `service_catalog` & `resource_types` (controlled vocabularies)
- `care_requirement_profiles` (clinical case requirements)
- `facility_services` (structural capabilities)
- `facility_acceptance_status` (live acceptance with expiration)
- `recommendation_runs` (de-identified audit of every recommendation)
- Extends `facilities` and `facility_resources`
- Enables Row Level Security (RLS) policies and triggers that feed into `audit_logs`.

### Step 3: `supabase/seed-routing-dev.sql` (Optional Demo Data)
Seeds clearly-labeled demo facilities reproducing the trauma case scenario:
- **BRTTH** (closest, but trauma team unavailable → excluded)
- **[SAMPLE] Legazpi Secondary Hospital** (trauma confirmed → recommended)
- **[SAMPLE] Ligao District Hospital** (trauma confirmed → alternative)
- **RHU Legazpi** (primary care only → excluded)
- **[SAMPLE] Guinobatan Hospital** (stale data → unverified)

To refresh demo sample timestamps anytime, execute:
```sql
SELECT refresh_sample_availability();
```

---

## 4. Architecture & SOLID Principles

```
lib/routing/
├── domain/                         # Pure domain logic (zero external dependencies)
│   ├── types.ts                    # Core models, finding codes, and verdicts
│   ├── geo.ts                      # Haversine distance for candidate pre-filtering
│   ├── availability.ts             # 3-state availability derivation & freshness rules
│   ├── evaluate-facility.ts        # Orchestrates eligibility rules for a facility
│   ├── rank-facilities.ts          # Sorts by driving duration & selects nearest-excluded
│   ├── exclusion-reasons.ts        # Human-friendly clinical explanations
│   └── rules/                      # Individual Single-Responsibility eligibility checks
│       ├── eligibility-rule.ts     # Interface (Open/Closed Principle)
│       ├── operational-status.rule.ts
│       ├── facility-tier.rule.ts
│       ├── service-capability.rule.ts
│       ├── mandatory-resource.rule.ts
│       └── acceptance-status.rule.ts
├── config/
│   ├── freshness-policy.ts         # Freshness windows per urgency (1h for ER, 4h for Urgent)
│   ├── case-categories.ts          # Clinical definitions and red-flag symptoms
│   └── routing-limits.ts           # Max candidates and travel duration limits
├── application/
│   ├── ports.ts                    # Dependency Inversion ports (repositories & providers)
│   ├── recommend-facilities.ts     # Use case orchestrating Steps A-E
│   └── verify-facility-availability.ts # Pre-referral suitability check
└── infrastructure/                 # Adapters implementing ports
    ├── supabase-facility-repository.ts
    ├── supabase-requirement-profile-repository.ts
    └── supabase-recommendation-audit-log.ts
```

---

## 5. Verification & Testing

Run the automated test suite:
```bash
npm run test # or: npx vitest run
```

Tests cover:
- Three-state availability derivation (fresh, stale, unavailable, expired acceptance).
- Facility tier constraints (BHS/RHU emergency prevention).
- Specific vs generic bed counts (general bed count cannot satisfy ICU requirement).
- Complete Trauma emergency scenario matching and ranking.
- Fallback mode when Google Routes API is unreachable.
- De-identified recommendation audit logging.
