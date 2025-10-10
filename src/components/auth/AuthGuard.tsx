'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authenticated, loading, login } = useAuth();

  useEffect(() => {
    if (!loading && !authenticated) {
      login(); // redirect to Keycloak
    }
  }, [loading, authenticated, login]);

  if (loading) return <LoadingSpinner />;

  if (!authenticated) return null; // login() redirected

  return <>{children}</>;
}