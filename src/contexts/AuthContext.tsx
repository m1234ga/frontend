'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import keycloak, { keycloakInitOptions } from '@/lib/keycloak';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar_url?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  keycloak: typeof keycloak | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
  authenticated: boolean;
}

const defaultContext: AuthContextType = {
  user: null,
  token: null,
  keycloak: null,
  login: () => {},
  logout: () => {},
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
  const [kcReady, setKcReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const opts = {
          ...keycloakInitOptions,
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          onLoad: 'check-sso' as const,
          checkLoginIframe: false,
          promiseType: 'native' as const,
        };

        const res = await keycloak.init(opts);
        setKcReady(true);

        const isAuth = typeof res === 'boolean' ? res : !!keycloak.authenticated;

        if (isAuth) {
          setAuthenticated(true);
          setToken(keycloak.token ?? null);
          try {
            const info = await keycloak.loadUserInfo() as Record<string, unknown>;
            setUser({
              id: (info.sub as string) ?? '',
              username: (info.preferred_username as string) ?? '',
              email: (info.email as string) ?? '',
              firstName: (info.given_name as string) ?? '',
              lastName: (info.family_name as string) ?? '',
              avatar_url: undefined,
              status: 'online',
            });
          } catch (e) {
            // ignore loadUserInfo failures
            console.warn('loadUserInfo failed', e);
          }
        } else {
          setAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Keycloak init error', err);
        setAuthenticated(false);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // token refresh
  useEffect(() => {
    if (!authenticated || !kcReady) return;

    const id = setInterval(() => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            setToken(keycloak.token ?? null);
            sessionStorage.setItem('token', keycloak.token ?? '');
          }
        })
        .catch((err) => {
          console.warn('Token refresh failed', err);
          // if refresh fails, clear local auth state (Keycloak may handle session)
          setAuthenticated(false);
          setUser(null);
          setToken(null);
        });
    }, 20_000);

    return () => clearInterval(id);
  }, [authenticated, kcReady]);

  const login = () => {
    if (typeof window === 'undefined') return;
    if (!keycloak) {
      console.error('Keycloak instance not available');
      return;
    }

    // if already authenticated, update local state
    if (keycloak.authenticated) {
      setAuthenticated(true);
      setToken(keycloak.token ?? null);
      return;
    }

    try {
      // redirect to Keycloak; adjust redirectUri as needed
      keycloak.login({ redirectUri: window.location.origin + '/chat' });
    } catch (err) {
      console.error('Keycloak login error', err);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined' && keycloak) {
      try {
        keycloak.logout({ redirectUri: window.location.origin });
      } catch (err) {
        console.warn('Keycloak logout error', err);
      }
    }
    setUser(null);
    setToken(null);
    setAuthenticated(false);
    sessionStorage.clear();
  };

  const value: AuthContextType = {
    user,
    token,
    keycloak: keycloak ?? null,
    login,
    logout,
    loading,
    authenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
