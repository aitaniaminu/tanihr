# TaniHR — Product Requirements Document
**Version:** 3.2 | **Date:** March 2026 | **Owner:** Tani Nigeria Ltd | **Status:** FROZEN — Ready for Build
**Stack:** Next.js 14 + Supabase + Tailwind CSS + shadcn/ui | **Deployment:** Web + PWA (Offline-First)

---

## Table of Contents

1. [Executive Summary](#1)
2. [Problem Statement](#2)
3. [Target Users](#3)
4. [Core Modules](#4)
5. [Employee Profile — Field Registry](#5)
6. [Dropdown Reference Values](#6)
7. [Date of Retirement — Civil Service Rules](#7)
8. [Complete Database Schema](#8)
9. [Staff Discipline Module](#9)
10. [Promotion Schedule Module](#10)
11. [Location (Posting) History Module](#11)
12. [Nigerian Geo-Political Reference Data](#12)
13. [Cross-Cutting Features](#13)
14. [Offline-First Architecture](#14)
15. [Security Hardening](#15)
16. [Supabase Setup Guide](#16)
17. [Technical Architecture Summary](#17)
18. [Non-Functional Requirements](#18)
19. [Development Phases](#19)
20. [Commercialisation](#20)
21. [Known Risks & Mitigations](#21)
22. [External Review Notes](#22)

---

## 1. Executive Summary

TaniHR is a lean, powerful, and intuitive Human Resource Management System designed specifically for Nigerian organisations. It replaces bloated enterprise HRMS tools (Odoo, SAP, Zoho) with a focused, fast, mobile-ready system covering the full employee lifecycle — excluding payroll, which remains centrally managed via government systems (IPPIS).

TaniHR is built Nigeria-first: PSR-compliant, geo-data seeded, offline-capable on unreliable networks, and structured around how government and private-sector HR actually operates in Nigeria. Security is hardened end-to-end with Row Level Security, encrypted local storage, immutable audit logs, and NDPR compliance.

---

## 2. Problem Statement

- Existing HRMS tools are over-engineered and lack Nigerian-context defaults (NIN, IPPIS, GL grading, federal org structures)
- Government payroll is centrally managed — a compliant HRMS must work around this, not duplicate it
- Nigeria's internet infrastructure is unreliable — systems that require constant connectivity fail in the field
- No available system natively handles PSR retirement rules, discipline case management, promotion ladders, or posting history
- Existing tools have weak security defaults unsuitable for sensitive government HR data (NDPR compliance gaps)

---

## 3. Target Users

| Persona | Role | Primary Actions |
|---|---|---|
| HR Admin | Manages all HR data | Full CRUD on all modules |
| Line Manager | Manages team | Approve leaves, conduct appraisals, view team profiles |
| Employee | Self-service | Update profile, apply leave, submit expenses, view training |
| Recruiter | Talent acquisition | Manage job postings, pipeline, candidate evaluations |
| Executive | Read-only oversight | Dashboards, analytics, headcount reports |

---

## 4. Core Modules

### 4.1 Employee Profiles & Organisation Chart

**Purpose:** Single source of truth for all employee data, fully aligned to civil service record-keeping requirements.

**Features:**
- Complete employee record per §5 field registry (27 fields + 3 history sub-modules)
- Dynamic org chart (tree/radial view) with drill-down by department and site
- Document vault: upload/view certificates, contracts, ID cards (PDF/JPG/PNG)
- Profile completeness indicator
- Bulk import via CSV template
- Tamper-evident audit log on every profile (all changes timestamped and attributed)
- Multi-site support (Abuja, Kaduna, and any future locations)
- Retirement countdown displayed on profile (see §7)
- Full offline access — profiles cached and encrypted locally (see §14)

**Data Model:** See §8 (complete schema).

---

### 4.2 Recruitment & Applicant Tracking (ATS)

**Purpose:** End-to-end hiring pipeline from job creation to offer.

**Features:**
- Job requisition workflow: manager requests → HR approves → publishes
- Embeddable public careers page
- Kanban pipeline: Applied → Screened → Interview 1 → Interview 2 → Offer → Hired / Rejected
- Candidate profiles with CV attachment
- Interview scheduling with calendar integration
- Scorecard-based candidate evaluation per interviewer
- Offer letter generation from templates
- Auto-convert hired candidate to employee profile
- Source tracking (referral, job board, direct)
- Recruitment analytics: time-to-hire, source quality, pipeline velocity

**Data Model:**
```sql
job_postings (id, title, department_id, type, location_id, description, status, deadline)
applicants (id, job_id, full_name, email, phone, cv_url, source, current_stage, created_at)
interview_schedules (id, applicant_id, interviewer_id, date_time, type, notes)
evaluation_scorecards (id, applicant_id, evaluator_id, scores_json, recommendation, comments)
```

---

### 4.3 Leave & Attendance

**Purpose:** Transparent, rule-based leave management with real-time attendance tracking.

**Features:**
- Leave types: Annual, Sick, Maternity, Paternity, Study, Compassionate, AWOL (configurable)
- Leave accrual rules (pro-rata or flat annual allocation)
- Employee leave application with calendar picker
- Manager approval workflow (approve / reject / delegate) — works offline, syncs on reconnect
- Leave balance dashboard per employee and team
- Nigerian Federal Public Holidays pre-loaded; state-level holiday support
- Attendance: clock-in/out via web, PWA, or QR code scan — **fully offline**; device timestamp captured
- Overtime tracking
- Attendance reports per employee and department
- Biometric device integration hooks (API endpoint)
- Leave conflict detection (flag if team has >X% on leave simultaneously)

**Data Model:**
```sql
leave_types (id, name, days_allowed, accrual_type, is_paid, carry_over_limit)
leave_requests (id, employee_id, leave_type_id, start_date, end_date, days, status, reason, approver_id)
leave_balances (id, employee_id, leave_type_id, year, allocated, used, remaining)
attendance_logs (id, employee_id, clock_in, clock_out, date, source, location_coords)
public_holidays (id, date, name, scope)
```

---

### 4.4 Performance Appraisals

**Purpose:** Structured, fair, and continuous performance management.

**Features:**
- Appraisal cycles: annual, bi-annual, probation review (configurable)
- Goal setting: employee sets goals, manager approves — both fully offline
- Mid-cycle check-ins
- 360° feedback (self, manager, peer, subordinate)
- KPI-based scoring with weighted categories
- Calibration view for managers
- Final ratings: Exceptional / Meets Expectations / Needs Improvement / Unsatisfactory
- Performance Improvement Plan (PIP) for underperformers
- Historical appraisal archive per employee
- Analytics: rating distribution, high performers, at-risk employees

**Data Model:**
```sql
appraisal_cycles (id, name, type, start_date, end_date, status)
appraisal_forms (id, cycle_id, employee_id, manager_id, status, self_score, manager_score, final_score)
goals (id, appraisal_form_id, description, weight, target, achievement, score)
feedback_360 (id, appraisal_form_id, reviewer_id, relationship, responses_json, submitted_at)
```

---

### 4.5 Training & Skills

**Purpose:** Track workforce capability development and training compliance.

**Features:**
- Skills matrix per employee (skill → proficiency level → last assessed date)
- Training catalogue (internal and external)
- Enrolment and attendance tracking
- Training completion certificates
- Mandatory training compliance tracker with overdue flags
- Training calendar for upcoming sessions
- Budget tracking per department
- Learning path creation (sequenced trainings per role)
- Skills gap analysis (required vs. current per role)
- Training ROI reporting

**Data Model:**
```sql
skills (id, name, category, description)
employee_skills (id, employee_id, skill_id, proficiency_level, assessed_date, assessed_by)
training_programs (id, title, type, provider, duration_hours, cost, is_mandatory)
training_sessions (id, program_id, date, venue, max_participants, status)
training_enrolments (id, session_id, employee_id, status, attendance, certificate_url)
```

---

### 4.6 Expense Management

**Purpose:** Fast, mobile-friendly expense capture and reimbursement tracking.

**Features:**
- Expense submission: amount, category, date, description, receipt photo (mobile camera) — **fully offline**
- Categories: Travel, Accommodation, Meals, Supplies, Utilities, Training/Conference, Medical, Other
- Multi-line expense reports
- Manager approval + finance second-level approval above configurable threshold
- Status tracking: Draft → Submitted → Approved → Paid
- Mileage calculator (rate per km)
- Expense analytics per employee / department / category
- CSV/Excel export for integration with IPPIS or government payroll

**Data Model:**
```sql
expense_categories (id, name, default_limit_per_claim)
expense_claims (id, employee_id, title, submission_date, total_amount, status, approver_id)
expense_items (id, claim_id, category_id, amount, date, description, receipt_url)
```

---

## 5. Employee Profile — Field Registry

All 27 fields on the master employee record. Fields marked **Dropdown** are bound to reference tables or enums defined in §6.

| # | Field | Type | Input | Req | Notes |
|---|---|---|---|---|---|
| 1 | File Number | String | Text | Yes | Auto-generated or manual; unique per org |
| 2 | IPPIS Number | String | Text | No | Encrypted at column level |
| 3 | Surname | String | Text | Yes | |
| 4 | First Name | String | Text | Yes | |
| 5 | Middle Name | String | Text | No | |
| 6 | Date of Birth | Date | Date picker | Yes | Must be ≥ 18 years from today |
| 7 | Sex | Enum | Radio/Select | Yes | Male / Female |
| 8 | Department | FK | Dropdown | Yes | → `departments` |
| 9 | Rank | FK | Dropdown | Yes | → `ranks` |
| 10 | Salary Grade Level | FK | Dropdown | Yes | → `salary_grade_levels` |
| 11 | Type of Appointment | Enum | Dropdown | Yes | → §6.1 |
| 12 | Date of First Appointment | Date | Date picker | Yes | |
| 13 | Date of Present Appointment | Date | Date picker | Yes | ≥ Date of First Appointment |
| 14 | PFA Name | FK | Dropdown | Yes | → `pfa_list` |
| 15 | RSA Pin | String | Text | No | Encrypted at column level |
| 16 | Email | String | Email input | Yes | Unique; validated format |
| 17 | Geo-Political Zone | FK | Dropdown | Yes | → `geo_zones`; filters State list |
| 18 | State | FK | Dropdown | Yes | → `states`; filtered by Zone |
| 19 | LGA | FK | Dropdown | Yes | → `lgas`; filtered by State |
| 20 | Status | Enum | Dropdown | Yes | → §6.2 |
| 21 | Location | FK | Dropdown | Yes | → `locations` (org sites) |
| 22 | Salary Structure | FK | Dropdown | Yes | → `salary_structures` |
| 23 | Qualification | Enum | Dropdown | Yes | → §6.3 |
| 24 | Age on Entry | Integer | Calculated | Auto | year(First Appt) − year(DOB) |
| 25 | Date of Retirement | Date | Calculated | Auto | LEAST(DOB + 60 yrs, First Appt + 35 yrs); see §7 |
| 26 | Job Description | Text | Textarea | No | Role responsibilities; max 1000 chars |
| 27 | Remark | Text | Textarea | No | Free text; max 500 chars |

### Zone → State → LGA Cascade
1. Select **Geo-Political Zone** → State dropdown filters to that zone only
2. Select **State** → LGA dropdown filters to that state only
3. Selecting a State directly auto-sets its Zone

All three store FK references — never plain text.

---

## 6. Dropdown Reference Values

### 6.1 Type of Appointment
Permanent & Pensionable · Contract · Temporary · Secondment · Internship / NYSC · Consultant

### 6.2 Status
Active · On Leave · Suspended · Retired · Deceased · Resigned · Terminated · Transferred

### 6.3 Qualification
FSLC · WAEC/NECO/GCE · OND · HND · B.Sc/B.A/B.Ed/B.Eng · MBBS/BDS · PGD · M.Sc/M.A/MBA/M.Ed · Ph.D/D.Sc · Other Professional Certification

### 6.4 Salary Grade Levels
GL-01 through GL-17 (Federal Civil Service). Additional: CONHESS 01–15, CONTISS 01–15, CONMESS 01–06.

### 6.5 Salary Structures

| Code | Full Name | Applicable To |
|---|---|---|
| CONPSS | Consolidated Public Service Salary Structure | General civil servants |
| CONTISS | Consolidated Tertiary Institutions SS | University/polytechnic staff |
| CONHESS | Consolidated Health Salary Structure | Health workers |
| CONMESS | Consolidated Medical & Dental SS | Doctors & dentists |
| CONAISS | Consolidated Academic & Research Institution SS | Research institutions |
| CONRAISS | Consolidated Research & Allied Institutions SS | Research support staff |
| HAPSS | Harmonised Armed Forces & Police SS | Security forces |
| Other | Custom / State-specific | State govt orgs |

### 6.6 PFA Names (19 licensed — seeded at deployment)
ARM Pension Managers · AXA Mansard Pensions · Crusader Sterling Pensions · FCMB Pensions · Fidelity Pension Managers · First Guarantee Pension · IEI Anchor Pension Managers · Investment One Pension Managers · Leadway Pensure · NLPC Pension Fund Administrators · NPF Pensions · OAK Pensions · Pensions Alliance Ltd (PAL) · Premium Pension · Radix Pension Managers · Stanbic IBTC Pension Managers · Tangerine APT Pensions · Trustfund Pensions · Veritas Glanvills Pensions

---

## 7. Date of Retirement — Civil Service Rules

### Legal Basis
Per the **Public Service Rules (PSR)** and **Pension Reform Act 2014**, retirement is triggered by whichever occurs **first**:

| Trigger | Rule | Formula |
|---|---|---|
| Age limit | Mandatory retirement at 60 | `date_of_birth + 60 years` |
| Service limit | Maximum 35 years of service | `date_of_first_appointment + 35 years` |
| **Date of Retirement** | **Earlier of the two** | `LEAST(age_limit, service_limit)` |

### Examples

| Date of Birth | First Appointment | Age 60 | 35-yr Service | **Retires On** | Trigger |
|---|---|---|---|---|---|
| 1 Jan 1975 | 1 Jun 1995 | 1 Jan 2035 | 1 Jun 2030 | **1 Jun 2030** | Service |
| 1 Jan 1980 | 1 Mar 2010 | 1 Jan 2040 | 1 Mar 2045 | **1 Jan 2040** | Age |
| 1 Jan 1970 | 1 Jan 1990 | 1 Jan 2030 | 1 Jan 2025 | **1 Jan 2025** | Service |

### UI Behaviour
- Read-only — never manually editable
- Profile countdown: *"Retires in 4 years, 3 months"*
- HR dashboard alerts employees retiring within 12 months
- Status auto-suggests `Retired` on/after date (HR must confirm)
- Contract / Temporary / NYSC types show *"N/A — Non-pensionable"*
- Extension override: `retirement_extension_date` field activates when exec approval is granted

### Edge Cases

| Scenario | Handling |
|---|---|
| Joined at age 26+ (service limit > age limit) | Age limit always wins |
| Joined at age 18 (35 yrs = age 53) | Service limit wins |
| DOB not on record | Shows *"Pending — DOB required"* |
| Approved extension | `retirement_extension_date` override used instead |

---

## 8. Complete Database Schema

```sql
-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- posting overlap constraint
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- UUID generation
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- employee name search

-- ── REFERENCE TABLES ────────────────────────────────────────
CREATE TABLE geo_zones (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE states (
  id      SERIAL PRIMARY KEY,
  name    TEXT NOT NULL UNIQUE,
  zone_id INT REFERENCES geo_zones(id)
);

CREATE TABLE lgas (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  state_id INT REFERENCES states(id),
  UNIQUE (name, state_id)
);

CREATE TABLE departments (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  parent_id INT REFERENCES departments(id)
);

CREATE TABLE salary_grade_levels (
  id    SERIAL PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE,
  label TEXT
);

CREATE TABLE salary_structures (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE ranks (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  department_id INT REFERENCES departments(id)
);

CREATE TABLE pfa_list (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE locations (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  state_id INT REFERENCES states(id)
);

-- ── EMPLOYEES ───────────────────────────────────────────────
CREATE TABLE employees (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_number                   TEXT NOT NULL UNIQUE,
  ippis_number                  TEXT,                    -- encrypted at app layer
  surname                       TEXT NOT NULL,
  first_name                    TEXT NOT NULL,
  middle_name                   TEXT,
  date_of_birth                 DATE NOT NULL,
  sex                           TEXT CHECK (sex IN ('Male','Female')),
  department_id                 INT REFERENCES departments(id),
  rank_id                       INT REFERENCES ranks(id),
  salary_grade_level_id         INT REFERENCES salary_grade_levels(id),
  type_of_appointment           TEXT,
  date_of_first_appointment     DATE NOT NULL,
  date_of_present_appointment   DATE NOT NULL,
  pfa_id                        INT REFERENCES pfa_list(id),
  rsa_pin                       TEXT,                    -- encrypted at app layer
  email                         TEXT NOT NULL UNIQUE,
  geo_zone_id                   INT REFERENCES geo_zones(id),
  state_id                      INT REFERENCES states(id),
  lga_id                        INT REFERENCES lgas(id),
  status                        TEXT NOT NULL DEFAULT 'Active',
  location_id                   INT REFERENCES locations(id),
  salary_structure_id           INT REFERENCES salary_structures(id),
  qualification                 TEXT,
  job_description               TEXT,
  remark                        TEXT,
  manager_id                    UUID REFERENCES employees(id),
  retirement_extension_date     DATE,
  age_on_entry                  INT GENERATED ALWAYS AS (
                                  EXTRACT(YEAR FROM date_of_first_appointment)::INT -
                                  EXTRACT(YEAR FROM date_of_birth)::INT
                                ) STORED,
  retirement_by_age             DATE GENERATED ALWAYS AS (
                                  (date_of_birth + INTERVAL '60 years')::DATE
                                ) STORED,
  retirement_by_service         DATE GENERATED ALWAYS AS (
                                  (date_of_first_appointment + INTERVAL '35 years')::DATE
                                ) STORED,
  date_of_retirement            DATE GENERATED ALWAYS AS (
                                  LEAST(
                                    date_of_birth + INTERVAL '60 years',
                                    date_of_first_appointment + INTERVAL '35 years'
                                  )::DATE
                                ) STORED,
  created_at                    TIMESTAMPTZ DEFAULT now(),
  updated_at                    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE employee_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  expiry_date     DATE,
  expiry_alert_days INT DEFAULT 30,   -- days before expiry to trigger alert
  is_mandatory    BOOLEAN DEFAULT false,  -- mandatory professional licence flag
  issuing_body    TEXT,               -- e.g. 'MDCN', 'COREN', 'NBA', 'ICAN'
  licence_number  TEXT,
  verified        BOOLEAN DEFAULT false,
  verified_by     UUID REFERENCES auth.users(id),
  uploaded_at     TIMESTAMPTZ DEFAULT now()
);

-- ── DISCIPLINE ───────────────────────────────────────────────
CREATE TABLE discipline_cases (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference          TEXT NOT NULL UNIQUE,
  employee_id             UUID NOT NULL REFERENCES employees(id),
  offence_category        TEXT NOT NULL,
  offence_description     TEXT NOT NULL,
  date_of_offence         DATE NOT NULL,
  date_query_issued       DATE NOT NULL,
  date_response_received  DATE,
  query_response_summary  TEXT,
  hearing_date            DATE,
  panel_members           TEXT,
  finding                 TEXT CHECK (finding IN ('Guilty','Not Guilty','Inconclusive')),
  sanction                TEXT,
  sanction_details        TEXT,
  sanction_start_date     DATE,
  sanction_end_date       DATE,
  appeal_filed            BOOLEAN DEFAULT false,
  appeal_date             DATE,
  appeal_outcome          TEXT CHECK (appeal_outcome IN ('Upheld','Dismissed','Modified')),
  case_status             TEXT NOT NULL DEFAULT 'Open — Query Issued',
  recorded_by             UUID REFERENCES auth.users(id),
  remarks                 TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discipline_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES discipline_cases(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ── PROMOTION HISTORY ────────────────────────────────────────
CREATE TABLE promotion_history (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_reference   TEXT NOT NULL UNIQUE,
  employee_id           UUID NOT NULL REFERENCES employees(id),
  promotion_type        TEXT NOT NULL,
  from_rank_id          INT REFERENCES ranks(id),
  to_rank_id            INT REFERENCES ranks(id),
  from_grade_level_id   INT REFERENCES salary_grade_levels(id),
  to_grade_level_id     INT REFERENCES salary_grade_levels(id),
  from_salary_struct_id INT REFERENCES salary_structures(id),
  to_salary_struct_id   INT REFERENCES salary_structures(id),
  effective_date        DATE NOT NULL,
  approval_date         DATE NOT NULL,
  approving_authority   TEXT NOT NULL,
  approval_reference    TEXT,
  basis_of_promotion    TEXT NOT NULL,
  performance_score     NUMERIC(4,2),
  years_in_grade        INT,            -- computed at app layer
  promotion_letter_url  TEXT,
  remarks               TEXT,
  recorded_by           UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── POSTING HISTORY ──────────────────────────────────────────
CREATE TABLE posting_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_reference   TEXT NOT NULL UNIQUE,
  employee_id         UUID NOT NULL REFERENCES employees(id),
  posting_type        TEXT NOT NULL,
  from_location_id    INT REFERENCES locations(id),
  to_location_id      INT NOT NULL REFERENCES locations(id),
  from_department_id  INT REFERENCES departments(id),
  to_department_id    INT NOT NULL REFERENCES departments(id),
  from_rank_id        INT REFERENCES ranks(id),
  to_rank_id          INT REFERENCES ranks(id),
  effective_date      DATE NOT NULL,
  expected_end_date   DATE,
  actual_end_date     DATE,
  approving_authority TEXT NOT NULL,
  approval_reference  TEXT,
  reason_for_posting  TEXT NOT NULL,
  posting_letter_url  TEXT,
  remarks             TEXT,
  status              TEXT NOT NULL DEFAULT 'Active'
                        CHECK (status IN ('Active','Concluded','Cancelled')),
  recorded_by         UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_active_posting EXCLUDE USING gist (
    employee_id WITH =,
    daterange(effective_date, COALESCE(actual_end_date, '9999-12-31')) WITH &&
  ) WHERE (status = 'Active')
);

-- ── LEAVE ────────────────────────────────────────────────────
CREATE TABLE leave_types (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  days_allowed     INT,
  accrual_type     TEXT,
  is_paid          BOOLEAN DEFAULT true,
  carry_over_limit INT DEFAULT 0
);

CREATE TABLE leave_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID REFERENCES employees(id),
  leave_type_id INT REFERENCES leave_types(id),
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  days          INT NOT NULL,
  status        TEXT DEFAULT 'Pending',
  reason        TEXT,
  approver_id   UUID REFERENCES employees(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leave_balances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID REFERENCES employees(id),
  leave_type_id INT REFERENCES leave_types(id),
  year          INT NOT NULL,
  allocated     INT NOT NULL,
  used          INT DEFAULT 0,
  remaining     INT GENERATED ALWAYS AS (allocated - used) STORED,
  UNIQUE (employee_id, leave_type_id, year)
);

CREATE TABLE attendance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID REFERENCES employees(id),
  clock_in        TIMESTAMPTZ,
  clock_out       TIMESTAMPTZ,
  date            DATE NOT NULL,
  source          TEXT DEFAULT 'web',   -- 'web','pwa','qr','biometric','offline_queue'
  location_coords POINT
);

CREATE TABLE public_holidays (
  id    SERIAL PRIMARY KEY,
  date  DATE NOT NULL,
  name  TEXT NOT NULL,
  scope TEXT DEFAULT 'Federal'
);

-- ── APPRAISALS ───────────────────────────────────────────────
CREATE TABLE appraisal_cycles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type       TEXT,
  start_date DATE,
  end_date   DATE,
  status     TEXT DEFAULT 'Active'
);

CREATE TABLE appraisal_forms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id      UUID REFERENCES appraisal_cycles(id),
  employee_id   UUID REFERENCES employees(id),
  manager_id    UUID REFERENCES employees(id),
  status        TEXT DEFAULT 'Pending',
  self_score    NUMERIC(4,2),
  manager_score NUMERIC(4,2),
  final_score   NUMERIC(4,2),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_form_id UUID REFERENCES appraisal_forms(id),
  description       TEXT NOT NULL,
  weight            NUMERIC(5,2),
  target            TEXT,
  achievement       TEXT,
  score             NUMERIC(4,2)
);

CREATE TABLE feedback_360 (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_form_id UUID REFERENCES appraisal_forms(id),
  reviewer_id       UUID REFERENCES employees(id),
  relationship      TEXT,
  responses_json    JSONB,
  submitted_at      TIMESTAMPTZ DEFAULT now()
);

-- ── TRAINING ─────────────────────────────────────────────────
CREATE TABLE skills (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT,
  description TEXT
);

CREATE TABLE employee_skills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID REFERENCES employees(id),
  skill_id          INT REFERENCES skills(id),
  proficiency_level TEXT,
  assessed_date     DATE,
  assessed_by       UUID REFERENCES employees(id)
);

CREATE TABLE training_programs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  type           TEXT,
  provider       TEXT,
  duration_hours NUMERIC(6,2),
  cost           NUMERIC(12,2),
  is_mandatory   BOOLEAN DEFAULT false
);

CREATE TABLE training_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       UUID REFERENCES training_programs(id),
  date             DATE,
  venue            TEXT,
  max_participants INT,
  status           TEXT DEFAULT 'Scheduled'
);

CREATE TABLE training_enrolments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES training_sessions(id),
  employee_id     UUID REFERENCES employees(id),
  status          TEXT DEFAULT 'Enrolled',
  attendance      BOOLEAN,
  certificate_url TEXT
);

-- ── EXPENSES ─────────────────────────────────────────────────
CREATE TABLE expense_categories (
  id                      SERIAL PRIMARY KEY,
  name                    TEXT NOT NULL,
  default_limit_per_claim NUMERIC(12,2)
);

CREATE TABLE expense_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID REFERENCES employees(id),
  title           TEXT NOT NULL,
  submission_date DATE,
  total_amount    NUMERIC(12,2),
  status          TEXT DEFAULT 'Draft',
  approver_id     UUID REFERENCES employees(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expense_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id    UUID REFERENCES expense_claims(id) ON DELETE CASCADE,
  category_id INT REFERENCES expense_categories(id),
  amount      NUMERIC(12,2) NOT NULL,
  date        DATE NOT NULL,
  description TEXT,
  receipt_url TEXT
);

-- ── RECRUITMENT ──────────────────────────────────────────────
CREATE TABLE job_postings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  department_id INT REFERENCES departments(id),
  type          TEXT,
  location_id   INT REFERENCES locations(id),
  description   TEXT,
  status        TEXT DEFAULT 'Draft',
  deadline      DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE applicants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID REFERENCES job_postings(id),
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  cv_url        TEXT,
  source        TEXT,
  current_stage TEXT DEFAULT 'Applied',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE interview_schedules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id   UUID REFERENCES applicants(id),
  interviewer_id UUID REFERENCES employees(id),
  date_time      TIMESTAMPTZ,
  type           TEXT,
  notes          TEXT
);

CREATE TABLE evaluation_scorecards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id   UUID REFERENCES applicants(id),
  evaluator_id   UUID REFERENCES employees(id),
  scores_json    JSONB,
  recommendation TEXT,
  comments       TEXT,
  submitted_at   TIMESTAMPTZ DEFAULT now()
);

-- ── SECURITY & AUDIT ─────────────────────────────────────────
CREATE TABLE user_roles (
  user_id     UUID REFERENCES auth.users(id) PRIMARY KEY,
  role        TEXT NOT NULL DEFAULT 'employee'
                CHECK (role IN ('super_admin','hr_manager','line_manager','employee','recruiter','executive')),
  employee_id UUID REFERENCES employees(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id  UUID NOT NULL,
  operation  TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  old_data   JSONB,
  new_data   JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

CREATE TABLE auth_lockouts (
  user_id      UUID REFERENCES auth.users(id) PRIMARY KEY,
  attempts     INT DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  locked_until TIMESTAMPTZ
);

CREATE TABLE sync_processed (
  idempotency_key TEXT PRIMARY KEY,
  processed_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON sync_processed (processed_at);

CREATE TABLE data_processing_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID REFERENCES employees(id),
  version      TEXT NOT NULL,
  consented    BOOLEAN NOT NULL,
  ip_address   INET,
  consented_at TIMESTAMPTZ DEFAULT now()
);

-- ── OFFBOARDING ──────────────────────────────────────────────
CREATE TABLE offboarding_checklists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  exit_type       TEXT NOT NULL,   -- 'Retirement','Resignation','Dismissal','Transfer','Death'
  exit_date       DATE NOT NULL,
  initiated_by    UUID REFERENCES auth.users(id),
  overall_status  TEXT NOT NULL DEFAULT 'In Progress'
                    CHECK (overall_status IN ('In Progress','Cleared','Blocked')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE offboarding_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id    UUID NOT NULL REFERENCES offboarding_checklists(id) ON DELETE CASCADE,
  department      TEXT NOT NULL,   -- 'Library','ICT','Finance','Security','HR','Admin'
  item            TEXT NOT NULL,   -- e.g. 'Return staff ID card'
  cleared         BOOLEAN DEFAULT false,
  cleared_by      UUID REFERENCES auth.users(id),
  cleared_at      TIMESTAMPTZ,
  remarks         TEXT
);

-- ── BULK OPERATIONS ──────────────────────────────────────────
CREATE TABLE bulk_operations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type  TEXT NOT NULL,   -- 'BulkPromotion','BulkTransfer','BulkStatusChange'
  label           TEXT NOT NULL,   -- e.g. '2026 Annual Promotion Exercise'
  initiated_by    UUID REFERENCES auth.users(id),
  total_records   INT NOT NULL,
  processed       INT DEFAULT 0,
  failed          INT DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending','Processing','Complete','Partial','Failed')),
  payload_json    JSONB,           -- parameters (e.g. from_grade, to_grade, effective_date)
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE TABLE bulk_operation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id    UUID NOT NULL REFERENCES bulk_operations(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id),
  status          TEXT NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending','Success','Failed','Skipped')),
  error_message   TEXT,
  processed_at    TIMESTAMPTZ
);
```

---

## 9. Staff Discipline Module

### 9.1 Purpose
Complete, tamper-evident record of every disciplinary action. Compliant with **PSR Chapter 16**. Records are immutable — closed only, never deleted.

### 9.2 Fields (22)

| # | Field | Type | Input | Req | Notes |
|---|---|---|---|---|---|
| D1 | Case Reference | String | Auto | Auto | `DISC-{YEAR}-{SEQ}` |
| D2 | Employee | FK | Lookup | Yes | |
| D3 | Offence Category | Enum | Dropdown | Yes | → §9.4 |
| D4 | Offence Description | Text | Textarea | Yes | max 1000 chars |
| D5 | Date of Offence | Date | Date picker | Yes | |
| D6 | Date Query Issued | Date | Date picker | Yes | |
| D7 | Date Response Received | Date | Date picker | No | |
| D8 | Query Response Summary | Text | Textarea | No | |
| D9 | Hearing Date | Date | Date picker | No | |
| D10 | Panel Members | Text | Text/Tags | No | |
| D11 | Finding | Enum | Dropdown | Yes | Guilty / Not Guilty / Inconclusive |
| D12 | Sanction | Enum | Dropdown | No | → §9.5; required if Finding = Guilty |
| D13 | Sanction Details | Text | Textarea | No | |
| D14 | Sanction Start Date | Date | Date picker | No | |
| D15 | Sanction End Date | Date | Date picker | No | |
| D16 | Appeal Filed | Boolean | Toggle | No | Default: false |
| D17 | Appeal Date | Date | Date picker | No | |
| D18 | Appeal Outcome | Enum | Dropdown | No | Upheld / Dismissed / Modified |
| D19 | Case Status | Enum | Dropdown | Yes | → §9.6 |
| D20 | Recorded By | FK | Auto | Auto | |
| D21 | Supporting Documents | Files | Upload | No | PDF/JPG/PNG; max 10MB each |
| D22 | Remarks | Text | Textarea | No | max 500 chars |

### 9.3 Workflow
```
Query Issued → Response Received → Hearing Scheduled → Hearing Held
  → Finding Recorded → Sanction Applied → [Appeal Filed → Appeal Determined]
  → Case Closed
```

### 9.4 Offence Categories
AWOL · Insubordination · Financial Misconduct/Fraud · Gross Misconduct · Sexual Harassment · Negligence of Duty · Substance Abuse · Falsification of Records · Disclosure of Confidential Information · Theft/Misappropriation · Violence/Assault · Breach of Code of Conduct · Other (specify)

### 9.5 Sanctions
Oral Warning · Written Warning · Severe Warning · Withholding of Increment · Deferment of Promotion · Reduction in Rank · Suspension Without Pay · Compulsory Retirement · Dismissal · Interdiction (pending investigation)

### 9.6 Case Status Values
Open — Query Issued · Open — Awaiting Response · Open — Hearing Pending · Open — Under Appeal · Closed — Not Guilty · Closed — Sanction Applied · Closed — Dismissed · Withdrawn

### 9.7 Access & Audit Rules
- **HR Admin only** — never visible to the subject employee on self-service
- Timeline view of all workflow events with timestamps and actors
- Active sanctions surface as profile alerts to HR and line manager
- Passed `sanction_end_date` without closure auto-flags for HR review
- All actions audit-logged; records cannot be deleted — only closed
- **Not cached offline** — online access only (security policy)

---

## 10. Promotion Schedule Module

### 10.1 Purpose
Track every promotion event in an employee's career. Compliant with **PSR Chapter 6**.

### 10.2 Fields (19)

| # | Field | Type | Input | Req | Notes |
|---|---|---|---|---|---|
| P1 | Promotion Reference | String | Auto | Auto | `PROMO-{YEAR}-{SEQ}` |
| P2 | Employee | FK | Lookup | Yes | |
| P3 | Promotion Type | Enum | Dropdown | Yes | → §10.4 |
| P4 | From Rank | FK | Dropdown | Yes | Pre-filled from current |
| P5 | To Rank | FK | Dropdown | Yes | |
| P6 | From Grade Level | FK | Dropdown | Yes | Pre-filled from current |
| P7 | To Grade Level | FK | Dropdown | Yes | |
| P8 | From Salary Structure | FK | Dropdown | No | Pre-filled |
| P9 | To Salary Structure | FK | Dropdown | No | |
| P10 | Effective Date | Date | Date picker | Yes | |
| P11 | Approval Date | Date | Date picker | Yes | |
| P12 | Approving Authority | Text | Text | Yes | |
| P13 | Approval Reference | Text | Text | No | |
| P14 | Basis of Promotion | Enum | Dropdown | Yes | → §10.5 |
| P15 | Performance Score | Decimal | Number | No | Linked appraisal score |
| P16 | Years in Grade | Integer | Calculated | Auto | App-layer: this effective_date − previous effective_date |
| P17 | Promotion Letter | File | Upload | No | PDF; max 10MB |
| P18 | Remarks | Text | Textarea | No | max 500 chars |
| P19 | Recorded By | FK | Auto | Auto | |
| P20 | Is Acting | Boolean | Toggle | No | Default: false; marks acting/temporary appointments |
| P21 | Acting Expiry Date | Date | Date picker | No | Required if Is Acting = true; triggers alert |

### 10.3 Minimum Years in Grade (Federal Civil Service)

| Grade Band | Min Years |
|---|---|
| GL 01–06 | 2 years |
| GL 07–12 | 3 years |
| GL 13–14 | 4 years |
| GL 15–17 | Vacancy-dependent; Board approval |

### 10.4 Promotion Types
Accelerated · Regular/Scheduled · Acting Appointment Confirmed · Conversion (cadre change) · Upgrading (post reclassification)

### 10.5 Basis of Promotion
Annual Performance Appraisal · Competitive Examination · Seniority/Length of Service · Acquisition of Higher Qualification · Presidential/Gubernatorial Directive · Board Recommendation

### 10.6 UI Behaviour
- Promotion ladder timeline on employee profile
- Promotion-due alert on HR dashboard
- Approving a promotion auto-updates `employees.rank_id`, `salary_grade_level_id`, `date_of_present_appointment`
- Records read-only after saving — corrections require a superseding entry
- Acting appointments display a distinct **"Acting"** badge on the employee profile and org chart

### 10.7 Acting Capacity Logic

In the Nigerian Civil Service, an officer may hold a position "in an Acting capacity" — typically for up to 6 months — before the appointment is either confirmed or reverted. This is distinct from a substantive promotion and must be tracked separately.

**Rules:**
- `is_acting = true` marks the record as a temporary appointment, not a substantive promotion
- `acting_expiry_date` is mandatory when `is_acting = true`; defaults to 6 months from `effective_date`
- The master `employees` profile shows the acting rank/grade but flags it as **Acting**
- `employees.date_of_present_appointment` is **not updated** for acting appointments — only updated on substantive confirmation

**Alerts:**
- **30 days before** `acting_expiry_date`: HR dashboard alert — *"Acting appointment for [Name] expires in 30 days — confirm or revert"*
- **On expiry date**: alert escalates to urgent; status auto-flags as `Pending Confirmation`
- **On confirmation**: HR records a new promotion entry with `is_acting = false`; master profile updated; acting record closed
- **On reversion**: previous substantive rank/grade restored; acting record closed with `Reverted` remark

**Schema addition:**
```sql
ALTER TABLE promotion_history
  ADD COLUMN is_acting        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN acting_expiry_date DATE,
  ADD CONSTRAINT acting_expiry_required
    CHECK (is_acting = false OR acting_expiry_date IS NOT NULL);
```

---

## 11. Location (Posting) History Module

### 11.1 Purpose
Track every posting — transfer, redeployment, secondment — across an employee's career. Each posting updates the live `location_id` and `department_id` on the master profile.

### 11.2 Fields (19)

| # | Field | Type | Input | Req | Notes |
|---|---|---|---|---|---|
| L1 | Posting Reference | String | Auto | Auto | `POST-{YEAR}-{SEQ}` |
| L2 | Employee | FK | Lookup | Yes | |
| L3 | Posting Type | Enum | Dropdown | Yes | → §11.4 |
| L4 | From Location | FK | Dropdown | Yes | Pre-filled from current |
| L5 | To Location | FK | Dropdown | Yes | |
| L6 | From Department | FK | Dropdown | Yes | Pre-filled from current |
| L7 | To Department | FK | Dropdown | Yes | |
| L8 | From Rank | FK | Dropdown | No | Only if posting involves rank change |
| L9 | To Rank | FK | Dropdown | No | |
| L10 | Effective Date | Date | Date picker | Yes | |
| L11 | Expected End Date | Date | Date picker | No | Temporary postings/secondments |
| L12 | Actual End Date | Date | Date picker | No | Set when posting concludes |
| L13 | Approving Authority | Text | Text | Yes | |
| L14 | Approval Reference | Text | Text | No | |
| L15 | Reason for Posting | Enum | Dropdown | Yes | → §11.5 |
| L16 | Posting Letter | File | Upload | No | PDF; max 10MB |
| L17 | Remarks | Text | Textarea | No | max 500 chars |
| L18 | Status | Enum | Dropdown | Yes | Active / Concluded / Cancelled |
| L19 | Recorded By | FK | Auto | Auto | |

### 11.3 Master Profile Sync
When a posting is saved as `Active` with Effective Date ≤ today:
- `employees.location_id` → To Location
- `employees.department_id` → To Department
- Previous active posting → auto-set to `Concluded`; `actual_end_date` = day before new effective date

One active posting per employee enforced by DB `EXCLUDE` constraint (§8).

### 11.4 Posting Types
Transfer (Interdepartmental) · Transfer (Interministry/Cross-Agency) · Redeployment · Secondment (Internal) · Secondment (External) · Acting Posting · Field Deployment · Return from Secondment

### 11.5 Reasons for Posting
Organisational Restructuring · Staff Request · Disciplinary Action · Operational Need · Capacity Building · Medical/Humanitarian · Promotion-Induced Transfer · Security Reasons · Routine Rotation

### 11.6 UI Behaviour
- Posting timeline on employee profile with auto-calculated durations
- Current posting pinned with `Active` badge
- HR workforce view filterable by location (site headcount)
- External secondments flag `Externally Seconded` on dashboard
- Posting expiry alert when `expected_end_date` passes without `actual_end_date`

---

## 12. Nigerian Geo-Political Reference Data

All seeded at deployment. Never free text — always FK references.

| Zone | States | LGAs |
|---|---|---|
| North Central | Benue, FCT, Kogi, Kwara, Nasarawa, Niger, Plateau | 121 |
| North East | Adamawa, Bauchi, Borno, Gombe, Taraba, Yobe | 112 |
| North West | Jigawa, Kaduna, Kano, Katsina, Kebbi, Sokoto, Zamfara | 186 |
| South East | Abia, Anambra, Ebonyi, Enugu, Imo | 95 |
| South South | Akwa Ibom, Bayelsa, Cross River, Delta, Edo, Rivers | 123 |
| South West | Ekiti, Lagos, Ogun, Ondo, Osun, Oyo | 137 |
| **Total** | **37 (incl. FCT)** | **774** |

Full LGA seed data in `TaniHR_Nigeria_GeoData.md`.

---

## 13. Cross-Cutting Features

### 13.1 Dashboard & Analytics
- HR overview: headcount, new hires, turnover, open roles, on leave today, retiring within 12 months
- Active discipline cases, pending promotions, posting expiry alerts, sync queue status
- **Acting appointment expiry alerts** (30 days warning; urgent on expiry date)
- **Professional licence expiry alerts** (configurable days before expiry per document type)
- **Offboarding: blocked clearances** (employees not cleared within 30 days of exit date)
- Department and site breakdowns
- Configurable widgets per user role
- Export: PDF and Excel from every module

### 13.2 Notifications
- In-app notification centre
- Email notifications: leave approvals, appraisal deadlines, training reminders, discipline events, acting expiry, licence expiry, offboarding blocks
- PWA push notifications (optional per user)
- Offline: notifications queued and delivered on reconnect

### 13.3 Role-Based Access Control (RBAC)

| Role | Access |
|---|---|
| Super Admin | All modules, system settings, user management |
| HR Manager | All modules except system settings |
| Line Manager | Own team: leave approvals, appraisals, profiles (read), posting view |
| Employee | Own profile, leave, expenses, training — no discipline visibility |
| Recruiter | Recruitment module only |
| Executive | Read-only dashboards and reports |

### 13.4 Multi-Organisation / Multi-Site
- Organisation settings: logo, name, departments, grade levels, locations
- Supports Tani's Abuja + Kaduna setup
- Schema-per-tenant for future SaaS deployment

### 13.5 PWA Capabilities
- Offline-first (see §14 for full architecture)
- Add to home screen
- Push notifications
- Camera access: receipt capture, document upload, attendance QR scan

---

## 14. Offline-First Architecture

### 14.1 Design Philosophy
TaniHR treats offline as the **default state**, not a fallback. Every action that can be completed offline must be completeable offline. When connectivity returns, changes sync automatically with conflict resolution. This is non-negotiable for Nigerian deployments where power outages, poor 3G/4G, and ISP instability are routine.

### 14.2 Offline Capability Matrix

| Feature | Offline | Sync Strategy |
|---|---|---|
| View employee profiles | ✅ Full | Background sync on app open |
| Edit employee profile | ✅ Full | Queue → sync on reconnect |
| Clock in / Clock out | ✅ Full | Device timestamp captured immediately |
| Apply for leave | ✅ Full | Queue → sync |
| Approve/reject leave | ✅ Full | Queue → sync |
| View leave balance | ✅ Read | Cached; refreshed hourly when online |
| Submit expense claim | ✅ Full | Queue → sync; receipt stored locally |
| View org chart | ✅ Full | 24hr cache |
| Performance appraisal | ✅ Full | Queue → sync |
| Training enrolment | ✅ Queue | Queue → sync |
| Discipline cases | ❌ Online only | Security policy — not cached |
| System admin / settings | ❌ Online only | |
| Bulk CSV import | ❌ Online only | |
| Reports / PDF export | ⚠️ Partial | Uses locally cached data |

### 14.3 Offline Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Service Worker | Workbox 7 (via `next-pwa`) | Network interception, cache strategies |
| Local Database | Dexie.js (IndexedDB wrapper) | Structured encrypted offline storage |
| Sync Queue | Custom queue in IndexedDB | Ordered, idempotent mutation queue |
| Background Sync | Web Background Sync API | Auto-retry on reconnect |
| Conflict Resolution | Last-Write-Wins + field-level rules | Merge offline changes with server |
| Encryption | Web Crypto API (AES-GCM, PBKDF2) | All IndexedDB data encrypted at rest |
| Connectivity | `navigator.onLine` + server ping | Reliable online/offline detection |

### 14.4 Local IndexedDB Schema (Dexie.js)

```typescript
// All data values are AES-GCM encrypted JSON blobs

class TaniHROfflineDB extends Dexie {
  employees:        Table<{ id: string; data: string; synced_at: number; version: number }>
  sync_queue:       Table<SyncQueueItem>     // pending mutations
  attendance_queue: Table<AttendanceLog>     // offline clock-ins
  metadata_cache:   Table<CachedMetadata>    // reference data (departments, ranks, etc.)
  leave_requests:   Table<{ id: string; data: string; synced: boolean }>
  expense_claims:   Table<{ id: string; data: string; synced: boolean }>
}

interface SyncQueueItem {
  id?:              number;       // auto-increment
  operation:        'INSERT' | 'UPDATE' | 'DELETE';
  table:            string;
  record_id:        string;
  payload:          string;       // encrypted JSON
  created_at:       number;
  attempts:         number;       // max 5; then status = 'failed'
  status:           'pending' | 'processing' | 'failed';
  idempotency_key:  string;       // UUID; prevents duplicate server processing
}
```

### 14.5 Connectivity Detection

```typescript
// Dual detection: browser event + active server ping every 10 seconds
async function pingServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/ping', { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch { return false; }
}
setInterval(async () => {
  useConnectivity.getState().setOnline(await pingServer());
}, 10_000);
```

### 14.6 Sync Queue Processing

Every mutation (create/update/delete) is enqueued before any server call:

1. Write to local IndexedDB (encrypted) → immediate UI feedback
2. Add to `sync_queue` with unique `idempotency_key`
3. If online: process queue immediately; else: wait for reconnect event
4. On reconnect: process queue in `created_at` order
5. Server checks `sync_processed` table for idempotency key before applying
6. On success: delete queue item + record key in `sync_processed`
7. On failure: increment `attempts`; after 5 failures → mark `failed`, notify HR Admin

### 14.7 Conflict Resolution

| Scenario | Resolution |
|---|---|
| Employee edits profile offline; HR also edits online | Server wins on HR-controlled fields (rank, grade, dept, status); client wins on own fields (email, phone) |
| Manager approves leave offline; already approved online | Idempotency key prevents double-record; first write wins |
| Offline clock-in | Timestamp captured at device time; flagged `source = 'offline_queue'` |
| Two managers approve same leave offline | First sync wins; second triggers HR conflict notification |
| Record deleted online while edited offline | Server delete wins; queue item dropped with user warning |

**Field-level merge rules for employee profile:**
- Server wins: `rank_id`, `salary_grade_level_id`, `department_id`, `status`, `date_of_present_appointment`, `salary_structure_id`
- Client wins: `email`, `phone`, `remark`

### 14.8 Attendance Offline Flow

Clock-in/out is the most critical offline feature. Timestamp is captured at the moment of action — not at sync time:

```typescript
async function recordAttendance(employeeId: string, action: 'clock_in' | 'clock_out') {
  const entry = {
    id: uuid(),
    employee_id: employeeId,
    action,
    timestamp: Date.now(),       // captured immediately — not at sync time
    synced: false,
    encrypted_payload: await encryptField(JSON.stringify({
      employee_id: employeeId, action,
      timestamp: new Date().toISOString(),
      source: 'offline_queue',
    })),
  };
  await offlineDB.attendance_queue.add(entry);
  return { success: true, timestamp: entry.timestamp };
}
```

### 14.9 Data Freshness TTLs

| Data Type | Cache Duration | Refresh |
|---|---|---|
| Employee profiles | 24 hours | Background sync on app open |
| Reference data (departments, ranks, LGAs) | 7 days | On app open if online |
| Leave balances | 1 hour | On module open |
| Org chart | 24 hours | Background sync |
| Metadata (grades, PFAs, structures) | 30 days | On config change |
| Discipline cases | Not cached | Online only |
| Attendance logs | Session only | Not persisted |

### 14.10 Connectivity Banner (UI)

A persistent banner communicates sync state at all times:
- **Red:** Offline — *"Changes saved locally, will sync when connected (last online X mins ago)"*
- **Amber:** *"Syncing N pending changes…"*
- **Hidden:** Online, all synced

### 14.11 Secure Logout — Data Purge

On logout, all local data is destroyed before redirect:
1. Supabase `auth.signOut()` (invalidates server session)
2. Wipe all IndexedDB stores (employees, sync queue, attendance, metadata, leave, expenses)
3. Delete all service worker caches
4. Redirect to `/login`

No cached data survives a logout. On shared/public devices this prevents data leakage.

### 14.12 IndexedDB Eviction — User Warning

Browsers (especially on Android) may clear IndexedDB storage when the device runs critically low on disk space. This would destroy the sync queue, potentially losing unsynced mutations.

**Mitigations:**
- On app open, check `navigator.storage.estimate()` and warn if available quota is below 50MB:
  ```typescript
  const { quota, usage } = await navigator.storage.estimate();
  const remaining = (quota ?? 0) - (usage ?? 0);
  if (remaining < 50 * 1024 * 1024) {
    showWarning('Low device storage — sync your data now to avoid loss.');
  }
  ```
- Request persistent storage on install to prevent OS-level eviction:
  ```typescript
  if (navigator.storage?.persist) {
    const granted = await navigator.storage.persist();
    // If granted = true, browser will NOT evict this origin's storage
  }
  ```
- Display a prominent warning in the connectivity banner when unsynced queue items are present: *"You have N unsynced changes. Do not clear your browser cache."*
- On service worker install, call `self.registration.navigationPreload?.enable()` to reduce first-load risk of cache miss

### 14.13 Clock Tampering — Attendance Integrity

Since device time is captured offline for attendance, a user could manually set their phone clock to `08:00` to record a false on-time clock-in while offline.

**Detection strategy:**
1. On sync, compare `device_timestamp` against `server_received_at` (Supabase function timestamp)
2. If `|server_received_at − device_timestamp| > 15 minutes`, flag the record:
   ```sql
   ALTER TABLE attendance_logs
     ADD COLUMN device_timestamp   TIMESTAMPTZ,
     ADD COLUMN server_received_at TIMESTAMPTZ DEFAULT now(),
     ADD COLUMN time_drift_minutes INT GENERATED ALWAYS AS (
       EXTRACT(EPOCH FROM (server_received_at - device_timestamp))::INT / 60
     ) STORED,
     ADD COLUMN drift_flagged BOOLEAN GENERATED ALWAYS AS (
       ABS(EXTRACT(EPOCH FROM (server_received_at - device_timestamp))) > 900
     ) STORED;
   ```
3. HR dashboard shows all `drift_flagged = true` records in a **"Suspicious Attendance"** review queue
4. On reconnect, PWA attempts to fetch authoritative network time before processing sync:
   ```typescript
   async function getNetworkTime(): Promise<Date | null> {
     try {
       const res = await fetch('/api/time', { cache: 'no-store' });
       const { ts } = await res.json();
       return new Date(ts);
     } catch { return null; }
   }
   // If networkTime exists and differs from Date.now() by >5 minutes, warn user
   ```
5. `source = 'offline_queue'` records are visually distinguished in attendance reports — HR can filter and audit all offline clock-ins separately

---

## 15. Security Hardening

### 15.1 Threat Model

| Threat | Vector | Mitigation |
|---|---|---|
| Unauthorised data access | Weak auth, broken RBAC | RLS on every table; JWT role claims |
| Privilege escalation | Insecure API | Zod validation + rate limiting on all endpoints |
| Data exfiltration | Mass export, SQL injection | RLS; parameterised queries only |
| Session hijacking | XSS, token theft | PKCE flow; CSP headers; HttpOnly cookies |
| Offline data exposure | Unencrypted IndexedDB | AES-GCM encryption; purge on logout |
| Insider threat | Overprivileged staff | Field-level RLS; audit log; discipline records HR-only |
| Audit tampering | Mutable audit log | INSERT-only policy; no UPDATE/DELETE policy |

### 15.2 Authentication

**Flow:** PKCE (Proof Key for Code Exchange) — no implicit grant

**Settings:**
- Session expiry: 8 hours (working day)
- Refresh token rotation: enabled (each use invalidates previous)
- Concurrent sessions: max 3 devices per user
- Idle timeout: 30 minutes → re-auth required
- Email confirmation: required before first login
- Secure email change: enabled (confirms both old and new address)

**Password policy (enforced via Zod + Edge Function):**
- Minimum 10 characters; maximum 128
- Must contain: uppercase, lowercase, number, special character
- Cannot contain user's name or email prefix
- Password history: last 5 passwords rejected

**MFA:**
- **Required:** Super Admin, HR Manager (TOTP via Supabase Auth)
- **Optional:** All other roles

**Account lockout:**
- 5 failed attempts in 10 minutes → 30-minute lockout
- 10 failed attempts in 1 hour → 24-hour lockout + HR Admin email alert

### 15.3 Row Level Security (RLS)

RLS is enabled on **every table**. No data is accessible without an explicit policy. Role and employee ID are injected into every JWT via a custom Supabase Auth hook.

```sql
-- Helper functions used in all RLS policies
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'user_role';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_employee_id() RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'employee_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Key policy summary:**

| Table | Super Admin / HR Manager | Line Manager | Employee | Executive |
|---|---|---|---|---|
| employees | Full CRUD | Read own team | Read + limited update own record | Read all |
| discipline_cases | Full CRUD | No access | No access | No access |
| promotion_history | Full CRUD | Read own team | Read own | Read all |
| posting_history | Full CRUD | Read own team | Read own | Read all |
| leave_requests | Full CRUD | Approve own team | Insert + read own | Read all |
| expense_claims | Full CRUD | Approve own team | Full own | Read all |
| audit_log | Read only | No access | No access | No access |

**Discipline cases — strict isolation:**
```sql
CREATE POLICY "discipline_hr_only" ON discipline_cases
  FOR ALL USING (get_user_role() IN ('super_admin', 'hr_manager'));
-- No policy for any other role = zero access
```

**Employee self-update restriction** (prevents self-promotion):
```sql
CREATE POLICY "employee_own_update" ON employees
  FOR UPDATE USING (id = get_user_employee_id())
  WITH CHECK (
    rank_id               = (SELECT rank_id FROM employees WHERE id = get_user_employee_id()) AND
    salary_grade_level_id = (SELECT salary_grade_level_id FROM employees WHERE id = get_user_employee_id()) AND
    department_id         = (SELECT department_id FROM employees WHERE id = get_user_employee_id()) AND
    status                = (SELECT status FROM employees WHERE id = get_user_employee_id())
  );
```

### 15.4 Immutable Audit Trail

All sensitive table operations are auto-logged. The audit log has no UPDATE or DELETE policy — it is physically append-only from the application layer.

```sql
CREATE OR REPLACE FUNCTION audit_trigger_fn() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, operation, old_data, new_data, changed_by)
  VALUES (TG_TABLE_NAME, COALESCE(NEW.id::UUID, OLD.id::UUID), TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    auth.uid());
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Triggers applied to: `employees`, `discipline_cases`, `promotion_history`, `posting_history`, `leave_requests`, `expense_claims`, `appraisal_forms`, `employee_documents`.

### 15.5 API Security

- **Anon key:** used in browser/PWA; subject to RLS; safe to expose
- **Service role key:** server-side only (Edge Functions); never in frontend code or public repos
- **Input validation:** all mutations validated with Zod schemas before DB write
- **Rate limiting:** 60 requests/user/minute enforced in Edge Function middleware
- **CORS:** locked to `NEXT_PUBLIC_APP_URL` — never wildcard `*` in production

### 15.6 HTTP Security Headers

```javascript
// next.config.js — applied to all responses
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; connect-src 'self' *.supabase.co wss://*.supabase.co; frame-ancestors 'none'
```

### 15.7 Data Encryption

**At rest:** AES-256 (Supabase managed) for all database data and Storage files.

**In transit:** TLS 1.3 enforced; HSTS preload ensures no HTTP fallback.

**Column-level encryption** (applied before DB write for highest-sensitivity fields):
- Fields: `ippis_number`, `rsa_pin`, `nin` (if added)
- Algorithm: AES-256-GCM with per-value IV
- Key: `FIELD_ENCRYPTION_KEY` env var (32-byte hex; generated with `openssl rand -hex 32`)

**Offline encryption:** All IndexedDB data encrypted with Web Crypto AES-GCM. Key derived from user's session token via PBKDF2 (100,000 iterations). Data is session-bound and user-specific.

### 15.8 File Upload Security

Every upload is validated before reaching Supabase Storage:
1. MIME type check (not just file extension)
2. File size ≤ 10MB
3. Filename sanitised (strip path traversal characters)
4. Uploaded to private bucket (no public access)
5. Storage RLS restricts download to authorised roles

Allowed types: `application/pdf`, `image/jpeg`, `image/png`

### 15.9 NDPR Compliance

| Requirement | Implementation |
|---|---|
| Lawful basis | Employment contract; recorded in `data_processing_consents` |
| Data subject rights | Self-service profile view; own-data export (JSON/PDF) |
| Right to erasure | Soft-delete (`status = 'Deleted'`); full purge after statutory retention |
| Data minimisation | Only fields in §5 collected |
| Retention policy | Employee records: 6 years post-exit; discipline: 7 years |
| Breach notification | Edge Function webhook → HR Admin email within 72 hours |
| Third-party processors | Supabase + Resend; both under Data Processing Agreements |

### 15.10 Supabase Edge Function Cold Starts

Edge Functions on Supabase experience cold start latency (typically 200–800ms) after periods of inactivity. For most functions (email, validation) this is acceptable. For **time-critical triggers** like breach notifications and the `/api/time` endpoint used for attendance integrity checks, cold starts must be minimised.

**Mitigations:**
- **Keep-alive ping:** Schedule a Supabase `pg_cron` job to call critical Edge Functions every 5 minutes, keeping them warm:
  ```sql
  SELECT cron.schedule(
    'keepalive-edge-functions',
    '*/5 * * * *',
    $$SELECT net.http_get('https://<ref>.supabase.co/functions/v1/time')$$
  );
  ```
- **Upgrade plan if needed:** Supabase Pro provides faster cold start recovery vs. Free tier. Enterprise tier offers dedicated function instances.
- **Fallback for `/api/time`:** If the Edge Function is cold and `/api/time` returns slowly, the PWA falls back gracefully — it does not block the sync queue. It only flags attendance records it cannot verify.
- **Breach notification redundancy:** In addition to Edge Function webhook, configure Supabase Dashboard → Database → Webhooks as a secondary trigger on a separate delivery path.

### 15.11 Security Pre-Launch Checklist

- [ ] RLS enabled on all tables with explicit policies
- [ ] `service_role` key absent from all frontend code and git history
- [ ] `.env.local` in `.gitignore`; production secrets in Vercel environment variables
- [ ] MFA enforced for Super Admin and HR Manager
- [ ] Audit triggers deployed on all sensitive tables
- [ ] Offline IndexedDB data encrypted; purged on logout
- [ ] CORS locked to production domain
- [ ] File uploads MIME-validated and path-sanitised
- [ ] Rate limiting active on auth and API endpoints
- [ ] HSTS + CSP verified via securityheaders.com
- [ ] NDPR consent recorded at employee onboarding
- [ ] Edge Function keep-alive cron job configured for `/api/time` and breach notification
- [ ] Penetration test completed before go-live

---

## 16. Supabase Setup Guide

Execute steps **in order**. Do not skip.

### 16.1 Create Project

1. Go to supabase.com/dashboard → New Project
2. Name: `tanihr-production` | Region: `eu-west-2` (London — closest to Nigeria currently)
3. Plan: **Pro** (required for custom SMTP, daily backups, 8GB database)
4. Save your Project URL and Project Reference ID

### 16.2 CLI Setup

```bash
npm install -g supabase
supabase login
supabase init                          # in project root
supabase link --project-ref <ref>
```

### 16.3 Environment Variables

```bash
# .env.local — never commit this file
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-side only
FIELD_ENCRYPTION_KEY=<openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://tanihr.app
RESEND_API_KEY=<resend-key>
EMAIL_FROM=noreply@tanihr.app
```

### 16.4 Auth Configuration

In Dashboard → Authentication → Settings:
```
Site URL:                    https://tanihr.app
Redirect URLs:               https://tanihr.app/auth/callback
JWT expiry:                  28800  (8 hours)
Refresh token rotation:      ENABLED
Email confirmations:         ENABLED
Secure email change:         ENABLED
Phone confirmations:         DISABLED
Flow type:                   pkce
```

Custom SMTP (Dashboard → Authentication → SMTP):
```
Host: smtp.resend.com | Port: 587 | Username: resend | Password: <RESEND_API_KEY>
```

### 16.5 Database Extensions

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- posting overlap constraint
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- UUID
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- name search
```

### 16.6 Run Migration

Save as `supabase/migrations/001_core_schema.sql`, paste the complete schema from §8, then:

```bash
supabase db push
```

### 16.7 Enable RLS on All Tables

```sql
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;
```

Then apply all RLS policies from §15.3.

### 16.8 Deploy Audit Triggers

```sql
-- Deploy audit function and apply to all sensitive tables (§15.4)
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'employees','discipline_cases','promotion_history','posting_history',
    'leave_requests','expense_claims','appraisal_forms','employee_documents'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();',
      tbl, tbl
    );
  END LOOP;
END $$;
```

### 16.9 Custom JWT Hook (Role Injection)

```sql
-- Called by Supabase after every token mint
CREATE OR REPLACE FUNCTION custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE claims JSONB; user_role TEXT; emp_id UUID;
BEGIN
  SELECT role, employee_id INTO user_role, emp_id
  FROM user_roles WHERE user_id = (event->>'user_id')::UUID;
  claims := event->'claims';
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}',   to_jsonb(user_role));
    claims := jsonb_set(claims, '{employee_id}', to_jsonb(emp_id::TEXT));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"employee"');
  END IF;
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin;
```

**Enable in Dashboard → Authentication → Hooks → Custom Access Token → select `custom_access_token_hook`**

### 16.10 Storage Buckets

Create these **private** buckets (Dashboard → Storage → New Bucket, Public = OFF):

| Bucket | Purpose |
|---|---|
| `employee-documents` | Contracts, certificates, IDs |
| `discipline-docs` | Discipline case attachments (HR only) |
| `expense-receipts` | Expense claim receipts |
| `training-certs` | Training completion certificates |
| `promotion-letters` | Promotion approval letters |
| `posting-letters` | Posting approval letters |
| `cv-uploads` | Candidate CVs |

Apply storage RLS policies restricting each bucket to appropriate roles (HR only for `discipline-docs`; employee own-path for `expense-receipts`; HR for all others).

### 16.11 Seed Reference Data

```sql
-- Geo-Political Zones
INSERT INTO geo_zones (name) VALUES
  ('North Central'),('North East'),('North West'),
  ('South East'),('South South'),('South West');

-- Salary Grade Levels (GL-01 to GL-17)
INSERT INTO salary_grade_levels (code, label)
SELECT 'GL-' || lpad(n::TEXT, 2, '0'), 'Grade Level ' || n
FROM generate_series(1, 17) AS n;

-- Salary Structures
INSERT INTO salary_structures (name) VALUES
  ('CONPSS'),('CONTISS'),('CONHESS'),('CONMESS'),
  ('CONAISS'),('CONRAISS'),('HAPSS'),('Other');

-- PFA List (19 licensed PFAs)
INSERT INTO pfa_list (name) VALUES
  ('ARM Pension Managers'),('AXA Mansard Pensions'),('Crusader Sterling Pensions'),
  ('FCMB Pensions'),('Fidelity Pension Managers'),('First Guarantee Pension'),
  ('IEI Anchor Pension Managers'),('Investment One Pension Managers'),('Leadway Pensure'),
  ('NLPC Pension Fund Administrators'),('NPF Pensions'),('OAK Pensions'),
  ('Pensions Alliance Ltd (PAL)'),('Premium Pension'),('Radix Pension Managers'),
  ('Stanbic IBTC Pension Managers'),('Tangerine APT Pensions'),
  ('Trustfund Pensions'),('Veritas Glanvills Pensions');

-- Nigerian Federal Public Holidays 2026
INSERT INTO public_holidays (date, name, scope) VALUES
  ('2026-01-01','New Year''s Day','Federal'),
  ('2026-04-03','Good Friday','Federal'),
  ('2026-04-06','Easter Monday','Federal'),
  ('2026-03-31','Eid-el-Fitr','Federal'),
  ('2026-06-12','Democracy Day','Federal'),
  ('2026-06-07','Eid-el-Kabir','Federal'),
  ('2026-10-01','Independence Day','Federal'),
  ('2026-09-26','Eid-el-Maulud','Federal'),
  ('2026-12-25','Christmas Day','Federal'),
  ('2026-12-26','Boxing Day','Federal');

-- Leave Types
INSERT INTO leave_types (name, days_allowed, accrual_type, is_paid, carry_over_limit) VALUES
  ('Annual Leave',       30, 'flat', true,  10),
  ('Sick Leave',         10, 'flat', true,   0),
  ('Maternity Leave',    84, 'flat', true,   0),
  ('Paternity Leave',    10, 'flat', true,   0),
  ('Study Leave',         5, 'flat', true,   0),
  ('Compassionate Leave', 5, 'flat', true,   0),
  ('AWOL',                0, 'flat', false,  0);

-- Expense Categories
INSERT INTO expense_categories (name, default_limit_per_claim) VALUES
  ('Travel',500000),('Accommodation',150000),('Meals',15000),
  ('Supplies',50000),('Utilities',30000),('Training/Conference',200000),
  ('Medical',50000),('Other',25000);
```

States and LGAs: use `TaniHR_Nigeria_GeoData.md` to generate INSERT statements (774 LGAs across 37 states; too large to inline).

### 16.12 Enable Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_processed;
```

### 16.13 Backups

Dashboard → Project Settings → Backups:
- Daily backups: **ON** (Pro plan)
- Retention: **30 days**
- Test restore to staging project quarterly

### 16.14 First Super Admin

```sql
-- After creating user in Dashboard → Authentication → Users
INSERT INTO user_roles (user_id, role, employee_id)
VALUES ('<auth-user-uuid>', 'super_admin', NULL);
-- Link employee_id once first employee record is created
```

### 16.15 Verification Checklist

```bash
# Verify all tables exist
supabase db execute --sql \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

# Verify RLS enabled on all tables (all rows must show rowsecurity=true)
supabase db execute --sql \
  "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';"

# Verify extensions
supabase db execute --sql "SELECT extname FROM pg_extension;"
```

- [ ] 35+ tables created
- [ ] RLS enabled on all tables
- [ ] Audit triggers on all sensitive tables
- [ ] Custom JWT hook enabled in Auth settings
- [ ] 7 private storage buckets with RLS policies
- [ ] Reference data seeded (grades, PFAs, structures, leave types, holidays, expense categories)
- [ ] Realtime enabled on required tables
- [ ] Daily backups confirmed active
- [ ] First super admin user created and role assigned

---

## 17. Technical Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  Next.js 14 (App Router) + Tailwind CSS + shadcn/ui │
│  next-pwa + Workbox 7 service worker                │
│  Dexie.js (IndexedDB) — encrypted offline store     │
└──────────────────────────┬──────────────────────────┘
                           │  online: Supabase client
                           │  offline: Dexie read/write
                           │  sync queue: Dexie → Supabase on reconnect
┌──────────────────────────▼──────────────────────────┐
│                   Supabase                           │
│  PostgreSQL (RLS + audit triggers + generated cols)  │
│  Auth (PKCE, MFA, custom JWT hook)                  │
│  Storage (7 private buckets, RLS per bucket)        │
│  Realtime (leave, attendance, sync notifications)   │
│  Edge Functions (rate limiting, email, webhooks)    │
└─────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Concern | Decision | Reason |
|---|---|---|
| Auth flow | PKCE (no implicit grant) | Prevents token interception |
| Offline DB | Dexie.js + IndexedDB | Best-in-class IndexedDB wrapper; works in PWA |
| Offline encryption | Web Crypto AES-GCM + PBKDF2 | Session-bound; purged on logout |
| Idempotency | UUID key per mutation | Prevents duplicate server writes on sync retry |
| Conflict resolution | Field-level server/client rules | Protects HR-controlled fields |
| Service worker | Workbox 7 CacheFirst/StaleWhileRevalidate | Fastest possible offline app load |
| RLS | Every table, explicit policies | Zero implicit access |
| Audit log | Trigger-based, INSERT-only policy | Tamper-evident; no app-layer bypass |
| Column encryption | AES-256-GCM (app layer) | NIN/RSA Pin protected even from DB admin |
| Posting overlap | btree_gist EXCLUDE constraint | DB-level enforcement; no app-layer race |
| Forms | react-hook-form + zod | Type-safe; same schema used for API validation |
| Tables | TanStack Table v8 | Virtualised for large staff lists |
| PDF Export | react-pdf/renderer | Client-side; works offline |
| Email | Supabase Edge Function + Resend | Transactional; reliable delivery |
| Deployment | Vercel + Supabase Cloud | Zero-ops; global CDN |

---

## 18. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load cold (3G) | < 2.5s |
| Time to interactive | < 1.5s |
| Offline: app usable | Full functionality (excl. discipline, admin) |
| Offline: sync on reconnect | < 30s for queued mutations |
| Offline: storage eviction | Persistent storage requested on install; warn at < 50MB remaining |
| Attendance integrity | Clock drift > 15 min flagged; offline records visually distinguished |
| Mobile responsiveness | All screens ≥ 320px |
| Data export | CSV + PDF from every module |
| Audit trail | All create/update/delete logged with user + timestamp |
| Audit log integrity | No UPDATE or DELETE permitted on `audit_log` |
| Multi-tenancy | Schema-per-tenant |
| NDPR compliance | Data residency + consent + breach notification |
| Discipline records | Immutable — close only, never delete |
| Session security | PKCE; 8hr expiry; 30min idle timeout; 3-device limit |
| Encrypted at rest | AES-256 (DB + Storage + IndexedDB) |
| MFA | Required for Super Admin and HR Manager |

---

## 19. Development Phases

### Phase 1 — Foundation (Weeks 1–4)
- Supabase project setup per §16 (all 15 steps)
- Next.js project, auth (PKCE + MFA), RBAC, JWT hook
- Reference data seeding (geo, grades, PFAs, structures)
- Employee profiles + org chart
- Offline infrastructure: Dexie.js, service worker, sync queue, encryption
- Dashboard skeleton

### Phase 2 — Core Workflows (Weeks 5–8)
- Leave & Attendance (offline clock-in, offline approval queue)
- Posting History module
- Connectivity banner + sync status UI
- Notification system (in-app + email via Resend)

### Phase 3 — HR Management Modules (Weeks 9–12)
- Recruitment / ATS
- Promotion Schedule module (including acting capacity logic + expiry alerts)
- Staff Discipline module (online-only; strict RLS)
- Offboarding Checklist module
- Bulk Operations UI (bulk promotion, bulk transfer, bulk status change)

### Phase 4 — Performance & Development (Weeks 13–16)
- Performance Appraisals (offline self-assessment)
- Training & Skills
- Expense Management (offline claim submission + receipt capture)

### Phase 5 — Hardening & Launch (Weeks 17–20)
- Analytics & reporting (offline uses cached data)
- PDF/Excel exports across all modules
- Mobile PWA optimisation + install prompt
- Persistent storage request + IndexedDB quota warning banner
- Attendance clock-drift detection + suspicious attendance review queue
- Edge Function keep-alive cron + `/api/time` endpoint
- Document expiry notification system (licences, contracts)
- NDPR compliance audit + consent flows
- Penetration test
- UAT with Tani team (Abuja + Kaduna)

---

## 20. Commercialisation (SaaS Model)

| Plan | Price (₦/month) | Users | Storage |
|---|---|---|---|
| Starter | ₦25,000 | Up to 25 | 5 GB |
| Growth | ₦65,000 | Up to 100 | 20 GB |
| Enterprise | Custom | Unlimited | Unlimited |

**Target verticals:** Federal/state agencies, NGOs, manufacturing, hospitality, tertiary institutions, healthcare

**Differentiators for Nigerian market:**
- Offline-first — works on 2G and through power outages
- PSR-compliant out of the box (retirement rules, discipline, promotion schedules)
- All 774 LGAs and Nigerian geo-data pre-seeded
- NDPR-compliant data handling
- No payroll overlap — works alongside IPPIS, not against it
- ₦-native pricing; no FX exposure for customers

---

## 21. Known Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | IndexedDB eviction (low device storage) | Medium | High — unsynced data loss | Persistent storage API on install; quota warning at < 50MB; user-facing alert when unsynced queue is non-empty |
| R2 | Clock tampering for false attendance | Medium | Medium — attendance fraud | Device timestamp vs `server_received_at` diff; > 15-min drift auto-flags record; HR review queue for all `offline_queue` source records |
| R3 | Edge Function cold start on breach notification | Low | High — delayed NDPR alert | Keep-alive pg_cron ping every 5 minutes; secondary Dashboard webhook as fallback |
| R4 | Ghost worker records in Posting History | Low | High — audit failure | DB-level `EXCLUDE USING gist` constraint prevents overlapping active postings; HR confirmation required before back-dating |
| R5 | Sync queue build-up during extended outage | Medium | Medium — large batch sync on reconnect | Queue processes in ordered batches of 50; progress indicator shown; failed items (5+ attempts) surface to HR Admin |
| R6 | Acting appointment never confirmed or reverted | High — common in practice | Medium — grade/pay inconsistency | `acting_expiry_date` mandatory; 30-day advance alert; day-of urgent alert; status auto-flags `Pending Confirmation` |
| R7 | Professional licence expires unnoticed | Medium | High — regulatory/legal risk | `expiry_alert_days` per document type; email + in-app alert; HR dashboard widget for all expiring docs in next 90 days |
| R8 | Offboarding not completed before exit date | High — endemic in MDAs | Medium — asset recovery failure | Offboarding checklist auto-created on `status = Retired/Resigned/Dismissed`; blocked clearances surfaced on dashboard; cannot mark employee as fully exited until all items cleared |
| R9 | Bulk promotion applied to wrong batch | Low | Very High — mass data corruption | Two-step: HR previews list before applying; dry-run mode shows changes without committing; all bulk ops logged in `bulk_operations` with full payload; rollback via audit log |
| R10 | Supabase service outage | Very Low | Very High — full system unavailable | Offline-first architecture means read/write continues locally; sync resumes when Supabase recovers; display Supabase status page link in connectivity banner during outages |

---

## 22. External Review Notes

*Review received March 2026. Reviewer classified TaniHR as a "Zero-Ops, highly resilient architecture — better suited for the African market than 90% of available HRMS tools." Key findings incorporated into this PRD version.*

### 22.1 Strategic Validation

**IPPIS Positioning:** The decision to exclude payroll is confirmed as strategically correct. TaniHR positions as the *data feeder and record-keeper that IPPIS lacks at the agency/department level* — not a competitor. This avoids confrontation with Federal Government infrastructure while filling the gap agencies actually need.

**PSR-Centricity as Moat:** The reviewer confirms that building around PSR Chapters 6, 16, and retirement rules creates a competitive moat. No standard international HRMS tool (BambooHR, Workday, Zoho) natively understands *"35 years of service"* or *"Withholding of Increment"* as a formal disciplinary sanction. This is TaniHR's most defensible differentiator.

**Federal Character Compliance:** The Zone → State → LGA cascade is validated as more than a UI feature — it is a compliance requirement for Federal Character reporting in Nigeria.

### 22.2 Technical Validation

**Offline Architecture:** The reviewer describes Section 14 as *"the most sophisticated part of the PRD."* Key confirmations:
- Treating offline as the **primary state** (not a cache) solves the trust issue for shared office computers
- `idempotency_key` in the sync queue is confirmed as critical for preventing double-submitted leave requests on unreliable 3G/4G
- Capturing device timestamp at the moment of action (§14.8) — not at sync time — prevents staff from exploiting network issues to excuse late clock-ins

**Schema Decisions Validated:**
- `GENERATED ALWAYS` retirement columns (§8): described as *"a masterstroke"* — the exit date becomes a living calculation that cannot be manually tampered with
- `EXCLUDE USING gist` on `posting_history` (§8): described as *"high-level SQL"* — programmatically prevents ghost worker duplications
- Discipline module as online-only: described as *"a smart security trade-off"* — disciplinary records are the most litigious part of HR

**Security:**
- JWT role injection + RLS confirmed as *"bank-grade"* — even bypassing the UI, the database refuses to serve unauthorised data
- Trigger-based audit log confirmed as essential for Nigerian government audits — proves who changed a file number or rank and when

### 22.3 Gaps Identified by Reviewer — All Resolved in This Version

| Gap | Identified In Review | Resolved In |
|---|---|---|
| Acting capacity logic (is_acting flag, expiry, alerts) | §5A of review | §10.7, fields P20–P21, Risk R6 |
| Professional licence expiry alerts | §5B of review | `employee_documents` enhanced schema, §13.1, Risk R7 |
| Exit clearing / offboarding checklist | §5C of review | `offboarding_checklists` + `offboarding_items` tables, §13.1, Phase 3, Risk R8 |
| Bulk promotion UI | §5D of review | `bulk_operations` + `bulk_operation_items` tables, Phase 3, Risk R9 |
| IndexedDB eviction risk | §6A of review | §14.12, NFR table, Phase 5, Risk R1 |
| Clock tampering via device time | §6B of review | §14.13, `time_drift_minutes` generated column, NFR table, Phase 5, Risk R2 |
| Edge Function cold starts | §6C of review | §15.10, keep-alive cron pattern, §16 checklist, Phase 5, Risk R3 |

### 22.4 Final Verdict (v3.2)
Strategic Value: **10/10** · Technical Rigor: **10/10** · Nigerian Context: **10/10**

> *"The document is no longer just a list of features; it is a technical blueprint that anticipates failure points and bakes the solutions into the database and protocol layers."*

**PRD is frozen.** Use §16 as the Definition of Done for initial Supabase environment setup.

### 22.5 Phase 1 Implementation Gotchas

Three Postgres-specific details the engineering team must know before writing the first migration:

**1. btree_gist Extension (§8 — Posting History EXCLUDE constraint)**
The `EXCLUDE USING gist` constraint on `posting_history` requires `btree_gist` to be active. It is listed in Step 16.5 but must be confirmed present *before* the migration runs. Unlike a `UNIQUE` constraint, `btree_gist` prevents time-range *overlaps*, not just duplicate rows — this is what stops ghost worker records at the database level, with no application code required.

**2. STORED Generated Columns (§8 — Retirement Dates)**
The retirement columns are `GENERATED ALWAYS AS ... STORED`. If a user's `date_of_birth` is corrected via an audit amendment, Postgres automatically recalculates `date_of_retirement` and updates all related indices. No application code handles this. Teams accustomed to MySQL or application-layer calculations must not attempt to manually `UPDATE` these columns — Postgres will reject it.

**3. IndexedDB Encryption Key Derivation (§14 — Dexie.js)**
The AES-GCM encryption key for IndexedDB **must not be stored in `localStorage`**. It must be derived in-memory from the Supabase session token using PBKDF2 (as specified in §14.4 and §15.7). When the tab closes or the user logs out, the key vanishes with the session. Storing the key in `localStorage` would mean an attacker with physical device access could decrypt the cached HR data even after logout — defeating the entire offline security model.

**Start order for Phase 1:** Geo reference data seed → Custom JWT Hook (§16.9) → RLS policies (§15.3) → then frontend.

---

*End of TaniHR PRD v3.2 — FROZEN*
