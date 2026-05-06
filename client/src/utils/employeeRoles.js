import { db } from '../db/indexedDB';

export async function assignEmployeeRoleToAllEmployees() {
  try {
    const employees = await db.employees.toArray();
    const existingUsers = await db.users.toArray();
    const existingUsernames = new Set(existingUsers.map(u => u.username.toLowerCase()));
    
    let created = 0;
    let skipped = 0;
    
    for (const emp of employees) {
      const username = generateUsername(emp);
      
      if (existingUsernames.has(username.toLowerCase())) {
        skipped++;
        continue;
      }
      
      await db.users.add({
        username: username,
        email: emp.email || null,
        password: null,
        roles: ['employee'],
        primaryRole: 'employee',
        role: 'Employee',
        employeeId: emp.id,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
      });
      
      existingUsernames.add(username.toLowerCase());
      created++;
    }
    
    return { success: true, created, skipped, total: employees.length };
  } catch (error) {
    console.error('Error assigning employee roles:', error);
    return { success: false, error: error.message };
  }
}

function generateUsername(emp) {
  const firstName = (emp.firstName || 'employee').toLowerCase().replace(/[^a-z0-9]/g, '');
  const lastName = (emp.surname || emp.lastName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileNumber = (emp.fileNumber || '').replace(/[^0-9]/g, '');
  
  if (firstName && lastName) {
    return `${firstName}.${lastName}${fileNumber ? '.' + fileNumber : ''}`;
  }
  
  return `employee${fileNumber || emp.id || Math.random().toString(36).substr(2, 9)}`;
}

export async function createUserForEmployee(employee) {
  try {
    const username = generateUsername(employee);
    
    const existingUser = await db.users.where('username').equals(username).first();
    if (existingUser) {
      return { success: false, error: 'User already exists', username };
    }
    
    const tempPassword = Math.random().toString(36).substr(2, 12);
    
    const userId = await db.users.add({
      username: username,
      email: employee.email || null,
      password: tempPassword,
      roles: ['employee'],
      primaryRole: 'employee',
      role: 'Employee',
      employeeId: employee.id,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    });
    
    return { success: true, userId, username, tempPassword };
  } catch (error) {
    console.error('Error creating user for employee:', error);
    return { success: false, error: error.message };
  }
}

export async function getEmployeeUserAccount(employeeId) {
  try {
    const user = await db.users.where('employeeId').equals(employeeId).first();
    return user || null;
  } catch (error) {
    console.error('Error getting employee user account:', error);
    return null;
  }
}

export async function ensureEmployeeRoleForAllUsers() {
  try {
    const users = await db.users.toArray();
    let updated = 0;
    
    for (const user of users) {
      const roles = user.roles || [];
      const hasEmployeeRole = roles.includes('employee');
      
      if (!hasEmployeeRole) {
        const newRoles = [...roles, 'employee'];
        const primaryRole = user.primaryRole || roles[0] || 'employee';
        await db.users.update(user.id, {
          roles: newRoles,
          primaryRole: primaryRole,
          role: primaryRole === 'employee' ? 'Employee' : user.role,
        });
        updated++;
      }
    }
    
    return { success: true, updated, total: users.length };
  } catch (error) {
    console.error('Error ensuring employee roles:', error);
    return { success: false, error: error.message };
  }
}