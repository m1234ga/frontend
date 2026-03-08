'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Chat, ChatMessage, MessageReaction } from '@shared/Models';

const normalizeOutgoingPhone = (chatId: string, phone?: string): string => {
  const rawChatId = (chatId || '').trim();
  const rawPhone = (phone || '').trim();
  const base = (rawPhone || rawChatId).replace(/@[^@]+$/, '');
  const isGroup = rawPhone.endsWith('@g.us') || rawChatId.endsWith('@g.us') || rawChatId.includes('-');

  if (!base) return '';
  if (isGroup) return `${base}@g.us`;
  if (rawPhone) return rawPhone;
  return `${base}@s.whatsapp.net`;
};

interface SocketContextType {
  socket: Socket | null;
  sendMessage: (message: ChatMessage) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  isConnected: boolean;
  onNewMessage: (callback: (message: ChatMessage) => void) => void;
  onMessageUpdate: (callback: (message: ChatMessage & { tempId?: string }) => void) => void;
  onChatUpdate: (callback: (chat: Chat) => void) => void;
  onUserTyping: (callback: (data: { userId: string; isTyping: boolean; conversationId: string }) => void) => void;
  onChatPresence: (callback: (data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => void) => void;
  onReactionUpdate: (callback: (data: { messageId: string; reactions: MessageReaction[] }) => void) => void;
  emitTyping: (conversationId: string, isTyping: boolean) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  // Use refs to store callbacks to prevent re-renders
  const newMessageCallbackRef = useRef<((message: ChatMessage) => void) | null>(null);
  const messageUpdateCallbackRef = useRef<((message: ChatMessage & { tempId?: string }) => void) | null>(null);
  const chatUpdateCallbackRef = useRef<((chat: Chat) => void) | null>(null);
  const userTypingCallbackRef = useRef<((data: { userId: string; isTyping: boolean; conversationId: string }) => void) | null>(null);
  const chatPresenceCallbackRef = useRef<((data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => void) | null>(null);
  const reactionUpdateCallbackRef = useRef<((data: { messageId: string; reactions: MessageReaction[] }) => void) | null>(null);

  useEffect(() => {
    if (user && token) {
      // Use SOCKET_URL if set, otherwise fall back to API_URL, then default
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
        'http://localhost:5000';
      const newSocket = io(socketUrl, {
        auth: {
          token
        },
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join', user.id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('new_message', (message: ChatMessage) => {
        if (newMessageCallbackRef.current) {
          newMessageCallbackRef.current(message);
        }
      });

      newSocket.on('message_updated', (message: ChatMessage & { tempId?: string }) => {
        if (messageUpdateCallbackRef.current) {
          messageUpdateCallbackRef.current(message);
        }
      });

      newSocket.on('chat_updated', (chat: Chat) => {
        if (chatUpdateCallbackRef.current) {
          chatUpdateCallbackRef.current(chat);
        }
      });

      newSocket.on('user_typing', (data: { userId: string; isTyping: boolean; conversationId: string }) => {
        if (userTypingCallbackRef.current) {
          userTypingCallbackRef.current(data);
        }
      });

      newSocket.on('chat_presence', (data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => {
        if (chatPresenceCallbackRef.current) {
          chatPresenceCallbackRef.current(data);
        }
      });

      newSocket.on('reaction_updated', (data: { messageId: string; reactions: MessageReaction[] }) => {
        if (reactionUpdateCallbackRef.current) {
          reactionUpdateCallbackRef.current(data);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const sendMessage = useCallback((message: ChatMessage) => {
    if (socket && user) {
      const normalizedMessage = {
        ...message,
        phone: normalizeOutgoingPhone(message.chatId, message.phone),
      };
      socket.emit('send_message', normalizedMessage);
    }
  }, [socket, user]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('join_conversation', conversationId);
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('leave_conversation', conversationId);
    }
  }, [socket]);

  const emitTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (socket && user) {
      socket.emit('typing', {
        conversationId,
        userId: user.id,
        isTyping
      });
    }
  }, [socket, user]);

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  const off = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  const onNewMessage = useCallback((callback: (message: ChatMessage) => void) => {
    newMessageCallbackRef.current = callback;
  }, []);

  const onMessageUpdate = useCallback((callback: (message: ChatMessage & { tempId?: string }) => void) => {
    messageUpdateCallbackRef.current = callback;
  }, []);

  const onChatUpdate = useCallback((callback: (chat: Chat) => void) => {
    chatUpdateCallbackRef.current = callback;
  }, []);

  const onUserTyping = useCallback((callback: (data: { userId: string; isTyping: boolean; conversationId: string }) => void) => {
    userTypingCallbackRef.current = callback;
  }, []);

  const onChatPresence = useCallback((callback: (data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => void) => {
    chatPresenceCallbackRef.current = callback;
  }, []);

  const onReactionUpdate = useCallback((callback: (data: { messageId: string; reactions: MessageReaction[] }) => void) => {
    reactionUpdateCallbackRef.current = callback;
  }, []);

  const value = React.useMemo(() => ({
    socket,
    sendMessage,
    joinConversation,
    leaveConversation,
    isConnected,
    onNewMessage,
    onMessageUpdate,
    onChatUpdate,
    onUserTyping,
    onChatPresence,
    onReactionUpdate,
    emitTyping,
    on,
    off
  }), [
    socket,
    sendMessage,
    joinConversation,
    leaveConversation,
    isConnected,
    onNewMessage,
    onMessageUpdate,
    onChatUpdate,
    onUserTyping,
    onChatPresence,
    onReactionUpdate,
    emitTyping,
    on,
    off
  ]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 