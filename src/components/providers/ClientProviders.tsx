'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LeftNavbar } from '@/components/common/LeftNavbar';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = pathname !== '/auth' && pathname !== '/';

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
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
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
