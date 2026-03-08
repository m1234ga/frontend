import useSWR, { SWRConfiguration } from 'swr';
import { useMemo } from 'react';
import Chat from '@/components/chat/ChatRouters';
import { useAuth } from '@/contexts/AuthContext';

type ChatsPageResponse = { chats?: unknown };

export function useChatApi() {
    const { token } = useAuth();
    return useMemo(() => Chat(token || ""), [token]);
}

export function useConversations(status?: string, options?: SWRConfiguration) {
    const api = useChatApi();
    const { token } = useAuth();

    return useSWR(
        token ? ['conversations', status || 'all', token] : null,
        async () => {
            const result = await api.GetChatsPage(1, 200, status);
            // Normalize result to array
            const chats = Array.isArray(result) ? result :
                (result && typeof result === 'object' && 'chats' in result) ? (result as ChatsPageResponse).chats :
                    [];
            return Array.isArray(chats) ? chats : [];
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 5000,
            ...options
        }
    );
}

export function useClosedConversations() {
    return useConversations('closed');
}

export function useOpenConversations() {
    return useConversations('open');
}

export function useMessages(chatId: string | null, options?: SWRConfiguration) {
    const api = useChatApi();
    const { token } = useAuth();

    return useSWR(
        token && chatId ? ['messages', chatId, token] : null,
        async () => {
            const data = await api.GetMessagesById(chatId!);
            return Array.isArray(data) ? data : [];
        },
        {
            revalidateOnFocus: false,
            ...options
        }
    );
}
