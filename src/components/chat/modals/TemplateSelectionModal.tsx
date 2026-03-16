'use client';

import React, { useState, useCallback } from 'react';
import { X, FileText, Image as ImageIcon, Loader2, Send } from 'lucide-react';

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  imageUrl?: string;
  mediaPath?: string;
  createdBy?: string;
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MessageTemplate[];
  isLoading?: boolean;
  onSelectTemplate: (template: MessageTemplate) => Promise<void> | void;
}

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  templates,
  isLoading = false,
  onSelectTemplate,
}) => {
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  const handleSelectTemplate = useCallback(async (template: MessageTemplate) => {
    setPendingTemplateId(template.id);
    try {
      await onSelectTemplate(template);
      onClose();
    } finally {
      setPendingTemplateId(null);
    }
  }, [onClose, onSelectTemplate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-cyan-500/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500 rounded-lg shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Template</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No templates available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  disabled={pendingTemplateId !== null}
                  className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-cyan-50 dark:hover:bg-gray-800 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {template.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {(template.imageUrl || template.mediaPath) && (
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded">
                          <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                      )}
                      {pendingTemplateId === template.id ? (
                        <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded">
                          <Loader2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <Send className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
