'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit3, 
  MessageSquare, 
  Pin, 
  PinOff, 
  StickyNote, 
  Reply, 
  Heart, 
  Forward, 
  Trash2,
  X,
  Check,
  Save,
  MoreVertical,
  Smile
} from 'lucide-react';
import { ChatMessage } from '../../../../Shared/Models';

interface MessageMenuProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  isFavorite: boolean;
  onToggleFavorite: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage, newMessage: string) => void;
  onAddNote: (message: ChatMessage, note: string) => void;
  onReply: (message: ChatMessage) => void;
  onPin: (message: ChatMessage, isPinned: boolean) => void;
  onReact: (message: ChatMessage, position: { x: number; y: number }) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const MessageMenu: React.FC<MessageMenuProps> = ({
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
  isOpen,
  onToggle
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [noteText, setNoteText] = useState(message.note || '');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate popup position to stay within viewport
  const getPopupPosition = () => {
    if (!buttonRef.current) return { 
      horizontalPosition: 'right-full', 
      horizontalMargin: 'mr-2',
      verticalPosition: 'top-0',
      verticalMargin: 'mt-0'
    };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 320; // w-80 = 320px
    const popupHeight = 400; // Estimated height for popup
    
    // Calculate horizontal position
    let horizontalPosition = 'right-full';
    let horizontalMargin = 'mr-2';
    
    if (isOwnMessage) {
      const spaceOnLeft = buttonRect.left;
      if (spaceOnLeft >= popupWidth) {
        horizontalPosition = 'right-full';
        horizontalMargin = 'mr-2';
      } else {
        horizontalPosition = 'left-full';
        horizontalMargin = 'ml-2';
      }
    } else {
      const spaceOnRight = viewportWidth - buttonRect.right;
      if (spaceOnRight >= popupWidth) {
        horizontalPosition = 'left-full';
        horizontalMargin = 'ml-2';
      } else {
        horizontalPosition = 'right-full';
        horizontalMargin = 'mr-2';
      }
    }
    
    // Calculate vertical position
    let verticalPosition = 'top-0';
    let verticalMargin = 'mt-0';
    
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    if (spaceBelow >= popupHeight) {
      // Enough space below, show below button
      verticalPosition = 'top-0';
      verticalMargin = 'mt-0';
    } else if (spaceAbove >= popupHeight) {
      // Not enough space below, but enough above, show above button
      verticalPosition = 'bottom-0';
      verticalMargin = 'mb-0';
    } else {
      // Not enough space on either side, show below but adjust if needed
      verticalPosition = 'top-0';
      verticalMargin = 'mt-0';
    }
    
    return {
      horizontalPosition,
      horizontalMargin,
      verticalPosition,
      verticalMargin
    };
  };

  const popupPosition = getPopupPosition();

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const handleEdit = () => {
    if (editText.trim() && editText !== message.message) {
      onEdit(message, editText.trim());
    }
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote(message, noteText.trim());
    }
    setIsAddingNote(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'edit' | 'note') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (action === 'edit') {
        handleEdit();
      } else {
        handleAddNote();
      }
    }
    if (e.key === 'Escape') {
      if (action === 'edit') {
        setIsEditing(false);
        setEditText(message.message);
      } else {
        setIsAddingNote(false);
        setNoteText(message.note || '');
      }
    }
  };

  if (isEditing) {
    return (
      <div ref={menuRef} className={`absolute ${popupPosition.horizontalPosition} ${popupPosition.horizontalMargin} ${popupPosition.verticalPosition} ${popupPosition.verticalMargin} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 w-80 z-50`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Edit Message</h4>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditText(message.message);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'edit')}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
          autoFocus
        />
        <div className="flex items-center justify-end space-x-2 mt-2">
          <button
            onClick={() => {
              setIsEditing(false);
              setEditText(message.message);
            }}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={!editText.trim() || editText === message.message}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center space-x-1"
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
        </div>
      </div>
    );
  }

  if (isAddingNote) {
    return (
      <div ref={menuRef} className={`absolute ${popupPosition.horizontalPosition} ${popupPosition.horizontalMargin} ${popupPosition.verticalPosition} ${popupPosition.verticalMargin} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 w-80 z-50`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add Note</h4>
          <button
            onClick={() => {
              setIsAddingNote(false);
              setNoteText(message.note || '');
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'note')}
          placeholder="Add a note to this message..."
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
          autoFocus
        />
        <div className="flex items-center justify-end space-x-2 mt-2">
          <button
            onClick={() => {
              setIsAddingNote(false);
              setNoteText(message.note || '');
            }}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center space-x-1"
          >
            <StickyNote className="w-3 h-3" />
            <span>Add Note</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
        <button
          ref={buttonRef}
          onClick={onToggle}
          className="p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700"
          title="More options"
        >
          <MoreVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </button>
    );
  }

  return (
    <div ref={menuRef} className={`absolute ${popupPosition.horizontalPosition} ${popupPosition.horizontalMargin} ${popupPosition.verticalPosition} ${popupPosition.verticalMargin} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-48`}>
      {/* Main Actions */}
      <div className="px-3 py-1">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Message Actions
        </div>
        
        {/* Reply */}
        <button
          onClick={() => {
            onReply(message);
            onToggle();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Reply className="w-4 h-4" />
          <span>Reply</span>
        </button>

        {/* React */}
        <button
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onReact(message, { x: rect.left, y: rect.top - 10 });
            onToggle();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Smile className="w-4 h-4" />
          <span>React</span>
        </button>

        {/* Edit (only for own messages) */}
        {isOwnMessage && (
          <button
            onClick={() => {
              setIsEditing(true);
              onToggle();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        )}

        {/* Pin/Unpin */}
        <button
          onClick={() => {
            onPin(message, !message.isPinned);
            onToggle();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {message.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
        </button>

        {/* Add Note */}
        <button
          onClick={() => {
            setIsAddingNote(true);
            onToggle();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <StickyNote className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

      {/* Quick Actions */}
      <div className="px-3 py-1">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Quick Actions
        </div>
        
        {/* Favorite */}
        <button
          onClick={() => {
            onToggleFavorite(message);
            onToggle();
          }}
          className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
            isFavorite
              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
        </button>

        {/* Forward */}
        <button
          onClick={() => {
            onForward(message);
            onToggle();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Forward className="w-4 h-4" />
          <span>Forward</span>
        </button>

        {/* Delete (only for own messages) */}
        {isOwnMessage && (
          <button
            onClick={() => {
              onDelete(message);
              onToggle();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Close button */}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Close</span>
        </button>
      </div>
    </div>
  );
};
