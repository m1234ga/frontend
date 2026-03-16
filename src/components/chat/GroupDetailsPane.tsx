"use client";

import React from 'react';
import { Users, X, RefreshCw } from 'lucide-react';

type ParticipantOption = {
    id: string;
    name: string;
};

interface GroupDetailsPaneProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    participants: ParticipantOption[];
    isLoading: boolean;
    error?: string;
}

export const GroupDetailsPane: React.FC<GroupDetailsPaneProps> = ({
    isOpen,
    onClose,
    onRefresh,
    participants,
    isLoading,
    error,
}) => {
    if (!isOpen) return null;

    return (
        <aside className="w-[300px] min-w-[260px] max-w-[360px] border-l border-[var(--chat-border)] bg-[var(--chat-panel)] h-full flex flex-col" aria-label="Group participants panel">
            <header className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center justify-between">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--chat-text)] inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[var(--chat-accent)]" />
                        Participants
                    </h3>
                    <p className="text-xs text-[var(--chat-muted)] mt-0.5">{participants.length} member{participants.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={onRefresh} className="p-1.5 rounded-md hover:bg-[var(--chat-accent-soft)]" aria-label="Refresh participants" title="Refresh">
                        <RefreshCw className="w-4 h-4 text-[var(--chat-muted)]" />
                    </button>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--chat-accent-soft)]" aria-label="Close participants panel">
                        <X className="w-4 h-4 text-[var(--chat-muted)]" />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                {isLoading ? (
                    <p className="text-xs text-[var(--chat-muted)] px-2 py-2">Loading...</p>
                ) : error ? (
                    <p className="text-xs text-rose-500 px-2 py-2">{error}</p>
                ) : participants.length === 0 ? (
                    <p className="text-xs text-[var(--chat-muted)] px-2 py-2">No participants</p>
                ) : (
                    participants.map((participant) => (
                        <div key={participant.id} className="px-2 py-2 rounded-md border border-[var(--chat-border)] bg-white/50 dark:bg-slate-900/30">
                            <p className="text-sm text-[var(--chat-text)] truncate">{participant.name || participant.id}</p>
                            <p className="text-[11px] text-[var(--chat-muted)] truncate">{participant.id}</p>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};
