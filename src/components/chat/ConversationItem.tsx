"use client";

import React from 'react';
import Image from 'next/image';
import { User, Archive, Check, UserPlus } from 'lucide-react';
import { Chat as ChatModel } from '../../../../Shared/Models';
import TagPill from '../common/TagPill';
import TypingIndicator from './TypingIndicator';

interface ConversationItemProps {
    conversation: ChatModel;
    isSelected?: boolean;
    onSelect: (conversation: ChatModel) => void;
    onArchive?: (chatId: string) => void;
    onUnarchive?: (chatId: string) => void;
    onMuteToggle?: (chatId: string) => void;
    onAssign?: (chatId: string) => void;
    onToggleStatus?: (chatId: string, currentStatus: string) => void;
    onOpenTagManager?: (chat: ChatModel) => void;
    formatTime: (date?: string | number | Date) => string;
}

interface ConversationBodyProps {
    conversation: ChatModel;
    onArchive?: (chatId: string) => void;
    onUnarchive?: (chatId: string) => void;
    onAssign?: (chatId: string) => void;
    onToggleStatus?: (chatId: string, currentStatus: string) => void;
    formatTime: (date?: string | number | Date) => string;
}

interface ConversationActionsProps {
    conversation: ChatModel;
    onArchive?: (chatId: string) => void;
    onUnarchive?: (chatId: string) => void;
    onAssign?: (chatId: string) => void;
    onToggleStatus?: (chatId: string, currentStatus: string) => void;
}

const isTypingActive = (conversation: ChatModel) => (
    Boolean(conversation.isTyping && conversation.isOnline && conversation.status !== 'closed' && !conversation.isArchived)
);

const getStatusPillClass = (status?: string) => (
    status === 'closed'
        ? 'bg-green-100/50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
        : 'bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
);

const runArchiveAction = (
    conversation: ChatModel,
    onArchive?: (chatId: string) => void,
    onUnarchive?: (chatId: string) => void
) => {
    if (!onArchive) return;
    if (conversation.isArchived) {
        onUnarchive?.(conversation.id);
        return;
    }
    onArchive(conversation.id);
};

const MessagePreview = ({ conversation }: { conversation: ChatModel }) => {
    if (isTypingActive(conversation)) {
        return (
            <div className="flex items-center space-x-1">
                <TypingIndicator className="flex items-center space-x-1" dotClassName="bg-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-tighter">Typing...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-1.5">
            {conversation.status && (
                <span className={`text-[8px] uppercase font-bold px-1 py-0.5 rounded italic shrink-0 ${getStatusPillClass(conversation.status)}`}>
                    {conversation.status}
                </span>
            )}
            <p className="text-xs theme-text-secondary truncate font-medium opacity-80">
                {conversation.lastMessage || 'No messages'}
            </p>
        </div>
    );
};

const ConversationActions: React.FC<ConversationActionsProps> = ({
    conversation,
    onArchive,
    onUnarchive,
    onAssign,
    onToggleStatus
}) => {
    return (
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 px-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-md shadow-sm">
            {onToggleStatus && (
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(conversation.id, conversation.status || 'open'); }}
                    className={`p-1.5 rounded-md transition-colors ${conversation.status === 'closed' ? 'bg-green-100/50 text-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`}
                    title={conversation.status === 'closed' ? 'Reopen Chat' : 'Close Chat'}
                >
                    <Check className="w-3.5 h-3.5" />
                </button>
            )}
            {onAssign && (
                <button
                    onClick={(e) => { e.stopPropagation(); onAssign(conversation.id); }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-400 transition-colors"
                    title="Assign Chat"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                </button>
            )}
            {onArchive && (
                <button
                    onClick={(e) => { e.stopPropagation(); runArchiveAction(conversation, onArchive, onUnarchive); }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-400 transition-colors"
                    title={conversation.isArchived ? 'Unarchive' : 'Archive'}
                >
                    <Archive className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

const ConversationBody: React.FC<ConversationBodyProps> = ({
    conversation,
    onArchive,
    onUnarchive,
    onAssign,
    onToggleStatus,
    formatTime
}) => {
    const getTagId = (tag: ChatModel['tags'][number]) => tag.tagId ?? (tag as unknown as { id?: string }).id ?? '';
    const getTagName = (tag: ChatModel['tags'][number]) => tag.tagName ?? (tag as unknown as { name?: string }).name ?? 'Tag';

    return (
        <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center shadow-md relative shrink-0 overflow-hidden">
                {conversation.avatar ? (
                    <Image src={conversation.avatar} alt={conversation.name} className="w-full h-full object-cover" width={48} height={48} />
                ) : (
                    <User className="w-6 h-6 text-white" />
                )}
                {conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                        <h3 className="text-[15px] font-bold text-gray-800 truncate dark:theme-text-primary">
                            {conversation.name || conversation.phone || conversation.id}
                        </h3>
                        {conversation.unreadCount > 0 && (
                            <span className="bg-emerald-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center font-bold shrink-0 shadow-glow-sm">
                                {conversation.unreadCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium theme-text-accent shrink-0">
                        {formatTime(conversation.lastMessageTime)}
                    </span>
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-medium text-gray-400 truncate opacity-80">
                            {conversation.phone}
                        </span>
                        {conversation.isMyContact ? (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 shrink-0">
                                Contact
                            </span>
                        ) : conversation.isLead ? (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 shrink-0">
                                Lead
                            </span>
                        ) : null}
                    </div>
                    <ConversationActions
                        conversation={conversation}
                        onArchive={onArchive}
                        onUnarchive={onUnarchive}
                        onAssign={onAssign}
                        onToggleStatus={onToggleStatus}
                    />
                </div>

                <div className="mt-1 flex items-center justify-between min-h-[18px]">
                    <div className="flex-1 min-w-0">
                        <MessagePreview conversation={conversation} />
                    </div>
                </div>

                <div className="mt-2 min-h-[26px] flex items-start">
                    {conversation.tags && conversation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {conversation.tags.slice(0, 3).map((tag) => (
                                <TagPill key={getTagId(tag)} id={getTagId(tag)} name={getTagName(tag)} color={tag.color} />
                            ))}
                            {conversation.tags.length > 3 && (
                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                                    +{conversation.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isSelected,
    onSelect,
    onArchive,
    onUnarchive,
    onAssign,
    onToggleStatus,
    onOpenTagManager,
    formatTime
}) => {
    return (
        <div
            onClick={() => onSelect(conversation)}
            onContextMenu={(e) => { e.preventDefault(); onOpenTagManager?.(conversation); }}
            className={`p-4 border-b theme-border-primary cursor-pointer hover:bg-gray-500/10 transition-colors group relative ${isSelected ? 'bg-gray-500/20 border-l-4 border-l-emerald-500' : ''
                }`}
        >
            <ConversationBody
                conversation={conversation}
                onArchive={onArchive}
                onUnarchive={onUnarchive}
                onAssign={onAssign}
                onToggleStatus={onToggleStatus}
                formatTime={formatTime}
            />
        </div>
    );
};
