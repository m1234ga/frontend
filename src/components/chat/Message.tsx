"use client";
import React, { useState, memo } from 'react';
import Image from 'next/image';
import { Pin } from 'lucide-react';
import { ImageModal } from './ImageModal';
import { MessageMenu } from './MessageMenu';
import { ChatMessage, MessageReaction } from '../../../../Shared/Models';

const formatTime = (dateInput?: string | number | Date) => {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput as string | number);
  if (Number.isNaN(date.getTime())) return '';
  const timezone = process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Cairo';
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: timezone
  });
};

export function Message({
  message,
  onToggleFavorite,
  isFavorite,
  onForward,
  onDelete,
  onEdit,
  onAddNote,
  onReply,
  onPin,
  onReact,
  isMenuOpen,
  onMenuToggle
}: {
  message: ChatMessage;
  onToggleFavorite?: (message: ChatMessage) => void;
  isFavorite?: boolean;
  onForward?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage, newMessage: string) => void;
  onAddNote?: (message: ChatMessage, note: string) => void;
  onReply?: (message: ChatMessage) => void;
  onPin?: (message: ChatMessage, isPinned: boolean) => void;
  onReact?: (message: ChatMessage, position: { x: number; y: number }) => void;
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
}) {
  const isOwnMessage = message.isFromMe;
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';
  const buildMediaUrl = (primary?: string, fallback?: string) => {
    const pick = primary || fallback || '';
    // Handle base64 data URLs (data:image/... or data:audio/...)
    if (/^data:/.test(pick)) {
      return pick;
    }
    // Handle http/https URLs
    if (/^https?:\/\//i.test(pick)) {
      return pick;
    }
    // Handle relative paths - prepend API base URL
    return `${apiBaseUrl}${pick.replace(/^\/+/, '')}`;
  };

  return (
    <>
      <div className={`group flex items-end space-x-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        {isOwnMessage && (
          <div className="relative flex items-center">
            <MessageMenu
              message={message}
              isOwnMessage={isOwnMessage}
              isFavorite={isFavorite || false}
              onToggleFavorite={onToggleFavorite || (() => {})}
              onForward={onForward || (() => {})}
              onDelete={onDelete || (() => {})}
              onEdit={onEdit || (() => {})}
              onAddNote={onAddNote || (() => {})}
              onReply={onReply || (() => {})}
              onPin={onPin || (() => {})}
              onReact={onReact || (() => {})}
              isOpen={isMenuOpen || false}
              onToggle={onMenuToggle || (() => {})}
            />
          </div>
        )}

        <div key={message.id} className={`message-bubble px-4 py-2 relative ${isOwnMessage ? 'message-sent' : 'message-received'} ${message.isPinned ? 'border-l-4 border-yellow-400' : ''}`}>
          {/* Show pushname for messages not from me */}
          {!isOwnMessage && message.pushName && (
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {message.pushName}
            </div>
          )}
          
          {message.isPinned && (
            <div className="flex items-center space-x-1 mb-1 text-xs text-yellow-600 dark:text-yellow-400">
              <Pin className="w-3 h-3" />
              <span>Pinned</span>
            </div>
          )}

          {message.replyToMessage && (
            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-400">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Replying to:</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{message.replyToMessage.message}</div>
            </div>
          )}

          {message.note && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Note:</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">{message.note}</div>
            </div>
          )}

          {message.messageType === 'text' && (
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <p className="text-sm">{message.message}</p>
                {message.isEdit && (<div className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">Edited</div>)}
              </div>
              <span className="text-xs opacity-70">{formatTime(message.timeStamp)}</span>
            </div>
          )}

          {message.messageType === 'image' && (
            <div className="flex flex-col items-start space-y-1">
              <div className="cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setIsImageModalOpen(true)} title="Click to view full size">
                <Image src={buildMediaUrl(message.mediaPath, message.mediaPath ? undefined : `imgs/${message.id}.webp`)} alt="sent" className="rounded-lg max-w-full" width={300} height={300} />
              </div>
              {!!message.message && message.message !== '[Image]' && (
                <p className="text-sm">{message.message}</p>
              )}
              <span className="text-xs opacity-70">{formatTime(message.timeStamp)}</span>
            </div>
          )}

          {message.messageType === 'audio' &&
            (() => {
              const audioUrl = buildMediaUrl(message.mediaPath, `Audio/${message.message}`);
              return (
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-sm max-w-xs">
                    <div className="flex-shrink-0">
                      <audio controls className="w-48">
                        <source src={audioUrl} type="audio/opus" />
                        <source src={audioUrl} type="audio/ogg" />
                        <source src={audioUrl} type="audio/webm" />
                      </audio>
                    </div>
                  </div>
                  {!!message.message && message.message !== '[Audio]' && (
                    <p className="text-sm">{message.message}</p>
                  )}
                  <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                </div>
              );
            })()}

          {message.messageType === 'video' &&
            (() => {
              const videoUrl = buildMediaUrl(message.mediaPath, message.message);
              return (
                <div className="flex flex-col items-start space-y-1">
                  <video controls className="rounded-lg max-w-full">
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                  {!!message.message && message.message !== '[Video]' && (
                    <p className="text-sm">{message.message}</p>
                  )}
                  <span className="text-xs opacity-70">{formatTime(message.timeStamp)}</span>
                </div>
              );
            })()}

          {message.messageType === 'sticker' && (
            <div className="flex flex-col items-start space-y-1">
              <Image src={buildMediaUrl(message.mediaPath, String(message.message || ''))} alt="sticker" className="w-24 h-24 object-contain" width={96} height={96} />
              <span className="text-xs opacity-70">{formatTime(message.timeStamp)}</span>
            </div>
          )}

          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(message.reactions.reduce((acc: Record<string, number>, reaction: MessageReaction) => { acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([emoji, count]) => (
                <button key={emoji} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title={`${count} reaction${Number(count) > 1 ? 's' : ''}`}>
                  <span>{emoji}</span>
                  <span className="text-gray-600 dark:text-gray-400">{String(count)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!isOwnMessage && (
          <div className="relative flex items-center">
            <MessageMenu
              message={message}
              isOwnMessage={isOwnMessage}
              isFavorite={isFavorite || false}
              onToggleFavorite={onToggleFavorite || (() => {})}
              onForward={onForward || (() => {})}
              onDelete={onDelete || (() => {})}
              onEdit={onEdit || (() => {})}
              onAddNote={onAddNote || (() => {})}
              onReply={onReply || (() => {})}
              onPin={onPin || (() => {})}
              onReact={onReact || (() => {})}
              isOpen={isMenuOpen || false}
              onToggle={onMenuToggle || (() => {})}
            />
          </div>
        )}
      </div>

      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageSrc={buildMediaUrl(message.mediaPath, message.mediaPath ? undefined : `imgs/${message.id}.webp`)}
        imageAlt="Chat image"
      />
    </>
  );
}

// Export memoized version to prevent unnecessary re-renders
export const MemoizedMessage = memo(Message);