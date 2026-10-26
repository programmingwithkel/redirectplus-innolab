# CareRoute Bicol — MVP Implementation Status

> All 7 phases complete. Zero TypeScript errors. App is demo-ready.

## ✅ Phase 0 — Environment & Setup
- [x] Installed `@supabase/supabase-js` & `@supabase/ssr`
- [x] Created `.env.local` with Supabase keys
- [x] Created `lib/supabase/client.ts` (browser)
- [x] Created `lib/supabase/server.ts` (server)
- [x] Created `lib/supabase/admin.ts` (service role)
- [x] Populated `rules-design.md` design system
- [x] Created `lib/constants/facility-themes.ts`
- [x] Created `lib/constants/referral-status.ts` (state machine)

## ✅ Phase 1 — Database Schema, RLS, Seed Data
- [x] `supabase/schema.sql` — 6 tables, enums, indexes, triggers
- [x] `supabase/rls-policies.sql` — Full RLS for all tables
- [x] `supabase/seed.sql` — 5 facilities, 5 users, 4 referrals
- [x] `supabase/fix-profiles.sql` — Complete re-seed script
- [x] `supabase/fix-admin.sql` — Admin profile fix
- [x] `supabase/auto-profile-trigger.sql` — Auto-create profiles on signup
- [x] `lib/types/database.ts` — Full TypeScript types

## ✅ Phase 2 — Auth, Proxy & Role Routing
- [x] `proxy.ts` — Next.js 16 proxy (replaces middleware)
- [x] `lib/supabase/proxy.ts` — Session refresh + role routing
- [x] `lib/auth/get-user.ts` — Server auth helpers
- [x] `lib/auth/auth-context.tsx` — Client auth context
- [x] `lib/actions/auth-actions.ts` — Login/logout server actions
- [x] `app/page.tsx` — Landing page
- [x] `app/login/page.tsx` — Login with demo hints
- [x] `app/unauthorized/page.tsx` — Access denied page

## ✅ Phase 3 — Operational Dashboard (Themed)
- [x] `app/dashboard/layout.tsx` — Server layout with auth
- [x] `components/dashboard/dashboard-shell.tsx` — Client shell
- [x] `components/dashboard/sidebar.tsx` — 7-item nav, themed active state
- [x] `components/dashboard/header.tsx` — User info, sign out
- [x] `components/dashboard/facility-theme-provider.tsx` — CSS variable injection
- [x] `components/shared/stats-card.tsx` — Accent-aware stats
- [x] `components/shared/status-badge.tsx` — Status/urgency/facility badges
- [x] `components/shared/page-header.tsx` — Reusable page header
- [x] `app/dashboard/page.tsx` — Live stats + referral tables
- [x] `app/dashboard/profile/page.tsx` — User & facility info

## ✅ Phase 4 — Referral Workflow
- [x] `lib/actions/referral-actions.ts` — Create, update status, redirect, add note
- [x] `components/referrals/referral-form.tsx` — Full create form
- [x] `components/referrals/referral-actions.tsx` — Action buttons + dialogs
- [x] `app/dashboard/referrals/create/page.tsx` — Create referral
- [x] `app/dashboard/referrals/incoming/page.tsx` — Incoming list
- [x] `app/dashboard/referrals/outgoing/page.tsx` — Outgoing list
- [x] `app/dashboard/referrals/[id]/page.tsx` — Detail + timeline + actions

## ✅ Phase 5 — Facility Directory & Resources
- [x] `app/dashboard/facilities/page.tsx` — Facility cards + service badges
- [x] `lib/actions/resource-actions.ts` — Add/update/delete resources
- [x] `components/resources/resource-table.tsx` — Grouped table + inline status
- [x] `components/resources/add-resource-form.tsx` — Collapsible add form
- [x] `app/dashboard/resources/page.tsx` — Resource management

## ✅ Phase 6 — Super Admin Dashboard
- [x] `app/admin/layout.tsx` — Admin-only layout
- [x] `components/admin/admin-shell.tsx` — Dark sidebar, admin nav
- [x] `app/admin/page.tsx` — 6 stats + all referrals table
- [x] `app/admin/facilities/page.tsx` — Facility management
- [x] `app/admin/users/page.tsx` — User management
- [x] `app/admin/referrals/page.tsx` — System-wide referrals

## ✅ Phase 7 — Polish
- [x] `app/not-found.tsx` — Custom 404
- [x] `app/dashboard/loading.tsx` — Skeleton loading
- [x] `app/admin/loading.tsx` — Admin skeleton loading
- [x] SEO metadata in root layout
- [x] TypeScript: 0 errors

## Demo Accounts
| Email | Password | Role | Facility |
|---|---|---|---|
| `admin@careroute.ph` | `CareRoute2026!` | Super Admin | — |
| `bhs@careroute.ph` | `CareRoute2026!` | Operational | BHS Daraga (Green) |
| `rhu@careroute.ph` | `CareRoute2026!` | Operational | RHU Legazpi (Blue) |
| `tertiary@careroute.ph` | `CareRoute2026!` | Operational | BRTTH (Purple) |
| `bhs2@careroute.ph` | `CareRoute2026!` | Operational | BHS Camalig (Green) |

## Key Routes
| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Login form |
| `/dashboard` | Operational | Facility dashboard |
| `/dashboard/referrals/create` | Operational | Create referral |
| `/dashboard/referrals/incoming` | Operational | Incoming referrals |
| `/dashboard/referrals/outgoing` | Operational | Outgoing referrals |
| `/dashboard/referrals/[id]` | Operational | Referral detail + actions |
| `/dashboard/facilities` | Operational | Facility directory |
| `/dashboard/resources` | Operational | Resource management |
| `/dashboard/profile` | Operational | User profile |
| `/admin` | Super Admin | System overview |
| `/admin/facilities` | Super Admin | Facility management |
| `/admin/users` | Super Admin | User management |
| `/admin/referrals` | Super Admin | All referrals |

## ✅ Smart Hospital Recommendation & Routing (Clean Architecture & SOLID)
- [x] `supabase/migrations/002_smart_routing_enums.sql` — Enums for operating status, capability levels, acceptance, freshness
- [x] `supabase/migrations/003_smart_routing.sql` — Services, acceptance, requirement profiles, recommendation audit, RLS, triggers
- [x] `supabase/seed-routing-dev.sql` — Spec trauma emergency demo data + sample refresh function
- [x] `lib/routing/domain/` — Pure domain logic:
  - `types.ts` — Findings, verdicts, requirements, snapshots
  - `geo.ts` — Haversine pre-filter
  - `availability.ts` — 3-state availability & freshness derivation
  - `rules/` — Pluggable eligibility rules (OperationalStatus, FacilityTier, ServiceCapability, MandatoryResource, AcceptanceStatus)
  - `evaluate-facility.ts` — Multi-rule facility evaluator
  - `rank-facilities.ts` — Travel duration ranking & nearer-excluded detection
  - `exclusion-reasons.ts` — Clinical explanation formatting
- [x] `lib/routing/config/` — Freshness policies (stricter for ER), Case categories & red flags, Routing limits
- [x] `lib/routing/application/` — Ports and use cases:
  - `ports.ts` — Repository and provider interfaces
  - `recommend-facilities.ts` — Full Steps A-E recommendation use case
  - `verify-facility-availability.ts` — Pre-referral verification
- [x] `lib/routing/infrastructure/` — Supabase adapters:
  - `supabase-facility-repository.ts` — Facility snapshot mapper
  - `supabase-requirement-profile-repository.ts` — Profile loader with static fallback
  - `supabase-recommendation-audit-log.ts` — De-identified recommendation run logger
- [x] `lib/google-maps/` — Routes API client, matrix provider, polyline decoder, and geocoding client
- [x] `lib/validation/routing-schemas.ts` — Zod request validation
- [x] `app/api/` — Route handlers:
  - `POST /api/referrals/recommend` — Recommendation endpoint
  - `POST /api/routes` — Driving route polyline calculation
  - `GET /api/facilities/[id]/availability` — Single facility verification
  - `POST /api/geocode` — Manual location search fallback
- [x] `components/routing/` — UI components:
  - `emergency-banner.tsx` — Emergency alert and safety guidance
  - `location-picker.tsx` — GPS detection, address search fallback, quick presets
  - `patient-assessment-form.tsx` — Condition, urgency, and optional resources form
  - `availability-badge.tsx` — Confirmed / Unverified / Unavailable badge with freshness
  - `hospital-result-card.tsx` — Capabilities, ETA, match evidence, and actions
  - `hospital-recommendations.tsx` — Recommended hospital, nearer-excluded banner, alternatives
  - `hospital-map.tsx` — Interactive map with custom markers, info windows, and route polyline
- [x] `components/facilities/facility-directory-tabs.tsx` — Synchronized routing & directory tabs
- [x] `components/availability/hospital-availability-dashboard.tsx` — Live hospital operating status, shift re-confirmation, case acceptance
- [x] `tests/unit/` — Comprehensive Vitest test suite (9/9 passed)
- [x] Documentation & Setup: `docs/smart-routing-setup.md` & `.env.local.example`

## ✅ Smart Hospital Recommendation & Routing (Clean Architecture & SOLID)
- [x] `supabase/migrations/002_smart_routing_enums.sql` — Enums for operating status, capability levels, acceptance, freshness
- [x] `supabase/migrations/003_smart_routing.sql` — Services, acceptance, requirement profiles, recommendation audit, RLS, triggers
- [x] `supabase/seed-routing-dev.sql` — Spec trauma emergency demo data + sample refresh function
- [x] `lib/routing/domain/` — Pure domain logic:
  - `types.ts` — Findings, verdicts, requirements, snapshots
  - `geo.ts` — Haversine pre-filter
  - `availability.ts` — 3-state availability & freshness derivation
  - `rules/` — Pluggable eligibility rules (OperationalStatus, FacilityTier, ServiceCapability, MandatoryResource, AcceptanceStatus)
  - `evaluate-facility.ts` — Multi-rule facility evaluator
  - `rank-facilities.ts` — Travel duration ranking & nearer-excluded detection
  - `exclusion-reasons.ts` — Clinical explanation formatting
- [x] `lib/routing/config/` — Freshness policies (stricter for ER), Case categories & red flags, Routing limits
- [x] `lib/routing/application/` — Ports and use cases:
  - `ports.ts` — Repository and provider interfaces
  - `recommend-facilities.ts` — Full Steps A-E recommendation use case
  - `verify-facility-availability.ts` — Pre-referral verification
- [x] `lib/routing/infrastructure/` — Supabase adapters:
  - `supabase-facility-repository.ts` — Facility snapshot mapper
  - `supabase-requirement-profile-repository.ts` — Profile loader with static fallback
  - `supabase-recommendation-audit-log.ts` — De-identified recommendation run logger
- [x] `lib/google-maps/` — Routes API client, matrix provider, polyline decoder, and geocoding client
- [x] `lib/validation/routing-schemas.ts` — Zod request validation
- [x] `app/api/` — Route handlers:
  - `POST /api/referrals/recommend` — Recommendation endpoint
  - `POST /api/routes` — Driving route polyline calculation
  - `GET /api/facilities/[id]/availability` — Single facility verification
  - `POST /api/geocode` — Manual location search fallback
- [x] `components/routing/` — UI components:
  - `emergency-banner.tsx` — Emergency alert and safety guidance
  - `location-picker.tsx` — GPS detection, address search fallback, quick presets
  - `patient-assessment-form.tsx` — Condition, urgency, and optional resources form
  - `availability-badge.tsx` — Confirmed / Unverified / Unavailable badge with freshness
  - `hospital-result-card.tsx` — Capabilities, ETA, match evidence, and actions
  - `hospital-recommendations.tsx` — Recommended hospital, nearer-excluded banner, alternatives
  - `hospital-map.tsx` — Interactive map with custom markers, info windows, and route polyline
- [x] `components/facilities/facility-directory-tabs.tsx` — Synchronized routing & directory tabs
- [x] `components/availability/hospital-availability-dashboard.tsx` — Live hospital operating status, shift re-confirmation, case acceptance
- [x] `tests/unit/` — Comprehensive Vitest test suite (9/9 passed)
- [x] Documentation & Setup: `docs/smart-routing-setup.md` & `.env.local.example`

