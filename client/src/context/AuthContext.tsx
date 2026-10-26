import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLibrarian: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  quickLoginAs: (role: 'LIBRARIAN' | 'MEMBER') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data?.success && data?.data?.user) {
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data?.success && data?.data?.user) {
      setUser(data.data.user);
      // Also cache token in localStorage as backup for non-cookie environments
      if (data.data.token) {
        localStorage.setItem('libraryhub_token', data.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
      }
    }
  };

  const register = async (payload: any) => {
    const { data } = await api.post('/auth/register', payload);
    if (data?.success && data?.data?.user) {
      setUser(data.data.user);
      if (data.data.token) {
        localStorage.setItem('libraryhub_token', data.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
      }
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('libraryhub_token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const quickLoginAs = async (role: 'LIBRARIAN' | 'MEMBER') => {
    if (role === 'LIBRARIAN') {
      await login('librarian@libraryhub.com', 'Librarian@123');
    } else {
      await login('member@libraryhub.com', 'Member@123');
    }
  };

  const isLibrarian = user?.role === 'LIBRARIAN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLibrarian,
        isLoading,
        login,
        register,
        logout,
        quickLoginAs,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
