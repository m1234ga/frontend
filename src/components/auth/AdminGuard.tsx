'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, RefreshCw } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredRoles = ['admin', 'user-manager'],
  redirectTo = '/chat',
}) => {
  const { authenticated, loading, keycloak } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      if (loading) {
        return;
      }

      if (!authenticated) {
        router.push('/auth');
        return;
      }

      if (keycloak) {
        const userRoles = keycloak.realmAccess?.roles || [];
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
        
        setHasAccess(hasRequiredRole);
        setChecking(false);

        if (!hasRequiredRole) {
          setTimeout(() => {
            router.push(redirectTo);
          }, 2000);
        }
      }
    };

    checkAccess();
  }, [authenticated, loading, keycloak, requiredRoles, redirectTo, router]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You do not have permission to access this page
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to {redirectTo}...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

