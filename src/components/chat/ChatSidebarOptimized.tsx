"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarActions } from './SidebarActions';
import { SidebarSearch } from './SidebarSearch';
import { TagFilterBar } from './TagFilterBar';
import { SidebarTabs, SidebarTabType } from './SidebarTabs';
import { VirtualizedConversationList } from './VirtualizedConversationList';
import { Chat as ChatModel, ChatTag } from '../../../../Shared/Models';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useConversationStore } from '@/store/conversationStore';
import Chat from './ChatRouters';
import { toast } from 'react-hot-toast';

// Modals
import { CloseChatModal } from './modals/CloseChatModal';
import { AssignChatModal } from './modals/AssignChatModal';
import { NewChatModal } from './modals/NewChatModal';
import { TagManagerModal } from './modals/TagManagerModal';
import { TemplateManagerModal } from './modals/TemplateManagerModal';
import { TagAssignmentModal } from './modals/TagAssignmentModal';

interface AssignableUser {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
}

interface SidebarContact {
    phone: string;
    lid?: string;
    name?: string;
    fullName?: string;
    firstName?: string;
    pushName?: string;
    businessName?: string;
    isMyContact?: boolean;
    isLead?: boolean;
}

type ChatUpdateEvent = ChatModel & {
    unread_count?: number;
    unReadCount?: number;
};

const parseCombinedTag = (value: string): { name: string; id: string } | null => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const sep = raw.lastIndexOf('_-_');
    if (sep <= 0) return null;

    const name = raw.slice(0, sep).trim();
    const id = raw.slice(sep + 3).trim();
    if (!name || !id) return null;
    return { name, id };
};

const normalizeChatTags = (source: unknown): ChatTag[] => {
    const values: unknown[] = [];

    if (Array.isArray(source)) {
        values.push(...source);
    } else if (typeof source === 'string' && source.trim()) {
        try {
            const parsed = JSON.parse(source);
            if (Array.isArray(parsed)) {
                values.push(...parsed);
            } else {
                values.push(source);
            }
        } catch {
            values.push(source);
        }
    } else if (source && typeof source === 'object') {
        values.push(source);
    }

    const normalized: ChatTag[] = [];
    values.forEach((value, index) => {
        const tag = value as string;
        const parsed = parseCombinedTag(tag);
        const tagName = (parsed?.name || 'Tag').trim();
        const tagId = (parsed?.id || `${index + 1}`).trim();

        normalized.push({
            tagId,
            tagName,
            color: '#10B981',
            status: 'available',
            createdAt: new Date(),
            updatedAt:  new Date(),
        });
    });

    return normalized.filter((tag) => !!tag.tagId && !!tag.tagName);
};

type LegacyChatModel = ChatModel & {
    unReadCount?: number;
    contactid?: string;
    isarchived?: boolean;
    ismuted?: boolean;
    isTyping?: boolean | string;
    tagsname?: unknown;
    tagsName?: unknown;
};

const normalizeConversation = (conv: ChatModel): ChatModel => {
    const legacy = conv as LegacyChatModel;
    const rawTyping = (legacy as { isTyping?: unknown }).isTyping;
    return {
        ...conv,
        unreadCount: legacy.unreadCount ?? legacy.unReadCount ?? 0,
        contactId: legacy.contactId ?? legacy.contactid,
        isArchived: legacy.isArchived ?? legacy.isarchived ?? false,
        isMuted: legacy.isMuted ?? legacy.ismuted ?? false,
        status: legacy.status || 'open',
        isTyping: rawTyping === true || String(rawTyping || '') === '1',
        tags: normalizeChatTags(legacy.tags ?? legacy.tagsname ?? legacy.tagsName)
    };
};

interface ChatSidebarOptimizedProps {
    onSelectConversation: (conversation: ChatModel) => void;
    onNewChat: () => void;
    selectedConversationId: string;
    onLogout: () => void;
}

export const ChatSidebarOptimized: React.FC<ChatSidebarOptimizedProps> = ({
    onSelectConversation,
    selectedConversationId,
    onLogout
}) => {
    const serverPageSize = 200;
    const { user, token } = useAuth();
    const { onChatUpdate, onChatPresence, onUserPresence, sendMessage } = useSocket();
    const chatRouter = useMemo(() => Chat(token || ""), [token]);

    // Zustand Store
    const conversations = useConversationStore(state => state.conversations);
    const setConversations = useConversationStore(state => state.setConversations);
    const updateConversation = useConversationStore(state => state.updateConversation);
    const addConversation = useConversationStore(state => state.addConversation);

    // Local UI State
    const [activeTab, setActiveTab] = useState<SidebarTabType>('chats');
    const [serverPage, setServerPage] = useState(1);
    const [hasMoreServerPages, setHasMoreServerPages] = useState(false);
    const [isServerLoading, setIsServerLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        unreadOnly: false,
        onlineOnly: false,
        sortBy: 'date' as 'date' | 'name' | 'unread',
        dateFilter: 'all' as 'all' | 'today' | 'yesterday' | 'week' | 'month'
    });

    // Modal States
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [chatToCloseId, setChatToCloseId] = useState<string | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [chatToAssignId, setChatToAssignId] = useState<string | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showTagManagerModal, setShowTagManagerModal] = useState(false);
    const [showTemplateManagerModal, setShowTemplateManagerModal] = useState(false);
    const [showTagAssignmentModal, setShowTagAssignmentModal] = useState(false);
    const [chatForTags, setChatForTags] = useState<ChatModel | null>(null);
    const [availableUsers, setAvailableUsers] = useState<AssignableUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [contacts, setContacts] = useState<SidebarContact[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [contactTypeFilter, setContactTypeFilter] = useState<'all' | 'contact' | 'lead'>('all');
    const [contactSortBy, setContactSortBy] = useState<'name' | 'phone'>('name');
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const conversationsRef = useRef<ChatModel[]>([]);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    // Server-side conversation pagination by tab
    useEffect(() => {
        if (!token || activeTab === 'contacts') return;

        let cancelled = false;
        setIsServerLoading(true);

        const status = activeTab === 'open'
            ? 'open'
            : activeTab === 'closed'
                ? 'closed'
                : undefined;

        chatRouter.GetChatsPage(serverPage, serverPageSize, status, activeTab)
            .then((data) => {
                if (cancelled) return;

                const rawChats = Array.isArray(data)
                    ? data
                    : (data && typeof data === 'object' && 'chats' in data)
                        ? (data as { chats?: unknown }).chats
                        : [];

                const chats = Array.isArray(rawChats) ? rawChats : [];
                const normalized = chats.map((conv) => normalizeConversation(conv as ChatModel));

                if (serverPage === 1) {
                    setConversations(normalized);
                } else {
                    const currentConversations = conversationsRef.current;
                    const merged = [
                        ...currentConversations,
                        ...normalized.filter((conversation) => !currentConversations.some((existing: ChatModel) => existing.id === conversation.id))
                    ];
                    setConversations(merged);
                }
                setHasMoreServerPages(chats.length >= serverPageSize);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Failed to load chats page:', error);
                toast.error('Failed to load chats');
            })
            .finally(() => {
                if (!cancelled) setIsServerLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [token, activeTab, serverPage, serverPageSize, chatRouter, setConversations]);

    // Socket listeners
    useEffect(() => {
        if (!onChatUpdate || !onChatPresence || !onUserPresence) return;

        const handleUpdate = (updatedChat: ChatUpdateEvent) => {
            const normalizedUnread = updatedChat.unread_count
                ?? updatedChat.unReadCount
                ?? updatedChat.unreadCount;

            const normalizedName = String(
                updatedChat.name
                || updatedChat.pushname
                || updatedChat.pushName
                || updatedChat.fullName
                || updatedChat.firstName
                || updatedChat.id
            );

            const normalizedPhone = String(updatedChat.phone || updatedChat.contactId || updatedChat.id);
            const normalizedContactId = String(updatedChat.contactId || updatedChat.phone || updatedChat.id);
            const normalizedLastMessage = String(updatedChat.lastMessage || '');
            const normalizedLastMessageTime = updatedChat.lastMessageTime || new Date();

            const exists = conversations.some((conversation) => conversation.id === updatedChat.id);
            if (!exists) {
                addConversation(normalizeConversation({
                    id: updatedChat.id,
                    name: normalizedName,
                    participants: Array.isArray(updatedChat.participants) ? updatedChat.participants : [],
                    lastMessage: normalizedLastMessage,
                    lastMessageTime: normalizedLastMessageTime,
                    unreadCount: typeof normalizedUnread === 'number' ? normalizedUnread : 0,
                    isTyping: Boolean(updatedChat.isTyping),
                    isOnline: Boolean(updatedChat.isOnline),
                    messages: [],
                    phone: normalizedPhone,
                    contactId: normalizedContactId,
                    tags: normalizeChatTags((updatedChat as ChatUpdateEvent & { tagsname?: unknown; tagsName?: unknown }).tags
                        ?? (updatedChat as ChatUpdateEvent & { tagsname?: unknown; tagsName?: unknown }).tagsname
                        ?? (updatedChat as ChatUpdateEvent & { tagsname?: unknown; tagsName?: unknown }).tagsName),
                    status: updatedChat.status || 'open',
                    pushname: updatedChat.pushname,
                    pushName: updatedChat.pushName,
                    fullName: updatedChat.fullName,
                    firstName: updatedChat.firstName,
                    isMyContact: updatedChat.isMyContact,
                    isLead: updatedChat.isLead,
                    isArchived: updatedChat.isArchived,
                    isMuted: updatedChat.isMuted,
                    assignedTo: updatedChat.assignedTo,
                    avatar: updatedChat.avatar,
                    reason: updatedChat.reason,
                }));
                return;
            }

            updateConversation(updatedChat.id, {
                ...updatedChat,
                name: normalizedName,
                phone: normalizedPhone,
                contactId: normalizedContactId,
                tags: normalizeChatTags((updatedChat as ChatUpdateEvent & { tagsname?: unknown; tagsName?: unknown }).tags
                    ?? (updatedChat as ChatUpdateEvent & { tagsname?: unknown; tagsName?: unknown }).tagsname
                    ?? (updatedChat as ChatUpdateEvent & { tagsname?: unknown; tagsName?: unknown }).tagsName),
                ...(normalizedUnread !== undefined ? { unreadCount: normalizedUnread } : {})
            });
        };

        const handlePresence = (data: { chatId: string; isOnline: boolean; isTyping: boolean }) => {
            updateConversation(data.chatId, { isOnline: data.isOnline, isTyping: data.isTyping });
        };

        const handleUserPresence = (data: { userId: string; isOnline: boolean }) => {
            conversations.forEach((conversation) => {
                if (String(conversation.assignedTo || '') === String(data.userId || '')) {
                    updateConversation(conversation.id, { isOnline: data.isOnline });
                }
            });
        };

        onChatUpdate(handleUpdate);
        onChatPresence(handlePresence);
        onUserPresence(handleUserPresence);
    }, [onChatUpdate, onChatPresence, onUserPresence, updateConversation, addConversation, conversations]);

    useEffect(() => {
        if (activeTab !== 'contacts') return;

        let cancelled = false;
        setIsLoadingContacts(true);

        chatRouter.GetContacts()
            .then((data) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                const normalized = list.map((item: unknown) => {
                    const entry = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};

                    return {
                        phone: String(entry.phone || ''),
                        lid: entry.lid ? String(entry.lid) : undefined,
                        name: entry.name ? String(entry.name) : undefined,
                        fullName: entry.fullName ? String(entry.fullName) : undefined,
                        firstName: entry.firstName ? String(entry.firstName) : undefined,
                        pushName: entry.pushName ? String(entry.pushName) : undefined,
                        businessName: entry.businessName ? String(entry.businessName) : undefined,
                        isMyContact: Boolean(entry.isMyContact),
                        isLead: Boolean(entry.isLead),
                    };
                })
                    .filter((c: SidebarContact) => !!c.phone);

                setContacts(normalized);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Failed to load contacts:', error);
                toast.error('Failed to load contacts');
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingContacts(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [activeTab, chatRouter]);

    // Filtering Logic - Optimized with early returns
    const filteredConversations = useMemo(() => {
        let result = conversations;

        // Filter by tab first (fastest)
        if (activeTab === 'open') {
            result = result.filter(c => c.status === 'open');
        } else if (activeTab === 'closed') {
            result = result.filter(c => c.status === 'closed');
        } else if (activeTab === 'assigned') {
            result = result.filter(c => c.assignedTo === user?.id);
        } else if (activeTab === 'archived') {
            result = result.filter(c => c.isArchived);
        } else if (activeTab === 'favorites') {
            const favoriteIdsString = localStorage.getItem('favoriteMessages');
            let favoriteChatIds: string[] = [];
            try {
                const parsed = favoriteIdsString ? JSON.parse(favoriteIdsString) : [];
                favoriteChatIds = Array.isArray(parsed)
                    ? parsed.map((id: unknown) => String(id ?? '').split('_')[0]).filter(Boolean)
                    : [];
            } catch {
                favoriteChatIds = [];
            }
            result = result.filter(c => favoriteChatIds.includes(c.id));
        }

        // Quick filters before search
        if (filters.unreadOnly) result = result.filter(c => (c.unreadCount || 0) > 0);
        if (filters.onlineOnly) result = result.filter(c => c.isOnline);

        // Filter by tag before search
        if (selectedTagId) {
            result = result.filter(c => c.tags?.some(t => t.tagId === selectedTagId));
        }

        // Search last (most expensive)
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            const safeIncludes = (value: unknown, query: string) => String(value ?? '').toLowerCase().includes(query);
            result = result.filter(c =>
                safeIncludes(c.name, lower) ||
                safeIncludes(c.phone, lower) ||
                safeIncludes(c.lastMessage, lower)
            );
        }

        // Single sort operation
        if (result.length > 1) {
            result = result.slice().sort((a, b) => {
                if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
                if (filters.sortBy === 'unread') return (b.unreadCount || 0) - (a.unreadCount || 0);

                const timeA = new Date(a.lastMessageTime).getTime();
                const timeB = new Date(b.lastMessageTime).getTime();
                return timeB - timeA;
            });
        }

        return result;
    }, [conversations, activeTab, searchTerm, selectedTagId, filters, user?.id]);

    const filteredContacts = useMemo(() => {
        const lower = contactSearchTerm.trim().toLowerCase();
        let all = [...contacts];

        if (contactTypeFilter === 'contact') {
            all = all.filter((contact) => !!contact.isMyContact);
        } else if (contactTypeFilter === 'lead') {
            all = all.filter((contact) => !!contact.isLead);
        }

        const searched = !lower
            ? all
            : all.filter((contact) => {
                return [
                    contact.name,
                    contact.fullName,
                    contact.firstName,
                    contact.pushName,
                    contact.businessName,
                    contact.phone,
                ].some((value) => String(value || '').toLowerCase().includes(lower));
            });

        searched.sort((a, b) => {
            if (contactSortBy === 'phone') {
                return String(a.phone || '').localeCompare(String(b.phone || ''));
            }

            const nameA = a.fullName || a.firstName || a.pushName || a.businessName || a.name || a.phone;
            const nameB = b.fullName || b.firstName || b.pushName || b.businessName || b.name || b.phone;
            return String(nameA || '').localeCompare(String(nameB || ''));
        });

        return searched;
    }, [contacts, contactSearchTerm, contactTypeFilter, contactSortBy]);

    const availableTags = useMemo(() => {
        const tagsMap = new Map<string, ChatTag>();
        conversations.forEach(c => c.tags?.forEach(t => tagsMap.set(t.tagId, t)));
        return Array.from(tagsMap.values());
    }, [conversations]);

    // Handlers
    const handleToggleStatus = useCallback(async (chatId: string, currentStatus: string) => {
        if (currentStatus === 'open') {
            setChatToCloseId(chatId);
            setShowCloseModal(true);
        } else {
            try {
                updateConversation(chatId, { status: 'open' });
                await chatRouter.UpdateChatStatus(chatId, 'open', "");
                toast.success('Chat reopened');
            } catch {
                updateConversation(chatId, { status: 'closed' });
            }
        }
    }, [chatRouter, updateConversation]);

    const handleConfirmClose = async (reason: string) => {
        if (!chatToCloseId) return;
        try {
            updateConversation(chatToCloseId, { status: 'closed', reason });
            await chatRouter.UpdateChatStatus(chatToCloseId, 'closed', reason);
            toast.success('Chat closed');
            setShowCloseModal(false);
            setChatToCloseId(null);
        } catch {
            updateConversation(chatToCloseId, { status: 'open' });
        }
    };

    const handleAssignTrigger = useCallback(async (chatId: string) => {
        setChatToAssignId(chatId);
        setShowAssignModal(true);
        setIsLoadingUsers(true);
        try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/').replace(/\/$/, '');
            const response = await fetch(`${baseUrl}/api/user-management`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                const users = Array.isArray(data?.users)
                    ? data.users.map((u: Partial<AssignableUser>) => ({
                        id: String(u.id || ''),
                        username: String(u.username || ''),
                        firstName: u.firstName,
                        lastName: u.lastName,
                    })).filter((u: AssignableUser) => !!u.id)
                    : [];
                setAvailableUsers(users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [token]);

    const handleConfirmAssign = async (userId: string) => {
        if (!chatToAssignId || !user?.id) return;
        try {
            updateConversation(chatToAssignId, { assignedTo: userId });
            await chatRouter.AssignChat(chatToAssignId, userId, user.id);
            toast.success('Chat assigned');
            setShowAssignModal(false);
            setChatToAssignId(null);
        } catch {
            toast.error('Failed to assign chat');
        }
    };

    const handleCreateChat = useCallback(async (phoneNumber: string, initialMessage?: string) => {
        if (!user?.id || !sendMessage) return;

        let chatId = phoneNumber;
        try {
            const lidResult = await chatRouter.GetUserLid(phoneNumber) as { lid?: string } | null;
            const resolvedLid = String(lidResult?.lid || '').trim().split('@')[0];
            if (resolvedLid) {
                chatId = resolvedLid;
            }
        } catch (error) {
            console.warn('Failed to resolve LID for new chat, using phone as fallback:', error);
        }

        const mockChat: ChatModel = {
            id: chatId,
            name: phoneNumber,
            phone: phoneNumber,
            contactId: phoneNumber,
            lastMessage: initialMessage || '',
            lastMessageTime: new Date(),
            unreadCount: 0,
            isOnline: false,
            isTyping: false,
            messages: [],
            participants: [],
            tags: [],
            status: 'open'
        };

        addConversation(mockChat);
        onSelectConversation(mockChat);
        setShowNewChatModal(false);

        if (initialMessage?.trim()) {
            sendMessage({
                id: Date.now().toString(),
                chatId,
                message: initialMessage.trim(),
                timeStamp: new Date(),
                isEdit: false,
                isRead: false,
                isDelivered: false,
                ContactId: user.id,
                contactId: user.id,
                messageType: 'text',
                isFromMe: true,
                phone: phoneNumber,
                pushName: user.username || 'Agent'
            });
        }
    }, [user, sendMessage, addConversation, onSelectConversation, chatRouter]);

    const handleArchive = useCallback(async (chatId: string) => {
        if (!user?.id) return;
        try {
            updateConversation(chatId, { isArchived: true });
            await chatRouter.ArchiveChat(chatId, user.id);
            toast.success('Chat archived');
        } catch {
            updateConversation(chatId, { isArchived: false });
        }
    }, [chatRouter, updateConversation, user?.id]);

    const handleUnarchive = useCallback(async (chatId: string) => {
        if (!user?.id) return;
        try {
            updateConversation(chatId, { isArchived: false });
            await chatRouter.UnarchiveChat(chatId, user.id);
            toast.success('Chat unarchived');
        } catch {
            updateConversation(chatId, { isArchived: true });
        }
    }, [chatRouter, updateConversation, user?.id]);

    const handleOpenTagManager = useCallback((chat: ChatModel) => {
        setChatForTags(chat);
        setShowTagAssignmentModal(true);
    }, []);

    const handleTagsUpdated = useCallback((chatId: string, tags: ChatTag[]) => {
        updateConversation(chatId, { tags });
    }, [updateConversation]);

    const formatTime = useCallback((date?: string | number | Date) => {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600);

        if (diff < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        if (diff < 48) return 'Yesterday';
        return d.toLocaleDateString();
    }, []);

    // Get unique tags for the close modal
    const resolutionTags = useMemo(() => {
        const tagsMap = new Map<string, { id: string, name: string }>();
        conversations.forEach(c => c.tags?.forEach(t => tagsMap.set(t.tagId, { id: t.tagId, name: t.tagName })));
        return Array.from(tagsMap.values());
    }, [conversations]);

    const handleTabChange = useCallback((tab: SidebarTabType) => {
        setActiveTab(tab);
        setServerPage(1);
        setHasMoreServerPages(false);
    }, []);

    const handleLoadMoreConversations = useCallback(() => {
        if (activeTab === 'contacts' || isServerLoading || !hasMoreServerPages) {
            return;
        }

        setServerPage((prev) => prev + 1);
    }, [activeTab, hasMoreServerPages, isServerLoading]);

    return (
        <>
            <div className="w-[480px] min-w-[480px] tech-sidebar flex flex-col h-full border-r theme-border-primary bg-white dark:bg-black transition-all duration-300">
                <SidebarHeader
                    user={user}
                    onNewChat={() => setShowNewChatModal(true)}
                    onLogout={onLogout}
                />

                <SidebarActions
                    onBulkMessage={() => toast('Bulk messaging coming soon')}
                    onNewTemplate={() => setShowTemplateManagerModal(true)}
                    onManageTags={() => setShowTagManagerModal(true)}
                />

                {activeTab === 'contacts' ? (
                    <div className="p-4 border-b theme-border-primary bg-gray-50/40 dark:bg-gray-900/40">
                        <div className="flex items-end justify-between gap-3 mb-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] theme-text-secondary opacity-70">Contact Directory</p>
                                <p className="text-sm font-semibold theme-text-primary">
                                    {contacts.length} total • {contacts.filter((c) => c.isMyContact).length} contacts • {contacts.filter((c) => c.isLead).length} leads
                                </p>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Search contacts by name or phone..."
                            value={contactSearchTerm}
                            onChange={(e) => setContactSearchTerm(e.target.value)}
                            className="chat-input w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400"
                        />
                    </div>
                ) : (
                    <>
                        <SidebarSearch
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            filters={filters}
                            onFilterChange={setFilters}
                        />

                        <TagFilterBar
                            availableTags={availableTags}
                            selectedTagId={selectedTagId}
                            onTagToggle={(id) => setSelectedTagId(selectedTagId === id ? null : id)}
                            onClear={() => setSelectedTagId(null)}
                        />
                    </>
                )}

                <SidebarTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    unreadCounts={useMemo(() => ({
                        chats: conversations.filter(c => (c.unreadCount || 0) > 0).length,
                        open: conversations.filter(c => c.status === 'open' && (c.unreadCount || 0) > 0).length,
                        assigned: conversations.filter(c => c.assignedTo === user?.id && (c.unreadCount || 0) > 0).length,
                        favorites: 0,
                    }), [conversations, user?.id])}
                />

                <div className="flex-1 relative overflow-hidden">
                    {isServerLoading && conversations.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : activeTab === 'contacts' ? (
                        <div className="h-full overflow-y-auto no-scrollbar px-2 py-2 space-y-2">
                            <div className="px-1 pb-1 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setContactTypeFilter('all')}
                                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${contactTypeFilter === 'all' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 theme-text-secondary'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContactTypeFilter('contact')}
                                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${contactTypeFilter === 'contact' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 theme-text-secondary'}`}
                                    >
                                        Contacts
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContactTypeFilter('lead')}
                                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${contactTypeFilter === 'lead' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 theme-text-secondary'}`}
                                    >
                                        Leads
                                    </button>
                                </div>
                                <select
                                    value={contactSortBy}
                                    onChange={(e) => setContactSortBy(e.target.value as 'name' | 'phone')}
                                    className="text-[11px] px-2 py-1 rounded-md border theme-border-primary bg-white dark:bg-gray-900 theme-text-secondary"
                                >
                                    <option value="name">Sort: Name</option>
                                    <option value="phone">Sort: Phone</option>
                                </select>
                            </div>

                            {isLoadingContacts ? (
                                <div className="flex items-center justify-center h-full py-8">
                                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500"></div>
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="p-8 text-center theme-text-accent font-bold opacity-60 italic">
                                    No contacts found
                                </div>
                            ) : (
                                filteredContacts.map((contact) => {
                                    const displayName = contact.fullName || contact.firstName || contact.pushName || contact.businessName || contact.name || contact.phone;
                                    const existingChat = conversations.find((c) =>
                                        String(c.contactId || '').trim() === contact.phone ||
                                        String(c.phone || '').replace(/@[^@]+$/, '').trim() === contact.phone ||
                                        String(c.id || '').trim() === contact.phone
                                    );

                                    return (
                                        <button
                                            key={`${contact.phone}-${contact.lid || ''}`}
                                            type="button"
                                            className="w-full text-left p-3 rounded-xl border theme-border-primary hover:bg-gray-500/10 transition-colors"
                                            onClick={() => {
                                                if (existingChat) {
                                                    onSelectConversation(existingChat);
                                                    return;
                                                }

                                                const mockChat: ChatModel = {
                                                    id: contact.phone,
                                                    name: displayName,
                                                    participants: [],
                                                    lastMessage: '',
                                                    lastMessageTime: new Date(),
                                                    unreadCount: 0,
                                                    isTyping: false,
                                                    isOnline: false,
                                                    messages: [],
                                                    phone: contact.phone,
                                                    contactId: contact.phone,
                                                    pushname: displayName,
                                                    tags: [],
                                                    status: 'open',
                                                    isMyContact: contact.isMyContact,
                                                    isLead: contact.isLead,
                                                    fullName: contact.fullName,
                                                    firstName: contact.firstName,
                                                    pushName: contact.pushName,
                                                };

                                                addConversation(mockChat);
                                                onSelectConversation(mockChat);
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-semibold theme-text-primary truncate">{displayName}</p>
                                                    <p className="text-xs theme-text-secondary truncate">{contact.phone}</p>
                                                </div>
                                                {contact.isMyContact ? (
                                                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 shrink-0">
                                                        Contact
                                                    </span>
                                                ) : contact.isLead ? (
                                                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 shrink-0">
                                                        Lead
                                                    </span>
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 min-h-0">
                                <VirtualizedConversationList
                                    conversations={filteredConversations}
                                    selectedConversationId={selectedConversationId}
                                    onSelectConversation={onSelectConversation}
                                    onArchive={handleArchive}
                                    onUnarchive={handleUnarchive}
                                    onToggleStatus={handleToggleStatus}
                                    onAssign={handleAssignTrigger}
                                    onOpenTagManager={handleOpenTagManager}
                                    formatTime={formatTime}
                                    hasMore={hasMoreServerPages}
                                    onLoadMore={handleLoadMoreConversations}
                                />
                            </div>

                            {isServerLoading && filteredConversations.length > 0 && (
                                <div className="px-3 py-2 border-t theme-border-primary bg-white/90 dark:bg-gray-950/90 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CloseChatModal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                onConfirm={handleConfirmClose}
                availableTags={resolutionTags}
            />

            <AssignChatModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onAssign={handleConfirmAssign}
                availableUsers={availableUsers}
                isLoading={isLoadingUsers}
            />

            <NewChatModal
                isOpen={showNewChatModal}
                onClose={() => setShowNewChatModal(false)}
                onCreateChat={handleCreateChat}
            />

            <TagManagerModal
                isOpen={showTagManagerModal}
                onClose={() => setShowTagManagerModal(false)}
                chatRouter={chatRouter}
            />

            <TemplateManagerModal
                isOpen={showTemplateManagerModal}
                onClose={() => setShowTemplateManagerModal(false)}
                chatRouter={chatRouter}
            />

            <TagAssignmentModal
                isOpen={showTagAssignmentModal}
                onClose={() => setShowTagAssignmentModal(false)}
                chat={chatForTags}
                chatRouter={chatRouter}
                onTagsUpdated={handleTagsUpdated}
            />
        </>
    );
};
