"use client";

import React, { useState, useEffect } from 'react';
import { X, Tag, Loader2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Chat as ChatModel, ChatTag } from '@shared/Models';
import { useAuth } from '@/contexts/AuthContext';

interface TagAssignmentRouter {
    GetTags: () => Promise<ChatTag[]>;
    RemoveTagFromChat: (chatId: string, tagId: string) => Promise<unknown>;
    AssignTagToChat: (chatId: string, tagId: string, createdBy: string) => Promise<unknown>;
}

interface TagAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    chat: ChatModel | null;
    chatRouter: TagAssignmentRouter;
    onTagsUpdated?: (chatId: string, tags: ChatTag[]) => void;
}

export const TagAssignmentModal: React.FC<TagAssignmentModalProps> = ({
    isOpen,
    onClose,
    chat,
    chatRouter,
    onTagsUpdated
}) => {
    const { user } = useAuth();
    const [availableTags, setAvailableTags] = useState<ChatTag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const getTagId = (tag: ChatTag) => tag.tagId ?? (tag as unknown as { id?: string }).id ?? '';
    const getTagName = (tag: ChatTag) => tag.tagName ?? (tag as unknown as { name?: string }).name ?? 'Tag';

    const fetchAvailableTags = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await chatRouter.GetTags();
            setAvailableTags(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching tags:', error);
        } finally {
            setIsLoading(false);
        }
    }, [chatRouter]);

    useEffect(() => {
        if (isOpen) {
            fetchAvailableTags();
        }
    }, [isOpen, fetchAvailableTags]);

    const handleToggleTag = async (tag: ChatTag) => {
        if (!chat || !user?.id) return;

        const currentTagId = getTagId(tag);
        const isAssigned = chat.tags?.some((t: ChatTag) => getTagId(t) === currentTagId);
        setIsUpdating(true);

        try {
            if (isAssigned) {
                await chatRouter.RemoveTagFromChat(chat.id, currentTagId);
                const newTags = (chat.tags || []).filter((t: ChatTag) => getTagId(t) !== currentTagId);
                onTagsUpdated?.(chat.id, newTags);
                toast.success(`Removed tag: ${getTagName(tag)}`);
            } else {
                await chatRouter.AssignTagToChat(chat.id, currentTagId, user.id);
                const newTags = [...(chat.tags || []), tag];
                onTagsUpdated?.(chat.id, newTags);
                toast.success(`Assigned tag: ${getTagName(tag)}`);
            }
        } catch (error) {
            console.error('Error toggling tag:', error);
            toast.error('Failed to update tag');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isOpen || !chat) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-emerald-500/5">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                            <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold theme-text-primary line-clamp-1">{chat.name || chat.phone}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest theme-text-secondary opacity-60">Manage Chat Tags</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tags List */}
                <div className="p-6 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Loading available tags...</p>
                        </div>
                    ) : availableTags.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-sm text-gray-500 mb-4">No tags available.</p>
                            <p className="text-xs text-emerald-600 font-bold">Please create tags in the Tag Manager first.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableTags.map((tag) => {
                                const isAssigned = chat.tags?.some((t: ChatTag) => getTagId(t) === getTagId(tag));
                                return (
                                    <button
                                        key={getTagId(tag)}
                                        disabled={isUpdating}
                                        onClick={() => handleToggleTag(tag)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${isAssigned
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-gray-50 dark:bg-gray-800/50 border-transparent text-gray-600 dark:text-gray-400 hover:border-emerald-500/20'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-2 h-2 rounded-full ${isAssigned ? 'bg-emerald-500 shadow-glow-sm' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                            <span className="font-bold text-[13px]">{getTagName(tag)}</span>
                                        </div>
                                        {isAssigned && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-glow-sm transition-all active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
