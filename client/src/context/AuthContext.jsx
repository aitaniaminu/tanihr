import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(null);

  const login = async (identifier, password) => {
    // Allow local admin login (works even if Supabase is down)
    if ((identifier === 'admin' || identifier === 'admin@tanihr.com') && password === 'admin123') {
      const userData = { username: 'admin', role: 'Super Admin', id: 1 };
      sessionStorage.setItem('tanihr_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    }
    
    // Try Supabase auth
    if (useSupabase === true) {
      try {
        const isEmail = identifier.includes('@');
        const loginField = isEmail ? 'email' : 'username';
        
        const { data, error } = await supabase.auth.signInWithPassword({
          [loginField]: identifier,
          password,
        });

        if (error) throw error;

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    
    return { success: false, error: 'Invalid username or password' };
  };

  const logout = async () => {
    if (useSupabase === true) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    sessionStorage.removeItem('tanihr_user');
    setUser(null);
  };

  const restoreSession = useCallback(async () => {
    await checkSupabase();
    
    try {
      const storedUser = sessionStorage.getItem('tanihr_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      sessionStorage.removeItem('tanihr_user');
      setUser(null);
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isSuperAdmin: user?.role === 'Super Admin' || user?.role === 'HR Admin'
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}