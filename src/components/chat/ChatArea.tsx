'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Heart, FileText, Star, User, Search, Plus, Image as ImageIcon } from 'lucide-react';
import { EmptyArea } from '@/components/chat/EmptyArea';
import { toast } from 'react-hot-toast';
import MessageList from './MessageList';
import RecordingControls from './RecordingControls';
import { ChatMessage } from '../../../../Shared/Models';
import { ForwardModal } from '@/components/chat/ForwardModal';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import Chat from './ChatRouters';
import ChatCloseModal from '@/components/common/ChatCloseModal';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';

// TempMessage type is imported from '@/types/chat'

interface ChatAreaProps {
  selectedConversation: ChatModel | null;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onNewMessage?: (message: ChatMessage) => void;
  onMessageUpdate?: (message: ChatMessage & { tempId?: string }) => void;
  conversations?: ChatModel[];
  onLoadMoreMessages?: () => Promise<boolean>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  selectedConversation,
  messages,
  onSendMessage,
  onNewMessage,
  onMessageUpdate,
  conversations = [],
  onLoadMoreMessages
}) => {
  const [newMessage, setNewMessage] = useState('');
  // typing indicator tracked via typingUsers set
  // We track typing users in `typingUsers`. Keep a noop setter to satisfy existing call sites.
  const setIsTyping = (_val: boolean) => { void _val; /* noop, typingUsers set is authoritative */ };
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'reviewing'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

  const [showFavoritesPopup, setShowFavoritesPopup] = useState(false);
  const [favoriteMessages, setFavoriteMessages] = useState<ChatMessage[]>([]);
  const [showTemplatePopup, setShowTemplatePopup] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerPosition, setReactionPickerPosition] = useState({ x: 0, y: 0 });
  const [messageToReact, setMessageToReact] = useState<ChatMessage | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ id: number, name: string, content: string }[]>([]);
  const [showCreateTemplateForm, setShowCreateTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [newTemplateImage, setNewTemplateImage] = useState<File | null>(null);
  const [newTemplateImagePreview, setNewTemplateImagePreview] = useState<string | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const templateImageInputRef = useRef<HTMLInputElement>(null);
  const [chatStatus, setChatStatus] = useState<'open' | 'closed'>(selectedConversation?.status || 'open');
  const [showCloseModal, setShowCloseModal] = useState(false);
  // close reason: choose a single tag from available tags
  const [availableCloseTags, setAvailableCloseTags] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [selectedCloseTagId, setSelectedCloseTagId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; username: string; firstName?: string; lastName?: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isLoadingMoreRef = useRef(false);
  const prevMessagesRef = useRef<ChatMessage[]>([]);

  const { joinConversation, leaveConversation, onNewMessage: onSocketNewMessage, onMessageUpdate: onSocketMessageUpdate, onUserTyping, onChatPresence, socket } = useSocket();
  const { user, token } = useAuth();
  const chatRouter = useMemo(() => Chat(token || ""), [token]);

  // Update chat status when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setChatStatus(selectedConversation.status || 'open');
    }
  }, [selectedConversation]);

  // Helper function to format time. Accepts a Date, ISO string, number, or objects with `timestamp`.
  const formatTime = (input?: string | Date | number | { timestamp?: string | Date | number }) => {
    try {
      let dateVal: string | Date | number | undefined = undefined;
      if (!input) return '';
      if (typeof input === 'object' && 'timestamp' in input) {
        dateVal = (input as { timestamp?: string | Date | number }).timestamp;
      } else {
        dateVal = input as string | Date | number;
      }
      const date = new Date(String(dateVal));
      const timezone = process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Cairo';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });
    } catch {
      return '';
    }
  };

  // Handle status button click
  const handleStatusButtonClick = () => {
    if (chatStatus === 'open') {
      // Show modal to get reason before closing
      setShowCloseModal(true);
    } else {
      // Reopen chat directly
      handleToggleChatStatus('open', '');
    }
  };

  // Toggle chat status (open/closed)
  const handleToggleChatStatus = async (newStatus: 'open' | 'closed', reason: string) => {
    if (!selectedConversation) return;

    try {
      await chatRouter.UpdateChatStatus(selectedConversation.id, newStatus, reason);
      setChatStatus(newStatus);
      // Update conversation in parent component
      if (selectedConversation) {
        selectedConversation.status = newStatus;
      }
      // Close modal and reset selected tag
      setShowCloseModal(false);
      setSelectedCloseTagId(null);
    } catch (error) {
      console.error('Error toggling chat status:', error);
      alert('Failed to update chat status. Please try again.');
    }
  };

  // Load available close tags when showing close modal
  useEffect(() => {
    if (!showCloseModal) return;
    const loadTags = async () => {
      try {
        // Try to fetch tags from API; fallback to default list if fails
        const tags = await chatRouter.GetTags();
        type TagApiItem = { tagId?: number | string; id?: number | string; tagName?: string; name?: string };
        const formatted = (tags || []).map((t: TagApiItem) => ({ id: t.tagId?.toString?.() || t.id?.toString?.() || t.tagName || t.name || '', name: t.tagName || t.name || '' }));
        if (formatted.length === 0) {
          setAvailableCloseTags([
            { id: '1', name: 'Issue Resolved' },
            { id: '2', name: 'Customer Satisfied' },
            { id: '3', name: 'No Response' },
            { id: '4', name: 'Escalated' },
            { id: '5', name: 'Duplicate' },
            { id: '6', name: 'Spam' },
          ]);
        } else {
          setAvailableCloseTags(formatted);
        }
      } catch {
        setAvailableCloseTags([
          { id: '1', name: 'Issue Resolved' },
          { id: '2', name: 'Customer Satisfied' },
          { id: '3', name: 'No Response' },
          { id: '4', name: 'Escalated' },
          { id: '5', name: 'Duplicate' },
          { id: '6', name: 'Spam' },
        ]);
      }
    };
    loadTags();
  }, [showCloseModal, chatRouter]);

  // Handle close chat with reason(s)
  const handleCloseChat = () => {
    if (!selectedCloseTagId) {
      alert('Please select a reason (tag) for closing this chat.');
      return;
    }
    const tag = availableCloseTags.find(t => t.id === selectedCloseTagId);
    const reason = tag ? tag.name : 'Closed';
    handleToggleChatStatus('closed', reason);
  };

  // Fetch available users for assignment
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [token]);

  // Assign chat function
  const handleAssignChat = () => {
    if (!user?.id || !selectedConversation) return;
    setSelectedUserId(null);
    setUserSearchTerm('');
    setShowAssignModal(true);
    fetchUsers();
  };

  // Perform the actual assignment
  const performAssignment = async () => {
    if (!selectedConversation?.id || !selectedUserId || !user?.id) return;

    try {
      await chatRouter.AssignChat(selectedConversation.id, selectedUserId, user.id);
      toast.success('Chat assigned successfully');
      // Note: Conversation list will be refreshed by parent component
      setShowAssignModal(false);
      setSelectedUserId(null);
      setUserSearchTerm('');
    } catch (error) {
      console.error('Error assigning chat:', error);
      toast.error('Failed to assign chat');
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (selectedConversation) {
      // Join the conversation room
      joinConversation(selectedConversation.id);

      // Set up socket event listeners
      onSocketNewMessage((message: ChatMessage) => {
        // Play sound for incoming messages (not from me)
        if (!message.isFromMe) {
          playNotificationSound();
        }
        if (message.chatId === selectedConversation.id && onNewMessage) {
          onNewMessage(message);
        }
      });

      // Handle message updates (for updating mediaPath of sending messages)
      onSocketMessageUpdate((updatedMessage: ChatMessage & { tempId?: string }) => {
        if (updatedMessage.chatId === selectedConversation.id && onMessageUpdate) {
          onMessageUpdate(updatedMessage);
        }
      });

      onUserTyping((data: { userId: string; isTyping: boolean; conversationId: string }) => {
        if (data.conversationId === selectedConversation.id && data.userId !== user?.id?.toString()) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        }
      });

      onChatPresence((data: { chatId: string; userId: string; isOnline: boolean; isTyping: boolean }) => {
        if (data.chatId === selectedConversation.id) {
          setIsOnline(data.isOnline);
          if (data.isTyping && data.userId !== user?.id?.toString()) {
            setTypingUsers(prev => new Set(prev).add(data.userId));
          } else if (!data.isTyping && data.userId !== user?.id?.toString()) {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
        }
      });

      return () => {
        leaveConversation(selectedConversation.id);
      };

    }

  }, [selectedConversation, user, joinConversation, leaveConversation, onSocketNewMessage, onSocketMessageUpdate, onUserTyping, onChatPresence, onNewMessage, onMessageUpdate]);

  // Listen for global event to open Templates sidebar (triggered from ChatSidebar's "New Template" button)
  useEffect(() => {
    const openTemplates = () => setShowTemplatePopup(true);
    window.addEventListener('openTemplates', openTemplates as EventListener);
    return () => window.removeEventListener('openTemplates', openTemplates as EventListener);
  }, []);

  // Scroll handler to load more messages with throttle
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !onLoadMoreMessages) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = async () => {
      // Throttle scroll events
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(async () => {
        if (isLoadingMoreRef.current) return;

        // Check if scrolled near the top (within 100px)
        if (container.scrollTop <= 100) {
          isLoadingMoreRef.current = true;
          const hasMore = await onLoadMoreMessages();
          isLoadingMoreRef.current = false;

          if (!hasMore) {
            // No more messages, remove listener
            container.removeEventListener('scroll', handleScroll);
          }
        }
      }, 100); // Throttle to 100ms
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [messages, onLoadMoreMessages]);

  // Image upload handler - shows caption modal
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedConversation) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage({ file, preview: reader.result as string });
        setImageCaption(''); // Reset caption
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = ''; // Reset file input
    }
  };

  // Send image via Socket.IO with caption
  const sendImageWithCaption = async () => {
    if (!pendingImage || !selectedConversation || !socket) {
      toast.error('No image to send');
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(pendingImage.file);

      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;
          const imageData = base64Image.split(',')[1];

          const tempMessageId = Date.now().toString();
          const message: ChatMessage = {
            id: tempMessageId,
            chatId: selectedConversation.id,
            message: imageCaption || '[Image]',
            timestamp: new Date(),
            timeStamp: new Date(),
            ContactId: user?.id || 'current_user',
            messageType: 'image',
            isEdit: false,
            isRead: false,
            isDelivered: false,
            isFromMe: true,
            phone: selectedConversation.phone,
            // Add temporary mediaPath using the base64 data so image shows while sending
            mediaPath: base64Image
          };

          // Emit via Socket.IO
          socket.emit('send_image', {
            message,
            imageData,
            filename: `image_${Date.now()}.jpg`
          });

          // Add message optimistically with temporary image data
          if (onNewMessage) {
            onNewMessage(message);
          }

          toast.success('Image sent successfully');
          setPendingImage(null);
          setImageCaption('');
        } catch (error) {
          console.error('Error processing image:', error);
          toast.error('Failed to send image');
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Failed to send image');
    }
  };

  const cancelImageSend = () => {
    setPendingImage(null);
    setImageCaption('');
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedConversation) {
      try {
        const result = await chatRouter.SendVideo(selectedConversation.phone, file);
        if (result === "Error") {
          throw new Error('Failed to send video');
        }

        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          chatId: selectedConversation.id,
          message: '[Video]',
          timestamp: new Date(),
          timeStamp: new Date(), // Required field
          ContactId: user?.id || 'current_user',
          messageType: 'video',
          isEdit: false,
          isRead: false,
          isDelivered: false,
          isFromMe: true,
          phone: selectedConversation.phone
        };

        if (onNewMessage) {
          onNewMessage(newMessage);
        }

        toast.success('Video sent successfully');
      } catch (error) {
        console.error('Error sending video:', error);
        toast.error('Failed to send video');
      } finally {
        if (event.target) {
          event.target.value = ''; // Reset file input
        }
      }
    }
  };

  // Fetch message templates
  const fetchTemplates = useCallback(async () => {
    try {
      const templatesData = await chatRouter.GetMessageTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Set default templates on error
      setTemplates([
        { id: 1, name: 'Hello', content: 'Hello! How are you?' },
        { id: 2, name: 'Thank you', content: 'Thank you for your message!' }
      ]);
    }
  }, [chatRouter]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const prevLastMessage = prevMessagesRef.current[prevMessagesRef.current.length - 1];

    // Use a small timeout to ensure DOM has updated
    // Auto-scroll only if a NEW message was added to the END or if it's the initial load
    if (messages.length > 0 && (!prevLastMessage || lastMessage?.id !== prevLastMessage?.id)) {
      scrollToBottom();
    }

    prevMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Send text message directly (no temp message step)
      if (replyToMessage) {
        // Send reply message
        sendReplyMessage(replyToMessage.id, newMessage.trim());
        setReplyToMessage(null);
      } else {
        // Send regular message directly
        onSendMessage(newMessage.trim());
      }

      setNewMessage('');
      setIsTyping(false);
    }
  };




  // Helper function to get supported audio MIME type
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/wav',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback to default
    return '';
  };

  const cleanupAudioVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  const animateVisualization = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (recordingState === 'recording') {
        analyserRef.current!.getByteFrequencyData(dataArray);
        // You can use dataArray for waveform visualization
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
  }, [recordingState]);

  const setupAudioVisualization = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualization animation
      animateVisualization();
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  }, [animateVisualization]);

  // Play a short notification sound (beep) for new incoming messages
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5
      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.22);
      oscillator.onended = () => {
        try { ctx.close(); } catch { }
      };
    } catch (e) {
      // ignore audio errors (e.g., autoplay restrictions)
    }
  }, []);

  // Enhanced recording functions
  const startRecording = useCallback(async () => {
    console.log('startRecording: attempting to getUserMedia');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get supported MIME type
      const mimeType = getSupportedMimeType();
      console.log('Using audio MIME type:', mimeType);

      // Create MediaRecorder with supported MIME type
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Use the actual MIME type from the recorder
        const actualMimeType = recorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: actualMimeType });
        setRecordedAudio(audioBlob);
        setRecordingState('reviewing');

        // Create audio preview
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        setAudioPreview(audio);

        console.log('recorder.onstop: generated audio blob, entering reviewing state');
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onpause = () => {
        console.log('recorder.onpause');
        setRecordingState('paused');
      };

      recorder.onresume = () => {
        console.log('recorder.onresume');
        setRecordingState('recording');
      };

      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setRecordingStream(stream);
      setRecordingState('recording');
      setRecordingDuration(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Setup audio visualization
      setupAudioVisualization(stream);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [setupAudioVisualization]);

  const pauseRecording = () => {
    if (mediaRecorder && recordingState === 'recording') {
      mediaRecorder.pause();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && recordingState === 'paused') {
      mediaRecorder.resume();
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && (recordingState === 'recording' || recordingState === 'paused')) {
      console.log('stopRecording: stopping mediaRecorder (will wait for onstop to set reviewing)');
      // Trigger the recorder to finish — onstop handler will set the reviewing state and create the blob
      mediaRecorder.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      // Do not force-recordingState to 'idle' here; wait for recorder.onstop which sets 'reviewing'
      // Keep visualization cleanup in case onstop is not called promptly
      cleanupAudioVisualization();
    }
  };

  const cancelRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (audioPreview) {
      audioPreview.pause();
      URL.revokeObjectURL(audioPreview.src);
    }

    // Notify backend about recording cancellation
    if (socket && recordedAudio) {
      socket.emit('cancel_recording', {
        filename: `audio_${Date.now()}.webm` // Use a consistent filename pattern
      });
    }

    // Reset all recording state
    setRecordingState('idle');
    setRecordingDuration(0);
    setRecordedAudio(null);
    setAudioPreview(null);
    setIsPlayingPreview(false);
    setRecordingStream(null);
    setMediaRecorder(null);
    cleanupAudioVisualization();
  }, [mediaRecorder, recordingStream, audioPreview, recordedAudio, socket, cleanupAudioVisualization]);

  const recordAgain = () => {
    cancelRecording();
    setTimeout(() => {
      startRecording();
    }, 100);
  };

  const sendRecording = async () => {
    if (recordedAudio && selectedConversation && socket) {
      try {
        // Convert Blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(recordedAudio);

        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            const audioData = base64Audio.split(',')[1]; // Remove data URL prefix

            // Create message object
            const message: ChatMessage = {
              id: Date.now().toString(),
              chatId: selectedConversation.id,
              message: '[Audio]',
              timestamp: new Date(),
              timeStamp: new Date(),
              ContactId: user?.id || 'current_user',
              messageType: 'audio',
              isEdit: false,
              isRead: false,
              isDelivered: false,
              isFromMe: true,
              phone: selectedConversation.phone
            };

            // Emit audio via Socket.IO
            socket.emit('send_audio', {
              message,
              audioData,
              filename: `audio_${Date.now()}.webm`
            });

            // Add message optimistically
            if (onNewMessage) {
              onNewMessage(message);
            }

            toast.success('Audio sent successfully');
            cancelRecording();
          } catch (error) {
            console.error('Error processing audio:', error);
            toast.error('Failed to send audio');
          }
        };

        reader.onerror = () => {
          console.error('Error reading audio file');
          toast.error('Failed to process audio');
        };
      } catch (error) {
        console.error('Error sending audio:', error);
        toast.error('Failed to send audio');
      }
    }
  };

  const togglePreviewPlayback = () => {
    if (audioPreview) {
      if (isPlayingPreview) {
        audioPreview.pause();
        setIsPlayingPreview(false);
      } else {
        audioPreview.play();
        setIsPlayingPreview(true);
      }
    }
  };





  // Handler for Templates button from MessageInput
  const handleToggleTemplates = useCallback(() => {
    setShowTemplatePopup(prev => !prev);
  }, []);


  // Favorite messages functions
  const toggleFavorite = (message: ChatMessage) => {
    setFavoriteMessages(prev => {
      const isFavorite = prev.some(fav => fav.id === message.id);
      if (isFavorite) {
        return prev.filter(fav => fav.id !== message.id);
      } else {
        return [...prev, message];
      }
    });
  };

  const sendTemplateMessage = (template: { id: number, name: string, content: string }) => {
    setNewMessage(template.content);
    setShowTemplatePopup(false);
    inputRef.current?.focus();
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      toast.error('Please fill in both name and content');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsCreatingTemplate(true);
    try {
      await chatRouter.CreateMessageTemplate(
        newTemplateName.trim(),
        newTemplateContent.trim(),
        user.id.toString(),
        newTemplateImage || undefined
      );

      toast.success('Template created successfully');
      setNewTemplateName('');
      setNewTemplateContent('');
      setNewTemplateImage(null);
      setNewTemplateImagePreview(null);
      setShowCreateTemplateForm(false);
      // Refresh templates list
      await fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleTemplateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setNewTemplateImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewTemplateImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  // Forward message functions
  const handleForwardMessage = (message: ChatMessage) => {
    setMessageToForward(message);
    setShowForwardModal(true);
  };

  const handleForward = async (message: ChatMessage, targetChatId: string) => {
    try {
      message.phone = selectedConversation?.phone || '';
      const result = await chatRouter.ForwardMessage(message, targetChatId, user?.id?.toString() || 'current_user');

      // Emit socket event to notify other clients
      if (socket) {
        socket.emit('message_forwarded', {
          forwardedMessage: result.forwardedMessage,
          targetChatId: targetChatId
        });
      }

      console.log('Message forwarded successfully:', result);
    } catch (error) {
      console.error('Error forwarding message:', error);
      throw error;
    }
  };

  // Send reply message function
  const sendReplyMessage = async (originalMessageId: string, replyMessage: string) => {
    try {
      const result = await chatRouter.ReplyToMessage(
        originalMessageId,
        replyMessage,
        selectedConversation?.id || '',
        user?.id?.toString() || 'current_user'
      );

      // Emit socket event to notify other clients
      if (socket) {
        socket.emit('message_sent', {
          message: result.replyMessage,
          chatId: selectedConversation?.id
        });
      }

      console.log('Reply sent successfully:', result);
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  // Edit message function
  const handleEditMessage = async (message: ChatMessage, newMessage: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/EditMessage/${message.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      // Update message in local state
      if (onNewMessage) {
        const updatedMessage = { ...message, message: newMessage, isEdit: true, editedAt: new Date() };
        onNewMessage(updatedMessage);
      }

      console.log('Message edited successfully');
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message. Please try again.');
    }
  };

  // Add note to message function
  const handleAddNoteToMessage = async (message: ChatMessage, note: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/AddNoteToMessage/${message.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note })
      });

      if (!response.ok) {
        throw new Error('Failed to add note to message');
      }

      // Update message in local state
      if (onNewMessage) {
        const updatedMessage = { ...message, note: note };
        onNewMessage(updatedMessage);
      }

      console.log('Note added successfully');
    } catch (error) {
      console.error('Error adding note to message:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  // Pin message function
  const handlePinMessage = async (message: ChatMessage, isPinned: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/PinMessage/${message.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned })
      });

      if (!response.ok) {
        throw new Error('Failed to pin/unpin message');
      }

      // Update message in local state
      if (onNewMessage) {
        const updatedMessage = { ...message, isPinned: isPinned };
        onNewMessage(updatedMessage);
      }

      console.log(`Message ${isPinned ? 'pinned' : 'unpinned'} successfully`);
    } catch (error) {
      console.error('Error pinning/unpinning message:', error);
      alert('Failed to pin/unpin message. Please try again.');
    }
  };

  // Handle message menu open/close
  const handleMessageMenuToggle = (messageId: string) => {
    setOpenMessageMenuId(openMessageMenuId === messageId ? null : messageId);
  };

  // React to message function
  const handleReactToMessage = (message: ChatMessage, position: { x: number; y: number }) => {
    setMessageToReact(message);
    setReactionPickerPosition(position);
    setShowReactionPicker(true);
  };

  // Add reaction function
  const handleAddReaction = async (emoji: string) => {
    if (!messageToReact || !user?.id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/AddReaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: messageToReact.id,
          userId: user.id,
          emoji: emoji
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      const result = await response.json();

      // Emit socket event to notify other clients
      if (socket) {
        socket.emit('reaction_added', {
          messageId: messageToReact.id,
          reaction: result.reaction,
          action: result.action
        });
      }

      console.log('Reaction added successfully:', result);
    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('Failed to add reaction. Please try again.');
    }
  };

  // Reply to message function
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyToMessage(message);
    inputRef.current?.focus();
  };

  // Delete message function
  const handleDeleteMessage = async (message: ChatMessage) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/DeleteMessage/${message.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Remove message from local state
      // Note: We can't directly remove from messages array here since it's passed as prop
      // The parent component should handle this through socket events or other means

      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  // Keyboard event handler for closing popups
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showFavoritesPopup) {
          setShowFavoritesPopup(false);
        }
        if (showTemplatePopup) {
          setShowTemplatePopup(false);
        }
        if (showForwardModal) {
          setShowForwardModal(false);
          setMessageToForward(null);
        }
        if (replyToMessage) {
          setReplyToMessage(null);
        }
        if (showReactionPicker) {
          setShowReactionPicker(false);
          setMessageToReact(null);
        }
        if (openMessageMenuId) {
          setOpenMessageMenuId(null);
        }
      }
    };

    if (showFavoritesPopup || showTemplatePopup || showForwardModal || replyToMessage || showReactionPicker || openMessageMenuId) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFavoritesPopup, showTemplatePopup, showForwardModal, replyToMessage, showReactionPicker, openMessageMenuId]);

  if (!selectedConversation) {
    return (
      <EmptyArea />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <ChatHeader
        selectedConversation={selectedConversation}
        isOnline={isOnline}
        typingUsers={typingUsers}
        chatStatus={chatStatus}
        onAssignClick={handleAssignChat}
        onStatusClick={handleStatusButtonClick}
        favoriteCount={favoriteMessages.length}
        onFavoritesClick={() => setShowFavoritesPopup(true)}
      />

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Show More Messages Button */}
        {onLoadMoreMessages && messages.length >= 10 && (
          <div className="flex justify-center py-2">
            <button
              onClick={async () => {
                if (!isLoadingMoreRef.current && onLoadMoreMessages) {
                  isLoadingMoreRef.current = true;
                  const hasMore = await onLoadMoreMessages();
                  isLoadingMoreRef.current = false;

                  if (!hasMore) {
                    // Show a message that there are no more messages
                    toast.success('No more messages to load');
                  }
                }
              }}
              disabled={isLoadingMoreRef.current}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMoreRef.current ? 'Loading...' : 'Show More Messages'}
            </button>
          </div>
        )}

        <MessageList
          messages={messages}
          favoriteMessages={favoriteMessages}
          toggleFavorite={toggleFavorite}
          onForward={handleForwardMessage}
          onDelete={handleDeleteMessage}
          onEdit={handleEditMessage}
          onAddNote={handleAddNoteToMessage}
          onReply={handleReplyToMessage}
          onPin={handlePinMessage}
          onReact={handleReactToMessage}
          openMessageMenuId={openMessageMenuId}
          onMenuToggle={handleMessageMenuToggle}
        />

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-700/50 backdrop-blur-sm px-4 py-2 rounded-lg border theme-border-primary">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        {/* Recording area */}
        {(recordingState === 'recording' || recordingState === 'paused' || recordingState === 'reviewing') && (
          <RecordingControls
            recordingState={recordingState}
            recordingDuration={recordingDuration}
            isPlayingPreview={isPlayingPreview}
            onPause={pauseRecording}
            onStop={stopRecording}
            onResume={resumeRecording}
            onTogglePreview={togglePreviewPlayback}
            onRecordAgain={recordAgain}
            onSend={sendRecording}
            onCancel={cancelRecording}
          />
        )}

        {/* Recording area will be displayed here */}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply to message preview */}
      {replyToMessage && (
        <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                Replying to:
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {replyToMessage.message}
              </div>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      {/* Hidden file inputs for attachments */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />

      <MessageInput
        newMessage={newMessage}
        onChange={setNewMessage}
        onSend={handleSendMessage}
        onAttachImage={() => fileInputRef.current?.click()}
        onAttachVideo={() => videoInputRef.current?.click()}
        onStartRecording={() => startRecording()}
        onStopRecording={() => stopRecording()}
        isRecording={recordingState === 'recording' || recordingState === 'paused'}
        onToggleTempMessages={() => setShowTemplatePopup(true)}
      />



      {/* Favorites Popup - Right Side */}
      {showFavoritesPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowFavoritesPopup(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Favorite Messages
                </h3>
                <button
                  onClick={() => setShowFavoritesPopup(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                {favoriteMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No favorite messages yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Click the heart icon on messages to add them to favorites</p>
                  </div>
                ) : (
                  favoriteMessages.map((message) => (
                    <div key={message.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white mb-1">{message.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(message.timeStamp || message.timestamp)}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleFavorite(message)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ml-2"
                          title="Remove from favorites"
                        >
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Messages Popup */}
      {showTemplatePopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => {
            setShowTemplatePopup(false);
            setShowCreateTemplateForm(false);
          }}
        >
          <div
            className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-800 dark:border-white" />
                  {showCreateTemplateForm ? 'Create Template' : 'Template Messages'}
                </h3>
                <button
                  onClick={() => {
                    setShowTemplatePopup(false);
                    setShowCreateTemplateForm(false);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {!showCreateTemplateForm ? (
                <>
                  <button
                    onClick={() => setShowCreateTemplateForm(true)}
                    className="w-full mb-4 flex items-center justify-center space-x-2 px-4 py-2 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Template</span>
                  </button>

                  <div className="space-y-2">
                    {templates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No templates yet</p>
                        <p className="text-sm mt-1">Create your first template to get started</p>
                      </div>
                    ) : (
                      templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => sendTemplateMessage(template)}
                          className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                        >
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{template.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{template.content}</p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Enter template name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-800 dark:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Content
                    </label>
                    <textarea
                      value={newTemplateContent}
                      onChange={(e) => setNewTemplateContent(e.target.value)}
                      placeholder="Enter template content"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-800 dark:border-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Image (Optional)
                    </label>
                    <input
                      ref={templateImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTemplateImageSelect}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => templateImageInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-800 dark:border-white transition-colors"
                      >
                        <ImageIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {newTemplateImage ? 'Change Image' : 'Select Image'}
                        </span>
                      </button>
                      {newTemplateImagePreview && (
                        <div className="relative">
                          <img
                            src={newTemplateImagePreview}
                            alt="Template preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewTemplateImage(null);
                              setNewTemplateImagePreview(null);
                              if (templateImageInputRef.current) {
                                templateImageInputRef.current.value = '';
                              }
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setShowCreateTemplateForm(false);
                        setNewTemplateName('');
                        setNewTemplateContent('');
                        setNewTemplateImage(null);
                        setNewTemplateImagePreview(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      disabled={isCreatingTemplate}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTemplate}
                      disabled={isCreatingTemplate || !newTemplateName.trim() || !newTemplateContent.trim()}
                      className="flex-1 px-4 py-2 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingTemplate ? 'Creating...' : 'Create Template'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Caption Modal */}
      {pendingImage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Caption</h3>
                <button
                  onClick={cancelImageSend}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Image Preview */}
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={pendingImage.preview}
                  alt="Preview"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>

              {/* Caption Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Add a caption (optional)..."
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendImageWithCaption();
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 dark:border-white focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={cancelImageSend}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendImageWithCaption}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-800 dark:border-white to-black dark:bg-white text-white rounded-lg hover:from-black dark:bg-white hover:to-gray-900 dark:hover:bg-gray-100 transition-all"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {messageToForward && (
        <ForwardModal
          isOpen={showForwardModal}
          onClose={() => {
            setShowForwardModal(false);
            setMessageToForward(null);
          }}
          message={messageToForward}
          conversations={conversations.filter(conv => conv.id !== selectedConversation?.id)}
          onForward={handleForward}
        />
      )}

      {/* Reaction Picker */}
      <ReactionPicker
        isOpen={showReactionPicker}
        onClose={() => {
          setShowReactionPicker(false);
          setMessageToReact(null);
        }}
        onSelectReaction={handleAddReaction}
        position={reactionPickerPosition}
      />

      <ChatCloseModal
        isOpen={showCloseModal}
        tags={availableCloseTags}
        selectedTagId={selectedCloseTagId}
        onSelectTag={(id) => setSelectedCloseTagId(id)}
        onCancel={() => { setShowCloseModal(false); setSelectedCloseTagId(null); }}
        onConfirm={handleCloseChat}
        conversationName={selectedConversation?.name}
      />

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Chat to User</h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUserId(null);
                    setUserSearchTerm('');
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Search Filter */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 dark:border-white focus:border-transparent"
                  />
                </div>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {availableUsers
                    .filter((assignUser) => {
                      if (!userSearchTerm) return true;
                      const searchLower = userSearchTerm.toLowerCase();
                      const fullName = `${assignUser.firstName || ''} ${assignUser.lastName || ''}`.toLowerCase();
                      return (
                        assignUser.username.toLowerCase().includes(searchLower) ||
                        assignUser.email.toLowerCase().includes(searchLower) ||
                        fullName.includes(searchLower)
                      );
                    })
                    .map((assignUser) => (
                      <label
                        key={assignUser.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedUserId === assignUser.id
                          ? 'bg-gray-100 dark:bg-gray-800/20 border-2 border-gray-800 dark:border-white'
                          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="radio"
                            name="assignUser"
                            value={assignUser.id}
                            checked={selectedUserId === assignUser.id}
                            onChange={() => setSelectedUserId(assignUser.id)}
                            className="w-4 h-4 text-black dark:bg-white focus:ring-gray-800 dark:border-white focus:ring-2"
                          />
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 dark:border-white to-blue-500 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {assignUser.firstName && assignUser.lastName
                                ? `${assignUser.firstName} ${assignUser.lastName}`
                                : assignUser.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{assignUser.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  {availableUsers.filter((assignUser) => {
                    if (!userSearchTerm) return true;
                    const searchLower = userSearchTerm.toLowerCase();
                    const fullName = `${assignUser.firstName || ''} ${assignUser.lastName || ''}`.toLowerCase();
                    return (
                      assignUser.username.toLowerCase().includes(searchLower) ||
                      assignUser.email.toLowerCase().includes(searchLower) ||
                      fullName.includes(searchLower)
                    );
                  }).length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        {userSearchTerm ? 'No users found matching your search' : 'No users available'}
                      </p>
                    )}
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUserId(null);
                    setUserSearchTerm('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={performAssignment}
                  disabled={!selectedUserId}
                  className="flex-1 px-4 py-2 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
