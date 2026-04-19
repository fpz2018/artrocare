import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const mountedRef = useRef(true);
  const profileFetchedRef = useRef(false);
  const loadingRef = useRef(true);

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
            await new Promise(r => setTimeout(r, 300));
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
          await new Promise(r => setTimeout(r, 300));
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
    let profileTimeoutId;

    // Safety timeout: never stay loading forever
    // Uses a ref to avoid stale closure on the loading state value
    timeoutId = setTimeout(() => {
      if (mountedRef.current && loadingRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }, 8000);

    // Safety net for the profile fetch: if it stalls (bad network, RLS,
    // missing row), unblock protected routes after 3s rather than spinning.
    profileTimeoutId = setTimeout(() => {
      if (mountedRef.current && !profileFetchedRef.current) {
        console.warn('Profile fetch timed out; rendering without profile.');
        setProfileLoaded(true);
      }
    }, 3000);

    async function initAuth() {
      try {
        // If the user explicitly signed out moments ago, honour that and skip session restore.
        const signedOutAt = sessionStorage.getItem('artrocare_signed_out');
        if (signedOutAt && Date.now() - Number(signedOutAt) < 10000) {
          sessionStorage.removeItem('artrocare_signed_out');
          // Force-clear any lingering Supabase tokens from localStorage
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('sb-') && k.includes('auth')) localStorage.removeItem(k);
          });
          if (mountedRef.current) {
            setProfileLoaded(true);
            loadingRef.current = false;
            setLoading(false);
          }
          return;
        }

        // Let Supabase process any hash tokens in the URL
        // (email verification, password recovery)
        const hashParams = window.location.hash;
        const hasAuthTokens = hashParams && (
          hashParams.includes('access_token') ||
          hashParams.includes('refresh_token') ||
          hashParams.includes('type=signup') ||
          hashParams.includes('type=recovery')
        );

        if (hasAuthTokens) {
          await new Promise(r => setTimeout(r, 500));
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth session error:', error);
          if (mountedRef.current) {
            setProfileLoaded(true);
            loadingRef.current = false;
            setLoading(false);
          }
          return;
        }

        if (session?.user && mountedRef.current) {
          setUser(session.user);
          setIsAuthenticated(true);

          // Unblock the UI as soon as we know the session state.
          // The profile fetch continues in the background and gates only
          // role-dependent routes (via profileLoaded).
          loadingRef.current = false;
          setLoading(false);

          // Clean up URL hash after successful auth
          if (hasAuthTokens && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }

          const prof = await fetchProfile(session.user.id);
          if (mountedRef.current) {
            setProfile(prof);
            setProfileLoaded(true);
            profileFetchedRef.current = true;
          }
          return;
        }

        if (mountedRef.current) {
          // No session: profile is trivially "loaded" (nothing to load)
          setProfileLoaded(true);
          loadingRef.current = false;
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mountedRef.current) {
          setProfileLoaded(true);
          loadingRef.current = false;
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        // INITIAL_SESSION fires right after the subscription is set up;
        // initAuth already handles page load, so skip to avoid a duplicate
        // profile fetch that re-triggers the spinner.
        if (event === 'INITIAL_SESSION') return;

        // TOKEN_REFRESHED: user/session are unchanged, no need to refetch profile.
        if (event === 'TOKEN_REFRESHED') {
          if (session?.user && mountedRef.current) setUser(session.user);
          return;
        }

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setProfile(null);
          setProfileLoaded(true);
          setIsAuthenticated(false);
          profileFetchedRef.current = false;
          loadingRef.current = false;
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          loadingRef.current = false;
          setLoading(false);

          // Fetch profile on sign-in / user update. If we already have the
          // profile for this user, don't refetch — avoids a spinner flash.
          const needsFetch =
            event === 'SIGNED_IN' ||
            event === 'USER_UPDATED' ||
            !profileFetchedRef.current;
          if (needsFetch) {
            const prof = await fetchProfile(session.user.id);
            if (mountedRef.current) {
              setProfile(prof);
              setProfileLoaded(true);
              profileFetchedRef.current = true;
            }
          }

          // Clean up URL hash after auth callback
          if (window.location.hash.includes('access_token') && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      clearTimeout(profileTimeoutId);
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
    // 1. Clear React state immediately
    setUser(null);
    setProfile(null);
    setProfileLoaded(true);
    setIsAuthenticated(false);
    profileFetchedRef.current = false;
    loadingRef.current = false;

    // 2. Mark signed-out timestamp so initAuth skips session restore on next load
    sessionStorage.setItem('artrocare_signed_out', String(Date.now()));

    // 3. Clear Supabase tokens from localStorage explicitly
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-') && k.includes('auth')) localStorage.removeItem(k);
    });

    // 4. Tell Supabase server-side to invalidate the session
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      // Token already cleared above — safe to continue
    }

    // 5. Hard redirect so React state is fully reset
    window.location.href = '/';
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
    profileLoaded,
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
