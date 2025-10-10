'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Chat,ChatMessage } from '@shared/Models';

interface SocketContextType {
  socket: Socket | null;
  sendMessage: (message:ChatMessage) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  isConnected: boolean;
  onNewMessage: (callback: (message: ChatMessage) => void) => void;
  onChatUpdate: (callback: (chat: Chat) => void) => void;
  onUserTyping: (callback: (data: { userId: string; isTyping: boolean; conversationId: string }) => void) => void;
  onChatPresence: (callback: (data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => void) => void;
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
  const chatUpdateCallbackRef = useRef<((chat: Chat) => void) | null>(null);
  const userTypingCallbackRef = useRef<((data: { userId: string; isTyping: boolean; conversationId: string }) => void) | null>(null);
  const chatPresenceCallbackRef = useRef<((data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => void) | null>(null);

  useEffect(() => {
    if (user && token) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token
        },
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        newSocket.emit('join', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Listen for new messages
      newSocket.on('new_message', (message: ChatMessage) => {
        console.log('New message received:', message);
        if (newMessageCallbackRef.current) {
          newMessageCallbackRef.current(message);
        }
      });

      // Listen for chat updates
      newSocket.on('chat_updated', (chat: Chat) => {
        console.log('Chat updated:', chat);
        if (chatUpdateCallbackRef.current) {
          chatUpdateCallbackRef.current(chat);
        }
      });

      // Listen for typing indicators
      newSocket.on('user_typing', (data: { userId: string; isTyping: boolean; conversationId: string }) => {
        console.log('User typing:', data);
        if (userTypingCallbackRef.current) {
          userTypingCallbackRef.current(data);
        }
      });

      // Listen for chat presence updates
      newSocket.on('chat_presence', (data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => {
        console.log('Chat presence:', data);
        if (chatPresenceCallbackRef.current) {
          chatPresenceCallbackRef.current(data);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const sendMessage = (message:ChatMessage) => {
    
    if (socket && user) {
      socket.emit('send_message', message);
    }
  };

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

  const onChatUpdate = useCallback((callback: (chat:Chat) => void) => {
    chatUpdateCallbackRef.current = callback;
  }, []);

  const onUserTyping = useCallback((callback: (data: { userId: string; isTyping: boolean; conversationId: string }) => void) => {
    userTypingCallbackRef.current = callback;
  }, []);

  const onChatPresence = useCallback((callback: (data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => void) => {
    chatPresenceCallbackRef.current = callback;
  }, []);

  const value = {
    socket,
    sendMessage,
    joinConversation,
    leaveConversation,
    isConnected,
    onNewMessage,
    onChatUpdate,
    onUserTyping,
    onChatPresence,
    emitTyping,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 