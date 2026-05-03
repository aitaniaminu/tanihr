# TaniHR - Nigerian HRMIS (v3.0)

An offline-first, web-based Human Resources Management Information System designed for Nigerian civil service organisations.

## Features Implemented (Employee Module)

### Module 1: Employee Management
- **Employee List View**
  - Server-side pagination (20 records per page)
  - Searchable, sortable data table
  - Columns: File Number, Name, Department, Rank
  - Search by: name, File Number, department
  - Delete with confirmation modal

- **Employee Profile/Form**
  - 30 fields from Data Dictionary
  - Full validation per PSR guidelines
  - Avatar upload support

- **Employee Details**
  - Personal information section
  - Service information section
  - Offline-first with Supabase sync

### Technology Stack
- **Frontend**: React.js (Vite) + Tailwind CSS
- **Database**: Supabase (PostgreSQL) - source of truth
- **Offline Storage**: IndexedDB + Dexie.js (local cache)
- **Authentication**: Supabase Auth with PKCE

## Architecture

### Offline-First Sync Strategy
```
Page Load → Supabase (fetch all needed)
           ↓
         IndexedDB (cache for offline)
           ↓
   Supabase on next online
```

### Server-Side Pagination
- Use Supabase `.range(from, to)` for efficient fetches
- Get exact count with `{ count: 'exact', head: true }`
- Search filtering on server side

## Project Structure
```
/client/src/
├── lib/
│   ├── supabase.js           # Supabase client
│   └── syncSupabase.js      # Sync utilities
├── db/
│   └── indexedDB.js        # Dexie offline cache
├── pages/
│   ├── Employees/
│   │   ├── EmployeeList.jsx     # Paginated list
│   │   ├── EmployeeForm.jsx      # Add/Edit form
│   │   └── EmployeeDetails.jsx   # View details
│   ├── Dashboard.jsx
│   ├── OrgChart.jsx
│   └── DocumentVault.jsx
├── context/
│   └── AuthContext.jsx    # Auth provider
└── App.jsx
```

## Getting Started

### Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Installation
```bash
cd client
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

## Commands
```bash
npm run dev          # Start dev server
npm run build       # Production build
npm run test:run   # Run tests
npm run lint        # ESLint check
npm run format     # Prettier format
```

## Best Practices (from Odoo HR research)

Implemented:
- Unified employee profile with contract history
- Server-side pagination for large datasets
- Offline-first with Supabase sync
- Role-based access control

Future Enhancements:
- Skills/certifications tracking
- Timesheet integration
- Leave management
- Document vault
- Employee self-service portal

## Version History

- **v3.0**: Supabase integration, server-side pagination
- **v2.1**: Offline-first with IndexedDB
- **v2.0**: Employee module complete

---

**Status**: Active Development
**Supabase Records**: ~3,084 employees