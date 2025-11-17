'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import ChatRouter from '@/components/chat/ChatRouters';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Chat as ChatModel, ChatMessage } from '../../../../Shared/Models';

// Define proper type for incoming socket message
interface IncomingMessage {
  id: number;
  conversation_id: string;
  content: string;
  created_at: string;
  message_type?: string;
  sender_id: number;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ChatModel[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatModel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socket = useSocket();
  const { token,authenticated, loading, logout } = useAuth();
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
    return await ChatRouter(token||"").GetMessagesById(id, limit, before);
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

  const handleLoadMoreMessages = async () => {
    if (!selectedConversation || messages.length === 0) return;
    
    // Get the timestamp of the first (oldest) message
    const oldestMessage = messages[0];
    if (!oldestMessage.timeStamp) return;
    
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
        timestamp: new Date(),
        ContactId: selectedConversation.contactId,
        messageType: 'text',
        isEdit: false,
        isRead: false,
        isDelivered: false,
        isFromMe:true,
        phone:selectedConversation.phone
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

  const handleNewMessage = useCallback((message: ChatMessage) => {  
    if (!selectedConversation || message.chatId !== selectedConversation.id) {
      return;
    }
    setMessages(prev => {
      const existingIndex = prev.findIndex(msg => msg.id === message.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...message,
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
      // First try to match by tempId (the original optimistic message ID)
      // If tempId is provided, find the message with that ID
      // Otherwise, try to find a sending message with same messageType
      const existingIndex = updatedMessage.tempId
        ? prev.findIndex(msg => msg.id === updatedMessage.tempId && msg.isFromMe)
        : prev.findIndex(msg => 
            msg.chatId === updatedMessage.chatId && 
            msg.isFromMe && 
            msg.messageType === updatedMessage.messageType &&
            (!msg.mediaPath || msg.message?.includes('(Sending...)'))
          );
      
      if (existingIndex === -1) {
        // If not found, the message might have already been updated, or it's a new message
        // In this case, we should add it as a new message
        const updatedTimestamp = updatedMessage.timeStamp
          ? new Date(updatedMessage.timeStamp)
          : (updatedMessage.timestamp ? new Date(updatedMessage.timestamp) : new Date());
        return [...prev, {
          ...updatedMessage,
          timestamp: updatedTimestamp.toISOString(),
          timeStamp: updatedTimestamp
        }];
      }
      
      const updated = [...prev];
      const existing = updated[existingIndex];
      const updatedTimestamp = updatedMessage.timeStamp
        ? new Date(updatedMessage.timeStamp)
        : (updatedMessage.timestamp ? new Date(updatedMessage.timestamp) : (existing.timeStamp || new Date()));
      
      updated[existingIndex] = {
        ...existing,
        id: updatedMessage.id || existing.id,
        // Always use the updated mediaPath if provided (replace base64 with real path)
        mediaPath: updatedMessage.mediaPath ? updatedMessage.mediaPath : existing.mediaPath,
        timestamp: updatedTimestamp.toISOString(),
        timeStamp: updatedTimestamp,
        message: existing.message?.replace(' (Sending...)', '') || existing.message || updatedMessage.message,
        messageType: updatedMessage.messageType || existing.messageType
      };
      return updated;
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