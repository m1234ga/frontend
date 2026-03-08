"use client";

import React, { useState } from 'react';
import { X, UserPlus, Search, User } from 'lucide-react';

interface AssignChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (userId: string) => void;
    availableUsers: { id: string; username: string; firstName?: string; lastName?: string }[];
    isLoading?: boolean;
}

export const AssignChatModal: React.FC<AssignChatModalProps> = ({
    isOpen,
    onClose,
    onAssign,
    availableUsers,
    isLoading
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const normalizedSearch = searchTerm.toLowerCase();
    const filteredUsers = availableUsers.filter(u => {
        const username = (u.username || '').toLowerCase();
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
        return username.includes(normalizedSearch) || fullName.includes(normalizedSearch);
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold theme-text-primary">Assign Conversation</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 theme-text-secondary" />
                    </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-black/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                    </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-8 text-center text-sm theme-text-secondary">
                            No agents found matching "{searchTerm}"
                        </div>
                    ) : (
                        filteredUsers.map((agent) => (
                            <button
                                key={agent.id}
                                onClick={() => onAssign(agent.id)}
                                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left group"
                            >
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-colors">
                                    <User className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold theme-text-primary truncate">
                                        {agent.firstName} {agent.lastName}
                                    </p>
                                    <p className="text-xs theme-text-secondary truncate">@{agent.username}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-black/20 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm font-bold theme-text-accent hover:theme-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
