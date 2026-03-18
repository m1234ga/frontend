'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Edit3,
  Pin,
  PinOff,
  StickyNote,
  Reply,
  Heart,
  Forward,
  Trash2,
  X,
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
  const [isMounted, setIsMounted] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({ top: 0, left: 0 });

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const shouldShowPopup = isOpen || isEditing || isAddingNote;

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const updatePopupPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = isEditing || isAddingNote ? 320 : 280;
    const popupHeight = isEditing || isAddingNote ? 260 : 420;
    const edgePadding = 8;
    const gap = 8;

    // Horizontal positioning
    let left = isOwnMessage
      ? buttonRect.left - popupWidth - gap
      : buttonRect.right + gap;

    if (isOwnMessage && left < edgePadding) {
      left = buttonRect.right + gap;
    }

    if (left + popupWidth > viewportWidth - edgePadding) {
      left = viewportWidth - popupWidth - edgePadding;
    }
    if (left < edgePadding) {
      left = edgePadding;
    }

    // Vertical positioning - smart below/above detection
    let top = buttonRect.bottom + gap;
    let positionedAbove = false;

    // Check if menu would overflow bottom of viewport
    if (top + popupHeight > viewportHeight - edgePadding) {
      // Not enough space below, try above
      const topAbove = Math.max(edgePadding, buttonRect.top - popupHeight - gap);
      top = topAbove;
      positionedAbove = true;
    }

    setPopupStyle({
      position: 'fixed',
      left,
      top,
      zIndex: 120,
      width: popupWidth,
      maxHeight: `calc(100vh - ${edgePadding * 2}px)`
    });
  }, [isAddingNote, isEditing, isOwnMessage]);

  useEffect(() => {
    if (!shouldShowPopup) return;

    updatePopupPosition();

    const handleReposition = () => updatePopupPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [shouldShowPopup, updatePopupPosition]);

  useEffect(() => {
    if (!shouldShowPopup) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideMenu = !!menuRef.current?.contains(target);
      const clickedButton = !!buttonRef.current?.contains(target);

      if (clickedInsideMenu || clickedButton) {
        return;
      }

      if (isOpen) {
        onToggle();
      }

      if (isEditing) {
        setIsEditing(false);
        setEditText(message.message);
      }

      if (isAddingNote) {
        setIsAddingNote(false);
        setNoteText(message.note || '');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shouldShowPopup, isOpen, isEditing, isAddingNote, message.message, message.note, onToggle]);

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

  const renderEditPopup = () => (
    <div ref={menuRef} style={popupStyle} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 overflow-auto">
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

  const renderAddNotePopup = () => (
    <div ref={menuRef} style={popupStyle} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 overflow-auto">
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

  const renderMainPopup = () => (
    <div ref={menuRef} style={popupStyle} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-48 overflow-auto">
      <div className="px-3 py-1">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Message Actions
        </div>

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

      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

      <div className="px-3 py-1">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Quick Actions
        </div>

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

  const popupNode = isEditing
    ? renderEditPopup()
    : isAddingNote
      ? renderAddNotePopup()
      : isOpen
        ? renderMainPopup()
        : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className={`p-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
          shouldShowPopup ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        title="More options"
        type="button"
      >
        <MoreVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
      </button>

      {isMounted && popupNode ? createPortal(popupNode, document.body) : null}
    </>
  );
};
