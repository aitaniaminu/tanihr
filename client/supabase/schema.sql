-- TaniHR Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- Use IF NOT EXISTS to avoid errors on re-runs

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
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

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    parent_id UUID REFERENCES departments(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ranks
CREATE TABLE IF NOT EXISTS ranks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL,
    step_max INTEGER DEFAULT 17,
    salary_structure TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Structures
CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PFAs
CREATE TABLE IF NOT EXISTS pfas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    pencom_number TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
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

-- Insert default organization (use IF NOT EXISTS to avoid duplicate)
INSERT INTO organizations (name) 
SELECT 'Tani Nigeria Ltd' 
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Tani Nigeria Ltd');

-- Employee Skills
CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    name TEXT NOT NULL,
    category TEXT,
    level TEXT DEFAULT 'Intermediate',
    date_obtained DATE,
    date_expires DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Certifications
CREATE TABLE IF NOT EXISTS employee_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    name TEXT NOT NULL,
    provider TEXT,
    status TEXT DEFAULT 'Pending',
    date_obtained DATE,
    date_expires DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Contracts (Promotions, Salary Changes, Position Changes)
CREATE TABLE IF NOT EXISTS employee_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    contract_type TEXT NOT NULL,
    old_department TEXT,
    new_department TEXT,
    old_rank TEXT,
    new_rank TEXT,
    old_salary REAL,
    new_salary REAL,
    old_step TEXT,
    new_step TEXT,
    effective_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'Active',
    approval_letter_no TEXT,
    approved_by UUID REFERENCES employees(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);