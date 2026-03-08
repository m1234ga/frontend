"use client";

import React, { memo, useMemo, useRef, useCallback, useEffect } from 'react';
import { MemoizedMessage } from './Message';
import { ChatMessage } from '../../../../Shared/Models';
import { formatDateLabel } from '@/utils/date';
import { MessageSquareReply, Loader2 } from 'lucide-react';

interface MessageWithSeparator {
    message: ChatMessage;
    showSeparator: boolean;
    dateLabel: string | null;
    showSenderMeta: boolean;
    isGroupedWithPrevious: boolean;
}

interface VirtualizedMessageListProps {
    messages: ChatMessage[];
    favoriteMessages: ChatMessage[];
    currentUserId?: string | null;
    toggleFavorite: (m: ChatMessage) => void;
    onForward: (m: ChatMessage) => void;
    onDelete: (m: ChatMessage) => void;
    onEdit: (m: ChatMessage, newMessage: string) => void;
    onAddNote: (m: ChatMessage, note: string) => void;
    onReply: (m: ChatMessage) => void;
    onOpenThread: (m: ChatMessage) => void;
    onPin: (m: ChatMessage, isPinned: boolean) => void;
    onReact: (m: ChatMessage, pos: { x: number; y: number }) => void;
    openMessageMenuId: string | null;
    onMenuToggle: (id: string) => void;
    chatName?: string;
    onLoadMoreMessages?: () => Promise<boolean>;
}

const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
    messages,
    favoriteMessages,
    currentUserId = null,
    toggleFavorite,
    onForward,
    onDelete,
    onEdit,
    onAddNote,
    onReply,
    onOpenThread,
    onPin,
    onReact,
    openMessageMenuId,
    onMenuToggle,
    onLoadMoreMessages,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const stickToBottomRef = useRef(true);

    const favoriteIds = useMemo(
        () => new Set(favoriteMessages.map(f => f.id)),
        [favoriteMessages]
    );

    const messagesWithSeparators = useMemo((): MessageWithSeparator[] => {
        let lastDate: string | null = null;
        return messages.map((message, index) => {
            const messageDate = new Date(message.timeStamp || message.timestamp || Date.now());
            const dateString = messageDate.toDateString();
            const showSeparator = lastDate !== dateString;
            lastDate = dateString;

            const previous = messages[index - 1];
            const sameSender = previous
                ? previous.isFromMe === message.isFromMe &&
                  (previous.contactId || previous.ContactId) ===
                      (message.contactId || message.ContactId)
                : false;

            const prevTs = previous
                ? new Date(previous.timeStamp || previous.timestamp || Date.now()).getTime()
                : 0;
            const curTs = new Date(message.timeStamp || message.timestamp || Date.now()).getTime();
            const withinWindow = !!previous && curTs - prevTs < 4 * 60 * 1000;

            const showSenderMeta = message.messageType !== 'system';
            const isGroupedWithPrevious = sameSender && withinWindow && !showSeparator;

            return {
                message,
                showSeparator,
                dateLabel: showSeparator ? formatDateLabel(messageDate) : null,
                showSenderMeta,
                isGroupedWithPrevious,
            };
        });
    }, [messages]);

    const threadReplyCount = useMemo(
        () =>
            messages.reduce<Record<string, number>>((acc, m) => {
                if (!m.replyToMessageId) return acc;
                acc[m.replyToMessageId] = (acc[m.replyToMessageId] || 0) + 1;
                return acc;
            }, {}),
        [messages]
    );

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    }, []);

    // Scroll to bottom when new messages arrive and the user was already near bottom.
    useEffect(() => {
        if (stickToBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
        }
    }, [messages.length]);

    // On conversation switch: always snap to bottom immediately.
    const firstMsgId = messages[0]?.id ?? '';
    useEffect(() => {
        stickToBottomRef.current = true;
        bottomRef.current?.scrollIntoView({ behavior: 'instant' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firstMsgId]);

    if (messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center enterprise-chat-thread px-4">
                <p className="text-lg font-medium theme-text-accent">
                    No messages yet. Start the conversation!
                </p>
                <p className="text-sm opacity-70 mt-2 text-[var(--chat-muted)]">
                    Send a message to begin chatting
                </p>
            </div>
        );
    }

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full w-full overflow-y-auto overflow-x-hidden enterprise-chat-thread no-scrollbar"
            role="log"
            aria-live="polite"
            aria-label="Message thread"
        >
            {/* min-h-full + justify-end pushes short conversations to the bottom of the panel */}
            <div className="flex flex-col justify-end min-h-full px-3.5 pb-2 pt-2">
                {onLoadMoreMessages && (
                    <div className="flex items-center justify-center py-2 mb-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--chat-border)] bg-[var(--chat-panel)] px-3 py-1.5 text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
                            onClick={() => onLoadMoreMessages()}
                            aria-label="Load older messages"
                        >
                            <Loader2 className="w-3.5 h-3.5" />
                            Load previous messages
                        </button>
                    </div>
                )}

                {messagesWithSeparators.map((row) => {
                    const isSystem = row.message.messageType === 'system';
                    const isFavorite = favoriteIds.has(row.message.id);
                    const replyCount = threadReplyCount[row.message.id] || 0;

                    const topMargin = row.showSeparator
                        ? 'mt-4'
                        : row.isGroupedWithPrevious
                        ? 'mt-[3px]'
                        : 'mt-2';

                    return (
                        <div
                            key={row.message.id}
                            id={`msg-${encodeURIComponent(String(row.message.id || ''))}`}
                            className={topMargin}
                        >
                            {row.showSeparator && (
                                <div className="enterprise-date-separator-wrap mb-2">
                                    <span className="enterprise-date-separator-pill">
                                        {row.dateLabel}
                                    </span>
                                </div>
                            )}

                            <div className={`flex flex-col ${replyCount > 0 ? 'gap-0.5' : ''} ${isSystem ? 'items-center' : ''}`}>
                                <MemoizedMessage
                                    message={row.message}
                                    currentUserId={currentUserId}
                                    onToggleFavorite={toggleFavorite}
                                    isFavorite={isFavorite}
                                    onForward={onForward}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    onAddNote={onAddNote}
                                    onReply={onReply}
                                    onPin={onPin}
                                    onReact={onReact}
                                    isMenuOpen={openMessageMenuId === row.message.id}
                                    onMenuToggle={() => onMenuToggle(row.message.id)}
                                    showName={row.showSenderMeta}
                                />

                                {replyCount > 0 && (
                                    <button
                                        type="button"
                                        className="ml-2 mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-[var(--chat-accent)] hover:bg-[var(--chat-accent-soft)]"
                                        onClick={() => onOpenThread(row.message)}
                                        aria-label={`Open thread with ${replyCount} replies`}
                                    >
                                        <MessageSquareReply className="w-3.5 h-3.5" />
                                        {replyCount} repl{replyCount > 1 ? 'ies' : 'y'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Invisible bottom sentinel â€” scrollIntoView targets this on new messages */}
                <div ref={bottomRef} aria-hidden />
            </div>
        </div>
    );
};

export default memo(VirtualizedMessageList);
