"use client";

import React, { useMemo } from 'react';
import { ChatMessage } from '../../../../Shared/Models';
import { X, MessageSquareReply } from 'lucide-react';

interface ThreadPaneProps {
    rootMessage: ChatMessage | null;
    allMessages: ChatMessage[];
    onClose: () => void;
    onReply: (message: ChatMessage) => void;
}

const toDate = (value?: string | number | Date) => {
    if (!value) return new Date();
    return value instanceof Date ? value : new Date(value);
};

const formatTime = (value?: string | number | Date) => {
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const ThreadPane: React.FC<ThreadPaneProps> = ({
    rootMessage,
    allMessages,
    onClose,
    onReply
}) => {
    const threadMessages = useMemo(() => {
        if (!rootMessage) return [];

        return allMessages
            .filter((message) => message.id === rootMessage.id || message.replyToMessageId === rootMessage.id)
            .sort((a, b) => toDate(a.timeStamp || a.timestamp).getTime() - toDate(b.timeStamp || b.timestamp).getTime());
    }, [allMessages, rootMessage]);

    if (!rootMessage) return null;

    return (
        <aside className="w-[360px] min-w-[320px] max-w-[420px] border-l border-[var(--chat-border)] bg-[var(--chat-panel)] h-full flex flex-col" aria-label="Thread replies panel">
            <header className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center justify-between">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--chat-text)] inline-flex items-center gap-1.5">
                        <MessageSquareReply className="w-4 h-4 text-[var(--chat-accent)]" />
                        Thread
                    </h3>
                    <p className="text-xs text-[var(--chat-muted)] mt-0.5">{Math.max(threadMessages.length - 1, 0)} repl{threadMessages.length - 1 === 1 ? 'y' : 'ies'}</p>
                </div>
                <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--chat-accent-soft)]" aria-label="Close thread">
                    <X className="w-4 h-4 text-[var(--chat-muted)]" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {threadMessages.map((message) => {
                    const sender = message.isFromMe
                        ? (message.sender || 'user')
                        : (message.sender || message.contactName || message.pushName || message.contactId || message.ContactId || 'Contact');

                    return (
                        <article key={message.id} className="rounded-lg border border-[var(--chat-border)] px-3 py-2 bg-white/60 dark:bg-slate-900/40">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold text-[var(--chat-text)] truncate">{sender}</span>
                                <span className="text-[11px] text-[var(--chat-muted)]">{formatTime(message.timeStamp || message.timestamp)}</span>
                            </div>
                            <p className="text-sm text-[var(--chat-text)] break-words">{message.message || '[Media]'}</p>
                        </article>
                    );
                })}
            </div>

            <footer className="p-3 border-t border-[var(--chat-border)]">
                <button
                    type="button"
                    className="w-full rounded-lg bg-[var(--chat-accent)] text-white text-sm font-medium py-2 hover:brightness-95"
                    onClick={() => onReply(rootMessage)}
                >
                    Reply In Thread
                </button>
            </footer>
        </aside>
    );
};
