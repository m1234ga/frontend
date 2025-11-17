'use client';
import React from 'react';
import { User, Archive, VolumeX, Tag, Check } from 'lucide-react';
import { Chat as ChatModel } from '../../../../Shared/Models';
import TagPill from '../common/TagPill';

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
    <div>
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          onContextMenu={(e) => { e.preventDefault(); onOpenTagManager?.(conversation); }}
          className={`p-4 border-b theme-border-primary cursor-pointer hover:bg-gray-500/10 transition-colors ${
            selectedConversationId === conversation.id ? 'bg-gray-500/20 border-l-4 border-l-gray-600' : ''
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0 overflow-visible">
                <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {conversation.name}
                    </h3>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                    {conversation.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        conversation.status === 'closed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {conversation.status === 'closed' ? 'Closed' : 'Open'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 truncate">
                    {conversation.phone}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  {onArchive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onArchive(conversation.id); }}
                      className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                      title="Archive Chat"
                    >
                      <Archive className="w-3 h-3 theme-text-accent" />
                    </button>
                  )}
                  {onUnarchive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onUnarchive(conversation.id); }}
                      className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                      title="Unarchive Chat"
                    >
                      <Archive className="w-3 h-3 theme-text-accent" />
                    </button>
                  )}
                  {onMuteToggle && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onMuteToggle(conversation.id); }}
                      className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                      title={conversation.isMuted ? "Unmute Chat" : "Mute Chat"}
                    >
                      <VolumeX className={`w-3 h-3 ${conversation.isMuted ? 'text-red-500' : 'theme-text-accent'}`} />
                    </button>
                  )}
                  {onAssign && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAssign(conversation.id); }}
                      className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                      title="Assign Chat"
                    >
                      <User className="w-3 h-3 theme-text-accent" />
                    </button>
                  )}
                  {onToggleStatus && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleStatus(conversation.id, conversation.status || 'open'); }}
                      className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                      title={conversation.status === 'closed' ? 'Reopen Chat' : 'Close Chat'}
                    >
                      <Check className={`w-3 h-3 ${conversation.status === 'closed' ? 'text-green-500' : 'theme-text-accent'}`} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenTagManager?.(conversation); }}
                    className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                    title="Manage Tags"
                  >
                    <Tag className="w-3 h-3 theme-text-accent" />
                  </button>
                  {conversation.lastMessageTime && (
                    <span className="text-xs theme-text-accent">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  )}
                </div>
              </div>
              {conversation.lastMessage && (
                <p className="text-sm theme-text-secondary truncate">
                  {conversation.lastMessage}
                </p>
              )}
              {conversation.tags && conversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 overflow-visible">
                  {conversation.tags.map((tag) => (
                    <div key={tag.id}>
                      <TagPill id={tag.id} name={tag.name} color={tag.color} />
                    </div>
                  ))}
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
