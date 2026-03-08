"use client";

import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface CloseChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    availableTags: { id: string; name: string }[];
}

export const CloseChatModal: React.FC<CloseChatModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    availableTags
}) => {
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!selectedTagId && availableTags.length > 0) {
            alert('Please select a reason for closing this chat.');
            return;
        }
        const tag = availableTags.find(t => t.id === selectedTagId);
        onConfirm(tag?.name || "Closed");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold theme-text-primary">Close Conversation</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 theme-text-secondary" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm theme-text-secondary mb-4">
                        Select a resolution reason to mark this conversation as closed.
                    </p>

                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableTags.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => setSelectedTagId(tag.id)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selectedTagId === tag.id
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-glow-sm'
                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 theme-text-primary hover:border-emerald-500/50'
                                    }`}
                            >
                                <span>{tag.name}</span>
                                {selectedTagId === tag.id && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 dark:bg-black/20 flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold theme-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-glow transition-all active:scale-95"
                    >
                        Confirm Close
                    </button>
                </div>
            </div>
        </div>
    );
};
