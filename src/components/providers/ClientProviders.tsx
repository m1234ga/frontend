'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LeftNavbar } from '@/components/common/LeftNavbar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, loading, user } = useAuth();

  const isAuthPage = pathname === '/auth';
  const isHomePage = pathname === '/';
  const isUnauthorizedPage = pathname === '/unauthorized';
  const isPublicPage = isAuthPage || isHomePage;
  const isChatPage = pathname === '/chat';
  const isAdmin = user?.role === 'admin' || user?.role === 'user-manager';

  useEffect(() => {
    if (loading) return;

    if (!authenticated && !isPublicPage) {
      router.replace('/auth');
      return;
    }

    if (authenticated && isAuthPage) {
      router.replace('/chat');
      return;
    }

    if (authenticated && !user) {
      return;
    }

    if (authenticated && !isAdmin && !isChatPage && !isHomePage && !isUnauthorizedPage) {
      router.replace('/unauthorized');
    }
  }, [authenticated, loading, user, isPublicPage, isAuthPage, isAdmin, isChatPage, isHomePage, isUnauthorizedPage, router]);

  const showNavbar = pathname !== '/auth' && pathname !== '/';

  return (
    <>
      <Toaster position="top-right" />
      {showNavbar ? (
        <div className="flex h-screen">
          <LeftNavbar />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppShell>
            {children}
          </AppShell>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
