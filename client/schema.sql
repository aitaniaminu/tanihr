-- TaniHR Database Schema for Supabase
-- Synced with IndexedDB v8
-- Run this in Supabase SQL Editor

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    rc_number TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default organization
INSERT INTO organizations (name) 
SELECT 'Tani Nigeria Ltd' 
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Tani Nigeria Ltd');

-- Departments
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
    manager_id UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Skills
CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
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
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT,
    status TEXT DEFAULT 'Pending',
    date_obtained DATE,
    date_expires DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type TEXT DEFAULT 'other',
    file_name TEXT NOT NULL,
    file_url TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Contracts (Promotions, Salary Changes, Position Changes)
CREATE TABLE IF NOT EXISTS employee_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
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

-- Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    days_allowable INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
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

-- Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    year INTEGER NOT NULL,
    days_used INTEGER DEFAULT 0,
    days_remaining INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Holidays
CREATE TABLE IF NOT EXISTS public_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    scope TEXT DEFAULT 'National',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Logs
CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- USER MANAGEMENT TABLES (Multi-Role Support)

-- Users (replaces old user_roles table)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    password TEXT,
    roles TEXT[] DEFAULT ARRAY['employee'],
    primary_role TEXT DEFAULT 'employee',
    role TEXT,
    employee_id UUID REFERENCES employees(id),
    status TEXT DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_roles CHECK (
        roles IS NULL OR 
        roles <@ ARRAY['super_admin', 'hr_manager', 'line_manager', 'employee', 'recruiter', 'executive']
    )
);

-- Auth Lockouts
CREATE TABLE IF NOT EXISTS auth_lockouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login History
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    username TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'failed_attempt', 'password_change', 'password_reset')),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    device_info TEXT,
    ip_address INET,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE')),
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_employees_file_number ON employees(file_number);
CREATE INDEX IF NOT EXISTS idx_employees_surname ON employees(surname);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_name);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);

CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_hod ON departments(hod_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_logs(employee_id, date);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(username);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed ON audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_by ON audit_log(changed_by);

CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_certifications_employee ON employee_certifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee ON employee_contracts(employee_id);

-- RLS Policies for sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to login_history" ON login_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user_sessions" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to audit_log" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- Drop old user_roles table if exists
DROP TABLE IF EXISTS user_roles CASCADE;