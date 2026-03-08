"use client";

import React, { useMemo } from 'react';
import { List } from 'react-window';
import { Chat as ChatModel } from '../../../../Shared/Models';
import { ConversationItem } from './ConversationItem';

interface VirtualizedConversationListProps {
    conversations: ChatModel[];
    selectedConversationId?: string;
    onSelectConversation: (conversation: ChatModel) => void;
    onArchive?: (chatId: string) => void;
    onUnarchive?: (chatId: string) => void;
    onMuteToggle?: (chatId: string) => void;
    onAssign?: (chatId: string) => void;
    onToggleStatus?: (chatId: string, currentStatus: string) => void;
    onOpenTagManager?: (chat: ChatModel) => void;
    formatTime: (date?: string | number | Date) => string;
}

interface RowProps {
    data: {
        conversations: ChatModel[];
        selectedConversationId?: string;
        onSelectConversation: (conversation: ChatModel) => void;
        onArchive?: (chatId: string) => void;
        onUnarchive?: (chatId: string) => void;
        onMuteToggle?: (chatId: string) => void;
        onAssign?: (chatId: string) => void;
        onToggleStatus?: (chatId: string, currentStatus: string) => void;
        onOpenTagManager?: (chat: ChatModel) => void;
        formatTime: (date?: string | number | Date) => string;
    };
}

const Row = ({ index, style, data }: RowProps & { index: number; style: React.CSSProperties }) => {
    if (!data || !data.conversations) {
        console.warn('VirtualizedConversationList: Missing data in Row!', { index });
        return <div style={style}>Loading...</div>;
    }

    const conversation = data.conversations[index];

    if (!conversation) {
        console.warn('Conversation not found at index:', index);
        return null;
    }

    const {
        selectedConversationId,
        onSelectConversation,
        onArchive,
        onUnarchive,
        onMuteToggle,
        onAssign,
        onToggleStatus,
        onOpenTagManager,
        formatTime
    } = data;

    return (
        <div style={style}>
            <ConversationItem
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onSelect={onSelectConversation}
                onArchive={onArchive}
                onUnarchive={onUnarchive}
                onMuteToggle={onMuteToggle}
                onAssign={onAssign}
                onToggleStatus={onToggleStatus}
                onOpenTagManager={onOpenTagManager}
                formatTime={formatTime}
            />
        </div>
    );
};

export const VirtualizedConversationList: React.FC<VirtualizedConversationListProps> = ({
    conversations,
    selectedConversationId,
    onSelectConversation,
    onArchive,
    onUnarchive,
    onMuteToggle,
    onAssign,
    onToggleStatus,
    onOpenTagManager,
    formatTime
}) => {
    const itemData = useMemo(() => ({
        conversations,
        selectedConversationId,
        onSelectConversation,
        onArchive,
        onUnarchive,
        onMuteToggle,
        onAssign,
        onToggleStatus,
        onOpenTagManager,
        formatTime
    }), [
        conversations,
        selectedConversationId,
        onSelectConversation,
        onArchive,
        onUnarchive,
        onMuteToggle,
        onAssign,
        onToggleStatus,
        onOpenTagManager,
        formatTime
    ]);

    if (conversations.length === 0) {
        return (
            <div className="p-8 text-center theme-text-accent font-bold opacity-60 italic">
                No conversations found
            </div>
        );
    }

    return (
        <div className="flex-1 h-full w-full relative">
            <List<RowProps>
                style={{ height: 600, width: '100%' }}
                rowCount={conversations.length}
                rowHeight={144}
                rowProps={{ data: itemData }}
                overscanCount={5}
                className="no-scrollbar"
                rowComponent={Row}
            />
        </div>
    );
};
