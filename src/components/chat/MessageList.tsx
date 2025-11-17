"use client";

import React, { memo, useMemo } from 'react';
import { MemoizedMessage } from './Message';
import { ChatMessage } from '../../../../Shared/Models';

interface MessageListProps {
  messages: ChatMessage[];
  favoriteMessages: ChatMessage[];
  toggleFavorite: (m: ChatMessage) => void;
  onForward: (m: ChatMessage) => void;
  onDelete: (m: ChatMessage) => void;
  onEdit: (m: ChatMessage, newMessage: string) => void;
  onAddNote: (m: ChatMessage, note: string) => void;
  onReply: (m: ChatMessage) => void;
  onPin: (m: ChatMessage, isPinned: boolean) => void;
  onReact: (m: ChatMessage, pos: { x: number; y: number }) => void;
  openMessageMenuId: string | null;
  onMenuToggle: (id: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  favoriteMessages,
  toggleFavorite,
  onForward,
  onDelete,
  onEdit,
  onAddNote,
  onReply,
  onPin,
  onReact,
  openMessageMenuId,
  onMenuToggle
}) => {
  // Create a Set for O(1) lookup instead of O(n) with some()
  const favoriteIds = useMemo(() => new Set(favoriteMessages.map(fav => fav.id)), [favoriteMessages]);

  if (messages.length === 0) {
    return (
      <div className="text-center theme-text-accent mt-8">
        <p className="text-lg font-medium">No messages yet. Start the conversation!</p>
        <p className="text-sm opacity-70 mt-2">Send a message to begin chatting</p>
      </div>
    );
  }

  return (
    <>
      {messages.map((message: ChatMessage) => {
        const isFavorite = favoriteIds.has(message.id);
        return (
          <MemoizedMessage
            message={message}
            key={message.id}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            onForward={onForward}
            onDelete={onDelete}
            onEdit={onEdit}
            onAddNote={onAddNote}
            onReply={onReply}
            onPin={onPin}
            onReact={onReact}
            isMenuOpen={openMessageMenuId === message.id}
            onMenuToggle={() => onMenuToggle(message.id)}
          />
        );
      })}
    </>
  );
};

export default memo(MessageList);
