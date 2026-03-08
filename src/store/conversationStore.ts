import { create } from 'zustand';
import { Chat as ChatModel } from '@shared/Models';

interface ConversationState {
    // Normalized conversations by ID
    conversationsById: Map<string, ChatModel>;

    // Conversation list (ordered)
    conversationIds: string[];

    // Selected conversation
    selectedConversationId: string | null;

    conversations: ChatModel[];

    // Actions
    setConversations: (conversations: ChatModel[]) => void;
    addConversation: (conversation: ChatModel) => void;
    updateConversation: (id: string, updates: Partial<ChatModel>) => void;
    removeConversation: (id: string) => void;
    selectConversation: (id: string | null) => void;

    // Selectors
    getConversation: (id: string) => ChatModel | undefined;
    getSelectedConversation: () => ChatModel | null;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
    conversationsById: new Map(),
    conversationIds: [],
    conversations: [],
    selectedConversationId: null,

    setConversations: (conversations) => set(() => {
        const newMap = new Map<string, ChatModel>();
        const ids: string[] = [];

        conversations.forEach(conv => {
            newMap.set(conv.id, conv);
            ids.push(conv.id);
        });

        return {
            conversationsById: newMap,
            conversationIds: ids,
            conversations: conversations
        };
    }),

    addConversation: (conversation) => set((state) => {
        const newMap = new Map(state.conversationsById);
        newMap.set(conversation.id, conversation);

        const newIds = state.conversationIds.includes(conversation.id)
            ? state.conversationIds
            : [conversation.id, ...state.conversationIds];

        const newConversations = newIds
            .map(id => newMap.get(id))
            .filter((c): c is ChatModel => c !== undefined);

        return {
            conversationsById: newMap,
            conversationIds: newIds,
            conversations: newConversations
        };
    }),

    updateConversation: (id, updates) => set((state) => {
        const newMap = new Map(state.conversationsById);
        const existing = newMap.get(id);

        if (existing) {
            newMap.set(id, { ...existing, ...updates });
        }

        const newConversations = state.conversationIds
            .map(id => newMap.get(id))
            .filter((c): c is ChatModel => c !== undefined);

        return {
            conversationsById: newMap,
            conversations: newConversations
        };
    }),

    removeConversation: (id) => set((state) => {
        const newMap = new Map(state.conversationsById);
        newMap.delete(id);

        const newIds = state.conversationIds.filter(convId => convId !== id);
        const newConversations = newIds
            .map(convId => newMap.get(convId))
            .filter((c): c is ChatModel => c !== undefined);

        return {
            conversationsById: newMap,
            conversationIds: newIds,
            conversations: newConversations,
            selectedConversationId: state.selectedConversationId === id ? null : state.selectedConversationId
        };
    }),

    selectConversation: (id) => set(() => ({
        selectedConversationId: id
    })),

    // Selectors
    getConversation: (id) => {
        return get().conversationsById.get(id);
    },

    getSelectedConversation: () => {
        const state = get();
        if (!state.selectedConversationId) return null;
        return state.conversationsById.get(state.selectedConversationId) || null;
    },
}));
