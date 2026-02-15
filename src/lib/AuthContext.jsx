import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const mountedRef = useRef(true);
  const profileFetchedRef = useRef(false);

  // Fetch user profile from profiles table
  const fetchProfile = useCallback(async (userId, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile not found yet (trigger may not have fired yet)
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 1000)); // wait 1s
            continue;
          }
          return null;
        }
        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
        return data;
      } catch (err) {
        console.error('Profile fetch error:', err);
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        return null;
      }
    }
    return null;
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error('Not authenticated');

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
    let timeoutId;

    // Safety timeout: never stay loading forever
    timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('Auth loading timeout - forcing complete');
        setLoading(false);
      }
    }, 8000);

    async function initAuth() {
      try {
        // First, let Supabase process any hash tokens in the URL
        // This handles the redirect back from email verification
        const hashParams = window.location.hash;
        const hasAuthTokens = hashParams && (
          hashParams.includes('access_token') ||
          hashParams.includes('refresh_token') ||
          hashParams.includes('type=signup') ||
          hashParams.includes('type=recovery')
        );

        if (hasAuthTokens) {
          // Wait a bit for Supabase to process the hash
          await new Promise(r => setTimeout(r, 500));
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth session error:', error);
          if (mountedRef.current) setLoading(false);
          return;
        }

        if (session?.user && mountedRef.current) {
          setUser(session.user);
          setIsAuthenticated(true);
          const prof = await fetchProfile(session.user.id);
          if (mountedRef.current) {
            setProfile(prof);
            profileFetchedRef.current = true;
          }

          // Clean up URL hash after successful auth
          if (hasAuthTokens && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
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

        console.log('Auth event:', event);

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          profileFetchedRef.current = false;
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);

          // Fetch profile on sign-in or if we haven't fetched it yet
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || !profileFetchedRef.current) {
            const prof = await fetchProfile(session.user.id);
            if (mountedRef.current) {
              setProfile(prof);
              profileFetchedRef.current = true;
            }
          }

          // Clean up URL hash after auth callback
          if (window.location.hash.includes('access_token') && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
        if (mountedRef.current) setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
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
    profileFetchedRef.current = false;
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
