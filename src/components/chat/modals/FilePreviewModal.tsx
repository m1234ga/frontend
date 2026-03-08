import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    onSend: (file: File, caption: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
    isOpen,
    onClose,
    file,
    onSend
}) => {
    const [caption, setCaption] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setCaption('');
    }, [file]);

    if (!isOpen || !file) return null;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    const handleSend = () => {
        onSend(file, caption);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Send {isImage ? 'Image' : isVideo ? 'Video' : 'File'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content Preview */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-black/50 flex items-center justify-center min-h-[300px]">
                    {previewUrl && (
                        <>
                            {isImage && (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                                />
                            )}
                            {isVideo && (
                                <video
                                    src={previewUrl}
                                    controls
                                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Footer with Caption Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Add a caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
