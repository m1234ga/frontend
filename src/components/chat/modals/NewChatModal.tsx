"use client";

import React, { useState } from 'react';
import { X, MessageSquarePlus, Phone, Send } from 'lucide-react';

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateChat: (phone: string, initialMessage?: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
    isOpen,
    onClose,
    onCreateChat
}) => {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) return;
        onCreateChat(phone, message);
        setPhone('');
        setMessage('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-glow">
                            <MessageSquarePlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black theme-text-primary tracking-tight">New Chat</h3>
                            <p className="text-xs font-bold theme-text-accent uppercase tracking-widest opacity-60">Start a conversation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 theme-text-secondary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-60 theme-text-secondary ml-1">Phone Number</label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                required
                                placeholder="e.g. 201234567890"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-gray-800 rounded-2xl py-4 pl-12 pr-4 font-bold theme-text-primary transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-60 theme-text-secondary ml-1">First Message (Optional)</label>
                        <textarea
                            placeholder="Type your first message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-gray-800 rounded-2xl py-4 px-4 font-medium theme-text-primary transition-all shadow-inner h-32 resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 font-black shadow-glow transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                    >
                        <span>START CHAT</span>
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
