'use client';
import React from 'react';
import Image from 'next/image';
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

interface ChatTabItemProps {
  conversation: ChatModel;
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

interface ChatTabActionsProps {
  conversation: ChatModel;
  onArchive?: (chatId: string) => void;
  onUnarchive?: (chatId: string) => void;
  onMuteToggle?: (chatId: string) => void;
  onAssign?: (chatId: string) => void;
  onToggleStatus?: (chatId: string, currentStatus: string) => void;
  onOpenTagManager?: (chat: ChatModel) => void;
}

const isConversationTyping = (conversation: ChatModel) => (
  Boolean(conversation.isTyping && conversation.isOnline && conversation.status !== 'closed' && !conversation.isArchived)
);

const getStatusBadge = (status?: string) => {
  if (!status) return null;

  const isClosed = status === 'closed';
  return {
    label: isClosed ? 'Closed' : 'Open',
    className: isClosed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
  };
};

const getArchiveAction = (
  conversation: ChatModel,
  onArchive?: (chatId: string) => void,
  onUnarchive?: (chatId: string) => void
) => () => {
  if (!onArchive) return;
  if (conversation.isArchived) {
    onUnarchive?.(conversation.id);
    return;
  }
  onArchive(conversation.id);
};

const ConversationPreview = ({ conversation }: { conversation: ChatModel }) => {
  if (isConversationTyping(conversation)) {
    return <TypingIndicator className="flex items-center space-x-1 text-soft-primary text-xs" dotClassName="bg-soft-primary" />;
  }

  const statusBadge = getStatusBadge(conversation.status);

  return (
    <div className="flex items-center space-x-2">
      {statusBadge && (
        <span className={`text-[9px] px-1 py-0 rounded opacity-70 shrink-0 ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      )}
      {conversation.status === 'closed' && conversation.reason && (
        <span className="text-[10px] text-gray-500 italic truncate max-w-[100px]">
          - {conversation.reason}
        </span>
      )}
      <p className="text-sm theme-text-secondary truncate">
        {conversation.lastMessage || 'No messages'}
      </p>
    </div>
  );
};

const ChatTabActions: React.FC<ChatTabActionsProps> = ({
  conversation,
  onArchive,
  onUnarchive,
  onMuteToggle,
  onAssign,
  onToggleStatus,
  onOpenTagManager
}) => {
  return (
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
          title={conversation.isMuted ? 'Unmute' : 'Mute'}
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      )}
      {onArchive && (
        <button
          onClick={(e) => { e.stopPropagation(); getArchiveAction(conversation, onArchive, onUnarchive)(); }}
          className="p-1 hover:bg-gray-500/20 rounded text-gray-400 transition-colors"
          title={conversation.isArchived ? 'Unarchive' : 'Archive'}
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
  );
};

const ChatTabItem: React.FC<ChatTabItemProps> = ({
  conversation,
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
  return (
    <div
      key={conversation.id}
      onClick={() => onSelectConversation(conversation)}
      onContextMenu={(e) => { e.preventDefault(); onOpenTagManager?.(conversation); }}
      className={`p-4 border-b theme-border-primary cursor-pointer hover:bg-gray-500/10 transition-colors group ${selectedConversationId === conversation.id ? 'bg-gray-500/20 border-l-4 border-l-gray-600' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-md relative shrink-0 overflow-hidden">
          {conversation.avatar ? (
            <Image src={conversation.avatar} alt={conversation.name} className="w-full h-full object-cover" width={48} height={48} />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
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

          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-gray-400 truncate">
              {conversation.phone}
            </span>
            <ChatTabActions
              conversation={conversation}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
              onMuteToggle={onMuteToggle}
              onAssign={onAssign}
              onToggleStatus={onToggleStatus}
              onOpenTagManager={onOpenTagManager}
            />
          </div>

          <div className="mt-1 flex items-center justify-between min-h-[20px]">
            <div className="flex-1 min-w-0">
              <ConversationPreview conversation={conversation} />
            </div>
          </div>

          {conversation.tags && conversation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 transition-all">
              {conversation.tags.slice(0, 3).map((tag) => (
                <TagPill key={tag.tagId} id={tag.tagId} name={tag.tagName} color={tag.color} />
              ))}
              {conversation.tags.length > 3 && (
                <span className="text-[10px] text-gray-400">+{conversation.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
        <ChatTabItem
          key={conversation.id}
          conversation={conversation}
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onMuteToggle={onMuteToggle}
          onAssign={onAssign}
          onToggleStatus={onToggleStatus}
          onOpenTagManager={onOpenTagManager}
          formatTime={formatTime}
        />
      ))}
    </div>
  );
};

export default ChatTab;
