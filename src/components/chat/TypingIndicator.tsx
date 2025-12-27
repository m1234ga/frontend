"use client";

import React from 'react';

interface TypingIndicatorProps {
    className?: string;
    dotClassName?: string;
    text?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    className = "flex items-center space-x-1",
    dotClassName = "bg-soft-primary",
    text = ""
}) => {
    return (
        <div className={className}>
            {text && <span className="mr-1">{text}</span>}
            <div className="flex space-x-1 items-center h-full pt-1">
                <span className={`typing-dot ${dotClassName}`}></span>
                <span className={`typing-dot ${dotClassName}`}></span>
                <span className={`typing-dot ${dotClassName}`}></span>
            </div>
        </div>
    );
};

export default TypingIndicator;
