"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Smile, Image as ImageIcon, Mic, Video, Send, Plus, Paperclip, Slash, Command, Hash } from 'lucide-react';

interface MessageInputProps {
  newMessage: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  onAttachImage: () => void;
  onAttachVideo: () => void;
  onAttachDocument: () => void;
  onStartRecording: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  onToggleTempMessages?: () => void;
  onOpenTemplates?: () => void;
  templateShortcuts?: Array<{
    key: string;
    label: string;
    insert: string;
  }>;
}

const QUICK_EMOJIS = ['😀', '👍', '🔥', '🎉', '🙏', '✅', '👀', '💡'];

const normalizeSlashLookup = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-\//g, '/');

const BASE_SLASH_COMMANDS = [
  { key: '/assign', label: 'Assign chat', insert: '/assign @' },
  { key: '/close', label: 'Close conversation', insert: '/close ' },
  { key: '/note', label: 'Internal note', insert: '/note ' },
  { key: '/tag', label: 'Tag conversation', insert: '/tag ' },
  { key: '/location', label: 'Send location', insert: '/location 30.0444,31.2357 Cairo' },
  { key: '/contact', label: 'Send contact', insert: '/contact John Doe|+201234567890' },
  { key: '/poll', label: 'Send poll', insert: '/poll Lunch?|Pizza|Burger|Salad' },
  { key: '/templates', label: 'Send template by name', insert: '/template ' }
];

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  onChange,
  onSend,
  onTypingChange,
  onAttachImage,
  onAttachVideo,
  onAttachDocument,
  onStartRecording,
  onStopRecording,
  isRecording,
  onOpenTemplates,
  templateShortcuts = []
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const slashCommands = useMemo(
    () => [...BASE_SLASH_COMMANDS, ...templateShortcuts],
    [templateShortcuts]
  );

  const slashMatches = useMemo(() => {
    const rawQuery = (newMessage || '').trim().toLowerCase();
    if (!rawQuery.startsWith('/')) return slashCommands;

    const normalizedQuery = normalizeSlashLookup(rawQuery);
    return slashCommands.filter((command) =>
      command.key.startsWith(rawQuery) ||
      normalizeSlashLookup(command.key).startsWith(normalizedQuery)
    );
  }, [newMessage, slashCommands]);

  useEffect(() => {
    if (newMessage.trim().startsWith('/')) {
      setShowSlashMenu(true);
      setActiveSlashIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  }, [newMessage]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const appendToMessage = (value: string) => {
    const nextValue = `${newMessage}${value}`;
    onChange(nextValue);
    textareaRef.current?.focus();
  };

  const applySlashCommand = (value: string) => {
    onChange(value.endsWith(' ') ? value : `${value} `);
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  };

  const updateTypingState = (isTyping: boolean) => {
    onTypingChange?.(isTyping);
    if (!isTyping) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange?.(false);
    }, 1300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const trimmedInput = newMessage.trim();
    const commandToken = trimmedInput.split(/\s+/, 1)[0] || '';
    const hasSlashArgument = trimmedInput.startsWith('/') && trimmedInput.length > commandToken.length;

    if (showSlashMenu && slashMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSlashIndex((prev) => Math.min(prev + 1, slashMatches.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSlashIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !hasSlashArgument) {
        e.preventDefault();
        applySlashCommand(slashMatches[activeSlashIndex]?.insert || '/');
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        applySlashCommand(slashMatches[activeSlashIndex]?.insert || '/');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        onSend();
        onTypingChange?.(false);
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
      e.preventDefault();
      if (newMessage.trim()) {
        onSend();
        onTypingChange?.(false);
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
      setShowSlashMenu(false);
      onTypingChange?.(false);
    }
  };

  return (
    <div className="enterprise-composer px-3 md:px-4 py-2.5" role="region" aria-label="Message composer">
      <div className="relative rounded-xl border border-[var(--chat-border)] bg-[var(--chat-panel)] shadow-sm px-2.5 py-2">
        <div className="flex items-center gap-1 mb-2 text-[11px] text-[var(--chat-muted)]">
          <span className="inline-flex items-center gap-1"><Command className="w-3 h-3" /> Enter to send</span>
          <span className="opacity-40">|</span>
          <span>Shift + Enter for newline</span>
          <span className="opacity-40">|</span>
          <span className="inline-flex items-center gap-1"><Slash className="w-3 h-3" /> slash commands</span>
        </div>

        <div className="flex items-end gap-1.5">
          <button
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            aria-label="Toggle emoji picker"
            title="Emoji"
            type="button"
          >
            <Smile className="w-5 h-5 text-[var(--chat-muted)]" />
          </button>

          <button onClick={onAttachImage} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" aria-label="Attach image" title="Attach image" type="button">
            <ImageIcon className="w-5 h-5 text-[var(--chat-muted)]" aria-hidden="true" />
          </button>

          <button onClick={onAttachVideo} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" aria-label="Attach video" title="Attach video" type="button">
            <Video className="w-5 h-5 text-[var(--chat-muted)]" />
          </button>

          <button onClick={onOpenTemplates} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Message templates" aria-label="Message templates" type="button">
            <Plus className="w-5 h-5 text-[var(--chat-muted)]" />
          </button>

          <button onClick={onAttachDocument} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Attach document" aria-label="Attach document" type="button">
            <Paperclip className="w-5 h-5 text-[var(--chat-muted)]" />
          </button>

          <div className="flex-1">
            <label htmlFor="enterprise-message-input" className="sr-only">Message input</label>
            <textarea
              id="enterprise-message-input"
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                onChange(e.target.value);
                updateTypingState(e.target.value.trim().length > 0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message team, use / for commands"
              rows={1}
              className="w-full resize-none min-h-[40px] max-h-32 px-3 py-2 rounded-lg border border-transparent bg-transparent focus:outline-none focus:border-[var(--chat-border)] text-[var(--chat-text)] placeholder:text-[var(--chat-muted)]"
              aria-multiline="true"
            />
          </div>

          <button
            onMouseDown={onStartRecording}
            onMouseUp={onStopRecording}
            onMouseLeave={onStopRecording}
            onTouchStart={onStartRecording}
            onTouchEnd={onStopRecording}
            aria-pressed={isRecording}
            className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-rose-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--chat-muted)]'}`}
            title="Hold to record"
            type="button"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button onClick={onSend} disabled={!newMessage.trim()} className="p-2.5 bg-[var(--chat-accent)] text-white rounded-lg hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Send message" type="button">
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>

        {showSlashMenu && slashMatches.length > 0 && (
          <div className="absolute left-3 bottom-[100%] mb-2 z-40 w-[320px] max-w-[95vw] rounded-lg border border-[var(--chat-border)] bg-[var(--chat-panel)] shadow-xl p-2" role="listbox" aria-label="Slash commands">
            <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-[var(--chat-muted)]">Commands</div>
            {slashMatches.map((command, index) => (
              <button
                key={command.key}
                type="button"
                className={`w-full text-left rounded-md px-2 py-1.5 text-sm flex items-center justify-between ${index === activeSlashIndex ? 'bg-[var(--chat-accent-soft)] text-[var(--chat-text)]' : 'text-[var(--chat-muted)] hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  applySlashCommand(command.insert);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="font-medium">{command.key}</span>
                </span>
                <span className="text-xs opacity-70">{command.label}</span>
              </button>
            ))}
          </div>
        )}

        {showEmojiPicker && (
          <div className="absolute left-3 bottom-[100%] mb-2 z-40 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-panel)] shadow-xl p-2.5" role="dialog" aria-label="Emoji picker">
            <div className="flex gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="text-xl leading-none rounded-md px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => appendToMessage(emoji)}
                  aria-label={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 px-1 text-[11px] text-[var(--chat-muted)]">
          <span className="inline-flex items-center gap-1">Tip: use <kbd className="rounded border border-[var(--chat-border)] px-1.5 py-0.5">/template your-template</kbd>.</span>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
