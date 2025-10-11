"use client";

import React from 'react';
import TagPill from './TagPill';
import { X, Check, XCircle } from 'lucide-react';

interface CloseTag { id: string; name: string; color?: string }

interface ChatCloseModalProps {
  isOpen: boolean;
  tags: CloseTag[];
  selectedTagId: string | null;
  onSelectTag: (id: string | null) => void;
  onCancel: () => void;
  onConfirm: () => void;
  conversationName?: string;
}

const ChatCloseModal: React.FC<ChatCloseModalProps> = ({ isOpen, tags, selectedTagId, onSelectTag, onCancel, onConfirm, conversationName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <XCircle className="w-5 h-5 mr-2 text-red-500" />
              Close Chat
            </h3>
            <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for closing this chat with <strong className="text-gray-900 dark:text-white">{conversationName}</strong>.
            </p>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Closing Reason <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagPill
                  key={tag.id}
                  id={tag.id}
                  name={tag.name}
                  color={tag.color}
                  selected={selectedTagId === tag.id}
                  onClick={(id) => onSelectTag(id === selectedTagId ? null : id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 rounded-b-xl">
          <div className="flex items-center justify-end space-x-3">
            <button onClick={onCancel} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
            <button onClick={onConfirm} disabled={!selectedTagId} className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2 shadow-lg">
              <Check className="w-4 h-4" />
              <span>Close Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCloseModal;
