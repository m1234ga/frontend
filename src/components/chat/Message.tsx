"use client";
import React, { useState, memo } from 'react';
import Image from 'next/image';
import { Pin, Check, CheckCheck } from 'lucide-react';
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

const MessageStatus = ({ isRead, isDelivered, isOwnMessage }: { isRead: boolean, isDelivered: boolean, isOwnMessage: boolean }) => {
  if (!isOwnMessage) return null;

  if (isRead) {
    return <CheckCheck className="w-3.5 h-3.5 text-sky-300 ml-1" />;
  }
  if (isDelivered) {
    return <CheckCheck className="w-3.5 h-3.5 text-white/50 ml-1" />;
  }
  return <Check className="w-3.5 h-3.5 text-white/50 ml-1" />;
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
    if (/^data:/.test(pick)) return pick;
    if (/^https?:\/\//i.test(pick)) return pick;
    return `${apiBaseUrl}${pick.replace(/^\/+/, '')}`;
  };

  return (
    <>
      <div className={`group flex items-end space-x-2 mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        {isOwnMessage && (
          <div className="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageMenu
              message={message}
              isOwnMessage={isOwnMessage}
              isFavorite={isFavorite || false}
              onToggleFavorite={onToggleFavorite || (() => { })}
              onForward={onForward || (() => { })}
              onDelete={onDelete || (() => { })}
              onEdit={onEdit || (() => { })}
              onAddNote={onAddNote || (() => { })}
              onReply={onReply || (() => { })}
              onPin={onPin || (() => { })}
              onReact={onReact || (() => { })}
              isOpen={isMenuOpen || false}
              onToggle={onMenuToggle || (() => { })}
            />
          </div>
        )}

        <div key={message.id}
          className={`px-5 py-3 relative max-w-[70%] shadow-soft-sm transition-all duration-200 
             ${isOwnMessage
              ? 'bg-emerald-600 dark:bg-emerald-700 text-white rounded-3xl rounded-br-sm'
              : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-3xl rounded-bl-sm border border-gray-100 dark:border-slate-700'
            } 
             ${message.isPinned ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
        >
          {/* Pushname for received messages */}
          {!isOwnMessage && message.pushName && (
            <div className={`text-xs font-bold mb-1 ${isOwnMessage ? 'text-white/80' : 'text-slate-600 dark:text-slate-300'}`}>
              {message.pushName}
            </div>
          )}

          {message.isPinned && (
            <div className={`flex items-center space-x-1 mb-1 text-xs ${isOwnMessage ? 'text-white/90' : 'text-amber-500'}`}>
              <Pin className="w-3 h-3" />
              <span>Pinned</span>
            </div>
          )}

          {message.replyToMessage && (
            <div className={`mb-2 p-2 rounded-xl text-sm border-l-4 ${isOwnMessage ? 'bg-white/10 border-white/50 text-white/90' : 'bg-gray-50 dark:bg-slate-700/50 border-soft-primary text-gray-600 dark:text-gray-300'}`}>
              <div className="font-semibold text-xs mb-1">Replying to:</div>
              <div className="truncate opacity-80">{message.replyToMessage.message}</div>
            </div>
          )}

          {message.note && (
            <div className={`mb-2 p-2 rounded-xl text-sm border-l-4 ${isOwnMessage ? 'bg-white/10 border-yellow-300 text-white/90' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-gray-700 dark:text-gray-200'}`}>
              <div className="font-semibold text-xs mb-1">Note:</div>
              <div className="opacity-90">{message.note}</div>
            </div>
          )}

          {message.messageType === 'text' && (
            <div className="flex flex-wrap items-end gap-x-3">
              <p className="text-[15px] leading-relaxed break-words">{message.message}</p>
              <div className={`text-[10px] ml-auto flex items-center ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                {message.isEdit && <span className="italic mr-1">Edited</span>}
                {formatTime(message.timeStamp)}
                <MessageStatus isRead={message.isRead} isDelivered={message.isDelivered} isOwnMessage={isOwnMessage} />
              </div>
            </div>
          )}

          {message.messageType === 'image' && (
            <div className="flex flex-col space-y-2">
              <div className="cursor-pointer overflow-hidden rounded-2xl w-64 h-48" onClick={() => setIsImageModalOpen(true)}>
                <Image src={buildMediaUrl(message.mediaPath, message.mediaPath ? undefined : `imgs/${message.id}.webp`)} alt="sent" className="hover:scale-105 transition-transform duration-300 w-full h-full object-cover" width={256} height={192} />
              </div>
              {!!message.message && message.message !== '[Image]' && (
                <p className="text-sm">{message.message}</p>
              )}
              <span className={`text-[10px] self-end flex items-center ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                {formatTime(message.timeStamp)}
                <MessageStatus isRead={message.isRead} isDelivered={message.isDelivered} isOwnMessage={isOwnMessage} />
              </span>
            </div>
          )}

          {message.messageType === 'audio' && (
            <div className="flex flex-col space-y-2 min-w-[200px]">
              <audio controls className="w-full h-8 rounded-lg">
                <source src={buildMediaUrl(message.mediaPath, `Audio/${message.message}`)} />
              </audio>
              <span className={`text-[10px] self-end flex items-center ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                {formatTime(message.timestamp)}
                <MessageStatus isRead={message.isRead} isDelivered={message.isDelivered} isOwnMessage={isOwnMessage} />
              </span>
            </div>
          )}

          {message.messageType === 'video' && (
            <div className="flex flex-col space-y-2">
              <video controls className="rounded-2xl w-full max-w-sm">
                <source src={buildMediaUrl(message.mediaPath, message.message)} />
              </video>
              {!!message.message && message.message !== '[Video]' && (
                <p className="text-sm">{message.message}</p>
              )}
              <span className={`text-[10px] self-end flex items-center ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                {formatTime(message.timeStamp)}
                <MessageStatus isRead={message.isRead} isDelivered={message.isDelivered} isOwnMessage={isOwnMessage} />
              </span>
            </div>
          )}

          {message.messageType === 'sticker' && (
            <div className="flex flex-col space-y-1">
              <Image src={buildMediaUrl(message.mediaPath, String(message.message || ''))} alt="sticker" className="w-32 h-32 object-contain hover:scale-105 transition-transform" width={128} height={128} />
              <span className={`text-[10px] self-end flex items-center ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                {formatTime(message.timeStamp)}
                <MessageStatus isRead={message.isRead} isDelivered={message.isDelivered} isOwnMessage={isOwnMessage} />
              </span>
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-3 right-4 flex space-x-1">
              {Object.entries(message.reactions.reduce((acc: Record<string, number>, reaction: MessageReaction) => { acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([emoji, count]) => (
                <div key={emoji} className="flex items-center space-x-1 px-2 py-0.5 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-gray-100 dark:border-slate-600 text-xs">
                  <span>{emoji}</span>
                  {(count as number) > 1 && <span className="text-gray-500 font-medium">{String(count)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isOwnMessage && (
          <div className="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageMenu
              message={message}
              isOwnMessage={isOwnMessage}
              isFavorite={isFavorite || false}
              onToggleFavorite={onToggleFavorite || (() => { })}
              onForward={onForward || (() => { })}
              onDelete={onDelete || (() => { })}
              onEdit={onEdit || (() => { })}
              onAddNote={onAddNote || (() => { })}
              onReply={onReply || (() => { })}
              onPin={onPin || (() => { })}
              onReact={onReact || (() => { })}
              isOpen={isMenuOpen || false}
              onToggle={onMenuToggle || (() => { })}
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

export const MemoizedMessage = memo(Message);