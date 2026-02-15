import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const mountedRef = useRef(true);

  // Fetch user profile from profiles table
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error('Not authenticated');

    // Sanitize updates - remove any undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...cleanUpdates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    if (mountedRef.current) setProfile(data);
    return data;
  }, [user]);

  // Initialize auth state
  useEffect(() => {
    mountedRef.current = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mountedRef.current) {
          setUser(session.user);
          setIsAuthenticated(true);
          const prof = await fetchProfile(session.user.id);
          if (mountedRef.current) setProfile(prof);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);

          // Only re-fetch profile on sign-in, not on token refresh
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const prof = await fetchProfile(session.user.id);
            if (mountedRef.current) setProfile(prof);
          }
        }
        if (mountedRef.current) setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Auth methods
  const signUp = useCallback(async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    if (error) throw error;
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
