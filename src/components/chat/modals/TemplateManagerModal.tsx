"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, FileText, Trash2, Loader2, Image as ImageIcon, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TemplateManagerChatRouter {
    GetMessageTemplates: () => Promise<unknown>;
    CreateMessageTemplate: (name: string, content: string, createdBy: string, imageFile?: File) => Promise<unknown>;
    DeleteMessageTemplate?: (id: string) => Promise<unknown>;
}

interface Template {
    id: string;
    name: string;
    content: string;
    imageUrl?: string;
    createdBy: string;
}

interface TemplateManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatRouter: TemplateManagerChatRouter;
    onSelect?: (content: string) => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
    isOpen,
    onClose,
    chatRouter,
    onSelect
}) => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);

    // New template form state
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await chatRouter.GetMessageTemplates();
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !content.trim() || !user?.id) return;

        setIsCreating(true);
        try {
            await chatRouter.CreateMessageTemplate(
                name.trim(),
                content.trim(),
                user.id,
                imageFile || undefined
            );
            toast.success('Template created');
            setName('');
            setContent('');
            setImageFile(null);
            setShowNewForm(false);
            fetchTemplates();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create template';
            toast.error(message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this template?')) return;
        if (!chatRouter.DeleteMessageTemplate) {
            toast.error('Delete template is not supported yet');
            return;
        }
        try {
            await chatRouter.DeleteMessageTemplate(id);
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-emerald-500/5">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500 rounded-lg shadow-glow-sm">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold theme-text-primary">Message Templates</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {showNewForm ? (
                        <form onSubmit={handleCreate} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider theme-text-secondary opacity-60">Template Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Welcome Message"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500/20 rounded-xl font-bold theme-text-primary outline-none transition-all shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider theme-text-secondary opacity-60">Message Content</label>
                                <textarea
                                    placeholder="Type your template message here..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500/20 rounded-xl font-medium theme-text-primary outline-none transition-all shadow-inner resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider theme-text-secondary opacity-60">Attachment (Optional)</label>
                                <div className="flex items-center space-x-3">
                                    <label className="flex-1 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/40 transition-colors bg-gray-50/50 dark:bg-gray-800/30">
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                            accept="image/*"
                                        />
                                        <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-xs font-medium text-gray-500">
                                            {imageFile ? imageFile.name : 'Upload image attachment'}
                                        </span>
                                    </label>
                                    {imageFile && (
                                        <button
                                            type="button"
                                            onClick={() => setImageFile(null)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewForm(false)}
                                    className="flex-1 py-3 font-bold theme-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black shadow-glow transition-all active:scale-[0.98] flex items-center justify-center space-x-2 px-8"
                                >
                                    {isCreating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Save Template</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={() => setShowNewForm(true)}
                                className="w-full p-4 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 rounded-2xl flex items-center justify-center space-x-2 text-emerald-600 font-bold transition-all group"
                            >
                                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Create New Template</span>
                            </button>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                                    <p className="text-gray-500 font-medium tracking-wide">Fetching templates...</p>
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-800">
                                    <FileText className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                                    <p className="text-gray-400 font-medium">No templates found. Start by creating one!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="p-4 bg-gray-50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border theme-border-primary rounded-2xl transition-all group relative cursor-pointer shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold theme-text-primary text-[15px]">{template.name}</h3>
                                                <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <p className="text-xs theme-text-secondary line-clamp-3 italic opacity-80 mb-3">
                                                "{template.content}"
                                            </p>
                                            {template.imageUrl && (
                                                <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
                                                    <img src={template.imageUrl} alt="" className="w-full h-full object-cover opacity-50" />
                                                </div>
                                            )}
                                            <div className="pt-2 border-t theme-border-primary mt-2 flex justify-between items-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                {onSelect && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onSelect(template.content);
                                                            onClose();
                                                        }}
                                                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-all active:scale-95"
                                                    >
                                                        Use Template
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center border-t theme-border-primary">
                    <button
                        onClick={onClose}
                        className="px-8 py-2 text-sm font-bold theme-text-secondary hover:theme-text-primary transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
