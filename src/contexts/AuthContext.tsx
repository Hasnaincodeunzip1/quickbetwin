import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from '@/services/pushNotifications';

interface Profile {
  id: string;
  phone: string | null;
  name: string | null;
  avatar_url: string | null;
  referral_code: string;
  referred_by: string | null;
  status: string;
  created_at: string;
  vip_level: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

interface UserRole {
  role: 'admin' | 'moderator' | 'user';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string, referralCode?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearAuthStorage = () => {
    // In some mobile WebView / PWA cases, auth storage may not clear reliably.
    // This is a safe fallback: remove any Supabase-style auth token keys.
    try {
      const removeMatching = (storage: Storage) => {
        for (const key of Object.keys(storage)) {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            storage.removeItem(key);
          }
        }
      };

      removeMatching(window.localStorage);
      removeMatching(window.sessionStorage);
    } catch {
      // ignore
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return false;
      }
      return data !== null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
      const adminStatus = await fetchUserRole(user.id);
      setIsAdmin(adminStatus);
    }
  };

  useEffect(() => {
    let safetyTimeout: number | undefined;

    const hydrate = async (session: Session | null) => {
      // If auth init was stuck, unstick it as soon as we get *any* signal.
      if (safetyTimeout) {
        window.clearTimeout(safetyTimeout);
        safetyTimeout = undefined;
      }

      // Skip hydration if we're in the middle of logging out
      if (isLoggingOut) {
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Fetch profile and role in parallel, but don't block UI
      Promise.all([
        fetchProfile(session.user.id),
        fetchUserRole(session.user.id),
      ]).then(([profileData, adminStatus]) => {
        setProfile(profileData);
        setIsAdmin(adminStatus);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });

      // Push notifications - completely deferred, runs after 2 seconds
      setTimeout(() => {
        pushNotificationService.initialize()
          .then(() => pushNotificationService.requestPermission())
          .then((granted) => {
            if (granted && session.user) {
              pushNotificationService.registerToken(session.user.id);
            }
          })
          .catch(() => {});
      }, 2000);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignore SIGNED_IN events during logout to prevent re-auth
        if (isLoggingOut && event === 'SIGNED_IN') {
          return;
        }
        await hydrate(session);
      }
    );

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        hydrate(session);
      })
      .catch((e) => {
        console.error('getSession failed:', e);
        hydrate(null);
      });

    // Safety: never allow the whole app to be stuck in auth loading forever.
    // If session hydration doesn't complete within a few seconds, allow UI to render.
    safetyTimeout = window.setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => {
      if (safetyTimeout) window.clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [isLoggingOut]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, name?: string, referralCode?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get referral code from parameter or localStorage
      const refCode = referralCode || localStorage.getItem('referral_code');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: name || 'Player',
            referred_by: refCode || null,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Clear the stored referral code after successful signup
      localStorage.removeItem('referral_code');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    // Set flag to prevent auth state listener from re-hydrating during logout
    setIsLoggingOut(true);
    
    // Remove device token in background (should not block UI/logout)
    if (user) {
      void pushNotificationService.removeToken(user.id).catch(() => {
        /* ignore */
      });
    }
    
    // Clear storage FIRST before anything else
    clearAuthStorage();
    
    // Clear all state
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAdmin(false);
    
    try {
      // Sign out locally first (most common case)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('Local sign out failed:', e);
    }
    
    // Clear storage again after signOut
    clearAuthStorage();

    // Defensive: if a session still exists, force a global sign-out.
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await supabase.auth.signOut({ scope: 'global' });
        clearAuthStorage();
      }
    } catch (e) {
      console.warn('Post-logout session check failed:', e);
    }

    // Reset flags after a small delay to ensure navigation happens first
    setTimeout(() => {
      setIsLoggingOut(false);
      setIsLoading(false);
    }, 100);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAuthenticated: !!user,
        isAdmin,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
