# TaniHR — Product Requirements Document

**Version:** 4.0 | **Date:** May 2026 | **Owner:** Tani Nigeria Ltd | **Status:** Phase 1 Client Complete — Backend Pending **Full-Stack Target:** Next.js 14 + Supabase + Tailwind CSS + shadcn/ui | **Deployment:** Web + PWA (Offline-First) **Client Current:** React 18 + Vite + Tailwind CSS + Dexie.js (IndexedDB) — Client-only MVP


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

23. [Client-Side Implementation Progress](#23)


## 1. Executive Summary

TaniHR is a lean, powerful, and intuitive Human Resource Management System designed specifically for Nigerian organisations. It replaces bloated enterprise HRMS tools (Odoo, SAP, Zoho) with a focused, fast, mobile-ready system covering the full employee lifecycle — excluding payroll, which remains centrally managed via government systems (IPPIS).

TaniHR is built Nigeria-first: PSR-compliant, geo-data seeded, offline-capable on unreliable networks, and structured around how government and private-sector HR actually operates in Nigeria. Security is hardened end-to-end with Row Level Security, encrypted local storage, immutable audit logs, and NDPR compliance.


## 2. Problem Statement

- Existing HRMS tools are over-engineered and lack Nigerian-context defaults (NIN, IPPIS, GL grading, federal org structures)

- Government payroll is centrally managed — a compliant HRMS must work around this, not duplicate it

- Nigeria's internet infrastructure is unreliable — systems that require constant connectivity fail in the field

- No available system natively handles PSR retirement rules, discipline case management, promotion ladders, or posting history

- Existing tools have weak security defaults unsuitable for sensitive government HR data (NDPR compliance gaps)


## 3. Target Users

| Persona | Role | Primary Actions |
| - | - | - |
| HR Admin | Manages all HR data | Full CRUD on all modules |
| Line Manager | Manages team | Approve leaves, conduct appraisals, view team profiles |
| Employee | Self-service | Update profile, apply leave, submit expenses, view training |
| Recruiter | Talent acquisition | Manage job postings, pipeline, candidate evaluations |
| Executive | Read-only oversight | Dashboards, analytics, headcount reports |



## 4. Core Modules

### 4.1 Employee Profiles & Organisation Chart

**Purpose:** Single source of truth for all employee data, fully aligned to civil service record-keeping requirements.

**Features:**

- Complete employee record per §5 field registry (30 fields + 3 history sub-modules)

- Dynamic org chart (tree/radial view) with drill-down by department and site

- Document vault: upload/view certificates, contracts, ID cards (PDF/JPG/PNG)

- Profile completeness indicator

- Bulk import via CSV template

- Tamper-evident audit log on every profile (all changes timestamped and attributed)

- Multi-site support (Abuja, Kaduna, and any future locations)

- Retirement countdown displayed on profile (see §7)

- Full offline access — profiles cached and encrypted locally (see §14)

**Data Model:** See §8 (complete schema).


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

```
job\_postings (id, title, department\_id, type, location\_id, description, status, deadline)  
applicants (id, job\_id, full\_name, email, phone, cv\_url, source, current\_stage, created\_at)  
interview\_schedules (id, applicant\_id, interviewer\_id, date\_time, type, notes)  
evaluation\_scorecards (id, applicant\_id, evaluator\_id, scores\_json, recommendation, comments)
```


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

- Leave conflict detection (flag if team has \>X% on leave simultaneously)

**Data Model:**

```
leave\_types (id, name, days\_allowed, accrual\_type, is\_paid, carry\_over\_limit)  
leave\_requests (id, employee\_id, leave\_type\_id, start\_date, end\_date, days, status, reason, approver\_id)  
leave\_balances (id, employee\_id, leave\_type\_id, year, allocated, used, remaining)  
attendance\_logs (id, employee\_id, clock\_in, clock\_out, date, source, location\_coords)  
public\_holidays (id, date, name, scope)
```


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

```
appraisal\_cycles (id, name, type, start\_date, end\_date, status)  
appraisal\_forms (id, cycle\_id, employee\_id, manager\_id, status, self\_score, manager\_score, final\_score)  
goals (id, appraisal\_form\_id, description, weight, target, achievement, score)  
feedback\_360 (id, appraisal\_form\_id, reviewer\_id, relationship, responses\_json, submitted\_at)
```


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

```
skills (id, name, category, description)  
employee\_skills (id, employee\_id, skill\_id, proficiency\_level, assessed\_date, assessed\_by)  
training\_programs (id, title, type, provider, duration\_hours, cost, is\_mandatory)  
training\_sessions (id, program\_id, date, venue, max\_participants, status)  
training\_enrolments (id, session\_id, employee\_id, status, attendance, certificate\_url)
```


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

```
expense\_categories (id, name, default\_limit\_per\_claim)  
expense\_claims (id, employee\_id, title, submission\_date, total\_amount, status, approver\_id)  
expense\_items (id, claim\_id, category\_id, amount, date, description, receipt\_url)
```


## 5. Employee Profile — Field Registry

All 28 fields on the master employee record. Fields marked **Dropdown** are bound to reference tables or enums defined in §6.

| \# | Field | Type | Input | Req | Notes |
| - | - | - | - | - | - |
| 1 | File Number | String | Text | Yes | Auto-generated or manual; unique per org |
| 2 | IPPIS Number | String | Text | No | Encrypted at column level |
| 3 | Surname | String | Text | Yes |  |
| 4 | First Name | String | Text | Yes |  |
| 5 | Middle Name | String | Text | No |  |
| 6 | Date of Birth | Date | Date picker | Yes | Must be ≥ 18 years from today |
| 7 | Sex | Enum | Radio/Select | Yes | Male / Female |
| 8 | Department | FK | Dropdown | Yes | → `departments` |
| 9 | Rank | FK | Dropdown | Yes | → `ranks` |
| 10 | Salary Grade Level | FK | Dropdown | Yes | → `salary\_grade\_levels` |
| 11 | Type of Appointment | Enum | Dropdown | Yes | → §6.1 |
| 12 | Date of First Appointment | Date | Date picker | Yes |  |
| 13 | Date of Present Appointment | Date | Date picker | Yes | ≥ Date of First Appointment |
| 14 | PFA Name | FK | Dropdown | Yes | → `pfa\_list` |
| 15 | RSA Pin | String | Text | No | Encrypted at column level; NO validation enforced |
| 16 | Email | String | Email input | Yes | Unique; validated format |
| 17 | Geo-Political Zone | FK | Dropdown | Yes | → `geo\_zones`; filters State list |
| 18 | State | FK | Dropdown | Yes | → `states`; filtered by Zone |
| 19 | LGA | FK | Dropdown | Yes | → `lgas`; filtered by State |
| 20 | Status | Enum | Dropdown | Yes | → §6.2 |
| 21 | Location | FK | Dropdown | Yes | → `locations` (org sites) |
| 22 | Salary Structure | FK | Dropdown | Yes | → `salary\_structures` |
| 23 | Qualification | Enum | Dropdown | Yes | → §6.3 |
| 24 | Age on Entry | Integer | Calculated | Auto | year(First Appt) − year(DOB) |
| 25 | Date of Retirement | Date | Calculated | Auto | LEAST(DOB + 60 yrs, First Appt + 35 yrs); see §7 |
| 26 | Job Description | Text | Textarea | No | Role responsibilities; max 1000 chars |
| 27 | Remark | Text | Textarea | No | Free text; max 500 chars |
| 28 | Avatar | Image | File upload | No | JPG/PNG/GIF, max 500KB; stored as base64; shown in profile header, list view, and detail page |


### Zone → State → LGA Cascade

1. Select **Geo-Political Zone** → State dropdown filters to that zone only

2. Select **State** → LGA dropdown filters to that state only

3. Selecting a State directly auto-sets its Zone

All three store FK references — never plain text.


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
| - | - | - |
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


## 7. Date of Retirement — Civil Service Rules

### Legal Basis

Per the **Public Service Rules (PSR)** and **Pension Reform Act 2014**, retirement is triggered by whichever occurs **first**:

| Trigger | Rule | Formula |
| - | - | - |
| Age limit | Mandatory retirement at 60 | `date\_of\_birth + 60 years` |
| Service limit | Maximum 35 years of service | `date\_of\_first\_appointment + 35 years` |
| **Date of Retirement** | **Earlier of the two** | `LEAST(age\_limit, service\_limit)` |


### Examples

| Date of Birth | First Appointment | Age 60 | 35-yr Service | **Retires On** | Trigger |
| - | - | - | - | :-: | - |
| 1 Jan 1975 | 1 Jun 1995 | 1 Jan 2035 | 1 Jun 2030 | **1 Jun 2030** | Service |
| 1 Jan 1980 | 1 Mar 2010 | 1 Jan 2040 | 1 Mar 2045 | **1 Jan 2040** | Age |
| 1 Jan 1970 | 1 Jan 1990 | 1 Jan 2030 | 1 Jan 2025 | **1 Jan 2025** | Service |


### UI Behaviour

- Read-only — never manually editable

- Profile countdown: *"Retires in 4 years, 3 months"*

- HR dashboard alerts employees retiring within 12 months

- Status auto-suggests `Retired` on/after date (HR must confirm)

- Contract / Temporary / NYSC types show *"N/A — Non-pensionable"*

- Extension override: `retirement\_extension\_date` field activates when exec approval is granted

### Edge Cases

| Scenario | Handling |
| - | - |
| Joined at age 26+ (service limit \> age limit) | Age limit always wins |
| Joined at age 18 (35 yrs = age 53) | Service limit wins |
| DOB not on record | Shows *"Pending — DOB required"* |
| Approved extension | `retirement\_extension\_date` override used instead |



## 8. Complete Database Schema

```
-- ── EXTENSIONS ──────────────────────────────────────────────  
CREATE EXTENSION IF NOT EXISTS btree\_gist;   -- posting overlap constraint  
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- UUID generation  
CREATE EXTENSION IF NOT EXISTS pg\_trgm;      -- employee name search  
  
-- ── REFERENCE TABLES ────────────────────────────────────────  
CREATE TABLE geo\_zones (  
  id   SERIAL PRIMARY KEY,  
  name TEXT NOT NULL UNIQUE  
);  
  
CREATE TABLE states (  
  id      SERIAL PRIMARY KEY,  
  name    TEXT NOT NULL UNIQUE,  
  zone\_id INT REFERENCES geo\_zones(id)  
);  
  
CREATE TABLE lgas (  
  id       SERIAL PRIMARY KEY,  
  name     TEXT NOT NULL,  
  state\_id INT REFERENCES states(id),  
  UNIQUE (name, state\_id)  
);  
  
CREATE TABLE departments (  
  id        SERIAL PRIMARY KEY,  
  name      TEXT NOT NULL,  
  parent\_id INT REFERENCES departments(id)  
);  
  
CREATE TABLE salary\_grade\_levels (  
  id    SERIAL PRIMARY KEY,  
  code  TEXT NOT NULL UNIQUE,  
  label TEXT  
);  
  
CREATE TABLE salary\_structures (  
  id   SERIAL PRIMARY KEY,  
  name TEXT NOT NULL UNIQUE  
);  
  
CREATE TABLE ranks (  
  id            SERIAL PRIMARY KEY,  
  name          TEXT NOT NULL,  
  department\_id INT REFERENCES departments(id)  
);  
  
CREATE TABLE pfa\_list (  
  id   SERIAL PRIMARY KEY,  
  name TEXT NOT NULL UNIQUE  
);  
  
CREATE TABLE locations (  
  id       SERIAL PRIMARY KEY,  
  name     TEXT NOT NULL,  
  state\_id INT REFERENCES states(id)  
);  
  
-- ── EMPLOYEES ───────────────────────────────────────────────  
CREATE TABLE employees (  
  id                            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  file\_number                   TEXT NOT NULL UNIQUE,  
  ippis\_number                  TEXT,                    -- encrypted at app layer  
  surname                       TEXT NOT NULL,  
  first\_name                    TEXT NOT NULL,  
  middle\_name                   TEXT,  
  date\_of\_birth                 DATE NOT NULL,  
  sex                           TEXT CHECK (sex IN ('Male','Female')),  
  department\_id                 INT REFERENCES departments(id),  
  rank\_id                       INT REFERENCES ranks(id),  
  salary\_grade\_level\_id         INT REFERENCES salary\_grade\_levels(id),  
  type\_of\_appointment           TEXT,  
  date\_of\_first\_appointment     DATE NOT NULL,  
  date\_of\_present\_appointment   DATE NOT NULL,  
  pfa\_id                        INT REFERENCES pfa\_list(id),  
  rsa\_pin                       TEXT,                    -- encrypted at app layer  
  email                         TEXT NOT NULL UNIQUE,  
  geo\_zone\_id                   INT REFERENCES geo\_zones(id),  
  state\_id                      INT REFERENCES states(id),  
  lga\_id                        INT REFERENCES lgas(id),  
  status                        TEXT NOT NULL DEFAULT 'Active',  
  location\_id                   INT REFERENCES locations(id),  
  salary\_structure\_id           INT REFERENCES salary\_structures(id),  
  qualification                 TEXT,  
  job\_description               TEXT,  
  remark                        TEXT,  
  manager\_id                    UUID REFERENCES employees(id),  
  retirement\_extension\_date     DATE,  
  age\_on\_entry                  INT GENERATED ALWAYS AS (  
                                  EXTRACT(YEAR FROM date\_of\_first\_appointment)::INT -  
                                  EXTRACT(YEAR FROM date\_of\_birth)::INT  
                                ) STORED,  
  retirement\_by\_age             DATE GENERATED ALWAYS AS (  
                                  (date\_of\_birth + INTERVAL '60 years')::DATE  
                                ) STORED,  
  retirement\_by\_service         DATE GENERATED ALWAYS AS (  
                                  (date\_of\_first\_appointment + INTERVAL '35 years')::DATE  
                                ) STORED,  
  date\_of\_retirement            DATE GENERATED ALWAYS AS (  
                                  LEAST(  
                                    date\_of\_birth + INTERVAL '60 years',  
                                    date\_of\_first\_appointment + INTERVAL '35 years'  
                                  )::DATE  
                                ) STORED,  
  created\_at                    TIMESTAMPTZ DEFAULT now(),  
  updated\_at                    TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE employee\_documents (  
  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  employee\_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,  
  type            TEXT NOT NULL,  
  file\_url        TEXT NOT NULL,  
  expiry\_date     DATE,  
  expiry\_alert\_days INT DEFAULT 30,   -- days before expiry to trigger alert  
  is\_mandatory    BOOLEAN DEFAULT false,  -- mandatory professional licence flag  
  issuing\_body    TEXT,               -- e.g. 'MDCN', 'COREN', 'NBA', 'ICAN'  
  licence\_number  TEXT,  
  verified        BOOLEAN DEFAULT false,  
  verified\_by     UUID REFERENCES auth.users(id),  
  uploaded\_at     TIMESTAMPTZ DEFAULT now()  
);  
  
-- ── DISCIPLINE ───────────────────────────────────────────────  
CREATE TABLE discipline\_cases (  
  id                      UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  case\_reference          TEXT NOT NULL UNIQUE,  
  employee\_id             UUID NOT NULL REFERENCES employees(id),  
  offence\_category        TEXT NOT NULL,  
  offence\_description     TEXT NOT NULL,  
  date\_of\_offence         DATE NOT NULL,  
  date\_query\_issued       DATE NOT NULL,  
  date\_response\_received  DATE,  
  query\_response\_summary  TEXT,  
  hearing\_date            DATE,  
  panel\_members           TEXT,  
  finding                 TEXT CHECK (finding IN ('Guilty','Not Guilty','Inconclusive')),  
  sanction                TEXT,  
  sanction\_details        TEXT,  
  sanction\_start\_date     DATE,  
  sanction\_end\_date       DATE,  
  appeal\_filed            BOOLEAN DEFAULT false,  
  appeal\_date             DATE,  
  appeal\_outcome          TEXT CHECK (appeal\_outcome IN ('Upheld','Dismissed','Modified')),  
  case\_status             TEXT NOT NULL DEFAULT 'Open — Query Issued',  
  recorded\_by             UUID REFERENCES auth.users(id),  
  remarks                 TEXT,  
  created\_at              TIMESTAMPTZ DEFAULT now(),  
  updated\_at              TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE discipline\_documents (  
  id          UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  case\_id     UUID NOT NULL REFERENCES discipline\_cases(id) ON DELETE CASCADE,  
  file\_name   TEXT NOT NULL,  
  file\_url    TEXT NOT NULL,  
  uploaded\_by UUID REFERENCES auth.users(id),  
  uploaded\_at TIMESTAMPTZ DEFAULT now()  
);  
  
-- ── PROMOTION HISTORY ────────────────────────────────────────  
CREATE TABLE promotion\_history (  
  id                    UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  promotion\_reference   TEXT NOT NULL UNIQUE,  
  employee\_id           UUID NOT NULL REFERENCES employees(id),  
  promotion\_type        TEXT NOT NULL,  
  from\_rank\_id          INT REFERENCES ranks(id),  
  to\_rank\_id            INT REFERENCES ranks(id),  
  from\_grade\_level\_id   INT REFERENCES salary\_grade\_levels(id),  
  to\_grade\_level\_id     INT REFERENCES salary\_grade\_levels(id),  
  from\_salary\_struct\_id INT REFERENCES salary\_structures(id),  
  to\_salary\_struct\_id   INT REFERENCES salary\_structures(id),  
  effective\_date        DATE NOT NULL,  
  approval\_date         DATE NOT NULL,  
  approving\_authority   TEXT NOT NULL,  
  approval\_reference    TEXT,  
  basis\_of\_promotion    TEXT NOT NULL,  
  performance\_score     NUMERIC(4,2),  
  years\_in\_grade        INT,            -- computed at app layer  
  promotion\_letter\_url  TEXT,  
  remarks               TEXT,  
  recorded\_by           UUID REFERENCES auth.users(id),  
  created\_at            TIMESTAMPTZ DEFAULT now()  
);  
  
-- ── POSTING HISTORY ──────────────────────────────────────────  
CREATE TABLE posting\_history (  
  id                  UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  posting\_reference   TEXT NOT NULL UNIQUE,  
  employee\_id         UUID NOT NULL REFERENCES employees(id),  
  posting\_type        TEXT NOT NULL,  
  from\_location\_id    INT REFERENCES locations(id),  
  to\_location\_id      INT NOT NULL REFERENCES locations(id),  
  from\_department\_id  INT REFERENCES departments(id),  
  to\_department\_id    INT NOT NULL REFERENCES departments(id),  
  from\_rank\_id        INT REFERENCES ranks(id),  
  to\_rank\_id          INT REFERENCES ranks(id),  
  effective\_date      DATE NOT NULL,  
  expected\_end\_date   DATE,  
  actual\_end\_date     DATE,  
  approving\_authority TEXT NOT NULL,  
  approval\_reference  TEXT,  
  reason\_for\_posting  TEXT NOT NULL,  
  posting\_letter\_url  TEXT,  
  remarks             TEXT,  
  status              TEXT NOT NULL DEFAULT 'Active'  
                        CHECK (status IN ('Active','Concluded','Cancelled')),  
  recorded\_by         UUID REFERENCES auth.users(id),  
  created\_at          TIMESTAMPTZ DEFAULT now(),  
  updated\_at          TIMESTAMPTZ DEFAULT now(),  
  CONSTRAINT one\_active\_posting EXCLUDE USING gist (  
    employee\_id WITH =,  
    daterange(effective\_date, COALESCE(actual\_end\_date, '9999-12-31')) WITH &&  
  ) WHERE (status = 'Active')  
);  
  
-- ── LEAVE ────────────────────────────────────────────────────  
CREATE TABLE leave\_types (  
  id               SERIAL PRIMARY KEY,  
  name             TEXT NOT NULL,  
  days\_allowed     INT,  
  accrual\_type     TEXT,  
  is\_paid          BOOLEAN DEFAULT true,  
  carry\_over\_limit INT DEFAULT 0  
);  
  
CREATE TABLE leave\_requests (  
  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  employee\_id   UUID REFERENCES employees(id),  
  leave\_type\_id INT REFERENCES leave\_types(id),  
  start\_date    DATE NOT NULL,  
  end\_date      DATE NOT NULL,  
  days          INT NOT NULL,  
  status        TEXT DEFAULT 'Pending',  
  reason        TEXT,  
  approver\_id   UUID REFERENCES employees(id),  
  created\_at    TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE leave\_balances (  
  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  employee\_id   UUID REFERENCES employees(id),  
  leave\_type\_id INT REFERENCES leave\_types(id),  
  year          INT NOT NULL,  
  allocated     INT NOT NULL,  
  used          INT DEFAULT 0,  
  remaining     INT GENERATED ALWAYS AS (allocated - used) STORED,  
  UNIQUE (employee\_id, leave\_type\_id, year)  
);  
  
CREATE TABLE attendance\_logs (  
  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  employee\_id     UUID REFERENCES employees(id),  
  clock\_in        TIMESTAMPTZ,  
  clock\_out       TIMESTAMPTZ,  
  date            DATE NOT NULL,  
  source          TEXT DEFAULT 'web',   -- 'web','pwa','qr','biometric','offline\_queue'  
  location\_coords POINT  
);  
  
CREATE TABLE public\_holidays (  
  id    SERIAL PRIMARY KEY,  
  date  DATE NOT NULL,  
  name  TEXT NOT NULL,  
  scope TEXT DEFAULT 'Federal'  
);  
  
-- ── APPRAISALS ───────────────────────────────────────────────  
CREATE TABLE appraisal\_cycles (  
  id         UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  name       TEXT NOT NULL,  
  type       TEXT,  
  start\_date DATE,  
  end\_date   DATE,  
  status     TEXT DEFAULT 'Active'  
);  
  
CREATE TABLE appraisal\_forms (  
  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  cycle\_id      UUID REFERENCES appraisal\_cycles(id),  
  employee\_id   UUID REFERENCES employees(id),  
  manager\_id    UUID REFERENCES employees(id),  
  status        TEXT DEFAULT 'Pending',  
  self\_score    NUMERIC(4,2),  
  manager\_score NUMERIC(4,2),  
  final\_score   NUMERIC(4,2),  
  created\_at    TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE goals (  
  id                UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  appraisal\_form\_id UUID REFERENCES appraisal\_forms(id),  
  description       TEXT NOT NULL,  
  weight            NUMERIC(5,2),  
  target            TEXT,  
  achievement       TEXT,  
  score             NUMERIC(4,2)  
);  
  
CREATE TABLE feedback\_360 (  
  id                UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  appraisal\_form\_id UUID REFERENCES appraisal\_forms(id),  
  reviewer\_id       UUID REFERENCES employees(id),  
  relationship      TEXT,  
  responses\_json    JSONB,  
  submitted\_at      TIMESTAMPTZ DEFAULT now()  
);  
  
-- ── TRAINING ─────────────────────────────────────────────────  
CREATE TABLE skills (  
  id          SERIAL PRIMARY KEY,  
  name        TEXT NOT NULL,  
  category    TEXT,  
  description TEXT  
);  
  
CREATE TABLE employee\_skills (  
  id                UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  employee\_id       UUID REFERENCES employees(id),  
  skill\_id          INT REFERENCES skills(id),  
  proficiency\_level TEXT,  
  assessed\_date     DATE,  
  assessed\_by       UUID REFERENCES employees(id)  
);  
  
CREATE TABLE training\_programs (  
  id             UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  title          TEXT NOT NULL,  
  type           TEXT,  
  provider       TEXT,  
  duration\_hours NUMERIC(6,2),  
  cost           NUMERIC(12,2),  
  is\_mandatory   BOOLEAN DEFAULT false  
);  
  
CREATE TABLE training\_sessions (  
  id               UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  program\_id       UUID REFERENCES training\_programs(id),  
  date             DATE,  
  venue            TEXT,  
  max\_participants INT,  
  status           TEXT DEFAULT 'Scheduled'  
);  
  
CREATE TABLE training\_enrolments (  
  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  session\_id      UUID REFERENCES training\_sessions(id),  
  employee\_id     UUID REFERENCES employees(id),  
  status          TEXT DEFAULT 'Enrolled',  
  attendance      BOOLEAN,  
  certificate\_url TEXT  
);  
  
-- ── EXPENSES ─────────────────────────────────────────────────  
CREATE TABLE expense\_categories (  
  id                      SERIAL PRIMARY KEY,  
  name                    TEXT NOT NULL,  
  default\_limit\_per\_claim NUMERIC(12,2)  
);  
  
CREATE TABLE expense\_claims (  
  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  employee\_id     UUID REFERENCES employees(id),  
  title           TEXT NOT NULL,  
  submission\_date DATE,  
  total\_amount    NUMERIC(12,2),  
  status          TEXT DEFAULT 'Draft',  
  approver\_id     UUID REFERENCES employees(id),  
  created\_at      TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE expense\_items (  
  id          UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  claim\_id    UUID REFERENCES expense\_claims(id) ON DELETE CASCADE,  
  category\_id INT REFERENCES expense\_categories(id),  
  amount      NUMERIC(12,2) NOT NULL,  
  date        DATE NOT NULL,  
  description TEXT,  
  receipt\_url TEXT  
);  
  
-- ── RECRUITMENT ──────────────────────────────────────────────  
CREATE TABLE job\_postings (  
  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  title         TEXT NOT NULL,  
  department\_id INT REFERENCES departments(id),  
  type          TEXT,  
  location\_id   INT REFERENCES locations(id),  
  description   TEXT,  
  status        TEXT DEFAULT 'Draft',  
  deadline      DATE,  
  created\_at    TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE applicants (  
  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  job\_id        UUID REFERENCES job\_postings(id),  
  full\_name     TEXT NOT NULL,  
  email         TEXT NOT NULL,  
  phone         TEXT,  
  cv\_url        TEXT,  
  source        TEXT,  
  current\_stage TEXT DEFAULT 'Applied',  
  created\_at    TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE interview\_schedules (  
  id             UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  applicant\_id   UUID REFERENCES applicants(id),  
  interviewer\_id UUID REFERENCES employees(id),  
  date\_time      TIMESTAMPTZ,  
  type           TEXT,  
  notes          TEXT  
);  
  
CREATE TABLE evaluation\_scorecards (  
  id             UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  applicant\_id   UUID REFERENCES applicants(id),  
  evaluator\_id   UUID REFERENCES employees(id),  
  scores\_json    JSONB,  
  recommendation TEXT,  
  comments       TEXT,  
  submitted\_at   TIMESTAMPTZ DEFAULT now()  
);  
  
-- ── SECURITY & AUDIT ─────────────────────────────────────────  
CREATE TABLE user\_roles (  
  user\_id     UUID REFERENCES auth.users(id) PRIMARY KEY,  
  role        TEXT NOT NULL DEFAULT 'employee'  
                CHECK (role IN ('super\_admin','hr\_manager','line\_manager','employee','recruiter','executive')),  
  employee\_id UUID REFERENCES employees(id),  
  created\_at  TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE audit\_log (  
  id         UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  table\_name TEXT NOT NULL,  
  record\_id  UUID NOT NULL,  
  operation  TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),  
  old\_data   JSONB,  
  new\_data   JSONB,  
  changed\_by UUID REFERENCES auth.users(id),  
  changed\_at TIMESTAMPTZ DEFAULT now(),  
  ip\_address INET,  
  user\_agent TEXT  
);  
  
CREATE TABLE auth\_lockouts (  
  user\_id      UUID REFERENCES auth.users(id) PRIMARY KEY,  
  attempts     INT DEFAULT 0,  
  last\_attempt TIMESTAMPTZ,  
  locked\_until TIMESTAMPTZ  
);  
  
CREATE TABLE sync\_processed (  
  idempotency\_key TEXT PRIMARY KEY,  
  processed\_at    TIMESTAMPTZ DEFAULT now()  
);  
CREATE INDEX ON sync\_processed (processed\_at);  
  
CREATE TABLE data\_processing\_consents (  
  id           UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  employee\_id  UUID REFERENCES employees(id),  
  version      TEXT NOT NULL,  
  consented    BOOLEAN NOT NULL,  
  ip\_address   INET,  
  consented\_at TIMESTAMPTZ DEFAULT now()  
);  
  
-- ── OFFBOARDING ──────────────────────────────────────────────  
CREATE TABLE offboarding\_checklists (  
  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  employee\_id     UUID NOT NULL REFERENCES employees(id),  
  exit\_type       TEXT NOT NULL,   -- 'Retirement','Resignation','Dismissal','Transfer','Death'  
  exit\_date       DATE NOT NULL,  
  initiated\_by    UUID REFERENCES auth.users(id),  
  overall\_status  TEXT NOT NULL DEFAULT 'In Progress'  
                    CHECK (overall\_status IN ('In Progress','Cleared','Blocked')),  
  created\_at      TIMESTAMPTZ DEFAULT now(),  
  updated\_at      TIMESTAMPTZ DEFAULT now()  
);  
  
CREATE TABLE offboarding\_items (  
  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  checklist\_id    UUID NOT NULL REFERENCES offboarding\_checklists(id) ON DELETE CASCADE,  
  department      TEXT NOT NULL,   -- 'Library','ICT','Finance','Security','HR','Admin'  
  item            TEXT NOT NULL,   -- e.g. 'Return staff ID card'  
  cleared         BOOLEAN DEFAULT false,  
  cleared\_by      UUID REFERENCES auth.users(id),  
  cleared\_at      TIMESTAMPTZ,  
  remarks         TEXT  
);  
  
-- ── BULK OPERATIONS ──────────────────────────────────────────  
CREATE TABLE bulk\_operations (  
  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  operation\_type  TEXT NOT NULL,   -- 'BulkPromotion','BulkTransfer','BulkStatusChange'  
  label           TEXT NOT NULL,   -- e.g. '2026 Annual Promotion Exercise'  
  initiated\_by    UUID REFERENCES auth.users(id),  
  total\_records   INT NOT NULL,  
  processed       INT DEFAULT 0,  
  failed          INT DEFAULT 0,  
  status          TEXT NOT NULL DEFAULT 'Pending'  
                    CHECK (status IN ('Pending','Processing','Complete','Partial','Failed')),  
  payload\_json    JSONB,           -- parameters (e.g. from\_grade, to\_grade, effective\_date)  
  created\_at      TIMESTAMPTZ DEFAULT now(),  
  completed\_at    TIMESTAMPTZ  
);  
  
CREATE TABLE bulk\_operation\_items (  
  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  operation\_id    UUID NOT NULL REFERENCES bulk\_operations(id) ON DELETE CASCADE,  
  employee\_id     UUID NOT NULL REFERENCES employees(id),  
  status          TEXT NOT NULL DEFAULT 'Pending'  
                    CHECK (status IN ('Pending','Success','Failed','Skipped')),  
  error\_message   TEXT,  
  processed\_at    TIMESTAMPTZ  
);
```


## 9. Staff Discipline Module

### 9.1 Purpose

Complete, tamper-evident record of every disciplinary action. Compliant with **PSR Chapter 16**. Records are immutable — closed only, never deleted.

### 9.2 Fields (22)

| \# | Field | Type | Input | Req | Notes |
| - | - | - | - | - | - |
| D1 | Case Reference | String | Auto | Auto | `DISC-\{YEAR\}-\{SEQ\}` |
| D2 | Employee | FK | Lookup | Yes |  |
| D3 | Offence Category | Enum | Dropdown | Yes | → §9.4 |
| D4 | Offence Description | Text | Textarea | Yes | max 1000 chars |
| D5 | Date of Offence | Date | Date picker | Yes |  |
| D6 | Date Query Issued | Date | Date picker | Yes |  |
| D7 | Date Response Received | Date | Date picker | No |  |
| D8 | Query Response Summary | Text | Textarea | No |  |
| D9 | Hearing Date | Date | Date picker | No |  |
| D10 | Panel Members | Text | Text/Tags | No |  |
| D11 | Finding | Enum | Dropdown | Yes | Guilty / Not Guilty / Inconclusive |
| D12 | Sanction | Enum | Dropdown | No | → §9.5; required if Finding = Guilty |
| D13 | Sanction Details | Text | Textarea | No |  |
| D14 | Sanction Start Date | Date | Date picker | No |  |
| D15 | Sanction End Date | Date | Date picker | No |  |
| D16 | Appeal Filed | Boolean | Toggle | No | Default: false |
| D17 | Appeal Date | Date | Date picker | No |  |
| D18 | Appeal Outcome | Enum | Dropdown | No | Upheld / Dismissed / Modified |
| D19 | Case Status | Enum | Dropdown | Yes | → §9.6 |
| D20 | Recorded By | FK | Auto | Auto |  |
| D21 | Supporting Documents | Files | Upload | No | PDF/JPG/PNG; max 10MB each |
| D22 | Remarks | Text | Textarea | No | max 500 chars |


### 9.3 Workflow

```
Query Issued → Response Received → Hearing Scheduled → Hearing Held  
  → Finding Recorded → Sanction Applied → \[Appeal Filed → Appeal Determined\]  
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

- Passed `sanction\_end\_date` without closure auto-flags for HR review

- All actions audit-logged; records cannot be deleted — only closed

- **Not cached offline** — online access only (security policy)


## 10. Promotion Schedule Module

### 10.1 Purpose

Track every promotion event in an employee's career. Compliant with **PSR Chapter 6**.

### 10.2 Fields (19)

| \# | Field | Type | Input | Req | Notes |
| - | - | - | - | - | - |
| P1 | Promotion Reference | String | Auto | Auto | `PROMO-\{YEAR\}-\{SEQ\}` |
| P2 | Employee | FK | Lookup | Yes |  |
| P3 | Promotion Type | Enum | Dropdown | Yes | → §10.4 |
| P4 | From Rank | FK | Dropdown | Yes | Pre-filled from current |
| P5 | To Rank | FK | Dropdown | Yes |  |
| P6 | From Grade Level | FK | Dropdown | Yes | Pre-filled from current |
| P7 | To Grade Level | FK | Dropdown | Yes |  |
| P8 | From Salary Structure | FK | Dropdown | No | Pre-filled |
| P9 | To Salary Structure | FK | Dropdown | No |  |
| P10 | Effective Date | Date | Date picker | Yes |  |
| P11 | Approval Date | Date | Date picker | Yes |  |
| P12 | Approving Authority | Text | Text | Yes |  |
| P13 | Approval Reference | Text | Text | No |  |
| P14 | Basis of Promotion | Enum | Dropdown | Yes | → §10.5 |
| P15 | Performance Score | Decimal | Number | No | Linked appraisal score |
| P16 | Years in Grade | Integer | Calculated | Auto | App-layer: this effective\_date − previous effective\_date |
| P17 | Promotion Letter | File | Upload | No | PDF; max 10MB |
| P18 | Remarks | Text | Textarea | No | max 500 chars |
| P19 | Recorded By | FK | Auto | Auto |  |
| P20 | Is Acting | Boolean | Toggle | No | Default: false; marks acting/temporary appointments |
| P21 | Acting Expiry Date | Date | Date picker | No | Required if Is Acting = true; triggers alert |


### 10.3 Minimum Years in Grade (Federal Civil Service)

| Grade Band | Min Years |
| - | - |
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

- Approving a promotion auto-updates `employees.rank\_id`, `salary\_grade\_level\_id`, `date\_of\_present\_appointment`

- Records read-only after saving — corrections require a superseding entry

- Acting appointments display a distinct **"Acting"** badge on the employee profile and org chart

### 10.7 Acting Capacity Logic

In the Nigerian Civil Service, an officer may hold a position "in an Acting capacity" — typically for up to 6 months — before the appointment is either confirmed or reverted. This is distinct from a substantive promotion and must be tracked separately.

**Rules:**

- `is\_acting = true` marks the record as a temporary appointment, not a substantive promotion

- `acting\_expiry\_date` is mandatory when `is\_acting = true`; defaults to 6 months from `effective\_date`

- The master `employees` profile shows the acting rank/grade but flags it as **Acting**

- `employees.date\_of\_present\_appointment` is **not updated** for acting appointments — only updated on substantive confirmation

**Alerts:**

- **30 days before** `acting\_expiry\_date`: HR dashboard alert — *"Acting appointment for \[Name\] expires in 30 days — confirm or revert"*

- **On expiry date**: alert escalates to urgent; status auto-flags as `Pending Confirmation`

- **On confirmation**: HR records a new promotion entry with `is\_acting = false`; master profile updated; acting record closed

- **On reversion**: previous substantive rank/grade restored; acting record closed with `Reverted` remark

**Schema addition:**

```
ALTER TABLE promotion\_history  
  ADD COLUMN is\_acting        BOOLEAN NOT NULL DEFAULT false,  
  ADD COLUMN acting\_expiry\_date DATE,  
  ADD CONSTRAINT acting\_expiry\_required  
    CHECK (is\_acting = false OR acting\_expiry\_date IS NOT NULL);
```


## 11. Location (Posting) History Module

### 11.1 Purpose

Track every posting — transfer, redeployment, secondment — across an employee's career. Each posting updates the live `location\_id` and `department\_id` on the master profile.

### 11.2 Fields (19)

| \# | Field | Type | Input | Req | Notes |
| - | - | - | - | - | - |
| L1 | Posting Reference | String | Auto | Auto | `POST-\{YEAR\}-\{SEQ\}` |
| L2 | Employee | FK | Lookup | Yes |  |
| L3 | Posting Type | Enum | Dropdown | Yes | → §11.4 |
| L4 | From Location | FK | Dropdown | Yes | Pre-filled from current |
| L5 | To Location | FK | Dropdown | Yes |  |
| L6 | From Department | FK | Dropdown | Yes | Pre-filled from current |
| L7 | To Department | FK | Dropdown | Yes |  |
| L8 | From Rank | FK | Dropdown | No | Only if posting involves rank change |
| L9 | To Rank | FK | Dropdown | No |  |
| L10 | Effective Date | Date | Date picker | Yes |  |
| L11 | Expected End Date | Date | Date picker | No | Temporary postings/secondments |
| L12 | Actual End Date | Date | Date picker | No | Set when posting concludes |
| L13 | Approving Authority | Text | Text | Yes |  |
| L14 | Approval Reference | Text | Text | No |  |
| L15 | Reason for Posting | Enum | Dropdown | Yes | → §11.5 |
| L16 | Posting Letter | File | Upload | No | PDF; max 10MB |
| L17 | Remarks | Text | Textarea | No | max 500 chars |
| L18 | Status | Enum | Dropdown | Yes | Active / Concluded / Cancelled |
| L19 | Recorded By | FK | Auto | Auto |  |


### 11.3 Master Profile Sync

When a posting is saved as `Active` with Effective Date ≤ today:

- `employees.location\_id` → To Location

- `employees.department\_id` → To Department

- Previous active posting → auto-set to `Concluded`; `actual\_end\_date` = day before new effective date

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

- Posting expiry alert when `expected\_end\_date` passes without `actual\_end\_date`


## 12. Nigerian Geo-Political Reference Data

All seeded at deployment. Never free text — always FK references.

| Zone | States | LGAs |
| - | - | - |
| North Central | Benue, FCT, Kogi, Kwara, Nasarawa, Niger, Plateau | 121 |
| North East | Adamawa, Bauchi, Borno, Gombe, Taraba, Yobe | 112 |
| North West | Jigawa, Kaduna, Kano, Katsina, Kebbi, Sokoto, Zamfara | 186 |
| South East | Abia, Anambra, Ebonyi, Enugu, Imo | 95 |
| South South | Akwa Ibom, Bayelsa, Cross River, Delta, Edo, Rivers | 123 |
| South West | Ekiti, Lagos, Ogun, Ondo, Osun, Oyo | 137 |
| **Total** | **37 (incl. FCT)** | **774** |


Full LGA seed data in `TaniHR\_Nigeria\_GeoData.md`.


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
| - | - |
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


## 14. Offline-First Architecture

### 14.1 Design Philosophy

TaniHR treats offline as the **default state**, not a fallback. Every action that can be completed offline must be completeable offline. When connectivity returns, changes sync automatically with conflict resolution. This is non-negotiable for Nigerian deployments where power outages, poor 3G/4G, and ISP instability are routine.

### 14.2 Offline Capability Matrix

| Feature | Offline | Sync Strategy |
| - | - | - |
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
| System admin / settings | ❌ Online only |  |
| Bulk CSV import | ❌ Online only |  |
| Reports / PDF export | ⚠️ Partial | Uses locally cached data |


### 14.3 Offline Technology Stack

| Layer | Technology | Purpose |
| - | - | - |
| Service Worker | Workbox 7 (via `next-pwa`) | Network interception, cache strategies |
| Local Database | Dexie.js (IndexedDB wrapper) | Structured encrypted offline storage |
| Sync Queue | Custom queue in IndexedDB | Ordered, idempotent mutation queue |
| Background Sync | Web Background Sync API | Auto-retry on reconnect |
| Conflict Resolution | Last-Write-Wins + field-level rules | Merge offline changes with server |
| Encryption | Web Crypto API (AES-GCM, PBKDF2) | All IndexedDB data encrypted at rest |
| Connectivity | `navigator.onLine` + server ping | Reliable online/offline detection |


### 14.4 Local IndexedDB Schema (Dexie.js)

```
// All data values are AES-GCM encrypted JSON blobs  
  
class TaniHROfflineDB extends Dexie \{  
  employees: Table\<\{  
    id: string;  
    data: string;  
    synced\_at: number;  
    version: number;  
  \}\>;  
  sync\_queue: Table\<SyncQueueItem\>; // pending mutations  
  attendance\_queue: Table\<AttendanceLog\>; // offline clock-ins  
  metadata\_cache: Table\<CachedMetadata\>; // reference data (departments, ranks, etc.)  
  leave\_requests: Table\<\{ id: string; data: string; synced: boolean \}\>;  
  expense\_claims: Table\<\{ id: string; data: string; synced: boolean \}\>;  
\}  
  
interface SyncQueueItem \{  
  id?: number; // auto-increment  
  operation: "INSERT" | "UPDATE" | "DELETE";  
  table: string;  
  record\_id: string;  
  payload: string; // encrypted JSON  
  created\_at: number;  
  attempts: number; // max 5; then status = 'failed'  
  status: "pending" | "processing" | "failed";  
  idempotency\_key: string; // UUID; prevents duplicate server processing  
\}
```

### 14.5 Connectivity Detection

```
// Dual detection: browser event + active server ping every 10 seconds  
async function pingServer(): Promise\<boolean\> \{  
  try \{  
    const res = await fetch("/api/ping", \{ method: "HEAD", cache: "no-store" \});  
    return res.ok;  
  \} catch \{  
    return false;  
  \}  
\}  
setInterval(async () =\> \{  
  useConnectivity.getState().setOnline(await pingServer());  
\}, 10\_000);
```

### 14.6 Sync Queue Processing

Every mutation (create/update/delete) is enqueued before any server call:

1. Write to local IndexedDB (encrypted) → immediate UI feedback

2. Add to `sync\_queue` with unique `idempotency\_key`

3. If online: process queue immediately; else: wait for reconnect event

4. On reconnect: process queue in `created\_at` order

5. Server checks `sync\_processed` table for idempotency key before applying

6. On success: delete queue item + record key in `sync\_processed`

7. On failure: increment `attempts`; after 5 failures → mark `failed`, notify HR Admin

### 14.7 Conflict Resolution

| Scenario | Resolution |
| - | - |
| Employee edits profile offline; HR also edits online | Server wins on HR-controlled fields (rank, grade, dept, status); client wins on own fields (email, phone) |
| Manager approves leave offline; already approved online | Idempotency key prevents double-record; first write wins |
| Offline clock-in | Timestamp captured at device time; flagged `source = 'offline\_queue'` |
| Two managers approve same leave offline | First sync wins; second triggers HR conflict notification |
| Record deleted online while edited offline | Server delete wins; queue item dropped with user warning |


**Field-level merge rules for employee profile:**

- Server wins: `rank\_id`, `salary\_grade\_level\_id`, `department\_id`, `status`, `date\_of\_present\_appointment`, `salary\_structure\_id`

- Client wins: `email`, `phone`, `remark`

### 14.8 Attendance Offline Flow

Clock-in/out is the most critical offline feature. Timestamp is captured at the moment of action — not at sync time:

```
async function recordAttendance(  
  employeeId: string,  
  action: "clock\_in" | "clock\_out",  
) \{  
  const entry = \{  
    id: uuid(),  
    employee\_id: employeeId,  
    action,  
    timestamp: Date.now(), // captured immediately — not at sync time  
    synced: false,  
    encrypted\_payload: await encryptField(  
      JSON.stringify(\{  
        employee\_id: employeeId,  
        action,  
        timestamp: new Date().toISOString(),  
        source: "offline\_queue",  
      \}),  
    ),  
  \};  
  await offlineDB.attendance\_queue.add(entry);  
  return \{ success: true, timestamp: entry.timestamp \};  
\}
```

### 14.9 Data Freshness TTLs

| Data Type | Cache Duration | Refresh |
| - | - | - |
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

- ```
const \{ quota, usage \} = await navigator.storage.estimate();  
const remaining = (quota ?? 0) - (usage ?? 0);  
if (remaining \< 50 \* 1024 \* 1024) \{  
  showWarning("Low device storage — sync your data now to avoid loss.");  
\}
```

- Request persistent storage on install to prevent OS-level eviction:

- ```
if (navigator.storage?.persist) \{  
  const granted = await navigator.storage.persist();  
  // If granted = true, browser will NOT evict this origin's storage  
\}
```

- Display a prominent warning in the connectivity banner when unsynced queue items are present: *"You have N unsynced changes. Do not clear your browser cache."*

- On service worker install, call `self.registration.navigationPreload?.enable()` to reduce first-load risk of cache miss

### 14.13 Clock Tampering — Attendance Integrity

Since device time is captured offline for attendance, a user could manually set their phone clock to `08:00` to record a false on-time clock-in while offline.

**Detection strategy:**

1. On sync, compare `device\_timestamp` against `server\_received\_at` (Supabase function timestamp)

2. If `|server\_received\_at − device\_timestamp| \> 15 minutes`, flag the record:

```
ALTER TABLE attendance\_logs  
  ADD COLUMN device\_timestamp   TIMESTAMPTZ,  
  ADD COLUMN server\_received\_at TIMESTAMPTZ DEFAULT now(),  
  ADD COLUMN time\_drift\_minutes INT GENERATED ALWAYS AS (  
    EXTRACT(EPOCH FROM (server\_received\_at - device\_timestamp))::INT / 60  
  ) STORED,  
  ADD COLUMN drift\_flagged BOOLEAN GENERATED ALWAYS AS (  
    ABS(EXTRACT(EPOCH FROM (server\_received\_at - device\_timestamp))) \> 900  
  ) STORED;
```

3. HR dashboard shows all `drift\_flagged = true` records in a **"Suspicious Attendance"** review queue

4. On reconnect, PWA attempts to fetch authoritative network time before processing sync:

```
async function getNetworkTime(): Promise\<Date | null\> \{  
  try \{  
    const res = await fetch("/api/time", \{ cache: "no-store" \});  
    const \{ ts \} = await res.json();  
    return new Date(ts);  
  \} catch \{  
    return null;  
  \}  
\}  
// If networkTime exists and differs from Date.now() by \>5 minutes, warn user
```

5. `source = 'offline\_queue'` records are visually distinguished in attendance reports — HR can filter and audit all offline clock-ins separately


## 15. Security Hardening

### 15.1 Threat Model

| Threat | Vector | Mitigation |
| - | - | - |
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

```
-- Helper functions used in all RLS policies  
CREATE OR REPLACE FUNCTION get\_user\_role() RETURNS TEXT AS $$  
  SELECT auth.jwt() -\>\> 'user\_role';  
$$ LANGUAGE sql STABLE SECURITY DEFINER;  
  
CREATE OR REPLACE FUNCTION get\_user\_employee\_id() RETURNS UUID AS $$  
  SELECT (auth.jwt() -\>\> 'employee\_id')::UUID;  
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Key policy summary:**

| Table | Super Admin / HR Manager | Line Manager | Employee | Executive |
| - | - | - | - | - |
| employees | Full CRUD | Read own team | Read + limited update own record | Read all |
| discipline\_cases | Full CRUD | No access | No access | No access |
| promotion\_history | Full CRUD | Read own team | Read own | Read all |
| posting\_history | Full CRUD | Read own team | Read own | Read all |
| leave\_requests | Full CRUD | Approve own team | Insert + read own | Read all |
| expense\_claims | Full CRUD | Approve own team | Full own | Read all |
| audit\_log | Read only | No access | No access | No access |


**Discipline cases — strict isolation:**

```
CREATE POLICY "discipline\_hr\_only" ON discipline\_cases  
  FOR ALL USING (get\_user\_role() IN ('super\_admin', 'hr\_manager'));  
-- No policy for any other role = zero access
```

**Employee self-update restriction** (prevents self-promotion):

```
CREATE POLICY "employee\_own\_update" ON employees  
  FOR UPDATE USING (id = get\_user\_employee\_id())  
  WITH CHECK (  
    rank\_id               = (SELECT rank\_id FROM employees WHERE id = get\_user\_employee\_id()) AND  
    salary\_grade\_level\_id = (SELECT salary\_grade\_level\_id FROM employees WHERE id = get\_user\_employee\_id()) AND  
    department\_id         = (SELECT department\_id FROM employees WHERE id = get\_user\_employee\_id()) AND  
    status                = (SELECT status FROM employees WHERE id = get\_user\_employee\_id())  
  );
```

### 15.4 Immutable Audit Trail

All sensitive table operations are auto-logged. The audit log has no UPDATE or DELETE policy — it is physically append-only from the application layer.

```
CREATE OR REPLACE FUNCTION audit\_trigger\_fn() RETURNS TRIGGER AS $$  
BEGIN  
  INSERT INTO audit\_log (table\_name, record\_id, operation, old\_data, new\_data, changed\_by)  
  VALUES (TG\_TABLE\_NAME, COALESCE(NEW.id::UUID, OLD.id::UUID), TG\_OP,  
    CASE WHEN TG\_OP = 'INSERT' THEN NULL ELSE to\_jsonb(OLD) END,  
    CASE WHEN TG\_OP = 'DELETE' THEN NULL ELSE to\_jsonb(NEW) END,  
    auth.uid());  
  RETURN COALESCE(NEW, OLD);  
END;  
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Triggers applied to: `employees`, `discipline\_cases`, `promotion\_history`, `posting\_history`, `leave\_requests`, `expense\_claims`, `appraisal\_forms`, `employee\_documents`.

### 15.5 API Security

- **Anon key:** used in browser/PWA; subject to RLS; safe to expose

- **Service role key:** server-side only (Edge Functions); never in frontend code or public repos

- **Input validation:** all mutations validated with Zod schemas before DB write

- **Rate limiting:** 60 requests/user/minute enforced in Edge Function middleware

- **CORS:** locked to `NEXT\_PUBLIC\_APP\_URL` — never wildcard `\*` in production

### 15.6 HTTP Security Headers

```
// next.config.js — applied to all responses  
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload  
X-Frame-Options: SAMEORIGIN  
X-Content-Type-Options: nosniff  
Referrer-Policy: strict-origin-when-cross-origin  
Content-Security-Policy: default-src 'self'; connect-src 'self' \*.supabase.co wss://\*.supabase.co; frame-ancestors 'none'
```

### 15.7 Data Encryption

**At rest:** AES-256 (Supabase managed) for all database data and Storage files.

**In transit:** TLS 1.3 enforced; HSTS preload ensures no HTTP fallback.

**Column-level encryption** (applied before DB write for highest-sensitivity fields):

- Fields: `ippis\_number`, `rsa\_pin`, `nin` (if added)

- Algorithm: AES-256-GCM with per-value IV

- Key: `FIELD\_ENCRYPTION\_KEY` env var (32-byte hex; generated with `openssl rand -hex 32`)

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
| - | - |
| Lawful basis | Employment contract; recorded in `data\_processing\_consents` |
| Data subject rights | Self-service profile view; own-data export (JSON/PDF) |
| Right to erasure | Soft-delete (`status = 'Deleted'`); full purge after statutory retention |
| Data minimisation | Only fields in §5 collected |
| Retention policy | Employee records: 6 years post-exit; discipline: 7 years |
| Breach notification | Edge Function webhook → HR Admin email within 72 hours |
| Third-party processors | Supabase + Resend; both under Data Processing Agreements |


### 15.10 Supabase Edge Function Cold Starts

Edge Functions on Supabase experience cold start latency (typically 200–800ms) after periods of inactivity. For most functions (email, validation) this is acceptable. For **time-critical triggers** like breach notifications and the `/api/time` endpoint used for attendance integrity checks, cold starts must be minimised.

**Mitigations:**

- **Keep-alive ping:** Schedule a Supabase `pg\_cron` job to call critical Edge Functions every 5 minutes, keeping them warm:

- ```
SELECT cron.schedule(  
  'keepalive-edge-functions',  
  '\*/5 \* \* \* \*',  
  $$SELECT net.http\_get('https://\<ref\>.supabase.co/functions/v1/time')$$  
);
```

- **Upgrade plan if needed:** Supabase Pro provides faster cold start recovery vs. Free tier. Enterprise tier offers dedicated function instances.

- **Fallback for `/api/time`:** If the Edge Function is cold and `/api/time` returns slowly, the PWA falls back gracefully — it does not block the sync queue. It only flags attendance records it cannot verify.

- **Breach notification redundancy:** In addition to Edge Function webhook, configure Supabase Dashboard → Database → Webhooks as a secondary trigger on a separate delivery path.

### 15.11 Security Pre-Launch Checklist

- [ ] RLS enabled on all tables with explicit policies

- [ ] `service\_role` key absent from all frontend code and git history

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


## 16. Supabase Setup Guide

Execute steps **in order**. Do not skip.

### 16.1 Create Project

1. Go to supabase.com/dashboard → New Project

2. Name: `tanihr-production` | Region: `eu-west-2` (London — closest to Nigeria currently)

3. Plan: **Pro** (required for custom SMTP, daily backups, 8GB database)

4. Save your Project URL and Project Reference ID

### 16.2 CLI Setup

```
npm install -g supabase  
supabase login  
supabase init                          \# in project root  
supabase link --project-ref \<ref\>
```

### 16.3 Environment Variables

```
\# .env.local — never commit this file  
NEXT\_PUBLIC\_SUPABASE\_URL=https://\<ref\>.supabase.co  
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=\<anon-key\>  
SUPABASE\_SERVICE\_ROLE\_KEY=\<service-role-key\>   \# server-side only  
FIELD\_ENCRYPTION\_KEY=\<openssl rand -hex 32\>  
NEXT\_PUBLIC\_APP\_URL=https://tanihr.app  
RESEND\_API\_KEY=\<resend-key\>  
EMAIL\_FROM=noreply@tanihr.app
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
Host: smtp.resend.com | Port: 587 | Username: resend | Password: \<RESEND\_API\_KEY\>
```

### 16.5 Database Extensions

```
CREATE EXTENSION IF NOT EXISTS btree\_gist;   -- posting overlap constraint  
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- UUID  
CREATE EXTENSION IF NOT EXISTS pg\_trgm;     -- name search
```

### 16.6 Run Migration

Save as `supabase/migrations/001\_core\_schema.sql`, paste the complete schema from §8, then:

```
supabase db push
```

### 16.7 Enable RLS on All Tables

```
DO $$  
DECLARE tbl TEXT;  
BEGIN  
  FOR tbl IN SELECT tablename FROM pg\_tables WHERE schemaname = 'public'  
  LOOP  
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);  
  END LOOP;  
END $$;
```

Then apply all RLS policies from §15.3.

### 16.8 Deploy Audit Triggers

```
-- Deploy audit function and apply to all sensitive tables (§15.4)  
DO $$  
DECLARE tbl TEXT;  
BEGIN  
  FOR tbl IN SELECT unnest(ARRAY\[  
    'employees','discipline\_cases','promotion\_history','posting\_history',  
    'leave\_requests','expense\_claims','appraisal\_forms','employee\_documents'  
  \])  
  LOOP  
    EXECUTE format(  
      'CREATE TRIGGER audit\_%s AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit\_trigger\_fn();',  
      tbl, tbl  
    );  
  END LOOP;  
END $$;
```

### 16.9 Custom JWT Hook (Role Injection)

```
-- Called by Supabase after every token mint  
CREATE OR REPLACE FUNCTION custom\_access\_token\_hook(event JSONB)  
RETURNS JSONB AS $$  
DECLARE claims JSONB; user\_role TEXT; emp\_id UUID;  
BEGIN  
  SELECT role, employee\_id INTO user\_role, emp\_id  
  FROM user\_roles WHERE user\_id = (event-\>\>'user\_id')::UUID;  
  claims := event-\>'claims';  
  IF user\_role IS NOT NULL THEN  
    claims := jsonb\_set(claims, '\{user\_role\}',   to\_jsonb(user\_role));  
    claims := jsonb\_set(claims, '\{employee\_id\}', to\_jsonb(emp\_id::TEXT));  
  ELSE  
    claims := jsonb\_set(claims, '\{user\_role\}', '"employee"');  
  END IF;  
  RETURN jsonb\_set(event, '\{claims\}', claims);  
END;  
$$ LANGUAGE plpgsql SECURITY DEFINER;  
  
GRANT EXECUTE ON FUNCTION custom\_access\_token\_hook TO supabase\_auth\_admin;
```

**Enable in Dashboard → Authentication → Hooks → Custom Access Token → select `custom\_access\_token\_hook`**

### 16.10 Storage Buckets

Create these **private** buckets (Dashboard → Storage → New Bucket, Public = OFF):

| Bucket | Purpose |
| - | - |
| `employee-documents` | Contracts, certificates, IDs |
| `discipline-docs` | Discipline case attachments (HR only) |
| `expense-receipts` | Expense claim receipts |
| `training-certs` | Training completion certificates |
| `promotion-letters` | Promotion approval letters |
| `posting-letters` | Posting approval letters |
| `cv-uploads` | Candidate CVs |


Apply storage RLS policies restricting each bucket to appropriate roles (HR only for `discipline-docs`; employee own-path for `expense-receipts`; HR for all others).

### 16.11 Seed Reference Data

```
-- Geo-Political Zones  
INSERT INTO geo\_zones (name) VALUES  
  ('North Central'),('North East'),('North West'),  
  ('South East'),('South South'),('South West');  
  
-- Salary Grade Levels (GL-01 to GL-17)  
INSERT INTO salary\_grade\_levels (code, label)  
SELECT 'GL-' || lpad(n::TEXT, 2, '0'), 'Grade Level ' || n  
FROM generate\_series(1, 17) AS n;  
  
-- Salary Structures  
INSERT INTO salary\_structures (name) VALUES  
  ('CONPSS'),('CONTISS'),('CONHESS'),('CONMESS'),  
  ('CONAISS'),('CONRAISS'),('HAPSS'),('Other');  
  
-- PFA List (19 licensed PFAs)  
INSERT INTO pfa\_list (name) VALUES  
  ('ARM Pension Managers'),('AXA Mansard Pensions'),('Crusader Sterling Pensions'),  
  ('FCMB Pensions'),('Fidelity Pension Managers'),('First Guarantee Pension'),  
  ('IEI Anchor Pension Managers'),('Investment One Pension Managers'),('Leadway Pensure'),  
  ('NLPC Pension Fund Administrators'),('NPF Pensions'),('OAK Pensions'),  
  ('Pensions Alliance Ltd (PAL)'),('Premium Pension'),('Radix Pension Managers'),  
  ('Stanbic IBTC Pension Managers'),('Tangerine APT Pensions'),  
  ('Trustfund Pensions'),('Veritas Glanvills Pensions');  
  
-- Nigerian Federal Public Holidays 2026  
INSERT INTO public\_holidays (date, name, scope) VALUES  
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
INSERT INTO leave\_types (name, days\_allowed, accrual\_type, is\_paid, carry\_over\_limit) VALUES  
  ('Annual Leave',       30, 'flat', true,  10),  
  ('Sick Leave',         10, 'flat', true,   0),  
  ('Maternity Leave',    84, 'flat', true,   0),  
  ('Paternity Leave',    10, 'flat', true,   0),  
  ('Study Leave',         5, 'flat', true,   0),  
  ('Compassionate Leave', 5, 'flat', true,   0),  
  ('AWOL',                0, 'flat', false,  0);  
  
-- Expense Categories  
INSERT INTO expense\_categories (name, default\_limit\_per\_claim) VALUES  
  ('Travel',500000),('Accommodation',150000),('Meals',15000),  
  ('Supplies',50000),('Utilities',30000),('Training/Conference',200000),  
  ('Medical',50000),('Other',25000);
```

States and LGAs: use `TaniHR\_Nigeria\_GeoData.md` to generate INSERT statements (774 LGAs across 37 states; too large to inline).

### 16.12 Enable Realtime

```
ALTER PUBLICATION supabase\_realtime ADD TABLE leave\_requests;  
ALTER PUBLICATION supabase\_realtime ADD TABLE attendance\_logs;  
ALTER PUBLICATION supabase\_realtime ADD TABLE sync\_processed;
```

### 16.13 Backups

Dashboard → Project Settings → Backups:

- Daily backups: **ON** (Pro plan)

- Retention: **30 days**

- Test restore to staging project quarterly

### 16.14 First Super Admin

```
-- After creating user in Dashboard → Authentication → Users  
INSERT INTO user\_roles (user\_id, role, employee\_id)  
VALUES ('\<auth-user-uuid\>', 'super\_admin', NULL);  
-- Link employee\_id once first employee record is created
```

### 16.15 Verification Checklist

```
\# Verify all tables exist  
supabase db execute --sql \\  
  "SELECT tablename FROM pg\_tables WHERE schemaname='public' ORDER BY tablename;"  
  
\# Verify RLS enabled on all tables (all rows must show rowsecurity=true)  
supabase db execute --sql \\  
  "SELECT tablename, rowsecurity FROM pg\_tables WHERE schemaname='public';"  
  
\# Verify extensions  
supabase db execute --sql "SELECT extname FROM pg\_extension;"
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
| - | - | - |
| Auth flow | PKCE (no implicit grant) | Prevents token interception |
| Offline DB | Dexie.js + IndexedDB | Best-in-class IndexedDB wrapper; works in PWA |
| Offline encryption | Web Crypto AES-GCM + PBKDF2 | Session-bound; purged on logout |
| Idempotency | UUID key per mutation | Prevents duplicate server writes on sync retry |
| Conflict resolution | Field-level server/client rules | Protects HR-controlled fields |
| Service worker | Workbox 7 CacheFirst/StaleWhileRevalidate | Fastest possible offline app load |
| RLS | Every table, explicit policies | Zero implicit access |
| Audit log | Trigger-based, INSERT-only policy | Tamper-evident; no app-layer bypass |
| Column encryption | AES-256-GCM (app layer) | NIN/RSA Pin protected even from DB admin |
| Posting overlap | btree\_gist EXCLUDE constraint | DB-level enforcement; no app-layer race |
| Forms | react-hook-form + zod | Type-safe; same schema used for API validation |
| Tables | TanStack Table v8 | Virtualised for large staff lists |
| PDF Export | react-pdf/renderer | Client-side; works offline |
| Email | Supabase Edge Function + Resend | Transactional; reliable delivery |
| Deployment | Vercel + Supabase Cloud | Zero-ops; global CDN |



## 18. Non-Functional Requirements

| Requirement | Target |
| - | - |
| Page load cold (3G) | \< 2.5s |
| Time to interactive | \< 1.5s |
| Offline: app usable | Full functionality (excl. discipline, admin) |
| Offline: sync on reconnect | \< 30s for queued mutations |
| Offline: storage eviction | Persistent storage requested on install; warn at \< 50MB remaining |
| Attendance integrity | Clock drift \> 15 min flagged; offline records visually distinguished |
| Mobile responsiveness | All screens ≥ 320px |
| Data export | CSV + PDF from every module |
| Audit trail | All create/update/delete logged with user + timestamp |
| Audit log integrity | No UPDATE or DELETE permitted on `audit\_log` |
| Multi-tenancy | Schema-per-tenant |
| NDPR compliance | Data residency + consent + breach notification |
| Discipline records | Immutable — close only, never delete |
| Session security | PKCE; 8hr expiry; 30min idle timeout; 3-device limit |
| Encrypted at rest | AES-256 (DB + Storage + IndexedDB) |
| MFA | Required for Super Admin and HR Manager |



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


## 20. Commercialisation (SaaS Model)

| Plan | Price (₦/month) | Users | Storage |
| - | - | - | - |
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


## 21. Known Risks & Mitigations

| \# | Risk | Likelihood | Impact | Mitigation |
| - | - | - | - | - |
| R1 | IndexedDB eviction (low device storage) | Medium | High — unsynced data loss | Persistent storage API on install; quota warning at \< 50MB; user-facing alert when unsynced queue is non-empty |
| R2 | Clock tampering for false attendance | Medium | Medium — attendance fraud | Device timestamp vs `server\_received\_at` diff; \> 15-min drift auto-flags record; HR review queue for all `offline\_queue` source records |
| R3 | Edge Function cold start on breach notification | Low | High — delayed NDPR alert | Keep-alive pg\_cron ping every 5 minutes; secondary Dashboard webhook as fallback |
| R4 | Ghost worker records in Posting History | Low | High — audit failure | DB-level `EXCLUDE USING gist` constraint prevents overlapping active postings; HR confirmation required before back-dating |
| R5 | Sync queue build-up during extended outage | Medium | Medium — large batch sync on reconnect | Queue processes in ordered batches of 50; progress indicator shown; failed items (5+ attempts) surface to HR Admin |
| R6 | Acting appointment never confirmed or reverted | High — common in practice | Medium — grade/pay inconsistency | `acting\_expiry\_date` mandatory; 30-day advance alert; day-of urgent alert; status auto-flags `Pending Confirmation` |
| R7 | Professional licence expires unnoticed | Medium | High — regulatory/legal risk | `expiry\_alert\_days` per document type; email + in-app alert; HR dashboard widget for all expiring docs in next 90 days |
| R8 | Offboarding not completed before exit date | High — endemic in MDAs | Medium — asset recovery failure | Offboarding checklist auto-created on `status = Retired/Resigned/Dismissed`; blocked clearances surfaced on dashboard; cannot mark employee as fully exited until all items cleared |
| R9 | Bulk promotion applied to wrong batch | Low | Very High — mass data corruption | Two-step: HR previews list before applying; dry-run mode shows changes without committing; all bulk ops logged in `bulk\_operations` with full payload; rollback via audit log |
| R10 | Supabase service outage | Very Low | Very High — full system unavailable | Offline-first architecture means read/write continues locally; sync resumes when Supabase recovers; display Supabase status page link in connectivity banner during outages |



## 22. External Review Notes

*Review received March 2026. Reviewer classified TaniHR as a "Zero-Ops, highly resilient architecture — better suited for the African market than 90% of available HRMS tools." Key findings incorporated into this PRD version.*

### 22.1 Strategic Validation

**IPPIS Positioning:** The decision to exclude payroll is confirmed as strategically correct. TaniHR positions as the *data feeder and record-keeper that IPPIS lacks at the agency/department level* — not a competitor. This avoids confrontation with Federal Government infrastructure while filling the gap agencies actually need.

**PSR-Centricity as Moat:** The reviewer confirms that building around PSR Chapters 6, 16, and retirement rules creates a competitive moat. No standard international HRMS tool (BambooHR, Workday, Zoho) natively understands *"35 years of service"* or *"Withholding of Increment"* as a formal disciplinary sanction. This is TaniHR's most defensible differentiator.

**Federal Character Compliance:** The Zone → State → LGA cascade is validated as more than a UI feature — it is a compliance requirement for Federal Character reporting in Nigeria.

### 22.2 Technical Validation

**Offline Architecture:** The reviewer describes Section 14 as *"the most sophisticated part of the PRD."* Key confirmations:

- Treating offline as the **primary state** (not a cache) solves the trust issue for shared office computers

- `idempotency\_key` in the sync queue is confirmed as critical for preventing double-submitted leave requests on unreliable 3G/4G

- Capturing device timestamp at the moment of action (§14.8) — not at sync time — prevents staff from exploiting network issues to excuse late clock-ins

**Schema Decisions Validated:**

- `GENERATED ALWAYS` retirement columns (§8): described as *"a masterstroke"* — the exit date becomes a living calculation that cannot be manually tampered with

- `EXCLUDE USING gist` on `posting\_history` (§8): described as *"high-level SQL"* — programmatically prevents ghost worker duplications

- Discipline module as online-only: described as *"a smart security trade-off"* — disciplinary records are the most litigious part of HR

**Security:**

- JWT role injection + RLS confirmed as *"bank-grade"* — even bypassing the UI, the database refuses to serve unauthorised data

- Trigger-based audit log confirmed as essential for Nigerian government audits — proves who changed a file number or rank and when

### 22.3 Gaps Identified by Reviewer — All Resolved in This Version

| Gap | Identified In Review | Resolved In |
| - | - | - |
| Acting capacity logic (is\_acting flag, expiry, alerts) | §5A of review | §10.7, fields P20–P21, Risk R6 |
| Professional licence expiry alerts | §5B of review | `employee\_documents` enhanced schema, §13.1, Risk R7 |
| Exit clearing / offboarding checklist | §5C of review | `offboarding\_checklists` + `offboarding\_items` tables, §13.1, Phase 3, Risk R8 |
| Bulk promotion UI | §5D of review | `bulk\_operations` + `bulk\_operation\_items` tables, Phase 3, Risk R9 |
| IndexedDB eviction risk | §6A of review | §14.12, NFR table, Phase 5, Risk R1 |
| Clock tampering via device time | §6B of review | §14.13, `time\_drift\_minutes` generated column, NFR table, Phase 5, Risk R2 |
| Edge Function cold starts | §6C of review | §15.10, keep-alive cron pattern, §16 checklist, Phase 5, Risk R3 |


### 22.4 Final Verdict (v3.2)

Strategic Value: **10/10** · Technical Rigor: **10/10** · Nigerian Context: **10/10**

> *"The document is no longer just a list of features; it is a technical blueprint that anticipates failure points and bakes the solutions into the database and protocol layers."*

**PRD is frozen.** Use §16 as the Definition of Done for initial Supabase environment setup.

### 22.5 Phase 1 Implementation Gotchas

Three Postgres-specific details the engineering team must know before writing the first migration:

**1. btree\_gist Extension (§8 — Posting History EXCLUDE constraint)** The `EXCLUDE USING gist` constraint on `posting\_history` requires `btree\_gist` to be active. It is listed in Step 16.5 but must be confirmed present *before* the migration runs. Unlike a `UNIQUE` constraint, `btree\_gist` prevents time-range *overlaps*, not just duplicate rows — this is what stops ghost worker records at the database level, with no application code required.

**2. STORED Generated Columns (§8 — Retirement Dates)** The retirement columns are `GENERATED ALWAYS AS ... STORED`. If a user's `date\_of\_birth` is corrected via an audit amendment, Postgres automatically recalculates `date\_of\_retirement` and updates all related indices. No application code handles this. Teams accustomed to MySQL or application-layer calculations must not attempt to manually `UPDATE` these columns — Postgres will reject it.

**3. IndexedDB Encryption Key Derivation (§14 — Dexie.js)** The AES-GCM encryption key for IndexedDB **must not be stored in `localStorage`**. It must be derived in-memory from the Supabase session token using PBKDF2 (as specified in §14.4 and §15.7). When the tab closes or the user logs out, the key vanishes with the session. Storing the key in `localStorage` would mean an attacker with physical device access could decrypt the cached HR data even after logout — defeating the entire offline security model.

**Start order for Phase 1:** Geo reference data seed → Custom JWT Hook (§16.9) → RLS policies (§15.3) → then frontend.


## 23. Client-Side Implementation Progress

### 23.1 Overview

The client-side React application has been built as a standalone MVP using **React 18 + Vite + Tailwind CSS + Dexie.js (IndexedDB)**. All data persists locally with no backend. This serves as a fully functional prototype and will later be integrated with Supabase (Phase 2).

**Repository:** `https://github.com/aitaniaminu/tanihr.git` **Commit:** `edfa43e` — May 2026 **Test Coverage:** 88 tests across 9 test files (100% pass rate) **Build:** Production build successful (317KB JS bundle + code-split routes)

### 23.2 Architecture

```
┌─────────────────────────────────────────────────────┐  
│                  Client (Current)                    │  
│  React 18 + Vite + Tailwind CSS                     │  
│  Dexie.js (IndexedDB) — local persistence           │  
│  react-router-dom v6 — client-side routing          │  
│  Vitest + React Testing Library — test suite        │  
│  ESLint + Prettier — code quality                   │  
└─────────────────────────────────────────────────────┘  
    All data stored in IndexedDB (no API/backend)
```

**Project Structure:**

```
client/  
├── src/  
│   ├── components/       \# Breadcrumb, Layout, Sidebar  
│   ├── context/          \# AuthContext  
│   ├── data/             \# Nigerian states, LGAs, departments, PFAs  
│   ├── db/               \# Dexie IndexedDB schema (10 tables)  
│   ├── pages/  
│   │   ├── Dashboard.jsx  
│   │   ├── Login.jsx  
│   │   ├── Departments/  
│   │   │   └── DepartmentList.jsx  
│   │   └── Employees/  
│   │       ├── EmployeeList.jsx  
│   │       ├── EmployeeForm.jsx  
│   │       ├── EmployeeDetails.jsx  
│   │       └── ImportEmployees.jsx  
│   ├── tests/            \# 9 test files, 88 tests  
│   └── utils/            \# csvValidator, dateHelpers  
├── fixCSV.js             \# Script to convert DD-Mon-YY dates  
├── .eslintrc.json  
├── .prettierrc  
└── vite.config.js
```

### 23.3 Features Implemented

#### Authentication

- Login page with session-based auth (localStorage)

- Protected routes — unauthenticated users redirected to `/login`

- Auth sync fix: `storage` event listener ensures cross-tab state consistency

- Logout clears session storage

#### Dashboard

- Real-time statistics: Total Employees, Total Departments, Pending Leave (stub), Retiring Soon

- Clickable stat cards navigate to relevant pages

- Department card now navigates to `/departments` (was "Coming Soon")

- "Coming Soon" badge for pending leave module

#### Employee Management

- **Employee List** (`/employees`):

  - Searchable, sortable table (all columns)

  - Filter by department and status (Active/Suspended/Retired/Resigned)

  - Pagination (20 per page)

  - Employee avatar thumbnails with initials fallback

  - Inline View, Edit, Delete action buttons

  - Delete confirmation modal

  - Clear filters button

- **Employee Form** (`/employees/new`, `/employees/edit/:id`):

  - Full create/edit with 4 section groups: Personal, Service, Pension & Origin, Additional

  - Auto-computed fields: Age, Years of Service, Retirement Date, Retirement Status

  - Retirement warnings for employees approaching retirement

  - **Avatar upload**: file picker, live preview, remove button, 500KB max (JPG/PNG/GIF)

  - Reference data datalists (departments, ranks, PFAs, salary structures)

  - Zone → State → LGA cascade (auto-fills geopolitical zone)

  - Comprehensive validation (required fields, date ordering, 18+ age check)

  - RSA Pin: optional, **zero validation** enforced

  - Auto-creates missing reference entries on save (best effort)

- **Employee Details** (`/employees/:id`):

  - Header with avatar image (or initials fallback), name, rank, department, file number

  - Personal Information and Service Information sections

  - Edit and Back to List navigation

#### Department Management

- **Department List** (`/departments`):

  - Searchable table with employee counts per department

  - Add/Edit/Delete with modal dialogs

  - Duplicate name prevention

  - Delete confirmation modal

  - "Seed default departments" button (12 pre-configured departments)

#### CSV Import

- **Import Employees** (`/import`):

  - CSV file upload and validation

  - Template download button

  - Validation summary: success count, error count, total rows

  - **Failed records download**: CSV export with "Failure Reason" column

  - Lenient validation rules:

    - PFA Name and RSA Pin removed from required fields

    - Case-insensitive strict LGA matching

    - Support for multiple date formats: `DD-MM-YYYY`, `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-Mon-YY`

- **CSV Utilities** (`fixCSV.js`):

  - Node.js script to convert Excel-exported CSVs with `DD-Mon-YY` dates and leading `'` prefixes

#### Navigation & UX

- Sidebar navigation: Dashboard, Employees, Departments, Import CSV

- Breadcrumb navigation component (auto-generated from route path)

- Responsive layout with collapsible sidebar

- Route-level code splitting (lazy-loaded pages)

- Consistent error states (loading, empty, error) across all pages

### 23.4 IndexedDB Schema (Dexie.js)

```
db.version(2).stores(\{  
  employees:  
    "++id, fileNumber, surname, firstName, department, rank, status, retirementStatus, dateOfBirth, dateOfFirstAppointment",  
  departments: "++id, &name",  
  cadres: "++id, &name",  
  ranks: "++id, &name",  
  pfas: "++id, &name",  
  salaryStructures: "++id, &name",  
  states: "++id, &name",  
  lgas: "++id, \[name+state\]",  
  leaveRequests:  
    "++id, employeeId, employeeName, leaveType, startDate, endDate, status, appliedDate",  
  importLogs: "++id, date, userId, successCount, errorCount",  
  users: "++id, &username, role",  
\});
```

**Employee record includes:** All 28 fields from §5 (including `avatar` as base64 data URL), plus computed `retirementDate`, `retirementStatus`, `createdAt`, `updatedAt`.

### 23.5 Test Suite

| Test File | Tests | Coverage |
| - | - | - |
| `DepartmentList.test.jsx` | 16 | CRUD, search, seed, error states, employee counts |
| `EmployeeList.test.jsx` | 14 | Sort, filter, pagination, status badges, delete modal |
| `EmployeeForm.test.jsx` | 10 | Create/edit mode, fetch by ID, cancel, avatar upload/preview/remove |
| `Dashboard.test.jsx` | 11 | Stats calculation, empty states, navigation |
| `Login.test.jsx` | 9 | Valid/invalid login, logout, unauthenticated redirect |
| `csvValidator.test.js` | 11 | Valid records, error types, failed records, PFA/RSA optional |
| `dateHelpers.test.js` | 9 | Retirement calculation, age, format, parsing, status |
| `indexedDB.test.js` | 4 | DB init, table count |
| `infrastructure.test.jsx` | 4 | Component rendering |
| **Total** | **88** | **All passing** |


### 23.6 Known Deviations from PRD v3.2

| PRD Requirement | Current Implementation | Reason |
| - | - | - |
| Email field required | Email optional | Real CSV data often missing emails |
| 27 employee fields | 28 fields (added avatar) | User request |
| RSA Pin validation (16-18 chars) | **No validation** | User directive — remove all validation |
| PFA Name required | PFA Name optional | Real CSV data often missing PFAs |
| Next.js 14 + Supabase | React 18 + Vite + IndexedDB | Phase 1 client-only; backend pending |
| Auth via Supabase (PKCE + MFA) | localStorage session auth | Phase 1; Supabase auth pending |
| Offline sync queue | Not needed (fully local) | Sync will be added in Phase 2 with Supabase |
| Row Level Security | Not applicable (no backend) | Will be implemented with Supabase |
| Discipline module | Not implemented | Phase 3 |
| Leave management (UI only) | Stub on dashboard | Phase 2 |
| Recruitment/ATS | Not implemented | Phase 3 |
| Performance appraisals | Not implemented | Phase 4 |
| Training & Skills | Not implemented | Phase 4 |
| Expense management | Not implemented | Phase 4 |


### 23.7 Next Steps (Phase 2 — Backend Integration)

1. Migrate from React 18/Vite to Next.js 14 (App Router)

2. Integrate Supabase Auth (PKCE flow, MFA for HR Admin)

3. Replace IndexedDB local-only reads with Supabase queries + Dexie offline cache

4. Implement sync queue for offline mutations

5. Add Row Level Security policies per §15.3

6. Build Leave & Attendance module

7. Add data export (CSV/PDF) from all modules

8. Implement notification system

### 23.8 Quality Metrics

- **Tests:** 88/88 passing (100%)

- **Build:** Production build succeeds (no errors, no warnings beyond vite deprecation notices)

- **Accessibility:** ARIA labels on interactive elements, keyboard navigation, semantic HTML, screen reader support

- **Code Quality:** ESLint + Prettier configured, consistent code style

- **Performance:** Route-level code splitting, lazy-loaded page components

- **Security:** Protected routes, localStorage session management (to be upgraded to Supabase Auth)


*End of TaniHR PRD v4.0 — Client Phase 1 Complete*

