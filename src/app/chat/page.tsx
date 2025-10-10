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

  async function GetConversation(id: string) {
    return await ChatRouter(token||"").GetMessagesById(id);
  }

  const handleSelectConversation = async (conversation: ChatModel) => {
    const data = await GetConversation(conversation.id);
    setSelectedConversation(conversation);
    setMessages(data);
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

  const handleNewMessage = (message: ChatMessage) => {  
    if (selectedConversation && message.chatId === selectedConversation.id) {
      setMessages(prev => [...prev, message]);
    }
  };

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
        conversations={conversations}
      />
    </div>
  );
}