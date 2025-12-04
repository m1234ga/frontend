'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Forward, User } from 'lucide-react';
import { Chat as ChatModel, ChatMessage } from '../../../../Shared/Models';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage;
  conversations: ChatModel[];
  onForward: (message: ChatMessage, targetChatId: string) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  onClose,
  message,
  conversations,
  onForward
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isForwarding, setIsForwarding] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedChatId(null);
      setIsForwarding(false);
    }
  }, [isOpen]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation =>
    conversation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.phone.includes(searchTerm)
  );

  const handleForward = async () => {
    if (!selectedChatId) return;

    setIsForwarding(true);
    try {
      await onForward(message, selectedChatId);
      onClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
    } finally {
      setIsForwarding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && selectedChatId) {
      handleForward();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Forward className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Forward Message
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Forwarding:
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            {message.messageType === 'text' && (
              <p className="text-sm text-gray-900 dark:text-white">
                {message.message}
              </p>
            )}
            {message.messageType === 'image' && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                  <Forward className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-gray-900 dark:text-white">
                  Image
                </span>
              </div>
            )}
            {message.messageType === 'audio' && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                  <Forward className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-gray-900 dark:text-white">
                  Audio Message
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(message.timeStamp || message.timestamp || Date.now()).toLocaleString('en-US', { timeZone: process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Cairo' })}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No conversations found' : 'No conversations available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedChatId(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedChatId === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {conversation.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.phone}
                      </p>
                    </div>
                    {selectedChatId === conversation.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedChatId || isForwarding}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isForwarding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Forwarding...</span>
              </>
            ) : (
              <>
                <Forward className="w-4 h-4" />
                <span>Forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
