"use client";

import React from 'react';
import { Smile, Image as ImageIcon, Mic, Video, Send } from 'lucide-react';

interface MessageInputProps {
  newMessage: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onAttachImage: () => void;
  onAttachVideo: () => void;
  onStartRecording: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  onToggleTempMessages?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ newMessage, onChange, onSend, onAttachImage, onAttachVideo, onStartRecording, onStopRecording, isRecording, onToggleTempMessages }) => {
  return (
    <div className="tech-header p-4">
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"><Smile className="w-5 h-5 theme-text-accent" /></button>
  <button onClick={onAttachImage} className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"><ImageIcon className="w-5 h-5 text-cyan-300" aria-hidden="true"/></button>
        <button onClick={onAttachVideo} className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"><Video className="w-5 h-5 text-cyan-300" /></button>
        <button
          onMouseDown={onStartRecording}
          onMouseUp={onStopRecording}
          onMouseLeave={onStopRecording}
          onTouchStart={onStartRecording}
          onTouchEnd={onStopRecording}
          aria-pressed={isRecording}
          className={`p-2 rounded-full transition-colors focus:outline-none ${isRecording ? 'bg-gray-900 text-white shadow-lg transform scale-95' : 'recording-button hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          title="Hold to record"
        >
          <Mic className="w-5 h-5" />
        </button>
        <button onClick={onToggleTempMessages} className="p-2 hover:bg-gray-500/20 rounded-full transition-colors" title="Drafts">Drafts</button>
        <div className="flex-1">
          <input type="text" value={newMessage} onChange={(e) => onChange(e.target.value)} placeholder="Type a message..." className="chat-input w-full px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400" />
        </div>
        <button onClick={onSend} disabled={!newMessage.trim()} className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"><Send className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

export default MessageInput;
