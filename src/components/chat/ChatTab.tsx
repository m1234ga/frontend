'use client';
import React from 'react';
import { User, Archive, VolumeX, Tag, Check, UserPlus } from 'lucide-react';
import { Chat as ChatModel } from '../../../../Shared/Models';
import TagPill from '../common/TagPill';
import TypingIndicator from './TypingIndicator';

interface ChatTabProps {
  conversations: ChatModel[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: ChatModel) => void;
  onArchive?: (chatId: string) => void;
  onUnarchive?: (chatId: string) => void;
  onMuteToggle?: (chatId: string) => void;
  onAssign?: (chatId: string) => void;
  onToggleStatus?: (chatId: string, currentStatus: string) => void;
  onOpenTagManager?: (chat: ChatModel) => void;
  formatTime: (date?: string | number | Date) => string;
}

const ChatTab: React.FC<ChatTabProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onArchive,
  onUnarchive,
  onMuteToggle,
  onAssign,
  onToggleStatus,
  onOpenTagManager,
  formatTime
}) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center theme-text-accent">No conversations</div>
    );
  }

  return (
    <div className="flex-1">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          onContextMenu={(e) => { e.preventDefault(); onOpenTagManager?.(conversation); }}
          className={`p-4 border-b theme-border-primary cursor-pointer hover:bg-gray-500/10 transition-colors group ${selectedConversationId === conversation.id ? 'bg-gray-500/20 border-l-4 border-l-gray-600' : ''
            }`}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar Section */}
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-md relative shrink-0">
              <User className="w-6 h-6 text-white" />
              {conversation.isOnline && (
                <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0">
              {/* Top Row: Name and Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 truncate dark:theme-text-primary">
                    {conversation.name}
                  </h3>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-soft-primary text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] theme-text-accent shrink-0">
                  {formatTime(conversation.lastMessageTime)}
                </span>
              </div>

              {/* Middle Row: Phone and Action Icons */}
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-gray-400 truncate">
                  {conversation.phone}
                </span>

                {/* Actions: Visible on hover or status based */}
                <div className="flex items-center space-x-1 shrink-0 px-1">
                  {onToggleStatus && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleStatus(conversation.id, conversation.status || 'open'); }}
                      className={`p-1 rounded transition-colors ${conversation.status === 'closed' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-500/20 text-gray-400'}`}
                      title={conversation.status === 'closed' ? 'Reopen Chat' : 'Close Chat'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onAssign && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAssign(conversation.id); }}
                      className="p-1 hover:bg-gray-500/20 rounded text-gray-400 transition-colors"
                      title="Assign Chat"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onMuteToggle && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onMuteToggle(conversation.id); }}
                      className={`p-1 rounded transition-colors ${conversation.isMuted ? 'text-red-500 bg-red-50' : 'hover:bg-gray-500/20 text-gray-400'}`}
                      title={conversation.isMuted ? "Unmute" : "Mute"}
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onArchive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); (conversation.isArchived ? onUnarchive?.(conversation.id) : onArchive(conversation.id)); }}
                      className="p-1 hover:bg-gray-500/20 rounded text-gray-400 transition-colors"
                      title={conversation.isArchived ? "Unarchive" : "Archive"}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenTagManager?.(conversation); }}
                    className="p-1 hover:bg-gray-500/20 rounded text-gray-400 transition-colors"
                    title="Manage Tags"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Message/Typing and Badges */}
              <div className="mt-1 flex items-center justify-between min-h-[20px]">
                <div className="flex-1 min-w-0">
                  {conversation.isTyping ? (
                    <TypingIndicator className="flex items-center space-x-1 text-soft-primary text-xs" dotClassName="bg-soft-primary" />
                  ) : (
                    <div className="flex items-center space-x-2">
                      {conversation.status && (
                        <span className={`text-[9px] px-1 py-0 rounded opacity-70 shrink-0 ${conversation.status === 'closed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                          }`}>
                          {conversation.status === 'closed' ? 'Closed' : 'Open'}
                        </span>
                      )}
                      <p className="text-sm theme-text-secondary truncate">
                        {conversation.lastMessage || 'No messages'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags Section */}
              {conversation.tags && conversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 transition-all">
                  {conversation.tags.slice(0, 3).map((tag) => (
                    <TagPill key={tag.id} id={tag.id} name={tag.name} color={tag.color} />
                  ))}
                  {conversation.tags.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{conversation.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatTab;
