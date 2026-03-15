'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EmptyArea } from '@/components/chat/EmptyArea';
import { toast } from 'react-hot-toast';
import VirtualizedMessageList from './VirtualizedMessageList';
import { ChatMessage, Chat as ChatModel } from '../../../../Shared/Models';
import { ForwardModal } from '@/components/chat/ForwardModal';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChatApi } from '@/hooks/useChatData';
import ChatHeader from './ChatHeader';
import { MessageInputWrapper } from './MessageInputWrapper';
import { ThreadPane } from './ThreadPane';
import { SecondarySidebar } from './SecondarySidebar';
import { AssignChatModal } from './modals/AssignChatModal';
import { CloseChatModal } from './modals/CloseChatModal';

interface ChatAreaProps {
    selectedConversation: ChatModel | null;
    messages: ChatMessage[];
    onSendMessage: (content: string, replyMessage?: ChatMessage) => void;
    onNewMessage?: (message: ChatMessage) => void;
    onMessageUpdate?: (message: ChatMessage & { tempId?: string }) => void;
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
        setUiState(prev => ({ ...prev, showThreadPane: true }));
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
                onFavoritesClick={() => setUiState(prev => ({
                    ...prev,
                    secondarySidebarType: 'favorites',
                    showSecondarySidebar: true
                }))}
                pinnedCount={pinnedMessages.length}
                pinnedPreview={latestPinnedMessage?.message || undefined}
                onPinnedClick={() => setUiState(prev => ({
                    ...prev,
                    secondarySidebarType: 'pinned',
                    showSecondarySidebar: true
                }))}
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
                            // TODO: Implement delete
                            console.log('Delete message:', msg.id);
                        }}
                        onEdit={(msg, newText) => {
                            // TODO: Implement edit
                            console.log('Edit message:', msg.id, newText);
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
