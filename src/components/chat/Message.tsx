"use client";
import React, { useState, memo } from 'react';
import Image from 'next/image';
import { Pin, Check, CheckCheck, FileText } from 'lucide-react';
import { ImageModal } from './ImageModal';
import { MessageMenu } from './MessageMenu';
import { ChatMessage, MessageReaction } from '../../../../Shared/Models';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

const formatTime = (dateInput?: string | number | Date) => {
  if (!dateInput) return '';

  const date =
    dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
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
  const { user } = useAuth();
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
              <div className="font-semibold text-xs mb-1 flex items-center gap-1">
                Replying to:
                <span className="font-bold">
                  {message.replyToMessage.isFromMe
                    ? 'You'
                    : (message.replyToMessage.pushName || message.replyToMessage.ContactId || 'Unknown')}
                </span>
              </div>
              <div className="truncate opacity-80">
                {message.replyToMessage.message ||
                  (message.replyToMessage.mediaPath ? '[Media]' : '[Message]')}
              </div>
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

          {(message.messageType === 'document' || message.messageType === 'media') && (
            <div className="flex flex-col space-y-2 min-w-[240px]">
              <div
                onClick={() => window.open(buildMediaUrl(message.mediaPath), '_blank')}
                className={`flex items-center space-x-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border
                  ${isOwnMessage
                    ? 'bg-white/10 hover:bg-white/20 border-white/20'
                    : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-100 dark:border-slate-600'
                  }`}
              >
                <div className={`p-3 rounded-xl ${isOwnMessage ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                  <FileText className={`w-6 h-6 ${isOwnMessage ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                    {message.message && message.message !== '[Document]' && message.message !== '[Media]'
                      ? message.message
                      : (message.mediaPath?.split('/').pop() || 'Attached File')}
                  </p>
                  <p className={`text-[11px] ${isOwnMessage ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
                    Click to download
                  </p>
                </div>
                <div className={`p-2 rounded-full ${isOwnMessage ? 'hover:bg-white/10' : 'hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                  <svg className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </div>
              <span className={`text-[10px] self-end flex items-center ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                {formatTime(message.timeStamp)}
                <MessageStatus isRead={message.isRead} isDelivered={message.isDelivered} isOwnMessage={isOwnMessage} />
              </span>
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-3 right-4 flex space-x-1 z-10">
              {Object.entries(message.reactions.reduce((acc, r) => {
                if (!acc[r.emoji]) acc[r.emoji] = [];
                const name = r.userId === user?.id ? 'You' : (r.contactName || r.participant || 'Unknown');
                acc[r.emoji].push(name);
                return acc;
              }, {} as Record<string, string[]>)).map(([emoji, names]) => (
                <div key={emoji} className="relative group/reaction flex items-center space-x-1 px-2 py-0.5 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-gray-100 dark:border-slate-600 text-xs cursor-help hover:scale-110 transition-transform">
                  <span>{emoji}</span>
                  {names.length > 1 && <span className="text-gray-500 dark:text-gray-400 font-medium">{names.length}</span>}

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/reaction:block z-50">
                    <div className="bg-gray-900/90 backdrop-blur-sm text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[60px] text-center">
                      <div className="flex flex-col gap-0.5">
                        {names.map((name, i) => (
                          <div key={i}>{name}</div>
                        ))}
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/90"></div>
                    </div>
                  </div>
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