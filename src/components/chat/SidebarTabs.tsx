"use client";

import React from 'react';

export type SidebarTabType = 'chats' | 'open' | 'closed' | 'assigned' | 'archived' | 'contacts' | 'favorites';

interface SidebarTabsProps {
    activeTab: SidebarTabType;
    onTabChange: (tab: SidebarTabType) => void;
    unreadCounts?: Record<string, number>;
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
    activeTab,
    onTabChange,
    unreadCounts = {}
}) => {
    const tabs: { id: SidebarTabType; label: string }[] = [
        { id: 'chats', label: 'All' },
        { id: 'open', label: 'Open' },
        { id: 'closed', label: 'Closed' },
        { id: 'assigned', label: 'My Chats' },
        { id: 'archived', label: 'Archived' },
        { id: 'favorites', label: 'Favorites' },
        { id: 'contacts', label: 'Contacts' }
    ];

    return (
        <div className="flex border-b theme-border-primary overflow-x-auto no-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative flex-1 px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                        ? 'theme-text-accent'
                        : 'theme-text-secondary hover:theme-text-primary hover:bg-gray-500/5'
                        }`}
                >
                    {tab.label}
                    {unreadCounts[tab.id] > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] rounded-full">
                            {unreadCounts[tab.id]}
                        </span>
                    )}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-glow-sm" />
                    )}
                </button>
            ))}
        </div>
    );
};
