"use client";

import React from 'react';
import { User, Check, XCircle, UserPlus, Star } from 'lucide-react';
import { Chat } from '@shared/Models';

import TypingIndicator from './TypingIndicator';

interface ChatHeaderProps {
  selectedConversation: Chat;
  isOnline: boolean;
  typingUsers: Set<string>;
  chatStatus: 'open' | 'closed';
  onAssignClick: () => void;
  onStatusClick: () => void;
  favoriteCount: number;
  onFavoritesClick: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ selectedConversation, isOnline, typingUsers, chatStatus, onAssignClick, onStatusClick, favoriteCount, onFavoritesClick }) => {
  return (
    <div className="glass-panel sticky top-0 z-30 mb-2 mx-4 mt-2 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-1">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-soft-primary to-soft-primary-light rounded-2xl flex items-center justify-center shadow-soft-md transform transition-transform hover:rotate-3">
            <User className="w-6 h-6 text-white" />
          </div>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full animate-bounce-subtle"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg truncate tracking-tight">{selectedConversation.name}</h2>
            {selectedConversation.unreadCount > 0 && (
              <span className="bg-soft-primary text-white text-xs rounded-full px-2 py-0.5 font-bold shadow-soft-sm">{selectedConversation.unreadCount}</span>
            )}
          </div>
          <div className="text-sm font-medium">
            {typingUsers.size > 0 ? (
              <TypingIndicator className="flex items-center space-x-1 text-soft-primary" dotClassName="bg-soft-primary" text="typing" />
            ) : isOnline ? (
              <span className="text-emerald-500 flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Online</span>
            ) : (
              <span className="text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 bg-gray-300 rounded-full"></span>Offline</span>
            )}
          </div>
        </div>
      </div>


      <div className="flex items-center space-x-3">
        <button onClick={onAssignClick} className="soft-button bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 flex items-center gap-2" title="Assign to User">
          <UserPlus className="w-4 h-4" />
          <span className="hidden md:inline">Assign</span>
        </button>

        <button
          onClick={onStatusClick}
          className={`soft-button flex items-center gap-2 ${chatStatus === 'closed'
            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300'
            }`}
          title={`Chat is ${chatStatus}. Click to ${chatStatus === 'open' ? 'close' : 'reopen'}`}
        >
          {chatStatus === 'closed' ? (
            <><Check className="w-4 h-4" /><span className="hidden md:inline">Closed</span></>
          ) : (
            <><XCircle className="w-4 h-4" /><span className="hidden md:inline">Close</span></>
          )}
        </button>

        <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>

        <button onClick={onFavoritesClick} className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 active:scale-90" title="Favorite Messages">
          <Star className={`w-5 h-5 ${favoriteCount > 0 ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} />
          {favoriteCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-soft-primary text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">{favoriteCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
