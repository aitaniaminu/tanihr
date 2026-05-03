# Row Level Security (RLS) Policies

## Overview
Documented RLS policies for TaniHR Supabase tables.

## Employees Table

### Policy: Employees can read all (HR Admin+)
```sql
CREATE POLICY "HR Admin can read all employees" ON employees
  FOR SELECT
  USING (
    auth.role() IN ('authenticated', 'anon') 
    OR (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('Super Admin', 'HR Admin', 'Manager')
      )
    )
  );
```

### Policy: Employees can update own profile
```sql
CREATE POLICY "Employees can update own profile" ON employees
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM users WHERE role IN ('Super Admin', 'HR Admin')
    )
    OR id = (
      SELECT employee_id FROM users 
      WHERE users.id = auth.uid()
    )
  );
```

### Policy: Only HR Admin can insert/delete
```sql
CREATE POLICY "HR Admin can insert employees" ON employees
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT users.id FROM users 
      WHERE users.role IN ('Super Admin', 'HR Admin')
    )
  );
```

## Users Table

### Policy: Users can read their own profile
```sql
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  USING (id = auth.uid());
```

### Policy: HR Admin can read all users
```sql
CREATE POLICY "HR Admin can read all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('Super Admin', 'HR Admin')
    )
  );
```

### Policy: Only Super Admin can manage users
```sql
CREATE POLICY "Super Admin can manage users" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role = 'Super Admin'
    )
  );
```

## Leave Requests

### Policy: Employees can view own requests
```sql
CREATE POLICY "Employees can view own leave requests" ON leave_requests
  FOR SELECT
  USING (
    employee_id = (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('Super Admin', 'HR Admin', 'Manager')
    )
  );
```

### Policy: Manager can approve team requests
```sql
CREATE POLICY "Manager can approve team leave" ON leave_requests
  FOR UPDATE
  USING (
    status = 'Pending'
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN employees e ON e.id = u.employee_id
      WHERE u.id = auth.uid()
      AND e.manager_id = leave_requests.employee_id
    )
  );
```

### Policy: HR Admin can manage all
```sql
CREATE POLICY "HR Admin leave all" ON leave_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('Super Admin', 'HR Admin')
    )
  );
```

## Attendance

### Policy: Employees can view own attendance
```sql
CREATE POLICY "View own attendance" ON attendance
  FOR SELECT
  USING (
    employee_id = (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('Super Admin', 'HR Admin', 'Manager')
    )
  );
```

### Policy: Manager can record team attendance
```sql
CREATE POLICY "Manager record team attendance" ON attendance
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN users u ON u.employee_id = e.id
      WHERE u.id = auth.uid()
      OR e.manager_id = (
        SELECT employee_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

## Documents

### Policy: Employee can view own documents
```sql
CREATE POLICY "View own documents" ON documents
  FOR SELECT
  USING (
    employee_id = (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('Super Admin', 'HR Admin')
    )
  );
```

### Policy: Employee can upload own documents
```sql
CREATE POLICY "Upload own documents" ON documents
  FOR INSERT
  WITH CHECK (
    employee_id = (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('Super Admin', 'HR Admin')
    )
  );
```

## Audit Log

### Policy: Only HR Admin can view audit logs
```sql
CREATE POLICY "HR Admin view audit" ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('Super Admin', 'HR Admin')
    )
  );
```

## Expense Claims

### Policy: Employee can view own claims
```sql
CREATE POLICY "View own expenses" ON expense_claims
  FOR SELECT
  USING (
    employee_id = (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
      AND u2.role IN ('Super Admin', 'HR Admin', 'Manager')
    )
  );
```

## Testing RLS

```sql
-- Test as authenticated user
SELECT 
  auth.uid() AS current_user,
  (
    SELECT role FROM users WHERE id = auth.uid()
  ) AS role;

-- Check what policies apply
SELECT * FROM pg_policies WHERE tablename = 'employees';
```

## Security Notes

1. All RLS policies use `auth.uid()` to identify current user
2. Service role key bypasses all RLS (use only in migrations)
3. Always test policies with different user roles
4. Audit all policy changes