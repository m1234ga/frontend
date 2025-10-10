'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { login, loading, authenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!authenticated) {
        login(); // triggers Keycloak redirect
      } else {
        router.push('/chat');
      }
    }
  }, [loading, authenticated, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
        <p className="mt-4 text-gray-600">
          {loading ? 'Checking authentication...' : authenticated ? 'Redirecting to chat...' : 'Redirecting to login...'}
        </p>
      </div>
    </div>
  );
}
