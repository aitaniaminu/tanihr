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
    hod_id UUID REFERENCES employees(id),
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

CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    document_type TEXT DEFAULT 'other',
    file_name TEXT NOT NULL,
    file_url TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all access to employee_documents" ON employee_documents
    FOR ALL USING (true) WITH CHECK (true);

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

-- Nigerian States
CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    capital TEXT,
    zone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all 36 Nigerian states + FCT
INSERT INTO states (name, capital, zone) VALUES
    ('Abia', 'Umuahia', 'South East'),
    ('Adamawa', 'Yola', 'North East'),
    ('Akwa Ibom', 'Uyo', 'South South'),
    ('Anambra', 'Awka', 'South East'),
    ('Bauchi', 'Bauchi', 'North East'),
    ('Bayelsa', 'Yenagoa', 'South South'),
    ('Benue', 'Makurdi', 'North Central'),
    ('Borno', 'Maiduguri', 'North East'),
    ('Cross River', 'Calabar', 'South South'),
    ('Delta', 'Asaba', 'South South'),
    ('Ebonyi', 'Abakaliki', 'South East'),
    ('Edo', 'Benin', 'South South'),
    ('Ekiti', 'Ado Ekiti', 'South West'),
    ('Enugu', 'Enugu', 'South East'),
    ('FCT', 'Abuja', 'North Central'),
    ('Gombe', 'Gombe', 'North East'),
    ('Imo', 'Owerri', 'South East'),
    ('Jigawa', 'Dutse', 'North West'),
    ('Kaduna', 'Kaduna', 'North West'),
    ('Kano', 'Kano', 'North West'),
    ('Katsina', 'Katsina', 'North West'),
    ('Kebbi', 'Birnin Kebbi', 'North West'),
    ('Kogi', 'Okene', 'North Central'),
    ('Kwara', 'Ilorin', 'North Central'),
    ('Lagos', 'Ikeja', 'South West'),
    ('Nasarawa', 'Lafia', 'North Central'),
    ('Niger', 'Minna', 'North Central'),
    ('Ogun', 'Abeokuta', 'South West'),
    ('Ondo', 'Akure', 'South West'),
    ('Osun', 'Osogbo', 'South West'),
    ('Oyo', 'Ibadan', 'South West'),
    ('Plateau', 'Jos', 'North Central'),
    ('Rivers', 'Port Harcourt', 'South South'),
    ('Sokoto', 'Sokoto', 'North West'),
    ('Taraba', 'Jalingo', 'North East'),
    ('Yobe', 'Damaturu', 'North East'),
    ('Zamfara', 'Gusau', 'North West')
ON CONFLICT (name) DO NOTHING;