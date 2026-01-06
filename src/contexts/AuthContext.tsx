import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, mockUser } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithOTP: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  sendOTP: (phone: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - in real app, this would call Supabase auth
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for admin login
    if (email === 'admin@colorwin.com' && password === 'admin123') {
      setUser({ ...mockUser, isAdmin: true, email: 'admin@colorwin.com', name: 'Admin User' });
      return true;
    }
    
    // Regular user login
    if (email && password.length >= 6) {
      setUser({ ...mockUser, email });
      return true;
    }
    
    return false;
  };

  const sendOTP = async (phone: string): Promise<boolean> => {
    // Mock OTP send
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('OTP sent to:', phone);
    return true;
  };

  const loginWithOTP = async (phone: string, otp: string): Promise<boolean> => {
    // Mock OTP verification - accept any 6-digit OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      setUser({ ...mockUser, phone });
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin,
        login,
        loginWithOTP,
        logout,
        sendOTP,
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
