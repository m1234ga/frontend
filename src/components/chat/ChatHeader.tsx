"use client";

import React from 'react';
import { User, Check, XCircle, UserPlus } from 'lucide-react';
import { Chat } from '@shared/Models';

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
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{selectedConversation.name}</h2>
              {selectedConversation.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">{selectedConversation.unreadCount}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {typingUsers.size > 0 ? (
                <span className="text-cyan-600 dark:text-cyan-400 italic">typing...</span>
              ) : isOnline ? (
                <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Online</span>
              ) : (
                <span className="flex items-center"><span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>Offline</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={onAssignClick} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30" title="Assign to User"><UserPlus className="w-4 h-4" /><span className="hidden md:inline">Assign</span></button>

          <button onClick={onStatusClick} className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${chatStatus === 'closed' ? 'bg-green-500/10 text-green-600' : 'bg-cyan-500/10 text-cyan-600'}`} title={`Chat is ${chatStatus}. Click to ${chatStatus === 'open' ? 'close' : 'reopen'}`}>
            {chatStatus === 'closed' ? (<><Check className="w-4 h-4" /><span className="hidden md:inline">Closed</span></>) : (<><XCircle className="w-4 h-4" /><span className="hidden md:inline">Open</span></>)}
          </button>

          <div className="flex items-center space-x-1 ml-2">
            <button onClick={onFavoritesClick} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group" title="Favorite Messages">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 21l-1-0.7C5 15 2 12 2 8.6 2 5.1 4.5 3 7.5 3c1.9 0 3.6 1 4.5 2.1C12.9 4 14.6 3 16.5 3 19.5 3 22 5.1 22 8.6c0 3.4-3 6.4-9 11.7L12 21z" strokeWidth="1" /></svg>
              {favoriteCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">{favoriteCount}</span>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
