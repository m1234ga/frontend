import { create } from 'zustand';
import { ChatMessage } from '@shared/Models';

interface MessageState {
    // Normalized messages by chat ID
    messagesByChat: Map<string, Map<string, ChatMessage>>;

    // Actions
    setMessages: (chatId: string, messages: ChatMessage[]) => void;
    addMessage: (chatId: string, message: ChatMessage) => void;
    updateMessage: (chatId: string, messageId: string, updates: Partial<ChatMessage>) => void;
    removeMessage: (chatId: string, messageId: string) => void;
    clearChat: (chatId: string) => void;

    // Selectors
    getMessages: (chatId: string) => ChatMessage[];
    getMessage: (chatId: string, messageId: string) => ChatMessage | undefined;
}

export const useMessageStore = create<MessageState>((set, get) => ({
    messagesByChat: new Map(),

    setMessages: (chatId, messages) => set((state) => {
        const newMap = new Map(state.messagesByChat);
        const chatMessages = new Map<string, ChatMessage>();

        messages.forEach(msg => {
            chatMessages.set(msg.id, msg);
        });

        newMap.set(chatId, chatMessages);
        return { messagesByChat: newMap };
    }),

    addMessage: (chatId, message) => set((state) => {
        const newMap = new Map(state.messagesByChat);
        const chatMessages = new Map(newMap.get(chatId) || new Map());

        chatMessages.set(message.id, message);
        newMap.set(chatId, chatMessages);

        return { messagesByChat: newMap };
    }),

    updateMessage: (chatId, messageId, updates) => set((state) => {
        const newMap = new Map(state.messagesByChat);
        const chatMessages = new Map(newMap.get(chatId) || new Map());
        const existingMessage = chatMessages.get(messageId);

        if (existingMessage) {
            chatMessages.set(messageId, { ...existingMessage, ...updates });
            newMap.set(chatId, chatMessages);
        }

        return { messagesByChat: newMap };
    }),

    removeMessage: (chatId, messageId) => set((state) => {
        const newMap = new Map(state.messagesByChat);
        const chatMessages = new Map(newMap.get(chatId) || new Map());

        chatMessages.delete(messageId);
        newMap.set(chatId, chatMessages);

        return { messagesByChat: newMap };
    }),

    clearChat: (chatId) => set((state) => {
        const newMap = new Map(state.messagesByChat);
        newMap.delete(chatId);
        return { messagesByChat: newMap };
    }),

    // Selectors
    getMessages: (chatId) => {
        const chatMessages = get().messagesByChat.get(chatId);
        if (!chatMessages) return [];

        return Array.from(chatMessages.values()).sort((a, b) => {
            const timeA = new Date(a.timeStamp || a.timestamp || 0).getTime();
            const timeB = new Date(b.timeStamp || b.timestamp || 0).getTime();
            return timeA - timeB;
        });
    },

    getMessage: (chatId, messageId) => {
        return get().messagesByChat.get(chatId)?.get(messageId);
    },
}));
