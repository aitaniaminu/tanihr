# TaniHR Project Summary

## Project Overview
- **Project Name**: TaniHR - HR Management System
- **Stack**: React + Vite + Tailwind CSS + Dexie.js (IndexedDB) + Supabase
- **Purpose**: Complete HR management system with responsive UI, offline-first data sync

## Session History

### Session 3 (2026-05-06) - Bidirectional Real-Time Database Sync

#### Work Completed
1. **syncEngine.js** (NEW) - Unified bidirectional sync engine:
   - Automatic sync from Supabase → IndexedDB on login
   - Real-time Supabase subscriptions → IndexedDB updates
   - Dexie hooks for automatic IndexedDB → Supabase sync (debounced 2s)
   - Conflict resolution: Supabase as source of truth
   - Offline mode with queued changes
   - Sync status tracking with event listeners

2. **SyncDatabase.jsx** (NEW) - Sync status monitoring UI:
   - Real-time connection status (Online/Offline)
   - Sync state display (Active, Syncing, Offline)
   - Last sync time
   - Force Sync button for manual trigger
   - Clear Local Data button
   - Live sync log viewer
   - How It Works documentation panel

3. **AuthContext.jsx** - Updated to use syncEngine.initializeSync() on login/session restore

4. **useOfflineData.js** - Updated to use syncEngine instead of offlineSync

5. **offlineSync.js** - Now re-exports from syncEngine.js (backward compat)

6. **Sidebar.jsx** - Updated label: "Sync Data" → "Sync Database"

7. **App.jsx** - Renamed import: SyncSupabase → SyncDatabase

8. **DELETED** files:
   - `src/lib/syncSupabase.js` (merged into syncEngine.js)
   - `src/pages/SyncSupabase.jsx` (replaced by SyncDatabase.jsx)

#### Build Verification
- ESLint passed (pre-existing warnings only)
- `npm run build` passed successfully

### Session 2 (2026-05-06) - Sync UI Fix
1. **SyncSupabase.jsx** - Added "Sync from Supabase" button (now replaced by syncEngine)

### Session 1 (2026-05-06) - Responsive UI Improvements
1. **Layout.jsx** - Added responsive container with max-width and adaptive padding
2. **Sidebar.jsx** - Made navigation responsive (mobile detection, collapsible sections)
3. **Dashboard.jsx** - Fixed responsive cards and actions
4. **UserManagement.jsx** - Made modal responsive
5. **Settings.jsx** - Made form responsive
6. **LeaveManagement.jsx** - Made card grids responsive
7. **Skills.jsx** - Made form grids responsive
8. **DocumentVault.jsx** - Made containers responsive
9. **MyProfile.jsx** - Made form responsive

## Architecture

### Sync Engine
```
┌─────────────────────────────────────────────────────┐
│                    Sync Engine                       │
├──────────────────────────┬──────────────────────────┤
│  Supabase → IndexedDB    │  IndexedDB → Supabase    │
│  - Initial fetch on login│  - Dexie hooks (creating │
│  - Real-time subscriptions│    updating, deleting)   │
│  - Pagination (1000/batch)│  - Debounced 2s batch    │
│  - Automatic on reconnect│  - Upsert with conflict   │
│                          │    resolution             │
└──────────────────────────┴──────────────────────────┘
```

## Key Decisions
- Reports uses IndexedDB (db.employees.toArray()) instead of Supabase
- Sync engine handles both directions automatically - no manual intervention needed
- Supabase is the source of truth for conflict resolution
- Offline mode works fully; changes queue and sync when connection restored
- Dexie hooks prevent infinite loops via `isSyncingFromSupabase` flag

## File Locations
- Client: `/home/aminua/Documents/Tani Nigeria Ltd/TaniHR/tanihr/client`
- Backend Schema: `schema.sql` in root
- IndexedDB: `src/db/indexedDB.js`
- Sync Engine: `src/lib/syncEngine.js`
- Sync UI: `src/pages/SyncDatabase.jsx`

## Important Notes
- IndexedDB version is 8 with all tables defined
- Supabase schema has users table with roles TEXT[] array
- Sync is automatic on login - no manual sync button needed for normal operation
- Sync Database page (/sync) shows real-time sync status and logs
