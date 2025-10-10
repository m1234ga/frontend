'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Sun, 
  Moon, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Users,
  Home,
  TrendingUp
} from 'lucide-react';

export const LeftNavbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { keycloak } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user has admin access
  const userRoles = keycloak?.realmAccess?.roles || [];
  const hasAdminAccess = userRoles.includes('admin') || userRoles.includes('user-manager');

  const allNavItems = [
    {
      icon: MessageSquare,
      label: 'Chats',
      path: '/chat',
      color: 'text-cyan-500',
      requiresAdmin: false
    },
    {
      icon: BarChart3,
      label: 'Dashboard',
      path: '/dashboard',
      color: 'text-blue-500',
      requiresAdmin: false
    },
    {
      icon: TrendingUp,
      label: 'Reports',
      path: '/reports',
      color: 'text-purple-500',
      requiresAdmin: false
    },
    {
      icon: Users,
      label: 'Users',
      path: '/users',
      color: 'text-green-500',
      requiresAdmin: true
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      color: 'text-gray-500',
      requiresAdmin: false
    }
  ];

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => !item.requiresAdmin || hasAdminAccess);

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-16 h-screen bg-gray-900 dark:bg-gray-950 border-r border-gray-800 dark:border-gray-900 flex flex-col items-center py-4 space-y-4">
      {/* Logo / Home */}
      <button
        onClick={() => router.push('/chat')}
        className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-cyan-500/50 transition-all duration-200 mb-4"
        title="Home"
      >
        <Home className="w-6 h-6 text-white" />
      </button>

      {/* Divider */}
      <div className="w-10 h-px bg-gray-800 dark:bg-gray-700"></div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                active
                  ? 'bg-gray-800 dark:bg-gray-800 shadow-lg'
                  : 'hover:bg-gray-800/50 dark:hover:bg-gray-800/50'
              }`}
              title={item.label}
            >
              <Icon 
                className={`w-6 h-6 ${active ? item.color : 'text-gray-400 group-hover:text-gray-300'}`} 
              />
              
              {/* Active Indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-r-full"></div>
              )}

              {/* Tooltip */}
              <div className="absolute left-16 ml-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-10 h-px bg-gray-800 dark:bg-gray-700"></div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="w-12 h-12 bg-gray-800 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group relative"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? (
          <Sun className="w-6 h-6 text-yellow-500 group-hover:rotate-90 transition-transform duration-300" />
        ) : (
          <Moon className="w-6 h-6 text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" />
        )}
        
        {/* Tooltip */}
        <div className="absolute left-16 ml-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
        </div>
      </button>
    </div>
  );
};

