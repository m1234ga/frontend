'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface DecodedToken extends JwtPayload {
  userId: string;
  username: string;
  role?: string;
}

interface User {
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

  const logout = useCallback(() => {
    localStorage.setItem('token', '');
    localStorage.setItem('user', '');
    setToken(null);
    setUser(null);
    setAuthenticated(false);
    router.push('/auth');
  }, [router]);

  useEffect(() => {
    // Check for token in local storage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(storedToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp < currentTime) {
          // Token expired
          logout();
        } else {
          setToken(storedToken);
          setAuthenticated(true);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Optionally fetch user from API if not in local storage
            // For now, reconstruct from token + placeholder or just rely on what we have
            setUser({
              id: decoded.userId,
              username: decoded.username,
              email: '', // Token might not have email
              role: decoded.role
            });
          }
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setAuthenticated(true);
    router.push('/Chat'); // Redirect to chat after login
  }, [router]);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    authenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
