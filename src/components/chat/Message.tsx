"use client";
import React, { useState, memo } from 'react';
import Image from 'next/image';
import { Pin, Check, CheckCheck, FileText } from 'lucide-react';
import { ImageModal } from './ImageModal';
import { MessageMenu } from './MessageMenu';
import { ChatMessage } from '../../../../Shared/Models';

type MessageProps = {
  message: ChatMessage;
  currentUserId?: string | null;
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
  showName?: boolean;
};

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

const formatDateTimeShort = (dateInput?: string | number | Date) => {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getMessageTime = (message: ChatMessage) => message.timeStamp ?? message.timestamp;

const getEditHistoryEntries = (message: ChatMessage) => {
  const historyItems = Array.isArray(message.editHistory) ? message.editHistory : [];
  const originalFallback = message.note
    ? [{ id: 'legacy-note', oldMessage: message.note, newMessage: message.message, editedAt: message.editedAt || message.timestamp || message.timeStamp }]
    : [];

  return historyItems.length > 0 ? historyItems : originalFallback;
};

const getAttachmentLabel = (message: ChatMessage) => {
  if (message.message && message.message !== '[Document]' && message.message !== '[Media]') {
    return message.message;
  }
  return message.mediaPath?.split('/').pop() || 'Attached File';
};

type ParsedContactDetails = {
  name: string;
  phone: string;
};

const parseContactDetails = (message: ChatMessage): ParsedContactDetails | null => {
  const payload = String(message.message || '').replace(/^\[Contact\]\s*/i, '').trim();
  if (!payload) return null;

  const [rawName, rawPhone] = payload.split('|').map((value) => String(value || '').trim());
  const phone = (rawPhone || '').replace(/[^\d+]/g, '');
  const name = rawName || 'Contact';
  return { name, phone };
};

const buildReactionGroups = (message: ChatMessage, currentUserId?: string | null) => {
  if (!message.reactions?.length) return [] as Array<[string, string[]]>;

  const grouped = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
    const name = reaction.userId === currentUserId ? 'You' : (reaction.contactName || reaction.participant || 'Unknown');
    acc[reaction.emoji].push(name);
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(grouped);
};

const TimeStatus = ({
  message,
  isOwnMessage,
  className = 'self-end'
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  className?: string;
}) => (
  <span className={`text-[10px] ${className} flex items-center ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
    {formatTime(getMessageTime(message))}
    <MessageStatus status={message.status} isOwnMessage={isOwnMessage} />
  </span>
);

const TextMessageContent = ({
  message,
  isOwnMessage,
  onOpenEditHistory
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  onOpenEditHistory: () => void;
}) => {
  const effectiveHistory = getEditHistoryEntries(message);

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[15px] leading-[1.35] break-words whitespace-pre-wrap">{message.message}</p>
      {message.isEdit && effectiveHistory.length > 0 && (
        <button
          type="button"
          onClick={onOpenEditHistory}
          className={`self-start mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-colors ${isOwnMessage ? 'bg-white/18 text-white/90 hover:bg-white/28' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50'}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          Edited
          <span className="opacity-70">{effectiveHistory.length}</span>
        </button>
      )}
      <TimeStatus message={message} isOwnMessage={isOwnMessage} className="self-end" />
    </div>
  );
};

const ImageMessageContent = ({
  message,
  isOwnMessage,
  buildMediaUrl,
  onPreview
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  buildMediaUrl: (primary?: string, fallback?: string) => string;
  onPreview: () => void;
}) => (
      <div className="flex flex-col gap-1.5">
    <div className="cursor-pointer overflow-hidden rounded-2xl w-64 h-48" onClick={onPreview}>
      <Image src={buildMediaUrl(message.mediaPath, message.mediaPath ? undefined : `imgs/${message.id}.webp`)} alt="sent" className="hover:scale-105 transition-transform duration-300 w-full h-full object-cover" width={256} height={192} />
    </div>
    {!!message.message && message.message !== '[Image]' && <p className="text-sm">{message.message}</p>}
    <TimeStatus message={message} isOwnMessage={isOwnMessage} />
  </div>
);

const AudioMessageContent = ({
  message,
  isOwnMessage,
  buildMediaUrl
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  buildMediaUrl: (primary?: string, fallback?: string) => string;
}) => (
      <div className="flex flex-col gap-1.5 min-w-[200px]">
    <audio controls className="w-full h-8 rounded-lg">
      <source src={buildMediaUrl(message.mediaPath, `Audio/${message.message}`)} />
    </audio>
    <TimeStatus message={message} isOwnMessage={isOwnMessage} />
  </div>
);

const VideoMessageContent = ({
  message,
  isOwnMessage,
  buildMediaUrl
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  buildMediaUrl: (primary?: string, fallback?: string) => string;
}) => (
      <div className="flex flex-col gap-1.5">
    <video controls className="rounded-2xl w-full max-w-sm">
      <source src={buildMediaUrl(message.mediaPath, message.message)} />
    </video>
    {!!message.message && message.message !== '[Video]' && <p className="text-sm">{message.message}</p>}
    <TimeStatus message={message} isOwnMessage={isOwnMessage} />
  </div>
);

const StickerMessageContent = ({
  message,
  isOwnMessage,
  buildMediaUrl
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  buildMediaUrl: (primary?: string, fallback?: string) => string;
}) => {
  const stickerFallback = (message.message && /^\[[^\]]+\]$/.test(message.message))
    ? `imgs/sticker_${message.id}.webp`
    : String(message.message || '');
  const stickerSrc = buildMediaUrl(message.mediaPath, stickerFallback);

  return (
        <div className="flex flex-col gap-1">
      {stickerSrc ? (
        <Image src={stickerSrc} alt="sticker" className="w-32 h-32 object-contain hover:scale-105 transition-transform" width={128} height={128} />
      ) : (
        <div className={`w-32 h-32 rounded-2xl flex items-center justify-center text-xs ${isOwnMessage ? 'bg-white/10 text-white/70' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300'}`}>
          Sticker
        </div>
      )}
      <TimeStatus message={message} isOwnMessage={isOwnMessage} />
    </div>
  );
};

const DocumentMessageContent = ({
  message,
  isOwnMessage,
  buildMediaUrl
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  buildMediaUrl: (primary?: string, fallback?: string) => string;
}) => (
      <div className="flex flex-col gap-1.5 min-w-[240px]">
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
          {getAttachmentLabel(message)}
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
    <TimeStatus message={message} isOwnMessage={isOwnMessage} />
  </div>
);

const LocationMessageContent = ({
  message,
  isOwnMessage
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
}) => {
  // Parse location from message format: "[Location] lat,lng (name)".
  const locationMatch = message.message?.match(/(?:\[Location\]\s*)?(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*\((.*?)\))?/i);
  const latitude = locationMatch ? Number(locationMatch[1]) : NaN;
  const longitude = locationMatch ? Number(locationMatch[2]) : NaN;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const name = locationMatch ? (locationMatch[3] || 'Location') : 'Location';

  return (
    <div className="flex flex-col gap-1.5 min-w-[240px]">
      <div
        onClick={() => {
          if (hasCoordinates) {
            window.open(`https://www.google.com/maps/search/${latitude},${longitude}`, '_blank');
          }
        }}
        className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-200 border ${hasCoordinates ? 'cursor-pointer' : 'cursor-default'}
          ${isOwnMessage
            ? 'bg-white/10 hover:bg-white/20 border-white/20'
            : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-100 dark:border-slate-600'
          }`}
      >
        <div className={`p-3 rounded-xl ${isOwnMessage ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
          <svg className={`w-6 h-6 ${isOwnMessage ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
            {name}
          </p>
          <p className={`text-[11px] ${isOwnMessage ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
            {hasCoordinates ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'Location details unavailable'}
          </p>
          <p className={`text-[10px] ${isOwnMessage ? 'text-white/50' : 'text-gray-400 dark:text-gray-500'}`}>
            {hasCoordinates ? 'Tap to open in Google Maps' : 'Coordinates unavailable'}
          </p>
        </div>
      </div>
      <TimeStatus message={message} isOwnMessage={isOwnMessage} />
    </div>
  );
};

const ContactMessageContent = ({
  message,
  isOwnMessage,
  onOpenDetails
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  onOpenDetails: (message: ChatMessage) => void;
}) => {
  // Parse contact from message format: "[Contact] Name|+phone".
  const contactPayload = message.message?.replace(/^\[Contact\]\s*/i, '').trim() || '';
  const [rawName, rawPhone] = contactPayload.split('|').map((value) => value.trim());
  const contactName = rawName || 'Contact';
  const contactPhone = (rawPhone || '').replace(/[\s-]/g, '');
  const canOpen = contactPhone.length > 0;

  return (
    <div className="flex flex-col gap-1.5 min-w-[240px]">
      <div
        onClick={() => {
          onOpenDetails(message);
        }}
        className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-200 border cursor-pointer
        ${isOwnMessage
          ? 'bg-white/10 border-white/20'
          : 'bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-600'
        }`}
      >
        <div className={`p-3 rounded-full ${isOwnMessage ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
          <svg className={`w-6 h-6 ${isOwnMessage ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
            {contactName}
          </p>
          <p className={`text-[11px] ${isOwnMessage ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
            {contactPhone || 'Contact Information'}
          </p>
          <p className={`text-[10px] ${isOwnMessage ? 'text-white/50' : 'text-gray-400 dark:text-gray-500'}`}>
            {canOpen ? 'Tap to view contact details' : 'Tap to view contact details'}
          </p>
        </div>
      </div>
      <TimeStatus message={message} isOwnMessage={isOwnMessage} />
    </div>
  );
};

const PollMessageContent = ({
  message,
  isOwnMessage
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
}) => {
  // Parse poll from message format: "[Poll] Question"
  const pollName = message.message?.replace(/^\[Poll\]\s*/, '') || 'Poll';

  return (
    <div className="flex flex-col gap-1.5 min-w-[240px]">
      <div className={`p-3 rounded-2xl border
        ${isOwnMessage
          ? 'bg-white/10 border-white/20'
          : 'bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-600'
        }`}
      >
        <div className="flex items-start space-x-3 mb-2">
          <div className={`p-2 rounded-lg mt-0.5 ${isOwnMessage ? 'bg-white/20' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
            <svg className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {pollName}
            </p>
            <p className={`text-[11px] ${isOwnMessage ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
              Poll • Vote on WhatsApp
            </p>
          </div>
        </div>
      </div>
      <TimeStatus message={message} isOwnMessage={isOwnMessage} />
    </div>
  );
};

const Reactions = ({ message, currentUserId }: { message: ChatMessage; currentUserId?: string | null }) => {
  const reactionGroups = buildReactionGroups(message, currentUserId);
  if (!reactionGroups.length) return null;

  return (
    <div className="absolute -bottom-3 right-4 flex space-x-1 z-10">
      {reactionGroups.map(([emoji, names]) => (
        <div key={emoji} className="relative group/reaction flex items-center space-x-1 px-2 py-0.5 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-gray-100 dark:border-slate-600 text-xs cursor-help hover:scale-110 transition-transform">
          <span>{emoji}</span>
          {names.length > 1 && <span className="text-gray-500 dark:text-gray-400 font-medium">{names.length}</span>}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/reaction:block z-50">
            <div className="bg-gray-900/90 backdrop-blur-sm text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap min-w-[60px] text-center">
              <div className="flex flex-col gap-0.5">
                {names.map((name, index) => (
                  <div key={index}>{name}</div>
                ))}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/90"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MessageContent = ({
  message,
  isOwnMessage,
  buildMediaUrl,
  onOpenImage,
  onOpenContact,
  onOpenEditHistory
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  buildMediaUrl: (primary?: string, fallback?: string) => string;
  onOpenImage: () => void;
  onOpenContact: (message: ChatMessage) => void;
  onOpenEditHistory: () => void;
}) => {
  switch (message.messageType) {
    case 'text':
      return <TextMessageContent message={message} isOwnMessage={isOwnMessage} onOpenEditHistory={onOpenEditHistory} />;
    case 'image':
      return <ImageMessageContent message={message} isOwnMessage={isOwnMessage} buildMediaUrl={buildMediaUrl} onPreview={onOpenImage} />;
    case 'audio':
      return <AudioMessageContent message={message} isOwnMessage={isOwnMessage} buildMediaUrl={buildMediaUrl} />;
    case 'video':
      return <VideoMessageContent message={message} isOwnMessage={isOwnMessage} buildMediaUrl={buildMediaUrl} />;
    case 'sticker':
      return <StickerMessageContent message={message} isOwnMessage={isOwnMessage} buildMediaUrl={buildMediaUrl} />;
    case 'document':
    case 'media':
      return <DocumentMessageContent message={message} isOwnMessage={isOwnMessage} buildMediaUrl={buildMediaUrl} />;
    case 'location':
      return <LocationMessageContent message={message} isOwnMessage={isOwnMessage} />;
    case 'contact':
      return <ContactMessageContent message={message} isOwnMessage={isOwnMessage} onOpenDetails={onOpenContact} />;
    case 'poll':
      return <PollMessageContent message={message} isOwnMessage={isOwnMessage} />;
    default:
      return <TextMessageContent message={message} isOwnMessage={isOwnMessage} />;
  }
};


const MessageStatus = ({ status, isOwnMessage }: { status?: string, isOwnMessage: boolean }) => {
  if (!isOwnMessage) return null;

  const effectiveStatus = status || 'sent';

  if (effectiveStatus === 'read') {
    return <CheckCheck className="w-3.5 h-3.5 text-sky-200 ml-1" />;
  }
  if (effectiveStatus === 'delivered') {
    return <CheckCheck className="w-3.5 h-3.5 text-white/50 ml-1" />;
  }
  return <Check className="w-3.5 h-3.5 text-white/50 ml-1" />;
};

const NOOP = () => { };

const withFallback = <Args extends unknown[]>(handler: ((...args: Args) => void) | undefined) => {
  return (...args: Args): void => {
    if (handler) {
      handler(...args);
      return;
    }
    NOOP();
  };
};

const MessageActions = ({
  message,
  isOwnMessage,
  isFavorite,
  onToggleFavorite,
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
  isOwnMessage: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (message: ChatMessage) => void;
  onForward?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage, newMessage: string) => void;
  onAddNote?: (message: ChatMessage, note: string) => void;
  onReply?: (message: ChatMessage) => void;
  onPin?: (message: ChatMessage, isPinned: boolean) => void;
  onReact?: (message: ChatMessage, position: { x: number; y: number }) => void;
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
}) => (
  <div className="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
    <MessageMenu
      message={message}
      isOwnMessage={isOwnMessage}
      isFavorite={isFavorite || false}
      onToggleFavorite={withFallback(onToggleFavorite)}
      onForward={withFallback(onForward)}
      onDelete={withFallback(onDelete)}
      onEdit={withFallback(onEdit)}
      onAddNote={withFallback(onAddNote)}
      onReply={withFallback(onReply)}
      onPin={withFallback(onPin)}
      onReact={withFallback(onReact)}
      isOpen={isMenuOpen || false}
      onToggle={withFallback(onMenuToggle)}
    />
  </div>
);

const ReplyBlock = ({ message, isOwnMessage }: { message: ChatMessage; isOwnMessage: boolean }) => {
  if (!message.replyToMessage) return null;

  return (
        <div className={`mb-1 p-2 rounded-xl text-sm border-l-4 ${isOwnMessage ? 'bg-white/10 border-white/50 text-white/90' : 'bg-gray-50 dark:bg-slate-700/50 border-soft-primary text-gray-600 dark:text-gray-300'}`}>
      <div className="font-semibold text-xs mb-1 flex items-center gap-1">
        Replying to:
        <span className="font-bold">
          {message.replyToMessage.isFromMe
            ? (message.replyToMessage.sender || 'user')
            : (message.replyToMessage.sender || message.replyToMessage.contactName || message.replyToMessage.pushName || message.replyToMessage.contactId || message.replyToMessage.ContactId || 'Unknown')}
        </span>
      </div>
      <div className="truncate opacity-80">
        {message.replyToMessage.message || (message.replyToMessage.mediaPath ? '[Media]' : '[Message]')}
      </div>
    </div>
  );
};

const NoteBlock = ({ message, isOwnMessage }: { message: ChatMessage; isOwnMessage: boolean }) => {
  if (!message.note || message.isEdit) return null;

  return (
        <div className={`mb-1 p-2 rounded-xl text-sm border-l-4 ${isOwnMessage ? 'bg-white/10 border-yellow-300 text-white/90' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-gray-700 dark:text-gray-200'}`}>
      <div className="font-semibold text-xs mb-1">Note:</div>
      <div className="opacity-90">{message.note}</div>
    </div>
  );
};

const MessageBubble = ({
  message,
  isOwnMessage,
  currentUserId,
  showName,
  buildMediaUrl,
  onOpenImage,
  onOpenContact,
  onOpenEditHistory
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  currentUserId?: string | null;
  showName: boolean;
  buildMediaUrl: (primary?: string, fallback?: string) => string;
  onOpenImage: () => void;
  onOpenContact: (message: ChatMessage) => void;
  onOpenEditHistory: () => void;
}) => {
  const displayName = isOwnMessage
    ? (message.sender || 'user')
    : (message.sender || message.contactName || message.pushName || message.contactId || message.ContactId || 'Unknown');
  const displayPhone = isOwnMessage ? '' : (message.contactId || message.ContactId || '');

  return (
  <div key={message.id}
        className={`px-3.5 py-1.5 relative max-w-[72%] transition-all duration-200 
       ${isOwnMessage
      ? 'bg-emerald-500 dark:bg-emerald-600 text-white rounded-2xl rounded-br-md shadow-sm'
        : 'bg-[var(--chat-panel)] text-[var(--chat-text)] rounded-2xl rounded-bl-md border border-[var(--chat-border)]'
      } 
       ${message.isPinned ? 'ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
  >
    {showName && (
          <div className="mb-1">
        <div className={`text-[11px] font-bold ${isOwnMessage ? 'text-white/90' : 'theme-text-accent opacity-90'}`}>
          {displayName}
        </div>
        {!!displayPhone && (
          <div className={`text-[10px] ${isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
            +{displayPhone}
          </div>
        )}
      </div>
    )}

    {message.isPinned && (
      <div className={`flex items-center space-x-1 mb-1 text-xs ${isOwnMessage ? 'text-white/90' : 'text-amber-500'}`}>
        <Pin className="w-3 h-3" />
        <span>Pinned</span>
      </div>
    )}

    <ReplyBlock message={message} isOwnMessage={isOwnMessage} />
    <NoteBlock message={message} isOwnMessage={isOwnMessage} />

    <MessageContent
      message={message}
      isOwnMessage={isOwnMessage}
      buildMediaUrl={buildMediaUrl}
      onOpenImage={onOpenImage}
      onOpenContact={onOpenContact}
      onOpenEditHistory={onOpenEditHistory}
    />
    <Reactions message={message} currentUserId={currentUserId} />
  </div>
  );
};

export function Message({
  message,
  currentUserId,
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
  onMenuToggle,
  showName = true
}: MessageProps) {
  const isOwnMessage = message.isFromMe;
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEditHistoryOpen, setIsEditHistoryOpen] = useState(false);
  const [activeContact, setActiveContact] = useState<ParsedContactDetails | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const editHistoryEntries = getEditHistoryEntries(message);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';
  const buildMediaUrl = (primary?: string, fallback?: string) => {
    const pick = primary || fallback || '';
    if (!pick || /^\[[^\]]+\]$/.test(pick.trim())) return '';
    if (/^data:/.test(pick)) return pick;
    if (/^https?:\/\//i.test(pick)) return pick;

    const normalizedApiBase = apiBaseUrl.replace(/\/+$/, '');
    const normalizedPath = pick.replace(/\\/g, '/');
    const mediaMatch = normalizedPath.match(/(?:^|\/)(imgs|video|audio|docs)\/.+$/i);
    const relativePath = (mediaMatch ? mediaMatch[0].replace(/^\/+/, '') : normalizedPath.replace(/^\/+/, ''));

    return `${normalizedApiBase}/${relativePath}`;
  };

  const handleOpenContactDetails = (contactMessage: ChatMessage) => {
    const details = parseContactDetails(contactMessage);
    if (!details) return;
    setActiveContact(details);
    setDraftMessage('');
  };

  const openAppChat = (phone: string, text?: string) => {
    const cleanPhone = String(phone || '').replace(/[^\d]/g, '');
    if (!cleanPhone) return;
    const messageQuery = text && text.trim()
      ? `&message=${encodeURIComponent(text.trim())}`
      : '';
    window.location.href = `/chat?contact=${encodeURIComponent(cleanPhone)}${messageQuery}`;
  };

  return (
    <>
      <div className={`group flex items-end space-x-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        {!isOwnMessage && (
          <div
            className={`w-7 h-7 rounded-lg shrink-0 border border-[var(--chat-border)] bg-[var(--chat-avatar-bg)] text-[var(--chat-muted)] text-xs font-semibold flex items-center justify-center ${showName ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!showName}
          >
            {(message.sender || message.contactName || message.pushName || message.contactId || message.ContactId || '?').slice(0, 1).toUpperCase()}
          </div>
        )}

        {isOwnMessage && (
          <MessageActions
            message={message}
            isOwnMessage={isOwnMessage}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onForward={onForward}
            onDelete={onDelete}
            onEdit={onEdit}
            onAddNote={onAddNote}
            onReply={onReply}
            onPin={onPin}
            onReact={onReact}
            isMenuOpen={isMenuOpen}
            onMenuToggle={onMenuToggle}
          />
        )}

        <MessageBubble
          message={message}
          isOwnMessage={isOwnMessage}
          currentUserId={currentUserId}
          showName={showName}
          buildMediaUrl={buildMediaUrl}
          onOpenImage={() => setIsImageModalOpen(true)}
          onOpenContact={handleOpenContactDetails}
          onOpenEditHistory={() => setIsEditHistoryOpen(true)}
        />

        {!isOwnMessage && (
          <MessageActions
            message={message}
            isOwnMessage={isOwnMessage}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onForward={onForward}
            onDelete={onDelete}
            onEdit={onEdit}
            onAddNote={onAddNote}
            onReply={onReply}
            onPin={onPin}
            onReact={onReact}
            isMenuOpen={isMenuOpen}
            onMenuToggle={onMenuToggle}
          />
        )}
      </div>

      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageSrc={buildMediaUrl(message.mediaPath, message.mediaPath ? undefined : `imgs/${message.id}.webp`)}
        imageAlt="Chat image"
      />

      {activeContact && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-panel)] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-[var(--chat-muted)]">Contact Details</p>
                <h3 className="text-lg font-semibold text-[var(--chat-text)]">{activeContact.name}</h3>
                <p className="text-sm text-[var(--chat-muted)]">{activeContact.phone || 'Phone unavailable'}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveContact(null)}
                className="rounded-md px-2 py-1 text-xs border border-[var(--chat-border)] text-[var(--chat-muted)] hover:bg-black/5"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                disabled={!activeContact.phone}
                onClick={() => {
                  if (!activeContact.phone) return;
                  window.open(`tel:${activeContact.phone}`, '_self');
                }}
                className="rounded-lg px-3 py-2 text-sm font-semibold border border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-black/5 disabled:opacity-50"
              >
                Call
              </button>
              <button
                type="button"
                disabled={!activeContact.phone}
                onClick={() => openAppChat(activeContact.phone)}
                className="rounded-lg px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Open Chat
              </button>
            </div>

            <label className="block text-xs text-[var(--chat-muted)] mb-1">Quick message</label>
            <textarea
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              rows={3}
              placeholder="Type a message to prefill chat..."
              className="w-full rounded-lg border border-[var(--chat-border)] bg-transparent px-3 py-2 text-sm text-[var(--chat-text)] mb-3"
            />

            <button
              type="button"
              disabled={!activeContact.phone || !draftMessage.trim()}
              onClick={() => openAppChat(activeContact.phone, draftMessage)}
              className="w-full rounded-lg px-3 py-2 text-sm font-semibold bg-[var(--chat-accent)] text-white disabled:opacity-50"
            >
              Open Chat With Message
            </button>
          </div>
        </div>
      )}

      {isEditHistoryOpen && message.isEdit && editHistoryEntries.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-[72] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditHistoryOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-[73] h-full w-full max-w-md border-l border-[var(--chat-border)] bg-[var(--chat-panel)] shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[var(--chat-border)] px-4 py-3">
                <div>
                  <p className="text-xs text-[var(--chat-muted)]">Full history</p>
                  <h3 className="text-sm font-semibold text-[var(--chat-text)]">Edited Message</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditHistoryOpen(false)}
                  className="rounded-md px-2 py-1 text-xs border border-[var(--chat-border)] text-[var(--chat-muted)] hover:bg-black/5"
                >
                  Close
                </button>
              </div>

              <div className="px-4 py-3 border-b border-[var(--chat-border)]">
                <p className="text-xs text-[var(--chat-muted)] mb-1">Current message</p>
                <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg-soft)] px-3 py-2 text-sm whitespace-pre-wrap break-words text-[var(--chat-text)]">
                  {message.message}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {editHistoryEntries.map((entry, index) => (
                  <div key={String(entry.id)} className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg-soft)] px-3 py-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-[var(--chat-muted)]">Version {editHistoryEntries.length - index}</span>
                      <span className="text-[11px] text-[var(--chat-muted)]">{formatDateTimeShort(entry.editedAt)}</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words text-[var(--chat-text)]">{entry.oldMessage}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export const MemoizedMessage = memo(Message, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.timeStamp === nextProps.message.timeStamp &&
    prevProps.message.message === nextProps.message.message &&
    prevProps.message.isEdit === nextProps.message.isEdit &&
    prevProps.message.note === nextProps.message.note &&
    prevProps.message.editHistory === nextProps.message.editHistory &&
    prevProps.message.reactions === nextProps.message.reactions &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.isMenuOpen === nextProps.isMenuOpen &&
    prevProps.showName === nextProps.showName
  );
});