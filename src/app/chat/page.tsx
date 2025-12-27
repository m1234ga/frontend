'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import ChatRouter from '@/components/chat/ChatRouters';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Chat as ChatModel, ChatMessage } from '../../../../Shared/Models';


export default function ChatPage() {
  const [conversations, setConversations] = useState<ChatModel[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatModel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socket = useSocket();
  const { token, authenticated, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !authenticated) {
      router.push('/auth');
    }
  }, [authenticated, loading, router]);

  const handleConversationsUpdate = useCallback((updatedConversations: ChatModel[]) => {
    setConversations(updatedConversations);
  }, []);

  async function GetConversation(id: string, limit: number = 10, before?: string) {
    return await ChatRouter(token || "").GetMessagesById(id, limit, before);
  }

  const handleSelectConversation = async (conversation: ChatModel) => {
    const data = await GetConversation(conversation.id, 10);

    // Update local state immediately to set unreadCount to 0
    const updatedConversation = { ...conversation, unreadCount: 0 };
    setSelectedConversation(updatedConversation);
    setMessages(data);

    // Update conversations list immediately
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation.id
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );

    // Mark chat as read when opened (backend call)
    try {
      await ChatRouter(token || "").MarkChatAsRead(conversation.id);
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const handleLoadMoreMessages = async (): Promise<boolean> => {
    if (!selectedConversation || messages.length === 0) return false;

    // Get the timestamp of the first (oldest) message
    const oldestMessage = messages[0];
    if (!oldestMessage.timeStamp) return false;

    const beforeTimestamp = oldestMessage.timeStamp instanceof Date
      ? oldestMessage.timeStamp.toISOString()
      : new Date(oldestMessage.timeStamp).toISOString();

    const moreMessages = await GetConversation(selectedConversation.id, 10, beforeTimestamp);

    // Prepend older messages to the beginning
    if (Array.isArray(moreMessages) && moreMessages.length > 0) {
      setMessages(prev => [...moreMessages, ...prev]);
      return true;
    }
    return false;
  };

  // Handle message sent confirmation
  const handleMessageSent = useCallback((data: { success: boolean; messageId: string; originalMessage: ChatMessage }) => {
    console.log('Message sent successfully:', data);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === data.originalMessage.id
          ? { ...msg, isDelivered: true, message: msg.message.replace(' (Sending...)', '') }
          : msg
      )
    );
  }, []);

  // Handle message error
  const handleMessageError = useCallback((data: { success: boolean; error: string; originalMessage: ChatMessage }) => {
    console.error('Message failed to send:', data);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === data.originalMessage.id
          ? { ...msg, message: `${msg.message.replace(' (Sending...)', '')} (Failed to send)` }
          : msg
      )
    );
  }, []);

  // Set up Socket.IO event listeners
  useEffect(() => {
    if (socket) {
      socket.on('message_sent', handleMessageSent as (...args: unknown[]) => void);
      socket.on('message_error', handleMessageError as (...args: unknown[]) => void);

      return () => {
        socket.off('message_sent', handleMessageSent as (...args: unknown[]) => void);
        socket.off('message_error', handleMessageError as (...args: unknown[]) => void);
      };
    }
  }, [socket, handleMessageSent, handleMessageError]);

  const handleSendMessage = async (content: string) => {
    if (selectedConversation) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        chatId: selectedConversation.id,
        message: content,
        timeStamp: new Date(),
        ContactId: selectedConversation.contactId,
        messageType: 'text',
        isEdit: false,
        isRead: false,
        isDelivered: false,
        isFromMe: true,
        phone: selectedConversation.phone,
        pushName: selectedConversation.name,
      };

      // Add message to UI immediately for better UX with sending status
      const messageWithStatus = { ...newMessage, message: `${newMessage.message} (Sending...)` };
      setMessages(prev => [...prev, messageWithStatus]);

      // Update conversation list with new last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: content, lastMessageTime: new Date() }
            : conv
        )
      );

      try {
        // Send message via Socket.io event
        socket.sendMessage(newMessage);
        console.log('Message sent via Socket.io');
      } catch (error) {
        console.log('Error sending message:', error);

        // Update message status to show error
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id
              ? { ...msg, message: `${msg.message.replace(' (Sending...)', '')} (Failed to send)` }
              : msg
          )
        );
      }
    }
  };

  const handleNewMessage = useCallback((message: ChatMessage & { tempId?: string }) => {
    if (!selectedConversation || message.chatId !== selectedConversation.id) {
      return;
    }

    // Automatically mark as read if we're currently in the chat
    if (!message.isFromMe) {
      ChatRouter(token || "").MarkChatAsRead(selectedConversation.id).catch(console.error);
    }

    setMessages(prev => {
      // Check if message already exists by ID or tempId
      const existingIndex = prev.findIndex(msg =>
        msg.id === message.id ||
        (message.tempId && msg.id === message.tempId)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...message,
          id: message.id, // Ensure ID is updated to the real one
          mediaPath: updated[existingIndex].mediaPath || message.mediaPath,
          message: message.message?.replace(' (Sending...)', '') || message.message
        };
        return updated;
      }
      return [...prev, { ...message, message: message.message?.replace(' (Sending...)', '') || message.message }];
    });
  }, [selectedConversation]);

  const handleMessageUpdate = useCallback((updatedMessage: ChatMessage & { tempId?: string }) => {
    if (!selectedConversation || updatedMessage.chatId !== selectedConversation.id) {
      return;
    }
    setMessages(prev => {
      // 1. Check for exact match by current message ID
      const exactIndex = prev.findIndex(msg => msg.id === updatedMessage.id);
      if (exactIndex !== -1) {
        const updated = [...prev];
        updated[exactIndex] = {
          ...updated[exactIndex],
          ...updatedMessage,
          mediaPath: updated[exactIndex].mediaPath || updatedMessage.mediaPath,
          message: updatedMessage.message?.replace(' (Sending...)', '') || updated[exactIndex].message || updatedMessage.message
        };
        return updated;
      }

      // 2. Check for match by tempId (if provided)
      const tempIndex = updatedMessage.tempId
        ? prev.findIndex(msg => msg.id === updatedMessage.tempId)
        : -1;
      if (tempIndex !== -1) {
        const updated = [...prev];
        updated[tempIndex] = {
          ...updated[tempIndex],
          ...updatedMessage,
          id: updatedMessage.id || updated[tempIndex].id, // Replace temp ID with real ID
          mediaPath: updated[tempIndex].mediaPath || updatedMessage.mediaPath,
          message: updatedMessage.message?.replace(' (Sending...)', '') || updated[tempIndex].message || updatedMessage.message
        };
        return updated;
      }

      // 3. Last fallback: Find an optimistic message of same type that is still in "Sending..." state
      const optimisticIndex = prev.findIndex(msg =>
        msg.isFromMe &&
        msg.messageType === updatedMessage.messageType &&
        msg.message?.includes('(Sending...)')
      );

      if (optimisticIndex !== -1) {
        const updated = [...prev];
        updated[optimisticIndex] = {
          ...updated[optimisticIndex],
          ...updatedMessage,
          mediaPath: updated[optimisticIndex].mediaPath || updatedMessage.mediaPath,
          message: updatedMessage.message?.replace(' (Sending...)', '') || updated[optimisticIndex].message || updatedMessage.message
        };
        return updated;
      }

      // 4. If not found and it's a sending confirmation (has ID and isFromMe), treat as new if it's very recent.
      // However, for ReadReceipt updates (where message already has an ID but wasn't found in current UI list),
      // we DON'T want to append it to the bottom as it's likely an older message not currently loaded.
      if (!updatedMessage.isFromMe || updatedMessage.message?.includes('(Sending...)')) {
        // Don't add status updates for messages we don't have in view
        return prev;
      }

      const updatedTimestamp = updatedMessage.timeStamp
        ? new Date(updatedMessage.timeStamp)
        : (updatedMessage.timestamp ? new Date(updatedMessage.timestamp) : new Date());

      // Only append if it looks like a legitimate new message being confirmed
      return [...prev, {
        ...updatedMessage,
        timestamp: updatedTimestamp.toISOString(),
        timeStamp: updatedTimestamp,
        message: updatedMessage.message?.replace(' (Sending...)', '') || updatedMessage.message
      }];
    });
  }, [selectedConversation]);

  const handleNewChat = () => {
    console.log('New chat functionality');
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect to auth page
  }

  return (
    <div className="h-screen flex tech-bg">
      {/* Chat Sidebar */}
      <ChatSidebar
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        selectedConversationId={selectedConversation?.id || ""}
        onConversationsUpdate={handleConversationsUpdate}
        onLogout={handleLogout}
      />

      {/* Chat Area */}
      <ChatArea
        selectedConversation={selectedConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
        onNewMessage={handleNewMessage}
        onMessageUpdate={handleMessageUpdate}
        conversations={conversations}
        onLoadMoreMessages={handleLoadMoreMessages}
      />
    </div>
  );
}