'use client';

import "./globals.css";
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LeftNavbar } from '@/components/common/LeftNavbar';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const showNavbar = pathname !== '/auth' && pathname !== '/';

  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('chat-app-theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
