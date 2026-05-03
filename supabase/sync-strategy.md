# IndexedDB to Supabase Sync Strategy

## Overview
Strategy for migrating data from client-side IndexedDB to Supabase backend with offline-first support.

## Migration Phases

### Phase 1: Initial Sync (One-time migration)
1. Export all data from IndexedDB to JSON
2. Transform data to match Supabase UUID schema
3. Bulk insert via Supabase REST API
4. Verify data integrity

### Phase 2: Dual-Write Mode (Transition)
- Write to both IndexedDB and Supabase simultaneously
- Use IndexedDB as source of truth for reads
- Queue failed Supabase writes for retry

### Phase 3: Supabase-First (Production)
- Switch to Supabase as primary
- Keep IndexedDB for offline cache only
- Use sync queue for offline mutations

## IndexedDB to Supabase Field Mapping

| IndexedDB | Supabase |
|----------|---------|
| employees.id | employees.id (UUID) |
| employees.fileNumber | employees.file_number |
| employees.surname | employees.first_name |
| employees.firstName | employees.first_name |
| employees.department | employees.department_id (FK) |
| employees.rank | employees.rank_id (FK) |
| employees.managerId | employees.manager_id (FK) |
| employees.status | employees.status |
| employees.dateOfBirth | employees.date_of_birth |
| employees.dateOfFirstAppointment | employees.date_of_first_appointment |
| departments.id | departments.id (UUID) |
| departments.name | departments.name |
| departments.parentId | departments.parent_id |
| departments.parentId | departments.parent_id (self-ref) |

## Sync Queue Architecture

```
[IndexedDB] ←→ [Sync Queue] ←→ [Supabase]
  ↓
  └─ Pending operations stored locally
     - CREATE
     - UPDATE
     - DELETE
```

## Offline Mutation Handling

1. **Detect offline state**
   - Monitor navigator.onLine
   - Queue mutations when offline

2. **Queue structure**
   ```javascript
   {
     table: 'employees',
     operation: 'UPDATE',
     data: { id: 1, changes: {...} },
     timestamp: '2026-05-02T12:00:00Z',
     retryCount: 0
   }
   ```

3. **Retry on reconnect**
   - Process queue in FIFO order
   - Exponential backoff on failures
   - Max 3 retries before alerting

## Implementation Notes

### Use Supabase-js for sync
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
```

### Conflict Resolution
- Server wins for all updates
- Client must refresh after sync
- Last-write-wins for non-critical fields

### Optimistic Updates
- Update UI immediately from IndexedDB
- Background sync to Supabase
- Rollback on failure

## Estimated Migration Time
- Employees (1000): ~2 minutes
- Departments (20): ~5 seconds  
- All data: ~5 minutes

## Rollback Plan
1. Keep local IndexedDB backup
2. Can revert to pure client-mode
3. No data loss during migration