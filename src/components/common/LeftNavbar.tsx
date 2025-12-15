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
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user has admin access
  const hasAdminAccess = user?.role === 'admin' || user?.role === 'user-manager';

  const allNavItems = [
    {
      icon: MessageSquare,
      label: 'Chats',
      path: '/chat',
      color: 'text-soft-primary',
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
      color: 'text-emerald-500',
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
    <div className="h-screen py-6 pl-4 flex flex-col z-50">
      {/* Glass Dock Container */}
      <div className="glass-panel w-20 flex-1 flex flex-col items-center py-6 space-y-6">

        {/* Logo / Home */}
        <button
          onClick={() => router.push('/chat')}
          className="w-12 h-12 bg-gradient-to-br from-soft-primary to-soft-primary-light rounded-2xl flex items-center justify-center shadow-soft-lg hover:scale-110 transition-transform duration-200"
          title="Home"
        >
          <Home className="w-6 h-6 text-white" />
        </button>

        {/* Divider */}
        <div className="w-8 h-px bg-gray-200 dark:bg-gray-700/50"></div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col space-y-3 w-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${active
                    ? 'bg-soft-primary/10 text-soft-primary shadow-soft-sm'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />

                {/* Active Indicator Dot */}
                {active && (
                  <div className="absolute right-2 top-2 w-1.5 h-1.5 bg-soft-primary rounded-full animate-pulse"></div>
                )}

                {/* Soft Tooltip */}
                <div className="absolute left-14 px-4 py-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none transition-all duration-200 whitespace-nowrap shadow-soft-xl border border-gray-100 dark:border-gray-700 z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 group relative"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? (
            <div className="bg-amber-100 p-2 rounded-xl text-amber-500 group-hover:rotate-12 transition-transform">
              <Sun className="w-5 h-5" />
            </div>
          ) : (
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-500 group-hover:-rotate-12 transition-transform">
              <Moon className="w-5 h-5" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

