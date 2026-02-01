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
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
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
    const hydrate = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const [profileData, adminStatus] = await Promise.all([
        fetchProfile(session.user.id),
        fetchUserRole(session.user.id),
      ]);

      setProfile(profileData);
      setIsAdmin(adminStatus);
      setIsLoading(false);

      // Push notifications should NOT block auth/UI; run in background.
      (async () => {
        try {
          await pushNotificationService.initialize();
          const granted = await pushNotificationService.requestPermission();
          if (granted) {
            await pushNotificationService.registerToken(session.user.id);
          }
        } catch (e) {
          console.warn('Push notification init failed:', e);
        }
      })();
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await hydrate(session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      hydrate(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const signup = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: name || 'Player',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    // Remove device token in background (should not block UI/logout)
    if (user) {
      void pushNotificationService.removeToken(user.id).catch(() => {
        /* ignore */
      });
    }
    
    // Clear all state first before signOut to ensure clean slate
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAdmin(false);
    setIsLoading(true);
    
    try {
      // Sign out locally first (most common case)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('Local sign out failed:', e);
    } finally {
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

      setIsLoading(false);
    }
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
