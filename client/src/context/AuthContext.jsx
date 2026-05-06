import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import { initializeSync } from '../lib/syncEngine';
import { db } from '../db/indexedDB';

const AuthContext = createContext(null);

export const ROLE_PERMISSIONS = {
  super_admin: {
    label: 'Super Admin',
    canManageUsers: true,
    canManageSettings: true,
    canViewAllEmployees: true,
    canEditAllEmployees: true,
    canManageLeave: true,
    canManageRecruitment: true,
    canManageAppraisals: true,
    canManageTraining: true,
    canManageExpenses: true,
    canViewReports: true,
    canManageDiscipline: true,
    canManagePromotions: true,
    canManagePostings: true,
  },
  hr_manager: {
    label: 'HR Manager',
    canManageUsers: true,
    canManageSettings: false,
    canViewAllEmployees: true,
    canEditAllEmployees: true,
    canManageLeave: true,
    canManageRecruitment: true,
    canManageAppraisals: true,
    canManageTraining: true,
    canManageExpenses: true,
    canViewReports: true,
    canManageDiscipline: true,
    canManagePromotions: true,
    canManagePostings: true,
  },
  line_manager: {
    label: 'Line Manager',
    canManageUsers: false,
    canManageSettings: false,
    canViewAllEmployees: false,
    canEditAllEmployees: false,
    canManageLeave: true,
    canManageRecruitment: false,
    canManageAppraisals: true,
    canManageTraining: false,
    canManageExpenses: true,
    canViewReports: false,
    canManageDiscipline: false,
    canManagePromotions: false,
    canManagePostings: false,
  },
  employee: {
    label: 'Employee',
    canManageUsers: false,
    canManageSettings: false,
    canViewAllEmployees: false,
    canEditAllEmployees: false,
    canManageLeave: true,
    canManageRecruitment: false,
    canManageAppraisals: false,
    canManageTraining: true,
    canManageExpenses: true,
    canViewReports: false,
    canManageDiscipline: false,
    canManagePromotions: false,
    canManagePostings: false,
  },
  recruiter: {
    label: 'Recruiter',
    canManageUsers: false,
    canManageSettings: false,
    canViewAllEmployees: false,
    canEditAllEmployees: false,
    canManageLeave: false,
    canManageRecruitment: true,
    canManageAppraisals: false,
    canManageTraining: false,
    canManageExpenses: false,
    canViewReports: false,
    canManageDiscipline: false,
    canManagePromotions: false,
    canManagePostings: false,
  },
  executive: {
    label: 'Executive',
    canManageUsers: false,
    canManageSettings: false,
    canViewAllEmployees: true,
    canEditAllEmployees: false,
    canManageLeave: false,
    canManageRecruitment: false,
    canManageAppraisals: false,
    canManageTraining: false,
    canManageExpenses: false,
    canViewReports: true,
    canManageDiscipline: false,
    canManagePromotions: false,
    canManagePostings: false,
  },
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function mapLegacyRole(role) {
  const roleMap = {
    'Super Admin': 'super_admin',
    'HR Manager': 'hr_manager',
    'HR Admin': 'hr_manager',
    'Line Manager': 'line_manager',
    'Employee': 'employee',
    'Recruiter': 'recruiter',
    'Executive': 'executive',
  };
  return roleMap[role] || 'employee';
}

function mapRoleToLegacy(role) {
  const roleMap = {
    super_admin: 'Super Admin',
    hr_manager: 'HR Manager',
    line_manager: 'Line Manager',
    employee: 'Employee',
    recruiter: 'Recruiter',
    executive: 'Executive',
  };
  return roleMap[role] || 'Employee';
}

// SECURITY NOTE: Passwords are stored in plain text in IndexedDB for demo purposes.
// In production, use Supabase Auth (signUp/signIn) which handles password hashing securely.
// To migrate: Replace login() with supabase.auth.signInWithPassword() and remove local password storage.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(null);
  const [permissions, setPermissions] = useState(null);

  const checkLockout = async (identifier) => {
    try {
      const lockoutRecords = await db.loginHistory
        .where('username')
        .equals(identifier)
        .filter(record => record.action === 'failed_attempt')
        .toArray();

      const recentFailures = lockoutRecords.filter(r => {
        const hoursSince = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
        return hoursSince < 1;
      });

      if (recentFailures.length >= 5) {
        const lastFailure = recentFailures[recentFailures.length - 1];
        const lockoutEnd = new Date(lastFailure.createdAt).getTime() + 15 * 60 * 1000;
        if (Date.now() < lockoutEnd) {
          return { locked: true, lockedUntil: lockoutEnd };
        }
      }
      return { locked: false };
    } catch (error) {
      console.error('Error checking lockout:', error);
      return { locked: false };
    }
  };

  const recordLoginAttempt = async (identifier, success, failureReason = null) => {
    try {
      await db.loginHistory.add({
        userId: null,
        username: identifier,
        action: success ? 'login' : 'failed_attempt',
        success,
        failureReason,
        ipAddress: null,
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  };

  const computePermissions = (roles) => {
    if (!roles || roles.length === 0) {
      return ROLE_PERMISSIONS.employee;
    }

    const mergedPermissions = {};
    const permissionKeys = [
      'canManageUsers', 'canManageSettings', 'canViewAllEmployees', 'canEditAllEmployees',
      'canManageLeave', 'canManageRecruitment', 'canManageAppraisals', 'canManageTraining',
      'canManageExpenses', 'canViewReports', 'canManageDiscipline', 'canManagePromotions', 'canManagePostings'
    ];

    for (const key of permissionKeys) {
      mergedPermissions[key] = false;
    }

    for (const roleKey of roles) {
      const rolePerms = ROLE_PERMISSIONS[roleKey];
      if (rolePerms) {
        for (const key of permissionKeys) {
          if (rolePerms[key] === true) {
            mergedPermissions[key] = true;
          }
        }
      }
    }

    return mergedPermissions;
  };

  const login = async (identifier, password) => {
    const lockoutStatus = await checkLockout(identifier);
    if (lockoutStatus.locked) {
      const remaining = Math.ceil((lockoutStatus.lockedUntil - Date.now()) / 1000 / 60);
      return { success: false, error: `Account locked. Try again in ${remaining} minutes.` };
    }

    if (identifier === import.meta.env.VITE_ADMIN_USERNAME && password === import.meta.env.VITE_ADMIN_PASSWORD) {
      const userData = {
        username: import.meta.env.VITE_ADMIN_USERNAME,
        role: 'Super Admin',
        roles: ['super_admin'],
        primaryRole: 'super_admin',
        id: 1,
        email: import.meta.env.VITE_ADMIN_USERNAME,
      };
      sessionStorage.setItem('tanihr_user', JSON.stringify(userData));
      setUser(userData);
      setPermissions(computePermissions(['super_admin']));
      initializeSync();
      await recordLoginAttempt(identifier, true);
      await db.users.where('username').equals(identifier).first().then(async (existingUser) => {
        if (existingUser) {
          await db.users.update(existingUser.id, { lastLogin: new Date().toISOString() });
        }
      });
      return { success: true };
    }

    const localUser = await db.users.where('username').equals(identifier).first();
    if (localUser && localUser.password === password) {
      const roles = localUser.roles || [mapLegacyRole(localUser.primaryRole || localUser.role)];
      const userData = {
        id: localUser.id,
        username: localUser.username,
        email: localUser.email,
        role: localUser.primaryRole || localUser.role,
        roles: roles,
        primaryRole: localUser.primaryRole || roles[0],
      };
      sessionStorage.setItem('tanihr_user', JSON.stringify(userData));
      setUser(userData);
      setPermissions(computePermissions(roles));
      initializeSync();
      await recordLoginAttempt(identifier, true);
      await db.users.update(localUser.id, { lastLogin: new Date().toISOString() });
      return { success: true };
    }

    await recordLoginAttempt(identifier, false, 'Invalid credentials');
    return { success: false, error: 'Invalid username or password' };
  };

  const logout = async () => {
    if (user) {
      try {
        await db.loginHistory.add({
          userId: user.id?.toString(),
          username: user.username,
          action: 'logout',
          success: true,
          ipAddress: null,
          userAgent: navigator.userAgent,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error recording logout:', error);
      }
    }

    if (useSupabase === true) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    sessionStorage.removeItem('tanihr_user');
    setUser(null);
    setPermissions(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (user.username === import.meta.env.VITE_ADMIN_USERNAME && currentPassword !== import.meta.env.VITE_ADMIN_PASSWORD) {
      return { success: false, error: 'Current password is incorrect' };
    }

    if (user.username !== 'aminua@tani.com.ng') {
      const localUser = await db.users.where('username').equals(user.username).first();
      if (!localUser || localUser.password !== currentPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }

      await db.users.update(localUser.id, { password: newPassword });
    }

    try {
      await db.loginHistory.add({
        userId: user.id?.toString(),
        username: user.username,
        action: 'password_change',
        success: true,
        ipAddress: null,
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording password change:', error);
    }

    return { success: true };
  };

  const resetPassword = async (identifier, newPassword) => {
    const localUser = await db.users.where('username').equals(identifier).first();
    if (!localUser && identifier !== 'aminua@tani.com.ng') {
      return { success: false, error: 'User not found' };
    }

    if (identifier === import.meta.env.VITE_ADMIN_USERNAME) {
      return { success: false, error: 'Cannot reset admin password' };
    }

    await db.users.update(localUser.id, { password: newPassword });

    try {
      await db.loginHistory.add({
        userId: localUser.id.toString(),
        username: identifier,
        action: 'password_reset',
        success: true,
        ipAddress: null,
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording password reset:', error);
    }

    return { success: true };
  };

  const getLoginHistory = async (limit = 50) => {
    try {
      const history = await db.loginHistory
        .orderBy('createdAt')
        .reverse()
        .limit(limit)
        .toArray();
      return history;
    } catch (error) {
      console.error('Error fetching login history:', error);
      return [];
    }
  };

  const getUserSessions = async () => {
    if (!user) return [];
    try {
      const sessions = await db.userSessions
        .where('userId')
        .equals(user.id?.toString() || user.username)
        .filter(s => s.isActive)
        .toArray();
      return sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      await db.userSessions.update(sessionId, { isActive: false });
      return { success: true };
    } catch (error) {
      console.error('Error terminating session:', error);
      return { success: false, error: 'Failed to terminate session' };
    }
  };

  const terminateAllOtherSessions = async () => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const currentSession = sessionStorage.getItem('tanihr_session_id');
      await db.userSessions
        .where('userId')
        .equals(user.id?.toString() || user.username)
        .modify(s => {
          if (s.sessionToken !== currentSession) {
            s.isActive = false;
          }
        });
      return { success: true };
    } catch (error) {
      console.error('Error terminating sessions:', error);
      return { success: false, error: 'Failed to terminate sessions' };
    }
  };

  const restoreSession = useCallback(async () => {
    await checkSupabase();

    try {
      const storedUser = sessionStorage.getItem('tanihr_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const roles = parsed.roles || [mapLegacyRole(parsed.primaryRole || parsed.role)];
        setUser({ ...parsed, roles, primaryRole: parsed.primaryRole || roles[0] });
        setPermissions(computePermissions(roles));
        initializeSync();
      } else {
        setUser(null);
        setPermissions(null);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      sessionStorage.removeItem('tanihr_user');
      setUser(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSupabase = async () => {
    try {
      const { data, error } = await supabase.from('organizations').select('id').limit(1);
      if (!error && data) {
        setUseSupabase(true);
      } else {
        setUseSupabase(false);
      }
    } catch (error) {
      setUseSupabase(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const hasPermission = (permission) => {
    if (!permissions) return false;
    return permissions[permission] === true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      changePassword,
      resetPassword,
      getLoginHistory,
      getUserSessions,
      terminateSession,
      terminateAllOtherSessions,
      isAuthenticated: !!user,
      isSuperAdmin: user?.roles?.includes('super_admin') || user?.roles?.includes('hr_manager') || user?.role === 'Super Admin' || user?.role === 'HR Manager',
      hasPermission,
      permissions,
      mapRoleToLegacy,
      computePermissions,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}