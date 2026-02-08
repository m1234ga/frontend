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

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const formatDateLabel = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return 'Today';
  if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';

  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

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

  let lastDate: string | null = null;

  return (
    <>
      {messages.map((message: ChatMessage) => {
        const isFavorite = favoriteIds.has(message.id);
        const messageDate = new Date(message.timeStamp || message.timestamp || Date.now());
        const dateString = messageDate.toDateString();
        const showSeparator = lastDate !== dateString;
        lastDate = dateString;

        return (
          <React.Fragment key={message.id}>
            {showSeparator && (
              <div className="flex justify-center my-6 sticky top-2 z-10">
                <span className="px-4 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-xl shadow-soft-sm border border-gray-100/50 dark:border-gray-700/50">
                  {formatDateLabel(messageDate)}
                </span>
              </div>
            )}
            <MemoizedMessage
              message={message}
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
          </React.Fragment>
        );
      })}
    </>
  );
};

export default memo(MessageList);
