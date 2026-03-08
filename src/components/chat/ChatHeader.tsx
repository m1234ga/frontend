"use client";

import React from 'react';
import Image from 'next/image';
import { User, Check, XCircle, UserPlus, Star, Phone, MoreHorizontal, Pin } from 'lucide-react';
import { Chat } from '@shared/Models';

import TypingIndicator from './TypingIndicator';
import TagPill from '../common/TagPill';

interface ChatHeaderProps {
  selectedConversation: Chat;
  isOnline: boolean;
  typingUsers: Set<string>;
  chatStatus: 'open' | 'closed';
  onAssignClick: () => void;
  onStatusClick: () => void;
  favoriteCount: number;
  onFavoritesClick: () => void;
  pinnedCount: number;
  pinnedPreview?: string;
  onPinnedClick: () => void;
  onClose?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedConversation,
  isOnline,
  typingUsers,
  chatStatus,
  onAssignClick,
  onStatusClick,
  favoriteCount,
  onFavoritesClick,
  pinnedCount,
  pinnedPreview,
  onPinnedClick,
  onClose
}) => {
  const displayName = selectedConversation.name?.split('-_-')[0] || selectedConversation.phone;

  return (
    <header className="enterprise-chat-header sticky top-0 z-30 px-4 md:px-6 py-3 flex items-start justify-between gap-3" aria-label="Conversation header">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <div className="relative">
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[var(--chat-avatar-bg)] border border-[var(--chat-border)] flex items-center justify-center overflow-hidden">
            {selectedConversation.avatar ? (
              <Image src={selectedConversation.avatar} alt={displayName} fill sizes="44px" className="object-cover" />
            ) : (
              <User className="w-5 h-5 text-[var(--chat-text)]" />
            )}
          </div>
          <span
            className={`absolute -right-1 -bottom-1 w-3 h-3 rounded-full border-2 border-[var(--chat-panel)] ${isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
            aria-label={isOnline ? 'Online' : 'Offline'}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-semibold text-base md:text-[17px] tracking-tight truncate text-[var(--chat-text)] dark:text-white">
              {displayName}
            </h2>
            <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${chatStatus === 'closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50'}`}>
              {chatStatus === 'closed' ? 'Closed' : 'Open'}
            </span>
            {selectedConversation.unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full min-w-5 h-5 px-1.5 text-[11px] font-bold bg-[var(--chat-accent)] text-white">
                {selectedConversation.unreadCount}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--chat-muted)]">
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {selectedConversation.phone}
            </span>
            {typingUsers.size > 0 && (
              <TypingIndicator className="inline-flex items-center gap-1 text-[var(--chat-accent)]" dotClassName="bg-[var(--chat-accent)]" text="typing" />
            )}
          </div>

          {selectedConversation.tags && selectedConversation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedConversation.tags.map((tag) => (
                <TagPill key={tag.tagId} id={tag.tagId} name={tag.tagName} color={tag.color} />
              ))}
            </div>
          )}

          {pinnedCount > 0 && (
            <button
              onClick={onPinnedClick}
              className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-panel)] px-2.5 py-1 text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
              title="View pinned messages"
              aria-label="View pinned messages"
            >
              <Pin className="h-3.5 w-3.5" />
              <span className="font-semibold">Pinned {pinnedCount}</span>
              {pinnedPreview && <span className="truncate">- {pinnedPreview}</span>}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 pl-2 shrink-0 self-start">
        <button
          onClick={onAssignClick}
          className="enterprise-header-btn"
          title="Assign chat"
          aria-label="Assign chat"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden xl:inline">Assign</span>
        </button>

        <button
          onClick={onStatusClick}
          className="enterprise-header-btn"
          title={chatStatus === 'open' ? 'Close chat' : 'Reopen chat'}
          aria-label={chatStatus === 'open' ? 'Close chat' : 'Reopen chat'}
        >
          {chatStatus === 'closed' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="hidden xl:inline">{chatStatus === 'closed' ? 'Reopen' : 'Close'}</span>
        </button>

        <button
          onClick={onFavoritesClick}
          className="enterprise-header-btn relative"
          title="Favorite messages"
          aria-label="Favorite messages"
        >
          <Star className={`w-4 h-4 ${favoriteCount > 0 ? 'text-amber-500 fill-amber-500' : ''}`} />
          <span className="hidden xl:inline">Starred</span>
          {favoriteCount > 0 && (
            <span className="absolute -top-1 -right-1 rounded-full min-w-4 h-4 px-1 text-[10px] font-bold bg-[var(--chat-accent)] text-white">
              {favoriteCount}
            </span>
          )}
        </button>

        <button
          onClick={onPinnedClick}
          className="enterprise-header-btn relative"
          title="Pinned messages"
          aria-label="Pinned messages"
        >
          <Pin className={`w-4 h-4 ${pinnedCount > 0 ? 'text-[var(--chat-accent)]' : ''}`} />
          <span className="hidden lg:inline">Pinned</span>
          {pinnedCount > 0 && (
            <span className="absolute -top-1 -right-1 rounded-full min-w-4 h-4 px-1 text-[10px] font-bold bg-[var(--chat-accent)] text-white">
              {pinnedCount}
            </span>
          )}
        </button>

        <button className="enterprise-header-btn" aria-label="More actions" title="More actions">
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="enterprise-header-btn text-rose-600 dark:text-rose-300"
            aria-label="Close panel"
            title="Close panel"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
