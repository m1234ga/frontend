"use client";

import React from 'react';
import { TempMessage } from '@/types/chat';
import { Edit3, Send, Trash2, Mic, MapPin } from 'lucide-react';

interface TempMessagesProps {
  tempMessages: TempMessage[];
  showTempMessages: boolean;
  onToggleShow: () => void;
  onEdit: (id: string) => void;
  onSend: (temp: TempMessage) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  onSave: (id: string, content: string) => void;
}

const TempMessages: React.FC<TempMessagesProps> = ({ tempMessages, showTempMessages, onToggleShow, onEdit, onSend, onDelete, editingId, onSave }) => {
  return (
    <div className="px-4 py-2 border-t border-gray-600/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">Draft Messages</h3>
        <button onClick={onToggleShow} className="text-xs text-gray-400 hover:text-gray-200 transition-colors">{showTempMessages ? 'Hide' : 'Show'} ({tempMessages.length})</button>
      </div>

      {showTempMessages && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {tempMessages.map((tempMsg) => (
            <div key={tempMsg.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {tempMsg.type === 'text' && (<div className="text-sm text-gray-200">{tempMsg.content}</div>)}
                  {tempMsg.type === 'image_caption' && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-200">{tempMsg.content}</div>
                      {tempMsg.imageData && (<img src={`data:image/jpeg;base64,${tempMsg.imageData}`} alt="Draft image" className="w-20 h-20 object-cover rounded" />)}
                    </div>
                  )}
                  {tempMsg.type === 'audio' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center"><Mic className="w-4 h-4 text-blue-300"/></div>
                      <span className="text-sm text-gray-200">Audio Recording</span>
                    </div>
                  )}
                  {tempMsg.type === 'location' && (
                    <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-green-300"/><span className="text-sm text-gray-200">{tempMsg.location?.address}</span></div>
                  )}

                  <div className="flex items-center space-x-1 mt-1"><span className="text-xs text-gray-400">{tempMsg.timestamp.toLocaleTimeString()}</span>{tempMsg.isDraft && (<span className="text-xs text-orange-400 ml-2">Draft</span>)}</div>
                </div>

                <div className="flex space-x-1 ml-2">
                  {tempMsg.isDraft && (<button onClick={() => onEdit(tempMsg.id)} className="p-1 hover:bg-gray-600/50 rounded transition-colors" title="Edit"><Edit3 className="w-3 h-3 text-gray-400"/></button>)}
                  <button onClick={() => onSend(tempMsg)} className="p-1 hover:bg-green-600/50 rounded transition-colors" title="Send"><Send className="w-3 h-3 text-green-400"/></button>
                  <button onClick={() => onDelete(tempMsg.id)} className="p-1 hover:bg-red-600/50 rounded transition-colors" title="Delete"><Trash2 className="w-3 h-3 text-red-400"/></button>
                </div>
              </div>

              {editingId === tempMsg.id && (
                <div className="mt-2 flex space-x-2">
                  <input type="text" defaultValue={tempMsg.content} data-temp-id={tempMsg.id} className="flex-1 px-2 py-1 text-sm bg-gray-600 border border-gray-500 rounded text-white" onKeyPress={(e) => { if (e.key === 'Enter') { onSave(tempMsg.id, (e.target as HTMLInputElement).value); } }} autoFocus />
                  <button onClick={() => onSave(tempMsg.id, (document.querySelector(`input[data-temp-id="${tempMsg.id}"]`) as HTMLInputElement)?.value || tempMsg.content)} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white">Save</button>
                  <button onClick={() => onEdit('')} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TempMessages;
