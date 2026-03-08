"use client";

import React from 'react';
import { Tag, X } from 'lucide-react';
import { ChatTag } from '../../../../Shared/Models';

interface TagFilterBarProps {
    availableTags: ChatTag[];
    selectedTagId: string | null;
    onTagToggle: (tagId: string) => void;
    onClear: () => void;
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({
    availableTags,
    selectedTagId,
    onTagToggle,
    onClear
}) => {
    const getTagId = (tag: ChatTag) => tag.tagId ?? (tag as unknown as { id?: string }).id ?? '';
    const getTagName = (tag: ChatTag) => tag.tagName ?? (tag as unknown as { name?: string }).name ?? 'Tag';

    if (availableTags.length === 0) return null;

    return (
        <div className="p-4 border-b theme-border-primary overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] uppercase tracking-wider font-bold theme-text-secondary opacity-60">
                    Filter by Tags
                </h3>
                {selectedTagId && (
                    <button
                        onClick={onClear}
                        className="flex items-center space-x-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
                    >
                        <X className="w-2.5 h-2.5" />
                        <span>CLEAR</span>
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto no-scrollbar pb-1">
                {availableTags.map((tag) => (
                    <button
                        key={getTagId(tag)}
                        onClick={() => onTagToggle(getTagId(tag))}
                        className={`group relative flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${selectedTagId === getTagId(tag)
                                ? 'bg-gray-900 border-gray-900 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 theme-text-secondary hover:border-gray-400 dark:hover:border-gray-600'
                            }`}
                        style={selectedTagId === getTagId(tag) ? { backgroundColor: tag.color, borderColor: tag.color } : { borderColor: `${tag.color}40` }}
                    >
                        <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: selectedTagId === getTagId(tag) ? 'white' : tag.color }}
                        />
                        <span>{getTagName(tag)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
