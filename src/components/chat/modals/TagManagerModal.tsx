"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Tag, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ChatTag } from '../../../../../Shared/Models';

interface TagManagerChatRouter {
    GetTags: () => Promise<unknown>;
    CreateTag: (name: string) => Promise<unknown>;
    DeleteTag: (id: string) => Promise<unknown>;
}

interface TagManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatRouter: TagManagerChatRouter;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
    isOpen,
    onClose,
    chatRouter
}) => {
    const [tags, setTags] = useState<ChatTag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTags();
        }
    }, [isOpen]);

    const fetchTags = async () => {
        setIsLoading(true);
        try {
            const data = await chatRouter.GetTags();
            setTags(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching tags:', error);
            toast.error('Failed to load tags');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        setIsCreating(true);
        try {
            await chatRouter.CreateTag(newTagName.trim());
            setNewTagName('');
            toast.success('Tag created');
            fetchTags();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create tag';
            toast.error(message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTag = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this tag?')) return;

        try {
            await chatRouter.DeleteTag(id);
            toast.success('Tag deleted');
            setTags(tags.filter(t => t.tagId !== id));
        } catch (error) {
            toast.error('Failed to delete tag');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-emerald-500/5">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500 rounded-lg shadow-glow-sm">
                            <Tag className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold theme-text-primary">Manage Tags</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Create Section */}
                <form onSubmit={handleCreateTag} className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="New tag name..."
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-emerald-500/20 rounded-xl font-medium theme-text-primary outline-none transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={isCreating || !newTagName.trim()}
                            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl shadow-glow-sm transition-all active:scale-95"
                        >
                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        </button>
                    </div>
                </form>

                {/* List Section */}
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="text-sm text-gray-500 font-medium">Loading tags...</p>
                        </div>
                    ) : tags.length === 0 ? (
                        <div className="text-center py-10">
                            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-20" />
                            <p className="text-gray-500 font-medium">No tags created yet</p>
                        </div>
                    ) : (
                        tags.map((tag) => (
                            <div
                                key={tag.tagId}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 rounded-xl border border-transparent hover:border-emerald-500/20 transition-all group"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-sm" />
                                    <span className="font-bold theme-text-primary">{tag.tagName}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteTag(tag.tagId)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-bold theme-text-secondary hover:theme-text-primary transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
