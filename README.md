# TaniHR - Nigerian HRMIS (v2.1)

An offline-first, web-based Human Resources Management Information System designed for Nigerian civil service organisations.

## Features Implemented (Employee Module)

### Module 1: Employee Management ✅
- **Employee List View**
  - Paginated, searchable, sortable data table
  - Columns: File Number, Surname, First Name, Department, Rank, Date of Present Appointment, Status, Retirement indicator
  - Search by: name, File Number, department, rank
  - Filter by: department, status
  - Click any row to open employee's full profile

- **Employee Profile/Form**
  - All 30 fields from the Data Dictionary
  - Computed fields: Age, Years in Service, Retirement Date, Retirement Status
  - Retirement Status Indicator: 🟢 Active / 🟠 Approaching / 🔴 Retired
  - Full validation per PSR guidelines
  - Auto-calculation of retirement date (60 years from DOB OR 35 years from first appointment, whichever comes first)

- **CSV Import System** ✅
  - Download template with exact 30-column headers
  - Upload and parse CSV files (max 15MB)
  - Strict DD-MM-YYYY date validation
  - Row-level error reporting
  - Preview valid/invalid records before import
  - Dynamic reference creation (auto-creates missing Departments, Ranks, PFAs, States, LGAs)
  - Import summary with auto-created references log

### Technology Stack
- **Frontend**: React.js (Vite) + Tailwind CSS
- **Offline Storage**: IndexedDB + Dexie.js
- **CSV Parsing**: PapaParse
- **Date Handling**: Custom utilities for DD-MM-YYYY format

## Project Structure
```
/workspace
├── client/src/
│   ├── db/indexedDB.js          # Dexie database schema
│   ├── data/nigerianData.js     # Nigerian states, LGAs, PFAs, etc.
│   ├── utils/
│   │   ├── dateHelpers.js       # DD-MM-YYYY parsing/formatting
│   │   └── csvValidator.js      # CSV import validation
│   ├── pages/Employees/
│   │   ├── EmployeeList.jsx     # Employee list with search/filter
│   │   ├── EmployeeForm.jsx     # Add/Edit employee form
│   │   └── ImportEmployees.jsx  # CSV import wizard
│   ├── App.jsx                  # Main app with navigation
│   └── main.jsx                 # Entry point
├── templates/
│   └── employee_import_template.csv
└── package.json
```

## Getting Started

### Installation
```bash
cd /workspace
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## Usage

### Adding an Employee Manually
1. Navigate to "Employees" from the sidebar
2. Click "Add Employee" button
3. Fill in all required fields (marked with *)
4. Retirement date is auto-calculated based on Nigerian Civil Service rules
5. Click "Create Employee"

### Importing Employees via CSV
1. Navigate to "Import CSV" from the sidebar
2. Click "Download Template" to get the correct format
3. Fill in employee data using DD-MM-YYYY date format
4. Upload the CSV file
5. Review validation results (valid rows highlighted green, errors in red)
6. Click "Import Valid Records"
7. System will auto-create any missing reference data (Departments, PFAs, etc.)

## Nigerian Civil Service Compliance

- **Date Format**: DD-MM-YYYY throughout UI and CSV
- **Retirement Calculation**: MIN(DOB + 60 years, First Appointment + 35 years)
- **Retirement Status**:
  - 🟢 Active: More than 12 months to retirement
  - 🟠 Approaching: 12 months or less to retirement
  - 🔴 Retired: Retirement date has passed
- **Required Fields**: File Number, Surname, First Name, DOB, Sex, Department, Rank, Salary Grade Level, Type of Appointment, Date of First Appointment, Date of Present Appointment, PFA Name, State, LGA, Status

## Sample Data

A sample CSV file with 5 employees is included in `/templates/employee_import_template.csv` for testing the import functionality.

## Next Steps (Leave Module)

The Leave Management module will be developed next, including:
- Leave types per Nigerian Civil Service (Annual, Sick, Maternity, Paternity, Casual, Study, Compassionate)
- Leave application workflow
- Balance tracking with retirement integration
- Leave approval system
- Calendar view

---

**Version**: 2.1  
**Status**: Employee Module Complete ✅  
**Next Phase**: Leave Management Module
# Fix Authentication
