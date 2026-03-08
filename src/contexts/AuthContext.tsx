'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  authenticated: boolean;
}

const defaultContext: AuthContextType = {
  user: null,
  token: null,
  login: () => { },
  logout: () => { },
  loading: true,
  authenticated: false,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/').replace(/\/$/, '');

  const logout = useCallback(() => {
    fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined).finally(() => {
      setToken(null);
      setUser(null);
      setAuthenticated(false);
      router.push('/auth');
    });
  }, [router, baseUrl]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setToken(data.token || null);
          setUser({
            id: data.id,
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
          });
          setAuthenticated(true);
        } else {
          setToken(null);
          setUser(null);
          setAuthenticated(false);
        }
      } catch (error) {
        setToken(null);
        setUser(null);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [baseUrl]);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setAuthenticated(true);
    router.push('/chat'); // Redirect to chat after login
  }, [router]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    login,
    logout,
    loading,
    authenticated,
  }), [user, token, login, logout, loading, authenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
