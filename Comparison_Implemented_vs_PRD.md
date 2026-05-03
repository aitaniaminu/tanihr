# Comparison: Implemented vs PRD Requirements

Based on Section 23 (Client-Side Implementation Progress) of TaniHR_PRD_v4.md

---

## 1. Employee Profile Field Registry (§5)

| Field | PRD Specified | Implemented | Status |
|-------|--------------|-------------|--------|
| File Number | Required | ✅ | ✅ |
| IPPIS Number | Optional (encrypted) | ❌ | Not in form |
| Surname | Required | ✅ | ✅ |
| First Name | Required | ✅ | ✅ |
| Middle Name | Optional | ✅ | ✅ |
| Date of Birth | Required (18+ check) | ✅ | ✅ |
| Sex | Enum (Male/Female) | ✅ | ✅ |
| Department | FK → departments | ✅ | ✅ |
| Rank | FK → ranks | ✅ | ✅ |
| Salary Grade Level | FK → salary_grade_levels | ✅ | ✅ |
| Type of Appointment | Enum dropdown | ✅ | ✅ |
| Date of First Appointment | Required | ✅ | ✅ |
| Date of Present Appointment | Required | ✅ | ✅ |
| PFA Name | FK → pfa_list | ✅ | ✅ |
| RSA Pin | Optional | ✅ | ✅ |
| Email | Required (unique) | ⚠️ | **Made optional** |
| Geo-Political Zone | FK → geo_zones | ✅ | ✅ |
| State | FK → states (filtered) | ✅ | ✅ |
| LGA | FK → lgas (filtered) | ✅ | ✅ |
| Status | Enum | ✅ | ✅ |
| Location | FK → locations | ❌ | **Not in form** |
| Salary Structure | FK → salary_structures | ✅ | ✅ |
| Qualification | Enum | ✅ | ✅ |
| Age on Entry | Calculated | ✅ | ✅ |
| Date of Retirement | Calculated (PSR rules) | ✅ | ✅ |
| Job Description | Textarea (max 1000) | ❌ | **Not in form** |
| Remark | Textarea (max 500) | ❌ | **Not in form** |
| Avatar | Image upload (500KB) | ✅ | **Added** (not in PRD v3.2) |

**Field Implementation: 22/28 fields (79%)** + 1 bonus field (avatar)

---

## 2. Core Modules (§4)

| Module | PRD Scope | Implementation | Gap |
|--------|-----------|----------------|-----|
| **4.1 Employee Profiles & Org Chart** | Full CRUD, org chart, document vault, profile completeness, bulk import, audit log, multi-site | ✅ CRUD, ✅ profile completeness, ✅ bulk import (CSV), ❌ org chart visualization, ❌ document vault, ❌ multi-site | Major |
| **4.2 Recruitment & ATS** | Job postings, Kanban pipeline, candidate profiles, interviews, scorecards, offer letters | ❌ | Not started |
| **4.3 Leave & Attendance** | Leave types, accrual, approval workflow, balance dashboard, holidays, clock-in/out, attendance reports | ⚠️ Dashboard stub only | Not implemented |
| **4.4 Performance Appraisals** | Cycles, goals, 360° feedback, KPI scoring, ratings, PIP | ❌ | Not started |
| **4.5 Training & Skills** | Skills matrix, catalogue, enrolment, certificates, compliance tracker | ❌ | Not started |
| **4.6 Expense Management** | Submission, categories, approval workflow, receipt capture, analytics | ❌ | Not started |

**Module Implementation: ~30%** (only employee module fully functional)

---

## 3. Technical Architecture

| Requirement | PRD Spec | Implemented | Status |
|-------------|----------|-------------|--------|
| Frontend | Next.js 14 + shadcn/ui | React 18 + Vite | ⚠️ Deviation |
| Database | Supabase (PostgreSQL) | Dexie.js (IndexedDB) | ⚠️ Deviation |
| Auth | PKCE + MFA | localStorage session | ⚠️ Deviation |
| Offline sync | Full sync queue | Not needed (local-only) | ✅ By design |
| RLS | Every table | N/A (no backend) | ✅ By design |
| PWA | Offline-first with service worker | ❌ | Not implemented |

---

## 4. Deviation Summary

| Category | PRD Says | Actual | Impact |
|----------|----------|--------|--------|
| **Email** | Required | Optional | Data quality risk |
| **Location** | Required field | Missing | Incomplete employee record |
| **Job Description** | Optional field | Missing | Missing |
| **Remark** | Optional field | Missing | Missing |
| **IPPIS Number** | Encrypted column | Missing | Sensitive field not captured |
| **Org Chart** | Tree/radial view | Not implemented | Core feature missing |
| **Document Vault** | Upload certificates, IDs | Not implemented | Major feature gap |

---

## 5. What's Implemented vs What's Missing

```
✅ IMPLEMENTED (from PRD):
   ├── Employee CRUD (22 of 28 fields)
   ├── Department CRUD
   ├── Avatar upload
   ├── Zone → State → LGA cascade
   ├── Computed retirement (PSR rules)
   ├── CSV Import with validation
   ├── Search, sort, filter, pagination
   ├── 88 passing tests
   └── Responsive UI with breadcrumbs

❌ NOT IMPLEMENTED:
   ├── IPPIS Number (sensitive field)
   ├── Location field
   ├── Job Description field
   ├── Remark field
   ├── Org Chart visualization
   ├── Document Vault (certificates, IDs)
   ├── Leave & Attendance (entire module)
   ├── Recruitment/ATS (entire module)
   ├── Performance Appraisals (entire module)
   ├── Training & Skills (entire module)
   ├── Expense Management (entire module)
   ├── Discipline Module (entire module)
   ├── Promotion History (entire module)
   ├── Posting History (entire module)
   ├── Multi-site support
   ├── Offline sync queue
   ├── Supabase backend
   ├── PWA capabilities
   └── PKCE/MFA authentication
```

---

## 6. Summary

| Metric | Value |
|--------|-------|
| Fields implemented | 22/28 (79%) + 1 bonus |
| Modules fully implemented | 2/6 (33%) - Employees, Departments |
| Modules partially implemented | 1/6 - Leave (stub) |
| Modules not started | 3/6 - Recruitment, Appraisals, Training, Expenses |
| Core PRD features missing | Org chart, Document vault, Location field |
| Technical stack | Deviated (Vite/React vs Next.js/Supabase) |

**The client is a functioning MVP for employee and department management only.** The remaining ~70% of PRD features (recruitment, leave, appraisals, training, expenses, discipline, promotions, posting, offline sync) remain unimplemented.