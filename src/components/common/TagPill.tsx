"use client";

import React from 'react';

interface TagPillProps {
  id: string;
  name: string;
  color?: string;
  selected?: boolean;
  onClick?: (id: string) => void;
}

export const TagPill: React.FC<TagPillProps> = ({ id, name, color, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick && onClick(id)}
      className={`px-3 py-1.5 text-xs hover:opacity-90 rounded-full transition-colors border ${selected ? 'bg-cyan-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
      style={{ borderColor: selected ? color || undefined : undefined, backgroundColor: selected ? color || undefined : undefined }}
    >
      {name}
    </button>
  );
};

export default TagPill;
