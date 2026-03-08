"use client";

import React, { memo, useMemo } from 'react';
import { MemoizedMessage } from './Message';
import { ChatMessage } from '../../../../Shared/Models';
import { formatDateLabel } from '@/utils/date';

interface MessageListProps {
  messages: ChatMessage[];
  favoriteMessages: ChatMessage[];
  currentUserId?: string | null;
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
  currentUserId,
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
  let previousMessage: ChatMessage | null = null;

  return (
    <>
      {messages.map((message: ChatMessage) => {
        const isFavorite = favoriteIds.has(message.id);
        const messageDate = new Date(message.timeStamp || message.timestamp || Date.now());
        const dateString = messageDate.toDateString();
        const showSeparator = lastDate !== dateString;
        lastDate = dateString;

        const sameSenderAsPrevious = previousMessage
          ? previousMessage.isFromMe === message.isFromMe &&
            (previousMessage.contactId || previousMessage.ContactId) === (message.contactId || message.ContactId)
          : false;
        const previousTs = previousMessage ? new Date(previousMessage.timeStamp || previousMessage.timestamp || Date.now()).getTime() : 0;
        const currentTs = new Date(message.timeStamp || message.timestamp || Date.now()).getTime();
        const withinGroupWindow = previousMessage ? (currentTs - previousTs) < 4 * 60 * 1000 : false;
        const showSenderMeta = !sameSenderAsPrevious || !withinGroupWindow || showSeparator;
        previousMessage = message;

        return (
          <React.Fragment key={message.id}>
            {showSeparator && (
              <div className="flex justify-center my-2 z-10">
                <span className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-xl shadow-soft-sm border border-gray-100/50 dark:border-gray-700/50">
                  {formatDateLabel(messageDate)}
                </span>
              </div>
            )}
            <MemoizedMessage
              message={message}
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
              isMenuOpen={openMessageMenuId === message.id}
              onMenuToggle={() => onMenuToggle(message.id)}
              showName={showSenderMeta}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default memo(MessageList);
