"use client";

import React from 'react';
import { MessageSquare, Plus, Tag } from 'lucide-react';

interface SidebarActionsProps {
    onBulkMessage: () => void;
    onNewTemplate: () => void;
    onManageTags: () => void;
}

export const SidebarActions: React.FC<SidebarActionsProps> = ({
    onBulkMessage,
    onNewTemplate,
    onManageTags
}) => {
    return (
        <div className="px-4 py-2 flex items-center justify-center space-x-3 border-b theme-border-primary">
            <button
                onClick={onBulkMessage}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                title="Send Bulk Message"
            >
                <MessageSquare className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Bulk</span>
            </button>
            <button
                onClick={onNewTemplate}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                title="New Message Template"
            >
                <Plus className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Template</span>
            </button>
            <button
                onClick={onManageTags}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Manage Tags"
            >
                <Tag className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Tags</span>
            </button>
        </div>
    );
};
