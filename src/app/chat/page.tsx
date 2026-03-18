'use client';

import React, { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { ChatSidebarOptimized } from '@/components/chat/ChatSidebarOptimized';
import { ChatAreaOptimized } from '@/components/chat/ChatAreaOptimized';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConversationStore } from '@/store/conversationStore';
import { useChatApi } from '@/hooks/useChatData';
import { Chat as ChatModel, ChatMessage, MessageReaction } from '../../../../Shared/Models';

type IncomingMessage = ChatMessage & { tempId?: string };

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

const getMessageTimeMs = (message: ChatMessage | IncomingMessage): number => {
  const raw = message.timeStamp ?? message.timestamp;
  if (!raw) return 0;
  const parsed = raw instanceof Date ? raw.getTime() : new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortMessagesAsc = (items: ChatMessage[]): ChatMessage[] => {
  return [...items].sort((a, b) => {
    const timeDelta = getMessageTimeMs(a) - getMessageTimeMs(b);
    if (timeDelta !== 0) return timeDelta;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
};

const normalizeMessages = (items: ChatMessage[]): ChatMessage[] => {
  const seen = new Set<string>();
  const unique: ChatMessage[] = [];

  for (const message of items) {
    const key = String(message.id || '').trim();
    if (!key) {
      unique.push(message);
      continue;
    }

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(message);
  }

  return unique;
};

const normalizeMessageId = (value: unknown): string => String(value ?? '').trim();

const decodeMaybeUriComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const resolveReactionMessageId = (data: { messageId?: string; reactions?: MessageReaction[] }): string => {
  const directId = normalizeMessageId(data.messageId);
  if (directId) return directId;
  const nestedId = normalizeMessageId(data.reactions?.[0]?.messageId);
  return nestedId;
};

const normalizeChatKey = (value: unknown): string => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  return raw.replace(/@[^@]+$/, '');
};

const isReactionForSelectedConversation = (payloadChatId: string, conversation: ChatModel | null): boolean => {
  if (!conversation) return false;

  const payloadKey = normalizeChatKey(payloadChatId);
  if (!payloadKey) return false;

  const selectedKeys = [
    normalizeChatKey(conversation.id),
    normalizeChatKey(conversation.phone),
    normalizeChatKey(conversation.contactId),
  ].filter(Boolean);

  return selectedKeys.includes(payloadKey);
};

const stripSendingSuffix = (value?: string) => value?.replace(' (Sending...)', '') || value;

const mergeMessage = (base: ChatMessage, incoming: IncomingMessage, overrideId?: string): ChatMessage => ({
  ...base,
  ...incoming,
  ...(overrideId ? { id: overrideId } : {}),
  mediaPath: base.mediaPath || incoming.mediaPath,
  message: stripSendingSuffix(incoming.message) || base.message || incoming.message
});

const resetUnreadConversation = (
  conversation: ChatModel,
  updateConversation: (chatId: string, updates: Partial<ChatModel>) => void
) => {
  updateConversation(conversation.id, { unreadCount: 0 });
  return { ...conversation, unreadCount: 0 };
};

const assignConversationToUser = async (
  conversation: ChatModel,
  userId: string,
  chatApi: ReturnType<typeof useChatApi>,
  updateConversation: (chatId: string, updates: Partial<ChatModel>) => void
) => {
  await chatApi.AssignChat(conversation.id, userId, userId);
  updateConversation(conversation.id, { assignedTo: userId, unreadCount: 0 });
  return { ...conversation, assignedTo: userId, unreadCount: 0 };
};

const maybeFetchWuzUserProfile = async (
  conversation: ChatModel,
  chatApi: ReturnType<typeof useChatApi>
) => {
  if (!conversation.phone) return;
  try {
    await chatApi.RefreshChatAvatar(conversation.id, conversation.phone);
  } catch (error) {
    console.error('Error refreshing Wuz user profile/avatar:', error);
  }
};

const getConversationAfterSelection = async (
  conversation: ChatModel,
  userId: string | undefined,
  chatApi: ReturnType<typeof useChatApi>,
  updateConversation: (chatId: string, updates: Partial<ChatModel>) => void
) => {
  const unreadReset = resetUnreadConversation(conversation, updateConversation);

  if (!userId || (conversation.assignedTo && conversation.assignedTo === userId)) {
    return unreadReset;
  }

  try {
    return await assignConversationToUser(conversation, userId, chatApi, updateConversation);
  } catch (error) {
    console.error('Error auto-assigning chat:', error);
    return unreadReset;
  }
};

const markChatAsReadSafe = async (
  chatId: string,
  chatApi: ReturnType<typeof useChatApi>
) => {
  try {
    await chatApi.MarkChatAsRead(chatId);
  } catch (error) {
    console.error('Error marking chat as read:', error);
  }
};

function ChatPageInner() {
  const [selectedConversation, setSelectedConversation] = useState<ChatModel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHistorySyncing, setIsHistorySyncing] = useState(false);
  const [historySyncProgress, setHistorySyncProgress] = useState({ processed: 0, total: 0, percent: 0 });
  const {
    joinConversation,
    leaveConversation,
    socket,
    onReactionUpdate,
    onNewMessage,
    onMessageUpdate,
    onChatUpdate,
    sendMessage
  } = useSocket();
  const { authenticated, loading, logout, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatApi = useChatApi();

  const conversations = useConversationStore((state) => state.conversations);
  const updateConversation = useConversationStore((state) => state.updateConversation);
  const getConversation = useConversationStore((state) => state.getConversation);
  const addConversation = useConversationStore((state) => state.addConversation);
  const launchHandledRef = useRef<string>('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !authenticated) {
      router.push('/auth');
    }
  }, [authenticated, loading, router]);

  // Join/leave socket room when selected conversation changes
  const prevChatIdRef = useRef<string | null>(null);
  const selectionRequestRef = useRef(0);
  useEffect(() => {
    const currentId = selectedConversation?.id ?? null;
    if (prevChatIdRef.current && prevChatIdRef.current !== currentId) {
      leaveConversation(prevChatIdRef.current);
    }
    if (currentId) {
      joinConversation(currentId);
      prevChatIdRef.current = currentId;
    } else {
      prevChatIdRef.current = null;
    }
    return () => {
      if (currentId) leaveConversation(currentId);
    };
  }, [selectedConversation?.id, joinConversation, leaveConversation]);

  const handleSelectConversation = useCallback(async (conversation: ChatModel) => {
    if (selectedConversation?.id === conversation.id) return;

    // Open chat immediately, then hydrate data in background.
    const requestId = ++selectionRequestRef.current;
    const optimisticConversation = resetUnreadConversation(conversation, updateConversation);
    setSelectedConversation(optimisticConversation);
    setMessages([]);

    const messagesPromise = chatApi.GetMessagesById(conversation.id, 10);

    void maybeFetchWuzUserProfile(conversation, chatApi);
    void getConversationAfterSelection(conversation, user?.id, chatApi, updateConversation)
      .then((updatedConversation) => {
        if (selectionRequestRef.current !== requestId) return;
        setSelectedConversation(updatedConversation);
      });
    void markChatAsReadSafe(conversation.id, chatApi);

    try {
      const data = await messagesPromise;
      if (selectionRequestRef.current !== requestId) return;
      setMessages(Array.isArray(data) ? normalizeMessages(sortMessagesAsc(data)) : []);
    } catch (error) {
      if (selectionRequestRef.current !== requestId) return;
      console.error('Error fetching messages for selected conversation:', error);
      setMessages([]);
    }
  }, [selectedConversation?.id, user?.id, chatApi, updateConversation]);

  const handleLoadMoreMessages = useCallback(async (): Promise<boolean> => {
    if (!selectedConversation || messages.length === 0) return false;

    const oldestMessage = messages[0];
    const oldestRawTimestamp = oldestMessage.timeStamp ?? oldestMessage.timestamp;
    if (!oldestRawTimestamp) return false;

    const beforeTimestamp = oldestRawTimestamp instanceof Date
      ? oldestRawTimestamp.toISOString()
      : new Date(oldestRawTimestamp).toISOString();

    const moreMessages = await chatApi.GetMessagesById(
      selectedConversation.id,
      10,
      beforeTimestamp,
      oldestMessage.id
    );

    if (Array.isArray(moreMessages) && moreMessages.length > 0) {
      const sortedMore = sortMessagesAsc(moreMessages);
      setMessages(prev => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueMore = sortedMore.filter((m) => !existingIds.has(m.id));
        return normalizeMessages([...uniqueMore, ...prev]);
      });
      return true;
    }
    return false;
  }, [selectedConversation, messages, chatApi]);

  const handleMessageSent = useCallback((data: { success: boolean; messageId: string; originalMessage?: ChatMessage }) => {
    if (!data?.originalMessage?.id) return;
    setMessages(prev => normalizeMessages(
      prev.map(msg =>
        msg.id === data.originalMessage!.id
          ? { ...msg, status: 'delivered', isDelivered: true, message: msg.message.replace(' (Sending...)', '') }
          : msg
      )
    ));
  }, []);

  // Handle message error
  const handleMessageError = useCallback((data: { success: boolean; error?: string; originalMessage?: ChatMessage }) => {
    console.error('Message failed to send:', data);
    if (!data?.originalMessage?.id) return;
    setMessages(prev => normalizeMessages(
      prev.map(msg =>
        msg.id === data.originalMessage!.id
          ? { ...msg, status: 'failed', message: `${msg.message.replace(' (Sending...)', '')} (Failed to send)` }
          : msg
      )
    ));
  }, []);

  const handleReactionUpdate = useCallback((data: { messageId?: string; reactions: MessageReaction[]; chatId?: string }) => {
    debugger;
    const targetRaw = resolveReactionMessageId(data);
    if (!targetRaw) return;

    const targetDecoded = decodeMaybeUriComponent(targetRaw);
    const targetLower = targetRaw.toLowerCase();
    const targetDecodedLower = targetDecoded.toLowerCase();
    const belongsToSelectedConversation = isReactionForSelectedConversation(String(data.chatId?.split(':')[0] || ''), selectedConversation);

    setMessages(prev => {
      let matched = false;

      const next = prev.map((msg) => {
        const msgId = normalizeMessageId(msg.id);
        const msgLower = msgId.toLowerCase();
        const isMatch =
          msgId === targetRaw ||
          msgId === targetDecoded ||
          msgLower === targetLower ||
          msgLower === targetDecodedLower;

        if (!isMatch) return msg;
        matched = true;
        return { ...msg, reactions: data.reactions };
      });

      // Accept only selected-conversation updates, unless payload chatId is mismatched
      // but the message id clearly exists in the currently loaded chat messages.
      if (!belongsToSelectedConversation && !matched) {
        return prev;
      }

      return matched ? normalizeMessages(next) : prev;
    });
  }, [selectedConversation]);

  // Set up Socket.IO event listeners
  useEffect(() => {
    onReactionUpdate(handleReactionUpdate);
  }, [onReactionUpdate, handleReactionUpdate]);

  useEffect(() => {
    if (socket) {
      socket.on('message_sent', handleMessageSent as (...args: unknown[]) => void);
      socket.on('message_error', handleMessageError as (...args: unknown[]) => void);
      const historySyncHandler = (payload: {
        syncing?: boolean;
        processedConversations?: number;
        totalConversations?: number;
        progressPercent?: number;
      }) => {
        const syncing = !!payload?.syncing;
        setIsHistorySyncing(syncing);

        if (syncing) {
          setHistorySyncProgress({
            processed: Number(payload?.processedConversations) || 0,
            total: Number(payload?.totalConversations) || 0,
            percent: Number(payload?.progressPercent) || 0
          });
          return;
        }

        setHistorySyncProgress({ processed: 0, total: 0, percent: 0 });
      };
      socket.on('history_sync_status', historySyncHandler as (...args: unknown[]) => void);
      return () => {
        socket.off('message_sent', handleMessageSent as (...args: unknown[]) => void);
        socket.off('message_error', handleMessageError as (...args: unknown[]) => void);
        socket.off('history_sync_status', historySyncHandler as (...args: unknown[]) => void);
      };
    }
  }, [socket, handleMessageSent, handleMessageError]);

  const handleSendMessage = useCallback(async (content: string, replyMessage?: ChatMessage, targetConversation?: ChatModel) => {
    const conversation = targetConversation || selectedConversation;
    if (!conversation) return;
    const targetPhone = normalizeOutgoingPhone(conversation.id, conversation.phone);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      chatId: conversation.id,
      message: content,
      timeStamp: new Date(),
      ContactId: conversation.contactId,
      messageType: 'text',
      isEdit: false,
      isRead: false,
      isDelivered: false,
      status: 'sent',
      isFromMe: true,
      phone: targetPhone,
      pushName: conversation.name,
      replyToMessage: replyMessage,
      replyToMessageId: replyMessage?.id
    };

    const messageWithStatus = { ...newMessage, message: `${newMessage.message} (Sending...)` };
    setMessages(prev => normalizeMessages([...prev, messageWithStatus]));
    updateConversation(conversation.id, { lastMessage: content, lastMessageTime: new Date() });

    try {
      sendMessage(newMessage);
    } catch {
      setMessages(prev => normalizeMessages(
        prev.map(msg =>
          msg.id === newMessage.id
            ? { ...msg, message: `${msg.message.replace(' (Sending...)', '')} (Failed to send)` }
            : msg
        )
      ));
    }
  }, [selectedConversation, sendMessage, updateConversation]);

  useEffect(() => {
    const rawContact = String(searchParams.get('contact') || '').trim();
    const launchMessage = String(searchParams.get('message') || '').trim();
    const contact = rawContact.replace(/\D/g, '');
    if (!contact || !authenticated || loading) return;

    const launchKey = `${contact}|${launchMessage}`;
    if (launchHandledRef.current === launchKey) return;
    launchHandledRef.current = launchKey;

    const existing = conversations.find((conversation) => {
      const normalizedId = String(conversation.id || '').replace(/\D/g, '');
      const normalizedPhone = String(conversation.phone || '').replace(/@[^@]+$/, '').replace(/\D/g, '');
      const normalizedContactId = String(conversation.contactId || '').replace(/\D/g, '');
      return normalizedId === contact || normalizedPhone === contact || normalizedContactId === contact;
    });

    const targetConversation: ChatModel = existing || {
      id: contact,
      name: contact,
      phone: contact,
      contactId: contact,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      isOnline: false,
      isTyping: false,
      messages: [],
      participants: [],
      tags: [],
      status: 'open'
    };

    if (!existing) {
      addConversation(targetConversation);
    }

    void (async () => {
      await handleSelectConversation(targetConversation);

      if (launchMessage) {
        await handleSendMessage(launchMessage, undefined, targetConversation);
      }

      router.replace('/chat');
    })();
  }, [searchParams, authenticated, loading, conversations, addConversation, handleSelectConversation, handleSendMessage, router]);

  const handleNewMessage = useCallback((message: IncomingMessage) => {
    if (!selectedConversation || message.chatId !== selectedConversation.id) {
      const existingConversation = getConversation(message.chatId);
      const inferredName = String(
        message.pushName
        || existingConversation?.name
        || message.chatId
      );
      const currentUnread = existingConversation?.unreadCount || 0;

      if (!existingConversation) {
        addConversation({
          id: message.chatId,
          name: inferredName,
          participants: [],
          lastMessage: stripSendingSuffix(message.message) || message.message,
          lastMessageTime: message.timeStamp || message.timestamp || new Date(),
          unreadCount: message.isFromMe ? 0 : 1,
          isTyping: false,
          isOnline: false,
          messages: [],
          phone: String(message.phone || message.ContactId || message.chatId),
          contactId: String(message.ContactId || message.phone || message.chatId),
          pushName: message.pushName,
          tags: [],
          status: 'open'
        });
        return;
      }

      updateConversation(message.chatId, {
        name: inferredName,
        lastMessage: stripSendingSuffix(message.message) || message.message,
        lastMessageTime: message.timeStamp || message.timestamp || new Date(),
        unreadCount: currentUnread + 1
      });
      return;
    }

    if (!message.isFromMe) {
      chatApi.MarkChatAsRead(selectedConversation.id).catch(console.error);
    }

    setMessages(prev => {
      // Check if message already exists by ID or tempId
      const existingIndex = prev.findIndex(msg =>
        msg.id === message.id ||
        (message.tempId && msg.id === message.tempId)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = mergeMessage(updated[existingIndex], message, message.id);
        return normalizeMessages(updated);
      }
      return normalizeMessages([...prev, { ...message, message: stripSendingSuffix(message.message) || message.message }]);
    });
  }, [selectedConversation, chatApi, getConversation, updateConversation, addConversation]);

  const handleMessageUpdate = useCallback((updatedMessage: IncomingMessage) => {
    if (!selectedConversation || updatedMessage.chatId !== selectedConversation.id) {
      return;
    }

    setMessages(prev => {
      const index = prev.findIndex((msg) => msg.id === updatedMessage.id);
      if (index === -1) return prev;

      const next = [...prev];
      next[index] = mergeMessage(next[index], updatedMessage);
      return normalizeMessages(next);
    });
  }, [selectedConversation]);

  const handleChatUpdate = useCallback((chat: ChatModel & { unread_count?: number; unReadCount?: number }) => {
    const unreadCount = chat.unread_count ?? chat.unreadCount;
    const normalizedName = String(
      chat.name
      || chat.pushname
      || chat.pushName
      || chat.fullName
      || chat.firstName
      || chat.id
    );
    const normalizedPhone = String(chat.phone || chat.contactId || chat.id);
    const normalizedContactId = String(chat.contactId || chat.phone || chat.id);
    const existing = getConversation(chat.id);

    if (!existing) {
      addConversation({
        id: chat.id,
        name: normalizedName,
        participants: Array.isArray(chat.participants) ? chat.participants : [],
        lastMessage: chat.lastMessage || '',
        lastMessageTime: chat.lastMessageTime || new Date(),
        unreadCount: unreadCount ?? chat.unReadCount ?? 0,
        isTyping: Boolean(chat.isTyping),
        isOnline: Boolean(chat.isOnline),
        messages: [],
        phone: normalizedPhone,
        contactId: normalizedContactId,
        pushname: chat.pushname,
        pushName: chat.pushName,
        fullName: chat.fullName,
        firstName: chat.firstName,
        tags: Array.isArray(chat.tags) ? chat.tags : [],
        status: chat.status || 'open',
        isArchived: chat.isArchived,
        isMuted: chat.isMuted,
        assignedTo: chat.assignedTo,
        avatar: chat.avatar,
        reason: chat.reason,
      });
      return;
    }

    updateConversation(chat.id, {
      ...chat,
      name: normalizedName,
      phone: normalizedPhone,
      contactId: normalizedContactId,
      ...(unreadCount !== undefined ? { unreadCount } : {})
    });
  }, [updateConversation, getConversation, addConversation]);

  useEffect(() => {
    onNewMessage(handleNewMessage);
  }, [onNewMessage, handleNewMessage]);

  useEffect(() => {
    onMessageUpdate(handleMessageUpdate);
  }, [onMessageUpdate, handleMessageUpdate]);

  useEffect(() => {
    onChatUpdate(handleChatUpdate);
  }, [onChatUpdate, handleChatUpdate]);

  const handleNewChat = () => {
    console.log('New chat functionality');
  };

  const handleLogout = useCallback(() => {
    logout();
    router.push('/auth');
  }, [logout, router]);

  const handleClose = useCallback(() => {
    setSelectedConversation(null);
    setMessages([]);
  }, []);

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
    <div className="h-screen flex tech-bg relative">
      {isHistorySyncing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 rounded-full border border-[var(--chat-border)] bg-[var(--chat-panel)] px-4 py-1.5 text-xs text-[var(--chat-muted)] shadow-md">
          Sync history in progress... {historySyncProgress.percent}% ({historySyncProgress.processed}/{historySyncProgress.total || '?'})
        </div>
      )}
      <ChatSidebarOptimized
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        selectedConversationId={selectedConversation?.id ?? ''}
        onLogout={handleLogout}
      />
      <ChatAreaOptimized
        selectedConversation={selectedConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
        onNewMessage={handleNewMessage}
        onMessageUpdate={handleMessageUpdate}
        conversations={conversations}
        onLoadMoreMessages={handleLoadMoreMessages}
        onClose={handleClose}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  );
}