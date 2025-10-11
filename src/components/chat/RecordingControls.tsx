"use client";

import React from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

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
  return (
    <div className="flex justify-end">
  <div className={`bg-white dark:bg-gray-900 backdrop-blur-sm px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg recording-state-indicator`}>
        {recordingState === 'recording' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-900 dark:text-white text-sm font-medium">Recording</span>
            </div>
            <div className="text-gray-900 dark:text-white text-sm font-mono recording-timer">
              {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex space-x-2">
              <button onClick={onPause} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full recording-control-button" title="Pause"><Pause className="w-4 h-4 text-gray-900 dark:text-white" /></button>
              <button onClick={onStop} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full recording-control-button" title="Stop"><Square className="w-4 h-4 text-gray-900 dark:text-white" /></button>
            </div>
          </div>
        )}

        {recordingState === 'paused' && (
          <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-900 dark:text-white text-sm font-medium">Paused</span>
            </div>
            <div className="text-gray-900 dark:text-white text-sm font-mono recording-timer">
              {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex space-x-2">
              <button onClick={onResume} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full recording-control-button" title="Resume"><Play className="w-4 h-4 text-gray-900 dark:text-white" /></button>
              <button onClick={onStop} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full recording-control-button" title="Stop"><Square className="w-4 h-4 text-gray-900 dark:text-white" /></button>
            </div>
          </div>
        )}

        {recordingState === 'reviewing' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-300 text-sm font-medium">Review Recording</span>
            </div>
            <div className="text-gray-900 dark:text-white text-sm font-mono recording-timer">
              {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex space-x-2">
              <button onClick={onTogglePreview} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full recording-control-button" title={isPlayingPreview ? 'Pause' : 'Play'}>
                {isPlayingPreview ? <Pause className="w-4 h-4 text-gray-900 dark:text-white"/> : <Play className="w-4 h-4 text-gray-900 dark:text-white"/>}
              </button>
              <button onClick={onRecordAgain} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full recording-control-button" title="Record Again"><RotateCcw className="w-4 h-4 text-gray-900 dark:text-white" /></button>
              <button onClick={onSend} className="p-2 bg-gray-900 text-white rounded-full recording-control-button hover:bg-black" title="Send">Send</button>
              <button onClick={onCancel} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full recording-control-button" title="Cancel">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingControls;
