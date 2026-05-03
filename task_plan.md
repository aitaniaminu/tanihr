# Task Plan: TaniHR Implementation Gap Closure

## Goal
Create a phased implementation plan to close the gaps between the current client-side MVP (React/Vite/IndexedDB) and the full PRD requirements (Next.js/Supabase/PWA).

## Current Phase
Planning Phase

## Phases

### Phase 1: Critical Data & Field Fixes
<!-- Immediate fixes to ensure data integrity and PRD compliance -->
- [ ] Add Location field to Employee Form
- [ ] Add Job Description field to Employee Form
- [ ] Add Remark field to Employee Form
- [ ] Add IPPIS Number field (encrypted storage)
- [ ] Make Email field required (as per PRD)
- [ ] Update Employee schema and IndexedDB
- **Status:** pending

### Phase 2: Employee Module Completeness
<!-- Complete the core employee module features -->
- [x] Implement Org Chart visualization (tree/radial view)
- [x] Implement Document Vault (upload certificates, IDs)
- [x] Add profile completeness indicator
- [x] Add retirement countdown display
- [x] Add audit trail on profile changes
- [x] Implement multi-site support
- **Status:** complete

### Phase 3: Backend Migration Preparation
<!-- Prepare for migration to Next.js + Supabase -->
- [x] Audit current React components for Next.js compatibility
- [x] Create Supabase schema migration scripts
- [x] Plan IndexedDB → Supabase sync strategy
- [x] Design PKCE + MFA auth flow
- [x] Document RLS policies needed
- **Status:** complete

### Phase 4: Leave & Attendance Module
<!-- Implement full leave and attendance system -->
- [ ] Create leave_types table and seed data
- [ ] Build leave request form with calendar picker
- [ ] Implement manager approval workflow
- [ ] Add leave balance dashboard
- [ ] Seed Nigerian federal holidays
- [ ] Implement clock-in/out functionality
- [ ] Add attendance reports
- [ ] Enable offline leave submission
- **Status:** pending

### Phase 5: HR Management Modules
<!-- Implement recruitment, discipline, promotion, posting -->
- [ ] Recruitment/ATS (job postings, Kanban pipeline, candidates)
- [ ] Discipline Module (PSLR-compliant case management)
- [ ] Promotion History (with acting capacity logic)
- [ ] Posting/Transfer History (with EXCLUDE constraint)
- [ ] Offboarding Checklists
- **Status:** pending

### Phase 6: Performance, Training & Expenses
<!-- Implement remaining core modules -->
- [ ] Performance Appraisals (cycles, goals, 360° feedback)
- [ ] Training & Skills (catalogue, enrolment, compliance)
- [ ] Expense Management (submission, approval, receipt capture)
- **Status:** pending

### Phase 7: PWA & Offline Capabilities
<!-- Add offline-first capabilities -->
- [ ] Convert to Next.js with PWA support (next-pwa)
- [ ] Implement service worker with Workbox
- [ ] Build sync queue for offline mutations
- [ ] Add IndexedDB encryption (Web Crypto AES-GCM)
- [ ] Implement connectivity banner
- [ ] Add clock tamper detection
- **Status:** pending

### Phase 8: Security Hardening
<!-- Implement PRD security requirements -->
- [ ] Implement PKCE authentication
- [ ] Enable MFA for HR Admin/Super Admin
- [ ] Configure RLS on all Supabase tables
- [ ] Set up audit triggers
- [ ] Implement column-level encryption (IPPIS, RSA Pin)
- [ ] Configure file upload security
- [ ] NDPR compliance verification
- **Status:** pending

## Key Questions

1. Should Phase 1 (critical fixes) be done on current Vite/React stack, or wait for Next.js migration?
2. What is the priority order - close field gaps first or implement new modules?
3. Should the migration to Next.js happen before or after completing Phase 1-2?
4. How should the Org Chart be implemented - use a library (react-d3-tree) or custom?

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Phase 1 fixes on current stack | Critical data integrity issue - fix before any new features |
| Org Chart with library | Faster development than building from scratch; react-d3-tree is well-maintained |
| Migrate to Next.js after Phase 2 | Complete client-side features first, then migrate to production-ready stack |
| Use Supabase for backend | As specified in PRD - provides Auth, Database, Storage, Realtime |

## Notes

- Current: React 18 + Vite + Tailwind + Dexie.js
- Target: Next.js 14 + Supabase + Tailwind + shadcn/ui + PWA
- Test coverage: 88 tests (100% passing) - maintain during migration
- Phase 1 fixes are critical for data quality and PRD compliance