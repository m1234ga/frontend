'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <ShieldOff className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Access Denied
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-2">
          This page is restricted to administrators only.
        </p>

        {user && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            You are signed in as <span className="font-medium text-gray-700 dark:text-gray-300">{user.username}</span> with role <span className="font-medium text-gray-700 dark:text-gray-300">{user.role || 'user'}</span>.
          </p>
        )}

        <button
          onClick={() => router.push('/chat')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <MessageSquare className="w-5 h-5" />
          Go to Chat
        </button>
      </div>
    </div>
  );
}
