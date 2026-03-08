"use client";

import React, { useState } from 'react';
import { User, Plus, MoreVertical, BarChart3, LogOut } from 'lucide-react';
import type { User as AuthUser } from '@/contexts/AuthContext';

interface SidebarHeaderProps {
    user: AuthUser | null;
    onNewChat: () => void;
    onLogout: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
    user,
    onNewChat,
    onLogout
}) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    return (
        <div className="tech-header p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold theme-text-primary">
                        {user?.firstName || user?.username || 'User'}
                    </h2>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={onNewChat}
                    className="p-2 hover:bg-gray-500/20 rounded-lg transition-colors"
                    title="Start New Chat"
                >
                    <Plus className="w-5 h-5 text-gray-300 hover:text-white" />
                </button>
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 theme-text-accent" />
                    </button>
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <a
                                href="/dashboard"
                                className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition-colors"
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Dashboard
                            </a>
                            <button
                                onClick={onLogout}
                                className="flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition-colors border-t border-gray-100 dark:border-gray-700"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
