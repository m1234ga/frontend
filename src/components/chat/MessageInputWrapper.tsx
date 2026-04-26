"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import MessageInput from './MessageInput';
import { ChatMessage, Chat as ChatModel } from '../../../../Shared/Models';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'react-hot-toast';

const normalizeOutgoingPhone = (chatId: string, phone?: string): string => {
    const rawChatId = (chatId || '').trim();
    const rawPhone = (phone || '').trim();
    const base = (rawPhone || rawChatId).replace(/@[^@]+$/, '');
    const isGroup = rawPhone.endsWith('@g.us') || rawChatId.endsWith('@g.us') || rawChatId.includes('-');

    if (!base) return '';
    if (isGroup) return `${base}@g.us`;
    if (rawPhone) return rawPhone;
    return `${base}@s.whatsapp.net`;
};
import RecordingControls from './RecordingControls';
import { FilePreviewModal } from './modals/FilePreviewModal';
import { TemplateManagerModal } from './modals/TemplateManagerModal';
import { type MessageTemplate } from './modals/TemplateSelectionModal';
import { useChatApi } from '@/hooks/useChatData';

interface ChatTagOption {
    id: string;
    name: string;
}

interface AssignableUserOption {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
}

const normalizeTemplateShortcut = (value: string): string =>
    value
        .normalize('NFKC')
        .toLocaleLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '');

const isTemplateSlashCommand = (value: string): boolean =>
    /^\/(?:template|templates|tpl)(?:\s|$)|^\/t(?:\s|$)/i.test(value.trim());

interface MessageInputWrapperProps {
    onSend: (content: string) => void;
    replyToMessage?: ChatMessage | null;
    onCancelReply?: () => void;
    disabled?: boolean;
    selectedConversation: ChatModel;
    onOpenTemplates?: () => void;
    onAssignChat?: (query?: string) => Promise<boolean> | boolean;
    onCloseChat?: (reason?: string) => Promise<boolean> | boolean;
    onTagChat?: (tagName?: string) => Promise<boolean> | boolean;
}

export const MessageInputWrapper: React.FC<MessageInputWrapperProps> = ({
    onSend,
    replyToMessage,
    onCancelReply,
    disabled,
    selectedConversation,
    onOpenTemplates,
    onAssignChat,
    onCloseChat,
    onTagChat
}) => {
    const chatRouter = useChatApi();
    const [newMessage, setNewMessage] = useState('');
    const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [tags, setTags] = useState<ChatTagOption[]>([]);
    const [assignableUsers, setAssignableUsers] = useState<AssignableUserOption[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'reviewing'>('idle');
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [filePreview, setFilePreview] = useState<File | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [waveform, setWaveform] = useState<number[]>([]);

    // File inputs refs
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    // Recording refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

    // Waveform refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const waveformDataRef = useRef<number[]>([]);
    const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Timer effect for recording duration and waveform collection
    useEffect(() => {
        if (recordingState === 'recording') {
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            // Collect waveform data
            waveformIntervalRef.current = setInterval(() => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);

                    // Simple average volume calculation
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;

                    // Normalize to approximately 0-100 range (255 is max byte value)
                    const normalized = Math.min(100, Math.round((average / 255) * 100));
                    waveformDataRef.current.push(normalized);
                }
            }, 100); // Sample every 100ms
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
        };
    }, [recordingState]);

    // Cleanup audio preview on unmount
    useEffect(() => {
        return () => {
            if (audioPreviewRef.current) {
                audioPreviewRef.current.pause();
                audioPreviewRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const { socket, emitTyping } = useSocket();

    const ensureTemplatesLoaded = useCallback(async () => {
        if (templates.length > 0) {
            return templates;
        }

        setIsLoadingTemplates(true);
        try {
            const data = await chatRouter.GetMessageTemplates();
            const nextTemplates = Array.isArray(data) ? data as MessageTemplate[] : [];
            setTemplates(nextTemplates);
            return nextTemplates;
        } catch (error) {
            console.error('Error fetching templates:', error);
            setTemplates([]);
            toast.error('Failed to load templates');
            return [] as MessageTemplate[];
        } finally {
            setIsLoadingTemplates(false);
        }
    }, [chatRouter, templates]);

    const ensureTagsLoaded = useCallback(async () => {
        if (tags.length > 0) {
            return tags;
        }

        try {
            const data = await chatRouter.GetTags();
            const nextTags = Array.isArray(data)
                ? data.map((tag: unknown) => {
                    const item = tag as { tagId?: string; id?: string; tagName?: string; name?: string };
                    return {
                        id: String(item.tagId || item.id || ''),
                        name: String(item.tagName || item.name || ''),
                    };
                }).filter((tag) => tag.id && tag.name)
                : [];
            setTags(nextTags);
            return nextTags;
        } catch (error) {
            console.error('Error fetching tags:', error);
            return [] as ChatTagOption[];
        }
    }, [chatRouter, tags]);

    const ensureUsersLoaded = useCallback(async () => {
        if (assignableUsers.length > 0) {
            return assignableUsers;
        }

        try {
            const data = await chatRouter.GetUsers();
            const users = Array.isArray(data) ? data as AssignableUserOption[] : [];
            setAssignableUsers(users);
            return users;
        } catch (error) {
            console.error('Error fetching assignable users:', error);
            return [] as AssignableUserOption[];
        }
    }, [assignableUsers, chatRouter]);

    const loadTemplateIntoComposer = useCallback((template: MessageTemplate) => {
        setNewMessage(template.content || '');
        setActiveTemplateName(template.name || null);
        if (template.imageUrl || template.mediaPath) {
            toast('Loaded template text only. Media is not inserted into the composer.');
        } else {
            toast.success('Template loaded. Edit before sending.');
        }
    }, []);

    const templateShortcuts = useMemo(
        () => templates
            .map((template) => {
                const command = normalizeTemplateShortcut(template.name);
                return {
                    key: `/template ${command}`,
                    label: `Send template: ${template.name}`,
                    insert: `/template ${command}`,
                };
            }),
        [templates]
    );

    const tagShortcuts = useMemo(
        () => tags.map((tag) => {
            const normalizedTag = normalizeTemplateShortcut(tag.name);
            return {
                key: `/tag ${normalizedTag}`,
                label: `Apply tag: ${tag.name}`,
                insert: `/tag ${normalizedTag}`,
            };
        }),
        [tags]
    );

    const slashShortcuts = useMemo(
        () => {
            const assignShortcuts = assignableUsers
                .filter((user) => Boolean(user.username))
                .map((user) => ({
                    key: `/assign ${user.username.toLowerCase()}`,
                    label: `Assign to: ${user.firstName || ''} ${user.lastName || ''}`.trim() || `Assign to: ${user.username}`,
                    insert: `/assign ${user.username}`,
                }));

            return [...templateShortcuts, ...tagShortcuts, ...assignShortcuts];
        },
        [assignableUsers, tagShortcuts, templateShortcuts]
    );

    const resolveTemplateCommand = useCallback(async (input: string) => {
        const trimmed = input.trim();
        const lowered = trimmed.toLowerCase();

        if (['/template', '/templates', '/tpl', '/t'].includes(lowered)) {
            toast('Pick a template command from slash list, e.g. /template welcome');
            return true;
        }

        const match = trimmed.match(/^\/(?:template|templates|tpl|t)\s+(.+)$/i);
        if (!match) {
            return false;
        }

        const shortcut = normalizeTemplateShortcut(match[1]);
        const availableTemplates = await ensureTemplatesLoaded();
        const template = availableTemplates.find((item) => normalizeTemplateShortcut(item.name) === shortcut);

        if (!template) {
            toast.error('Template shortcut not found');
            return true;
        }

        loadTemplateIntoComposer(template);
        return true;
    }, [ensureTemplatesLoaded, loadTemplateIntoComposer]);

    useEffect(() => {
        void ensureTemplatesLoaded();
    }, [ensureTemplatesLoaded]);

    useEffect(() => {
        const trimmed = newMessage.trim().toLowerCase();
        if (!trimmed.startsWith('/tag')) {
            return;
        }

        void ensureTagsLoaded();
    }, [ensureTagsLoaded, newMessage]);

    useEffect(() => {
        const trimmed = newMessage.trim().toLowerCase();
        if (!trimmed.startsWith('/assign')) {
            return;
        }

        void ensureUsersLoaded();
    }, [ensureUsersLoaded, newMessage]);

    useEffect(() => {
        const trimmed = newMessage.trim().toLowerCase();
        if (!isTemplateSlashCommand(trimmed)) {
            return;
        }

        void ensureTemplatesLoaded();
    }, [ensureTemplatesLoaded, newMessage]);

    const handleSend = () => {
        const trimmed = newMessage.trim();
        if (!trimmed || disabled) return;

        if (isTemplateSlashCommand(trimmed)) {
            void resolveTemplateCommand(trimmed)
                .then((handled) => {
                    if (!handled) {
                        return;
                    }
                    emitTyping(selectedConversation.id, false);
                })
                .catch(() => {
                    emitTyping(selectedConversation.id, false);
                });
            return;
        }

        if (trimmed.startsWith('/note ')) {
            onSend(`📝 ${trimmed.replace('/note', '').trim()}`);
            setNewMessage('');
            emitTyping(selectedConversation.id, false);
            return;
        }

        if (trimmed.startsWith('/close')) {
            const reason = trimmed.replace(/^\/close\s*/i, '').replace(/^reason:\s*/i, '').trim();
            void Promise.resolve(onCloseChat?.(reason)).then((handled) => {
                if (!handled) {
                    return;
                }
                setNewMessage('');
                emitTyping(selectedConversation.id, false);
            });
            return;
        }

        if (trimmed.startsWith('/assign')) {
            const assignee = trimmed.replace(/^\/assign\s*/i, '').replace(/^@/, '').trim();
            void Promise.resolve(onAssignChat?.(assignee)).then((handled) => {
                if (!handled) {
                    return;
                }
                setNewMessage('');
                emitTyping(selectedConversation.id, false);
            });
            return;
        }

        if (trimmed.startsWith('/tag')) {
            const tagName = trimmed.replace(/^\/tag\s*/i, '').replace(/^#/, '').trim();
            void Promise.resolve(onTagChat?.(tagName)).then((handled) => {
                if (!handled) {
                    return;
                }
                setNewMessage('');
                emitTyping(selectedConversation.id, false);
            });
            return;
        }

        if (trimmed.startsWith('/location')) {
            const match = trimmed.match(/^\/location\s+(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s+(.+))?$/i);
            if (!match || !socket) {
                toast.error('Usage: /location <lat>,<lng> [name]');
                return;
            }

            const latitude = Number(match[1]);
            const longitude = Number(match[2]);
            const name = (match[3] || '').trim();
            const targetPhone = normalizeOutgoingPhone(selectedConversation.id, selectedConversation.phone);

            socket.emit('send_location', {
                chatId: selectedConversation.id,
                phone: targetPhone,
                latitude,
                longitude,
                name,
                messageText: name ? `[Location] ${name}` : '',
                replyToId: replyToMessage?.id,
            });

            setNewMessage('');
            emitTyping(selectedConversation.id, false);
            if (replyToMessage) onCancelReply?.();
            return;
        }

        if (trimmed.startsWith('/contact')) {
            const payload = trimmed.replace(/^\/contact\s*/i, '').trim();
            const [rawName, rawPhone] = payload.split('|').map((value) => (value || '').trim());
            if (!rawName || !rawPhone || !socket) {
                toast.error('Usage: /contact <name>|<phone>');
                return;
            }

            const targetPhone = normalizeOutgoingPhone(selectedConversation.id, selectedConversation.phone);
            const safeName = rawName.replace(/\n/g, ' ').trim();
            const safePhone = rawPhone.replace(/\s+/g, ' ').trim();
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${safeName};;;;\nFN:${safeName}\nTEL;type=CELL:${safePhone}\nEND:VCARD`;

            socket.emit('send_contact', {
                chatId: selectedConversation.id,
                phone: targetPhone,
                contactName: safeName,
                vcard,
                messageText: `[Contact] ${safeName}`,
                replyToId: replyToMessage?.id,
            });

            setNewMessage('');
            emitTyping(selectedConversation.id, false);
            if (replyToMessage) onCancelReply?.();
            return;
        }

        if (trimmed.startsWith('/poll')) {
            const payload = trimmed.replace(/^\/poll\s*/i, '').trim();
            const segments = payload.split('|').map((value) => value.trim()).filter(Boolean);
            if (segments.length < 3 || !socket) {
                toast.error('Usage: /poll <question>|<option1>|<option2>[|option3...]');
                return;
            }

            const [pollName, ...options] = segments;
            const targetPhone = normalizeOutgoingPhone(selectedConversation.id, selectedConversation.phone);

            socket.emit('send_poll', {
                id: Date.now().toString(),
                chatId: selectedConversation.id,
                phone: targetPhone,
                pollName,
                options,
                selectableCount: 1,
                messageText: `[Poll] ${pollName}`,
                replyToId: replyToMessage?.id,
            });

            setNewMessage('');
            emitTyping(selectedConversation.id, false);
            if (replyToMessage) onCancelReply?.();
            return;
        }

        onSend(trimmed);
        setNewMessage('');
        setActiveTemplateName(null);
        emitTyping(selectedConversation.id, false);
    };

    const handleAttachImage = () => {
        imageInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFilePreview(file);
            setIsPreviewOpen(true);
        }
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleAttachVideo = () => {
        videoInputRef.current?.click();
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFilePreview(file);
            setIsPreviewOpen(true);
        }
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    const handleAttachDocument = () => {
        documentInputRef.current?.click();
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFilePreview(file);
            setIsPreviewOpen(true);
        }
        if (documentInputRef.current) documentInputRef.current.value = '';
    };

    const handleSendFile = async (file: File, caption: string) => {
        if (!selectedConversation || !socket) return;
        const targetPhone = normalizeOutgoingPhone(selectedConversation.id, selectedConversation.phone);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];

            if (file.type.startsWith('image/')) {
                socket.emit('send_image', {
                    chatId: selectedConversation.id,
                    phone: targetPhone,
                    image: base64Data,
                    caption: caption,
                    replyToId: replyToMessage?.id,
                    filename: file.name,
                    mimetype: file.type
                });
            } else if (file.type.startsWith('video/')) {
                socket.emit('send_video', {
                    chatId: selectedConversation.id,
                    phone: targetPhone,
                    video: base64Data,
                    caption: caption,
                    replyToId: replyToMessage?.id,
                    filename: file.name,
                    mimetype: file.type
                });
            } else {
                socket.emit('send_document', {
                    chatId: selectedConversation.id,
                    phone: targetPhone,
                    documentData: base64Data,
                    caption: caption,
                    replyToId: replyToMessage?.id,
                    filename: file.name,
                    mimetype: file.type || 'application/octet-stream'
                });
            }
            if (replyToMessage) onCancelReply?.();
        };

        setIsPreviewOpen(false);
        setFilePreview(null);
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Initialize AudioContext for waveform analysis
            const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('AudioContext is not supported in this browser');
            }
            const audioContext = new AudioContextClass();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            waveformDataRef.current = [];

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setRecordingState('reviewing');
                setWaveform([...waveformDataRef.current]);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Close audio context
                if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close().catch(e => console.error("Error closing context", e));
                    audioContextRef.current = null;
                }
            };

            mediaRecorder.start();
            setRecordingState('recording');
            setRecordingDuration(0);

            // Handle global mouse release
            const handleGlobalMouseUp = () => {
                if (mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
                document.removeEventListener('mouseup', handleGlobalMouseUp);
            };
            document.addEventListener('mouseup', handleGlobalMouseUp);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not start recording. Please check microphone permissions.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handlePauseRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.pause();
            setRecordingState('paused');
            if (audioContextRef.current) audioContextRef.current.suspend();
        }
    };

    const handleResumeRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'paused') {
            mediaRecorderRef.current.resume();
            setRecordingState('recording');
            if (audioContextRef.current) audioContextRef.current.resume();
        }
    };

    const handleCancelRecording = () => {
        if (mediaRecorderRef.current) {
            // Remove onstop handler to prevent auto-switching to review
            mediaRecorderRef.current.onstop = null;
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(e => console.error(e));
            audioContextRef.current = null;
        }

        setRecordingState('idle');
        setRecordingDuration(0);
        setAudioBlob(null);
        setWaveform([]);
        waveformDataRef.current = [];
        setIsPlayingPreview(false);
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current = null;
        }
    };

    const handleTogglePreview = () => {
        if (!audioBlob) return;

        if (isPlayingPreview) {
            audioPreviewRef.current?.pause();
            setIsPlayingPreview(false);
        } else {
            if (!audioPreviewRef.current) {
                const url = URL.createObjectURL(audioBlob);
                audioPreviewRef.current = new Audio(url);
                audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
            }
            audioPreviewRef.current.play();
            setIsPlayingPreview(true);
        }
    };

    const handleSendRecording = async () => {
        if (!audioBlob || !selectedConversation || !socket) return;
        const targetPhone = normalizeOutgoingPhone(selectedConversation.id, selectedConversation.phone);

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1];

            const messageData = {
                chatId: selectedConversation.id,
                phone: targetPhone,
                audioData: base64Audio,
                seconds: recordingDuration,
                waveform: waveform,
                replyToId: replyToMessage?.id,
                filename: 'voice-message.ogg',
                mimetype: 'audio/ogg'
            };

            socket.emit('send_audio_message', messageData);

            if (replyToMessage) onCancelReply?.();
            handleCancelRecording();
        };
    };

    const handleTypingChange = (isTyping: boolean) => {
        if (!selectedConversation?.id) return;
        emitTyping(selectedConversation.id, isTyping);
    };

    return (
        <div>
            {/* Hidden file inputs */}
            <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoChange}
                accept="video/*"
                className="hidden"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={documentInputRef}
                onChange={handleDocumentChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/*,text/*"
                className="hidden"
                style={{ display: 'none' }}
            />

            <FilePreviewModal
                isOpen={isPreviewOpen}
                onClose={() => {
                    setIsPreviewOpen(false);
                    setFilePreview(null);
                }}
                file={filePreview}
                onSend={handleSendFile}
            />

            <TemplateManagerModal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                chatRouter={chatRouter}
                onSelect={(content) => {
                    setNewMessage(content || '');
                    setShowTemplateModal(false);
                }}
            />

            {replyToMessage && recordingState === 'idle' && (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Replying to {replyToMessage.isFromMe ? (replyToMessage.sender || 'user') : (replyToMessage.sender || replyToMessage.pushName || 'contact')}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {replyToMessage.message || '[Media]'}
                            </p>
                        </div>
                        <button
                            onClick={onCancelReply}
                            className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {recordingState !== 'idle' ? (
                <RecordingControls
                    recordingState={recordingState}
                    recordingDuration={recordingDuration}
                    isPlayingPreview={isPlayingPreview}
                    onPause={handlePauseRecording}
                    onStop={handleStopRecording} // Stop leads to review
                    onResume={handleResumeRecording}
                    onTogglePreview={handleTogglePreview}
                    onRecordAgain={() => {
                        handleCancelRecording();
                        handleStartRecording();
                    }}
                    onSend={handleSendRecording}
                    onCancel={handleCancelRecording}
                />
            ) : (
                <MessageInput
                    newMessage={newMessage}
                    onChange={(value) => {
                        setNewMessage(value);
                        if (!value.trim()) {
                            setActiveTemplateName(null);
                        }
                    }}
                    onSend={handleSend}
                    onTypingChange={handleTypingChange}
                    onAttachImage={handleAttachImage}
                    onAttachVideo={handleAttachVideo}
                    onAttachDocument={handleAttachDocument}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    isRecording={false} // We handle recording UI separately now
                    onOpenTemplates={() => {
                        setNewMessage('/template ');
                        setActiveTemplateName(null);
                        onOpenTemplates?.();
                    }}
                    templateShortcuts={slashShortcuts}
                    activeTemplateName={activeTemplateName}
                    onClearTemplateName={() => setActiveTemplateName(null)}
                />
            )}
        </div>
    );
};
