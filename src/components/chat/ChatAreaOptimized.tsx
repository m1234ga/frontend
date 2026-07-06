'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EmptyArea } from '@/components/chat/EmptyArea';
import { toast } from 'react-hot-toast';
import VirtualizedMessageList from './VirtualizedMessageList';
import { ChatMessage, Chat as ChatModel, ChatTag } from '../../../../Shared/Models';
import { ForwardModal } from '@/components/chat/ForwardModal';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChatApi } from '@/hooks/useChatData';
import ChatHeader from './ChatHeader';
import { MessageInputWrapper } from './MessageInputWrapper';
import { ThreadPane } from './ThreadPane';
import { SecondarySidebar } from './SecondarySidebar';
import { GroupDetailsPane } from './GroupDetailsPane';
import { AssignChatModal } from './modals/AssignChatModal';
import { CloseChatModal } from './modals/CloseChatModal';

type GroupParticipantOption = {
    id: string;
    name: string;
};

const isGroupConversation = (conversation: ChatModel | null): boolean => {
    if (!conversation) return false;
    const phone = String(conversation.phone || '').trim();
    const contactId = String(conversation.contactId || '').trim();
    return phone.endsWith('@g.us') || contactId.endsWith('@g.us') || phone.includes('-') || contactId.includes('-');
};

const resolveGroupJid = (conversation: ChatModel | null): string => {
    if (!conversation) return '';
    const phone = String(conversation.phone || '').trim();
    const contactId = String(conversation.contactId || '').trim();
    if (phone.endsWith('@g.us')) return phone;
    if (contactId.endsWith('@g.us')) return contactId;
    return phone || contactId;
};

const normalizeParticipants = (payload: any): GroupParticipantOption[] => {
    const info = payload?.data || payload || {};
    const source = Array.isArray(info?.Participants)
        ? info.Participants
        : Array.isArray(info?.participants)
            ? info.participants
            : [];

    return source
        .map((item: any) => {
            const id = String(item?.JID || item?.jid || item?.ID || item?.id || item?.Phone || item?.phone || item || '').trim();
            const name = String(item?.Name || item?.name || item?.PushName || item?.pushName || id).trim();
            return { id, name };
        })
        .filter((participant: GroupParticipantOption) => !!participant.id);
};

interface ChatAreaProps {
    selectedConversation: ChatModel | null;
    messages: ChatMessage[];
    onSendMessage: (content: string, replyMessage?: ChatMessage) => void;
    onNewMessage?: (message: ChatMessage) => void;
    onMessageUpdate?: (message: ChatMessage & { tempId?: string; isDeleted?: boolean }) => void;
    conversations?: ChatModel[];
    onLoadMoreMessages?: () => Promise<boolean>;
    onClose?: () => void;
}

export const ChatAreaOptimized: React.FC<ChatAreaProps> = ({
    selectedConversation,
    messages: propMessages,
    onSendMessage,
    onNewMessage,
    onMessageUpdate,
    conversations = [],
    onLoadMoreMessages,
    onClose
}) => {
    const messages = propMessages;

    // Consolidated UI state
    const [uiState, setUiState] = useState({
        showSecondarySidebar: false,
        secondarySidebarType: 'favorites' as 'favorites' | 'pinned' | 'notes',
        showThreadPane: false,
        showTemplatePopup: false,
        showForwardModal: false,
        showReactionPicker: false,
        showCloseModal: false,
        showAssignModal: false,
    });

    // Message interaction state
    const [messageState, setMessageState] = useState({
        replyToMessage: null as ChatMessage | null,
        threadRootMessage: null as ChatMessage | null,
        messageToForward: null as ChatMessage | null,
        messageToReact: null as ChatMessage | null,
        openMessageMenuId: null as string | null,
        reactionPickerPosition: { x: 0, y: 0 },
    });

    // Other state
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isOnline, setIsOnline] = useState(false);
    const [chatStatus, setChatStatus] = useState<'open' | 'closed'>(selectedConversation?.status || 'open');
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; username: string; firstName?: string; lastName?: string }>>([]);
    const [closeReasonTags, setCloseReasonTags] = useState<Array<{ id: string; name: string }>>([]);
    const [isAssignLoading, setIsAssignLoading] = useState(false);
    const [groupPaneState, setGroupPaneState] = useState({
        isOpen: false,
        isLoading: false,
        error: '',
        participants: [] as GroupParticipantOption[],
    });

    // Refs
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const { onChatPresence, onUserTyping, forwardMessage } = useSocket();
    const { user } = useAuth();
    const chatRouter = useChatApi();

    // Load favorites from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('favoriteMessages');
        if (stored) {
            try {
                setFavoriteIds(JSON.parse(stored));
            } catch (e) {
                console.error('Error loading favorites:', e);
            }
        }
    }, []);

    // Update chat status when conversation changes
    useEffect(() => {
        if (selectedConversation) {
            setChatStatus(selectedConversation.status || 'open');
        }
    }, [selectedConversation]);

    // Memoized computed values
    const favoriteMessages = useMemo(() =>
        messages.filter(m => favoriteIds.includes(m.id)),
        [messages, favoriteIds]
    );

    const pinnedMessages = useMemo(() =>
        messages.filter(m => m.isPinned),
        [messages]
    );

    const secondarySidebarItems = useMemo(() => {
        if (uiState.secondarySidebarType === 'favorites') {
            return favoriteMessages;
        }

        if (uiState.secondarySidebarType === 'pinned') {
            return pinnedMessages;
        }

        return [] as ChatMessage[];
    }, [uiState.secondarySidebarType, favoriteMessages, pinnedMessages]);

    const latestPinnedMessage = useMemo(() => {
        if (pinnedMessages.length === 0) return null;
        return pinnedMessages[pinnedMessages.length - 1];
    }, [pinnedMessages]);

    const isCurrentGroupChat = useMemo(() => isGroupConversation(selectedConversation), [selectedConversation]);

    // Optimized callbacks
    const handleSendMessageInternal = useCallback((content: string) => {
        if (messageState.replyToMessage) {
            onSendMessage(content, messageState.replyToMessage);
            setMessageState(prev => ({ ...prev, replyToMessage: null }));
        } else {
            onSendMessage(content);
        }
    }, [onSendMessage, messageState.replyToMessage]);

    const toggleFavorite = useCallback((message: ChatMessage) => {
        setFavoriteIds(prev => {
            const newIds = prev.includes(message.id)
                ? prev.filter(id => id !== message.id)
                : [...prev, message.id];
            localStorage.setItem('favoriteMessages', JSON.stringify(newIds));
            return newIds;
        });
    }, []);

    const handleReply = useCallback((message: ChatMessage) => {
        setMessageState(prev => ({ ...prev, replyToMessage: message }));
    }, []);

    const handleOpenThread = useCallback((message: ChatMessage) => {
        setMessageState(prev => ({ ...prev, threadRootMessage: message }));
        setUiState(prev => ({ ...prev, showThreadPane: true, showSecondarySidebar: false }));
        setGroupPaneState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleCloseThread = useCallback(() => {
        setUiState(prev => ({ ...prev, showThreadPane: false }));
        setMessageState(prev => ({ ...prev, threadRootMessage: null }));
    }, []);

    const handleForward = useCallback((message: ChatMessage) => {
        setMessageState(prev => ({ ...prev, messageToForward: message }));
        setUiState(prev => ({ ...prev, showForwardModal: true }));
    }, []);

    const handleReact = useCallback((message: ChatMessage, position: { x: number; y: number }) => {
        setMessageState(prev => ({
            ...prev,
            messageToReact: message,
            reactionPickerPosition: position
        }));
        setUiState(prev => ({ ...prev, showReactionPicker: true }));
    }, []);

    const handleSelectReaction = useCallback(async (emoji: string) => {
        const targetMessage = messageState.messageToReact;
        const currentUserId = user?.id;
        const targetChatId = selectedConversation?.phone;

        if (!targetMessage || !currentUserId || !targetChatId) {
            toast.error('Unable to add reaction right now');
            return;
        }

        try {
            await chatRouter.AddReaction(targetMessage.id, currentUserId, emoji, targetChatId);
        } catch (error) {
            console.error('Error adding reaction:', error);
            toast.error('Failed to add reaction');
        } finally {
            setUiState(prev => ({ ...prev, showReactionPicker: false }));
            setMessageState(prev => ({ ...prev, messageToReact: null }));
        }
    }, [messageState.messageToReact, user?.id, selectedConversation?.id, chatRouter]);

    const handlePin = useCallback(async (message: ChatMessage, isPinned: boolean) => {
        if (!selectedConversation) return;

        try {
            await chatRouter.PinMessage(message.id, isPinned);
            toast.success(isPinned ? 'Message pinned' : 'Message unpinned');
        } catch (error) {
            console.error('Error pinning message:', error);
            toast.error('Failed to pin message');
        }
    }, [selectedConversation, chatRouter]);

    useEffect(() => {
        onUserTyping(({ userId, isTyping, conversationId }) => {
            if (!selectedConversation || conversationId !== selectedConversation.id) return;
            if (user?.id && userId === user.id) return;

            setTypingUsers(prev => {
                const next = new Set(prev);
                if (isTyping) {
                    next.add(userId);
                } else {
                    next.delete(userId);
                }
                return next;
            });
        });
    }, [onUserTyping, selectedConversation, user?.id]);

    useEffect(() => {
        onChatPresence(({ chatId, isOnline: chatOnline }) => {
            if (!selectedConversation || selectedConversation.id !== chatId) return;
            setIsOnline(chatOnline);
        });
    }, [onChatPresence, selectedConversation]);

    useEffect(() => {
        setTypingUsers(new Set());
    }, [selectedConversation?.id]);

    useEffect(() => {
        if (!uiState.showAssignModal) return;

        let isCancelled = false;
        setIsAssignLoading(true);

        chatRouter.GetUsers()
            .then((users) => {
                if (isCancelled) return;
                setAvailableUsers(Array.isArray(users) ? users : []);
            })
            .catch((error) => {
                if (isCancelled) return;
                console.error('Error loading assignable users:', error);
                toast.error('Failed to load users');
                setAvailableUsers([]);
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsAssignLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [uiState.showAssignModal, chatRouter]);

    useEffect(() => {
        if (!uiState.showCloseModal) return;

        let isCancelled = false;

        chatRouter.GetTags()
            .then((tags) => {
                if (isCancelled) return;
                const normalized = Array.isArray(tags)
                    ? tags.map((tag: any) => ({ id: String(tag.tagId ?? tag.id), name: String(tag.tagName ?? tag.name) }))
                    : [];
                setCloseReasonTags(normalized);
            })
            .catch((error) => {
                if (isCancelled) return;
                console.error('Error loading close reasons:', error);
                setCloseReasonTags([]);
            });

        return () => {
            isCancelled = true;
        };
    }, [uiState.showCloseModal, chatRouter]);

    const handleStatusClick = useCallback(async () => {
        if (!selectedConversation) return;

        if (chatStatus === 'closed') {
            try {
                await chatRouter.UpdateChatStatus(selectedConversation.id, 'open');
                setChatStatus('open');
                toast.success('Chat reopened');
            } catch (error) {
                console.error('Error reopening chat:', error);
                toast.error('Failed to reopen chat');
            }
            return;
        }

        setUiState(prev => ({ ...prev, showCloseModal: true }));
    }, [selectedConversation, chatStatus, chatRouter]);

    const handleAssignChat = useCallback(async (assignedTo: string) => {
        if (!selectedConversation) return;

        try {
            await chatRouter.AssignChat(selectedConversation.id, assignedTo, user?.id || 'system');
            toast.success('Chat assigned');
            setUiState(prev => ({ ...prev, showAssignModal: false }));
        } catch (error) {
            console.error('Error assigning chat:', error);
            toast.error('Failed to assign chat');
        }
    }, [selectedConversation, chatRouter, user?.id]);

    const handleCloseChat = useCallback(async (reason: string) => {
        if (!selectedConversation) return;

        try {
            await chatRouter.UpdateChatStatus(selectedConversation.id, 'closed', reason);
            setChatStatus('closed');
            setUiState(prev => ({ ...prev, showCloseModal: false }));
            toast.success('Chat closed');
        } catch (error) {
            console.error('Error closing chat:', error);
            toast.error('Failed to close chat');
        }
    }, [selectedConversation, chatRouter]);

    const handleAssignChatFromSlash = useCallback(async (query?: string) => {
        debugger;
        if (!selectedConversation) return false;

        const normalizedQuery = (query || '').trim().replace(/^@+/, '').toLowerCase();
        if (!normalizedQuery) {
            setUiState(prev => ({ ...prev, showAssignModal: true }));
            return true;
        }

        try {
            const loadedUsers = availableUsers.length > 0
                ? availableUsers
                : await chatRouter.GetUsers().then((users) => Array.isArray(users) ? users : []);

            if (availableUsers.length === 0) {
                setAvailableUsers(loadedUsers);
            }

            const exactMatches = loadedUsers.filter((candidate) => {
                const username = (candidate.username || '').toLowerCase();
                const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim().toLowerCase();
                return username === normalizedQuery || fullName === normalizedQuery || candidate.id.toLowerCase() === normalizedQuery;
            });

            const matchedUser = exactMatches[0] || loadedUsers.find((candidate) => {
                const username = (candidate.username || '').toLowerCase();
                const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim().toLowerCase();
                return username.startsWith(normalizedQuery) || fullName.includes(normalizedQuery);
            });

            if (!matchedUser) {
                toast.error('Assignee not found');
                setUiState(prev => ({ ...prev, showAssignModal: true }));
                return true;
            }

            await handleAssignChat(matchedUser.id);
            return true;
        } catch (error) {
            console.error('Error assigning chat from slash command:', error);
            toast.error('Failed to assign chat');
            return true;
        }
    }, [availableUsers, chatRouter, handleAssignChat, selectedConversation]);

    const handleCloseChatFromSlash = useCallback(async (reason?: string) => {
        if (!selectedConversation) return false;

        const normalizedReason = (reason || '').trim();
        if (!normalizedReason) {
            setUiState(prev => ({ ...prev, showCloseModal: true }));
            return true;
        }

        await handleCloseChat(normalizedReason);
        return true;
    }, [handleCloseChat, selectedConversation]);

    const handleTagChatFromSlash = useCallback(async (tagName?: string) => {
        if (!selectedConversation || !user?.id) return false;

        const rawTagQuery = (tagName || '').trim().replace(/^#/, '');
        const normalizedTag = rawTagQuery.toLowerCase();
        const normalizedTagToken = normalizedTag
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (!normalizedTagToken) {
            toast.error('Enter a tag name after /tag');
            return true;
        }

        try {
            const tags = await chatRouter.GetTags();
            const availableTags = Array.isArray(tags) ? tags : [];

            const toToken = (value: string) =>
                value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');

            const exactMatch = availableTags.find((tag) => {
                const name = String((tag as ChatTag).tagName || (tag as { name?: string }).name || '');
                const id = String((tag as ChatTag).tagId || (tag as { id?: string }).id || '');
                const nameLower = name.toLowerCase();
                const idLower = id.toLowerCase();
                return (
                    nameLower === normalizedTag ||
                    idLower === normalizedTag ||
                    toToken(name) === normalizedTagToken ||
                    toToken(id) === normalizedTagToken
                );
            });

            const matchedTag = exactMatch || availableTags.find((tag) => {
                const name = String((tag as ChatTag).tagName || (tag as { name?: string }).name || '');
                return toToken(name).startsWith(normalizedTagToken);
            });

            if (!matchedTag) {
                toast.error('Tag not found');
                return true;
            }

            const matchedTagId = String((matchedTag as ChatTag).tagId || (matchedTag as { id?: string }).id || '');
            await chatRouter.AssignTagToChat(selectedConversation.id, matchedTagId, user.id);
            toast.success(`Tag assigned: ${String((matchedTag as ChatTag).tagName || (matchedTag as { name?: string }).name || normalizedTag)}`);
            return true;
        } catch (error) {
            console.error('Error assigning tag from slash command:', error);
            toast.error('Failed to assign tag');
            return true;
        }
    }, [chatRouter, selectedConversation, user?.id]);

    const handleSecondaryItemClick = useCallback((item: { id?: string }) => {
        setUiState(prev => ({ ...prev, showSecondarySidebar: false }));

        const messageId = String(item?.id || '').trim();
        if (!messageId) return;

        // Wait for sidebar close transition/layout before scrolling target into view.
        window.setTimeout(() => {
            const node = document.getElementById(`msg-${encodeURIComponent(messageId)}`);
            node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
    }, []);

    const loadParticipants = useCallback(async (groupJid: string) => {
        if (!groupJid) return;
        setGroupPaneState(prev => ({ ...prev, isLoading: true, error: '' }));
        try {
            const payload = await chatRouter.GetGroupInfo(groupJid);
            const participants = normalizeParticipants(payload);
            setGroupPaneState(prev => ({ ...prev, isLoading: false, participants }));
        } catch (error) {
            console.error('Error loading group participants:', error);
            setGroupPaneState(prev => ({ ...prev, isLoading: false, error: 'Failed to load participants', participants: [] }));
        }
    }, [chatRouter]);

    const openGroupPane = useCallback(() => {
        if (!isCurrentGroupChat) return;
        const groupJid = resolveGroupJid(selectedConversation);
        if (!groupJid) return;
        setUiState(prev => ({ ...prev, showSecondarySidebar: false, showThreadPane: false }));
        setGroupPaneState(prev => ({ ...prev, isOpen: true, participants: [], error: '' }));
        void loadParticipants(groupJid);
    }, [isCurrentGroupChat, selectedConversation, loadParticipants]);

    const closeGroupPane = useCallback(() => {
        setGroupPaneState(prev => ({ ...prev, isOpen: false }));
    }, []);

    useEffect(() => {
        if (!selectedConversation || !isGroupConversation(selectedConversation)) {
            setGroupPaneState(prev => ({ ...prev, isOpen: false }));
        }
    }, [selectedConversation]);

    if (!selectedConversation) {
        return <EmptyArea conversations={conversations} currentUser={user} />;
    }

    return (
        <div className="flex-1 flex flex-col h-full relative bg-[var(--chat-bg)] text-[var(--chat-text)] transition-colors duration-300 border-l border-[var(--chat-border)]">
            <ChatHeader
                selectedConversation={selectedConversation}
                isOnline={isOnline}
                typingUsers={typingUsers}
                chatStatus={chatStatus}
                onAssignClick={() => setUiState(prev => ({ ...prev, showAssignModal: true }))}
                onStatusClick={handleStatusClick}
                favoriteCount={favoriteMessages.length}
                onFavoritesClick={() => {
                    setGroupPaneState(prev => ({ ...prev, isOpen: false }));
                    setUiState(prev => ({
                        ...prev,
                        showThreadPane: false,
                        secondarySidebarType: 'favorites',
                        showSecondarySidebar: true
                    }));
                }}
                pinnedCount={pinnedMessages.length}
                pinnedPreview={latestPinnedMessage?.message || undefined}
                onPinnedClick={() => {
                    setGroupPaneState(prev => ({ ...prev, isOpen: false }));
                    setUiState(prev => ({
                        ...prev,
                        showThreadPane: false,
                        secondarySidebarType: 'pinned',
                        showSecondarySidebar: true
                    }));
                }}
                isGroupChat={isCurrentGroupChat}
                onGroupInfoClick={openGroupPane}
                onClose={onClose}
            />

            {/* Messages Area with Virtualization */}
            <div className="flex-1 overflow-hidden relative bg-transparent flex">
                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-hidden relative bg-transparent"
                >
                    <VirtualizedMessageList
                        messages={messages}
                        favoriteMessages={favoriteMessages}
                        currentUserId={user?.id}
                        toggleFavorite={toggleFavorite}
                        onForward={handleForward}
                        onDelete={(msg) => {
                            chatRouter.DeleteMessage(msg)
                                .then(() => {
                                    onMessageUpdate?.({
                                        ...msg,
                                        isDeleted: true,
                                        message: ''
                                    });
                                    toast.success('Message deleted');
                                })
                                .catch((error) => {
                                    console.error('Error deleting message:', error);
                                    toast.error('Failed to delete message');
                                });
                        }}
                        onEdit={(msg, newText) => {
                            chatRouter.EditMessage(msg, newText)
                                .then((response) => {
                                    const updated = response?.editedMessage;
                                    onMessageUpdate?.({
                                        ...msg,
                                        ...updated,
                                        id: updated?.id || msg.id,
                                        message: newText,
                                        isEdit: true
                                    });
                                    toast.success('Message edited');
                                })
                                .catch((error) => {
                                    console.error('Error editing message:', error);
                                    toast.error('Failed to edit message');
                                });
                        }}
                        onAddNote={(msg, note) => {
                            chatRouter.AddNoteToMessage(msg.id, note)
                                .then((response) => {
                                    const updated = response?.updatedMessage;
                                    if (updated) {
                                        onMessageUpdate?.({
                                            ...msg,
                                            ...updated,
                                            id: updated.id || msg.id,
                                        });
                                    }
                                    toast.success('Note added');
                                })
                                .catch((error) => {
                                    console.error('Error adding note:', error);
                                    toast.error('Failed to add note');
                                });
                        }}
                        onReply={handleReply}
                        onOpenThread={handleOpenThread}
                        onPin={handlePin}
                        onReact={handleReact}
                        openMessageMenuId={messageState.openMessageMenuId}
                        onMenuToggle={(id) => setMessageState(prev => ({
                            ...prev,
                            openMessageMenuId: prev.openMessageMenuId === id ? null : id
                        }))}
                        chatName={selectedConversation.name}
                        onLoadMoreMessages={onLoadMoreMessages}
                    />
                </div>

                {uiState.showThreadPane && messageState.threadRootMessage && (
                    <ThreadPane
                        rootMessage={messageState.threadRootMessage}
                        allMessages={messages}
                        onClose={handleCloseThread}
                        onReply={handleReply}
                    />
                )}

                {groupPaneState.isOpen && isCurrentGroupChat && (
                    <GroupDetailsPane
                        isOpen={groupPaneState.isOpen}
                        onClose={closeGroupPane}
                        onRefresh={() => void loadParticipants(resolveGroupJid(selectedConversation))}
                        participants={groupPaneState.participants}
                        isLoading={groupPaneState.isLoading}
                        error={groupPaneState.error}
                    />
                )}

                <SecondarySidebar
                    isOpen={uiState.showSecondarySidebar}
                    onClose={() => setUiState(prev => ({ ...prev, showSecondarySidebar: false }))}
                    type={uiState.secondarySidebarType}
                    items={secondarySidebarItems}
                    onItemClick={handleSecondaryItemClick}
                />
            </div>

            {/* Message Input */}
            <MessageInputWrapper
                onSend={handleSendMessageInternal}
                replyToMessage={messageState.replyToMessage}
                onCancelReply={() => setMessageState(prev => ({ ...prev, replyToMessage: null }))}
                disabled={chatStatus === 'closed'}
                selectedConversation={selectedConversation}
                onAssignChat={handleAssignChatFromSlash}
                onCloseChat={handleCloseChatFromSlash}
                onTagChat={handleTagChatFromSlash}
            />

            {/* Modals */}
            {uiState.showForwardModal && messageState.messageToForward && (
                <ForwardModal
                    isOpen={uiState.showForwardModal}
                    onClose={() => {
                        setUiState(prev => ({ ...prev, showForwardModal: false }));
                        setMessageState(prev => ({ ...prev, messageToForward: null }));
                    }}
                    message={messageState.messageToForward}
                    conversations={conversations}
                    onForward={(message, targetChatId, targetPhone) => {
                        forwardMessage(message, targetChatId, targetPhone);
                        setUiState(prev => ({ ...prev, showForwardModal: false }));
                        setMessageState(prev => ({ ...prev, messageToForward: null }));
                    }}
                />
            )}

            {uiState.showReactionPicker && messageState.messageToReact && (
                <ReactionPicker
                    isOpen={uiState.showReactionPicker}
                    onClose={() => {
                        setUiState(prev => ({ ...prev, showReactionPicker: false }));
                        setMessageState(prev => ({ ...prev, messageToReact: null }));
                    }}
                    onSelectReaction={handleSelectReaction}
                    position={messageState.reactionPickerPosition}
                />
            )}

            <AssignChatModal
                isOpen={uiState.showAssignModal}
                onClose={() => setUiState(prev => ({ ...prev, showAssignModal: false }))}
                onAssign={handleAssignChat}
                availableUsers={availableUsers}
                isLoading={isAssignLoading}
            />

            <CloseChatModal
                isOpen={uiState.showCloseModal}
                onClose={() => setUiState(prev => ({ ...prev, showCloseModal: false }))}
                onConfirm={handleCloseChat}
                availableTags={closeReasonTags}
            />
        </div>
    );
};
