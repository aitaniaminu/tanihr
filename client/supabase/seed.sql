-- TaniHR Full Seed: Run this in Supabase SQL Editor
-- Creates tables (if not exist), seeds reference data + sample employees

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== TABLES ==========

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rc_number TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    parent_id UUID REFERENCES departments(id),
    hod_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL,
    step_max INTEGER DEFAULT 17,
    salary_structure TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pfas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    pencom_number TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    file_number TEXT NOT NULL UNIQUE,
    ippis_number TEXT,
    psn TEXT,
    surname TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    date_of_birth DATE,
    sex TEXT,
    phone TEXT,
    email TEXT,
    department_name TEXT,
    cadre TEXT,
    rank_name TEXT,
    salary_grade_level TEXT,
    step TEXT,
    appointment_type TEXT DEFAULT 'Permanent',
    date_of_first_appointment DATE,
    date_of_confirmation DATE,
    date_of_present_appointment DATE,
    pfa_name TEXT,
    rsa_pin TEXT,
    state_of_origin TEXT,
    lga TEXT,
    geopolitical_zone TEXT,
    remark TEXT,
    status TEXT DEFAULT 'Active',
    location TEXT,
    qualification TEXT,
    nature_of_job TEXT,
    salary_structure TEXT,
    retirement_date DATE,
    age_on_entry INTEGER,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    capital TEXT,
    zone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== SEED REFERENCE DATA ==========

INSERT INTO organizations (name)
SELECT 'Tani Nigeria Ltd'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Tani Nigeria Ltd');

INSERT INTO states (name, capital, zone) VALUES
    ('Abia', 'Umuahia', 'South East'), ('Adamawa', 'Yola', 'North East'),
    ('Akwa Ibom', 'Uyo', 'South South'), ('Anambra', 'Awka', 'South East'),
    ('Bauchi', 'Bauchi', 'North East'), ('Bayelsa', 'Yenagoa', 'South South'),
    ('Benue', 'Makurdi', 'North Central'), ('Borno', 'Maiduguri', 'North East'),
    ('Cross River', 'Calabar', 'South South'), ('Delta', 'Asaba', 'South South'),
    ('Ebonyi', 'Abakaliki', 'South East'), ('Edo', 'Benin', 'South South'),
    ('Ekiti', 'Ado Ekiti', 'South West'), ('Enugu', 'Enugu', 'South East'),
    ('FCT', 'Abuja', 'North Central'), ('Gombe', 'Gombe', 'North East'),
    ('Imo', 'Owerri', 'South East'), ('Jigawa', 'Dutse', 'North West'),
    ('Kaduna', 'Kaduna', 'North West'), ('Kano', 'Kano', 'North West'),
    ('Katsina', 'Katsina', 'North West'), ('Kebbi', 'Birnin Kebbi', 'North West'),
    ('Kogi', 'Okene', 'North Central'), ('Kwara', 'Ilorin', 'North Central'),
    ('Lagos', 'Ikeja', 'South West'), ('Nasarawa', 'Lafia', 'North Central'),
    ('Niger', 'Minna', 'North Central'), ('Ogun', 'Abeokuta', 'South West'),
    ('Ondo', 'Akure', 'South West'), ('Osun', 'Osogbo', 'South West'),
    ('Oyo', 'Ibadan', 'South West'), ('Plateau', 'Jos', 'North Central'),
    ('Rivers', 'Port Harcourt', 'South South'), ('Sokoto', 'Sokoto', 'North West'),
    ('Taraba', 'Jalingo', 'North East'), ('Yobe', 'Damaturu', 'North East'),
    ('Zamfara', 'Gusau', 'North West')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (name) VALUES
    ('Administration'), ('Finance'), ('Human Resources'), ('IT'), ('Operations'),
    ('Marketing'), ('Sales'), ('Engineering'), ('Legal'), ('Procurement'),
    ('Audit'), ('Security'), ('Medical'), ('Transport'), ('Agriculture'),
    ('Education'), ('Works'), ('Housing'), ('Environment'), ('Water Resources')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ranks (name, level) VALUES
    ('Director', 1), ('Deputy Director', 2), ('Assistant Director', 3),
    ('Chief Officer', 4), ('Senior Officer', 5), ('Officer I', 6),
    ('Officer II', 7), ('Officer III', 8), ('Clerk I', 9), ('Clerk II', 10),
    ('Driver', 11), ('Messenger', 12), ('Director General', 1),
    ('Permanent Secretary', 2), ('Under Secretary', 3),
    ('Chief Principal Secretary', 4), ('Principal Secretary', 5),
    ('Senior Secretary', 6), ('Secretary', 7), ('Assistant Secretary', 8)
ON CONFLICT (name) DO NOTHING;

INSERT INTO salary_structures (name) VALUES
    ('CONUSS'), ('CONHESS'), ('CONRAISS'), ('CONMESS'),
    ('CONTISS'), ('CONPASS'), ('CONJUSS'), ('COS')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pfas (name) VALUES
    ('Leadway Pensure'), ('Stanbic IBTC Pension Managers'), ('ARM Pension Managers'),
    ('Access Pension Fund'), ('AIICO Pension Managers'), ('Cornerstone Pension Fund'),
    ('Crusader Sterling Pension Fund'), ('Fidelity Pension Managers'),
    ('First Pension Custodian'), ('FCMB Pension Fund'), ('Guinea Trust Pension Fund'),
    ('Heritage Pension Fund')
ON CONFLICT (name) DO NOTHING;

-- ========== VERIFY ==========
SELECT 'organizations' AS tbl, count(*) FROM organizations
UNION ALL SELECT 'departments', count(*) FROM departments
UNION ALL SELECT 'ranks', count(*) FROM ranks
UNION ALL SELECT 'salary_structures', count(*) FROM salary_structures
UNION ALL SELECT 'pfas', count(*) FROM pfas
UNION ALL SELECT 'states', count(*) FROM states;
