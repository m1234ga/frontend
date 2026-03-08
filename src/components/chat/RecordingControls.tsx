"use client";

import React from 'react';
import { Trash2, Pause, Play, Send, Mic, Square } from 'lucide-react';

interface RecordingControlsProps {
  recordingState: 'idle' | 'recording' | 'paused' | 'reviewing';
  recordingDuration: number;
  isPlayingPreview: boolean;
  onPause: () => void;
  onStop: () => void;
  onResume: () => void;
  onTogglePreview: () => void;
  onRecordAgain: () => void;
  onSend: () => void;
  onCancel: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  recordingDuration,
  isPlayingPreview,
  onPause,
  onStop,
  onResume,
  onTogglePreview,
  onRecordAgain,
  onSend,
  onCancel
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tech-header p-4">
      <div className="flex items-center justify-between w-full space-x-4">
        {/* Left: Delete / Cancel */}
        <button
          onClick={onCancel}
          className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-full transition-colors"
          title="Delete Recording"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        {/* Center: Timer / Status */}
        <div className="flex items-center space-x-3 flex-1 justify-center">
          {recordingState === 'recording' && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          <span className="font-mono text-lg font-medium text-gray-700 dark:text-gray-200">
            {formatTime(recordingDuration)}
          </span>
          {recordingState === 'paused' && (
            <span className="text-xs text-yellow-500 font-medium uppercase tracking-wider">Paused</span>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-2">
          {recordingState === 'recording' ? (
            <button
              onClick={onStop}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg animate-pulse"
              title="Stop & Review"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : recordingState === 'paused' ? (
            <button
              onClick={onResume}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Mic className="w-5 h-5 text-red-500" />
            </button>
          ) : recordingState === 'reviewing' ? (
            <button
              onClick={onTogglePreview}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              {isPlayingPreview ? (
                <Pause className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Play className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          ) : null}

          {/* Send Button - Only if reviewing */}
          {recordingState === 'reviewing' && (
            <button
              onClick={onSend}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors shadow-lg"
              title="Send Voice Message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingControls;
