"use client";

import React from 'react';
import { Message } from './Message';
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
  return (
    <>
      {messages.length === 0 ? (
        <div className="text-center theme-text-accent mt-8">
          <p className="text-lg font-medium">No messages yet. Start the conversation!</p>
          <p className="text-sm opacity-70 mt-2">Send a message to begin chatting</p>
        </div>
      ) : (
        messages.map((message: ChatMessage) => {
          const isFavorite = favoriteMessages.some(fav => fav.id === message.id);
          return (
            <Message
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
        })
      )}
    </>
  );
};

export default MessageList;
