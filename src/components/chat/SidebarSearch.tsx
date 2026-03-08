"use client";

import React, { useState } from 'react';
import {
    Search,
    SlidersHorizontal,
    Mail,
    Users,
    ArrowUpDown,
    Calendar,
    X
} from 'lucide-react';

interface FilterState {
    unreadOnly: boolean;
    onlineOnly: boolean;
    sortBy: 'date' | 'name' | 'unread';
    dateFilter: 'all' | 'today' | 'yesterday' | 'week' | 'month';
}

interface SidebarSearchProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
}

const SORT_OPTIONS: Array<{ id: FilterState['sortBy']; label: string }> = [
    { id: 'date', label: 'Recent' },
    { id: 'name', label: 'Name' },
    { id: 'unread', label: 'Unread' }
];

const DATE_OPTIONS: Array<{ id: FilterState['dateFilter']; label: string }> = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'Last 7d' },
    { id: 'month', label: 'Last 30d' }
];

export const SidebarSearch: React.FC<SidebarSearchProps> = ({
    searchTerm,
    onSearchChange,
    filters,
    onFilterChange
}) => {
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters =
        filters.unreadOnly ||
        filters.onlineOnly ||
        filters.dateFilter !== 'all' ||
        filters.sortBy !== 'date';

    const updateFilters = (updates: Partial<FilterState>) => {
        onFilterChange({ ...filters, ...updates });
    };

    const clearFilters = () => {
        onFilterChange({
            unreadOnly: false,
            onlineOnly: false,
            sortBy: 'date',
            dateFilter: 'all'
        });
    };

    return (
        <div className="p-4 border-b theme-border-primary">
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-accent" />
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="chat-input w-full pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400"
                />
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md transition-all ${showFilters || hasActiveFilters
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'theme-text-accent hover:bg-gray-500/20'
                        }`}
                    title="Toggle Filters"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                </button>
            </div>

            {showFilters && (
                <div className="space-y-3 p-3 theme-bg-secondary rounded-xl border theme-border-primary animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                    {/* Quick Filters */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-wider font-bold theme-text-secondary mb-2 opacity-60">Quick Status</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => updateFilters({ unreadOnly: !filters.unreadOnly })}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filters.unreadOnly
                                        ? 'bg-emerald-500 text-white shadow-glow-sm'
                                        : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                                    }`}
                            >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Unread</span>
                            </button>
                            <button
                                onClick={() => updateFilters({ onlineOnly: !filters.onlineOnly })}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filters.onlineOnly
                                        ? 'bg-green-500 text-white shadow-glow-sm'
                                        : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                                    }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>Online</span>
                            </button>
                        </div>
                    </div>

                    {/* Sort By */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-wider font-bold theme-text-secondary mb-2 flex items-center space-x-1 opacity-60">
                            <ArrowUpDown className="w-3 h-3" />
                            <span>Sort By</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {SORT_OPTIONS.map((sort) => (
                                <button
                                    key={sort.id}
                                    onClick={() => updateFilters({ sortBy: sort.id })}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filters.sortBy === sort.id
                                            ? 'bg-gray-800 dark:bg-gray-200 dark:text-gray-900 text-white shadow-sm'
                                            : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                                        }`}
                                >
                                    {sort.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-wider font-bold theme-text-secondary mb-2 flex items-center space-x-1 opacity-60">
                            <Calendar className="w-3 h-3" />
                            <span>Time Period</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {DATE_OPTIONS.map((date) => (
                                <button
                                    key={date.id}
                                    onClick={() => updateFilters({ dateFilter: date.id })}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filters.dateFilter === date.id
                                            ? 'bg-gray-800 dark:bg-gray-200 dark:text-gray-900 text-white shadow-sm'
                                            : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                                        }`}
                                >
                                    {date.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Clear All Filters</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
