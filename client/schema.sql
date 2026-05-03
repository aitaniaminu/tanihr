-- Drop all existing tables first
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS ranks CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS pfas CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Then create fresh
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
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

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    parent_id UUID REFERENCES departments(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ranks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL,
    step_max INTEGER DEFAULT 17,
    salary_structure TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pfas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    pencom_number TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employees (
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

INSERT INTO organizations (name) VALUES ('Tani Nigeria Ltd');