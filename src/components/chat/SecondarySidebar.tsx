"use client";

import React from 'react';
import { X, Star, Pin, Notebook as Note, MessageCircle } from 'lucide-react';
import { ChatMessage } from '../../../../Shared/Models';

interface SecondarySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'favorites' | 'pinned' | 'notes';
    items: SecondarySidebarItem[];
    onItemClick?: (item: SecondarySidebarItem) => void;
}

interface SecondarySidebarItem {
    id?: string;
    pushName?: string;
    timeStamp?: string | number | Date;
    message?: string;
}

export const SecondarySidebar: React.FC<SecondarySidebarProps> = ({
    isOpen,
    onClose,
    type,
    items,
    onItemClick
}) => {
    if (!isOpen) return null;

    const titles = {
        favorites: 'Favorite Messages',
        pinned: 'Pinned Messages',
        notes: 'Chat Notes'
    };

    const icons = {
        favorites: <Star className="w-5 h-5 text-yellow-500" />,
        pinned: <Pin className="w-5 h-5 text-blue-500" />,
        notes: <Note className="w-5 h-5 text-purple-500" />
    };

    return (
        <div className="w-[350px] border-l theme-border-primary bg-white dark:bg-black h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl z-20">
            <div className="p-4 border-b theme-border-primary flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center space-x-2">
                    {icons[type]}
                    <h2 className="font-bold theme-text-primary">{titles[type]}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <X className="w-5 h-5 theme-text-secondary" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 opacity-40">
                        <MessageCircle className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">No items found</p>
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            onClick={() => onItemClick?.(item)}
                            className="p-3 bg-gray-50 dark:bg-gray-900 border theme-border-primary rounded-xl hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{item.pushName || 'Contact'}</span>
                                <span className="text-[9px] theme-text-accent">
                                    {item.timeStamp ? new Date(item.timeStamp).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <p className="text-sm theme-text-primary line-clamp-2 italic">"{item.message}"</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
