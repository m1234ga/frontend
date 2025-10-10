'use client'; 
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Smile, MoreVertical, Image, Mic, Video, Square, RotateCcw, X, Play, Pause, MapPin, Clock, Trash2, Edit3, Heart, FileText, Star, Check, XCircle, UserPlus, User, Search, Info } from 'lucide-react';
import { EmptyArea } from '@/components/chat/EmptyArea';
import { Message } from '@/components/chat/Message';
import { ForwardModal } from '@/components/chat/ForwardModal';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import Chat from './ChatRouters';

interface TempMessage {
  id: string;
  type: 'text' | 'image' | 'image_caption' | 'location' | 'audio';
  content: string;
  imageData?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  audioBlob?: Blob;
  timestamp: Date;
  isDraft: boolean;
}

interface ChatAreaProps {
  selectedConversation: ChatModel | null;
  messages:ChatMessage[];
  onSendMessage: (content: string) => void;
  onNewMessage?: (message: ChatMessage) => void;
  conversations?: ChatModel[];
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  selectedConversation,
  messages,
  onSendMessage,
  onNewMessage,
  conversations = []
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'reviewing'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [recordingChunks, setRecordingChunks] = useState<Blob[]>([]);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [tempMessages, setTempMessages] = useState<TempMessage[]>([]);
  const [showTempMessages, setShowTempMessages] = useState(false);
  const [editingTempMessage, setEditingTempMessage] = useState<string | null>(null);
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
  const [templates, setTemplates] = useState<{id: number, name: string, content: string}[]>([]);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { joinConversation, leaveConversation, onNewMessage: onSocketNewMessage, onUserTyping, onChatPresence, emitTyping, socket } = useSocket();
  const { user, token } = useAuth();
  const chatRouter = useMemo(() => Chat(token || ""), [token]);

  // Update chat status when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setChatStatus(selectedConversation.status || 'open');
    }
  }, [selectedConversation]);

  // Helper function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        const formatted = (tags || []).map((t: any) => ({ id: t.tagId?.toString?.() || t.id?.toString?.() || t.tagName || t.name, name: t.tagName || t.name }));
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
      } catch (err) {
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
      const users = await chatRouter.GetUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [chatRouter]);

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
    if (!user?.id || !selectedConversation || !selectedUserId) return;
    
    try {
      await chatRouter.AssignChat(selectedConversation.id, selectedUserId, user.id);
      setShowAssignModal(false);
      setSelectedUserId(null);
      setUserSearchTerm('');
      alert('Chat assigned successfully!');
    } catch (error) {
      console.error('Error assigning chat:', error);
      alert('Failed to assign chat. Please try again.');
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (selectedConversation) {
      // Join the conversation room
      joinConversation(selectedConversation.id);
      
      // Set up socket event listeners
      onSocketNewMessage((message: ChatMessage) => {
        if (message.chatId === selectedConversation.id && onNewMessage) {
          onNewMessage(message);
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
  }, [selectedConversation, user, joinConversation, leaveConversation, onSocketNewMessage, onUserTyping, onChatPresence, onNewMessage]);

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
    scrollToBottom();
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (selectedConversation) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (e.target.value && !isTyping) {
        setIsTyping(true);
        emitTyping(selectedConversation.id, true);
      } else if (!e.target.value && isTyping) {
        setIsTyping(false);
        emitTyping(selectedConversation.id, false);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          emitTyping(selectedConversation.id, false);
        }
      }, 1000);
    }
  };

  // Media handling functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedConversation) {
      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          const base64Content = base64Data.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          
          // Send image directly (no temp message step)
          const imageMessage: ChatMessage = {
            id: Date.now().toString(),
            chatId: selectedConversation.id,
            message: newMessage || '[Image]',
            timestamp: new Date(),
            ContactId: selectedConversation.contactId,
            messageType: 'image',
            isEdit: false,
            isRead: false,
            isDelivered: false,
            isFromMe: true,
            phone: selectedConversation.phone
          };
          
          if (socket) {
            socket.emit('send_image', {
              message: imageMessage,
              imageData: base64Content,
              filename: `image_${Date.now()}.jpg`
            });
          }
          
          setNewMessage('');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedConversation) {
      try {
        // Send video message directly (no temp message step)
        onSendMessage(newMessage || '[Video]');
        setNewMessage('');
      } catch (error) {
        console.error('Error sending video:', error);
      }
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

  // Enhanced recording functions
  const startRecording = async () => {
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
        setRecordingChunks(chunks);
        setRecordingState('reviewing');
        
        // Create audio preview
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        setAudioPreview(audio);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onpause = () => {
        setRecordingState('paused');
      };

      recorder.onresume = () => {
        setRecordingState('recording');
      };

      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setRecordingStream(stream);
      setRecordingState('recording');
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordingChunks([]);
      
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
  };

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
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      cleanupAudioVisualization();
    }
  };

  const cancelRecording = () => {
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
    setIsRecording(false);
    setRecordingState('idle');
    setRecordingDuration(0);
    setRecordedAudio(null);
    setAudioPreview(null);
    setIsPlayingPreview(false);
    setRecordingChunks([]);
    setRecordingStream(null);
    setMediaRecorder(null);
    cleanupAudioVisualization();
  };

  const recordAgain = () => {
    cancelRecording();
    setTimeout(() => {
      startRecording();
    }, 100);
  };

  const sendRecording = async () => {
    if (recordedAudio) {
      try {
        // Add to temp messages instead of sending immediately
        addTempMessage('audio', '[Audio]', {
          audioBlob: recordedAudio
        });
        
        // Clean up after adding to temp messages
        cancelRecording();
      } catch (error) {
        console.error('Error saving audio:', error);
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

  const setupAudioVisualization = (stream: MediaStream) => {
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
  };

  const animateVisualization = () => {
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
  };

  const cleanupAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  // Temp message functions
  const addTempMessage = (type: TempMessage['type'], content: string, additionalData?: Record<string, unknown>) => {
    const tempMessage: TempMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isDraft: true,
      ...additionalData
    };
    setTempMessages(prev => [...prev, tempMessage]);
  };

  const saveTempMessage = (id: string, content: string) => {
    setTempMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, content, isDraft: false } : msg
      )
    );
    setEditingTempMessage(null);
  };

  const deleteTempMessage = (id: string) => {
    setTempMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const sendTempMessage = async (tempMessage: TempMessage) => {
    if (!selectedConversation) return;

    try {
      switch (tempMessage.type) {
        case 'text':
          onSendMessage(tempMessage.content);
          break;
        case 'image':
        case 'image_caption':
          if (tempMessage.imageData) {
            const imageMessage: ChatMessage = {
              id: Date.now().toString(),
              chatId: selectedConversation.id,
              message: tempMessage.content || '[Image]',
              timestamp: new Date(),
              ContactId: selectedConversation.contactId,
              messageType: 'image',
              isEdit: false,
              isRead: false,
              isDelivered: false,
              isFromMe: true,
              phone: selectedConversation.phone
            };
            
            if (socket) {
              socket.emit('send_image', {
                message: imageMessage,
                imageData: tempMessage.imageData,
                filename: `image_${Date.now()}.jpg`
              });
            }
          }
          break;
        case 'audio':
          if (tempMessage.audioBlob) {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const base64Data = e.target?.result as string;
              const base64Content = base64Data.split(',')[1];
              
              const audioMessage: ChatMessage = {
                id: Date.now().toString(),
                chatId: selectedConversation.id,
                message: '[Audio]',
                timestamp: new Date(),
                ContactId: selectedConversation.contactId,
                messageType: 'audio',
                isEdit: false,
                isRead: false,
                isDelivered: false,
                isFromMe: true,
                phone: selectedConversation.phone
              };
              
              if (socket) {
                socket.emit('send_audio', {
                  message: audioMessage,
                  audioData: base64Content,
                  filename: `audio_${Date.now()}.ogg`
                });
              }
            };
            reader.readAsDataURL(tempMessage.audioBlob);
          }
          break;
        case 'location':
          // For location, we'll send as text with coordinates
          const locationText = `📍 Location: ${tempMessage.location?.address || 'Shared Location'}\nLat: ${tempMessage.location?.lat}\nLng: ${tempMessage.location?.lng}`;
          onSendMessage(locationText);
          break;
      }
      
      // Remove temp message after sending
      deleteTempMessage(tempMessage.id);
    } catch (error) {
      console.error('Error sending temp message:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Send location directly (no temp message step)
          const locationText = `📍 Location: Current Location\nLat: ${latitude.toFixed(4)}\nLng: ${longitude.toFixed(4)}`;
          onSendMessage(locationText);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser');
    }
  };

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

  const sendTemplateMessage = (template: {id: number, name: string, content: string}) => {
    setNewMessage(template.content);
    setShowTemplatePopup(false);
    inputRef.current?.focus();
  };

  // Forward message functions
  const handleForwardMessage = (message: ChatMessage) => {
    setMessageToForward(message);
    setShowForwardModal(true);
  };

  const handleForward = async (message: ChatMessage, targetChatId: string) => {
    try {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, []);

  if (!selectedConversation) {
    return (
      <EmptyArea/>
    );
  }

  return (
    <div className="flex-1 flex flex-col tech-chat-bg circuit-pattern">
      {/* Modern Chat Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left Section - User Info */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <User className="w-6 h-6 text-white" />
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                  {selectedConversation.name}
                </h2>
                {selectedConversation.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                    {selectedConversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {typingUsers.size > 0 ? (
                  <span className="text-cyan-600 dark:text-cyan-400 italic">typing...</span>
                ) : isOnline ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Online
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    Offline
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Assign User Button */}
            <button
              onClick={handleAssignChat}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30"
              title="Assign to User"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden md:inline">Assign</span>
            </button>

            {/* Chat Status Badge */}
            <button
              onClick={handleStatusButtonClick}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                chatStatus === 'closed'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30'
                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30'
              }`}
              title={`Chat is ${chatStatus}. Click to ${chatStatus === 'open' ? 'close' : 'reopen'}`}
            >
              {chatStatus === 'closed' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden md:inline">Closed</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Open</span>
                </>
              )}
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-2">
              <button 
                onClick={() => setShowFavoritesPopup(true)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                title="Favorite Messages"
              >
                <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-500" />
                {favoriteMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {favoriteMessages.length}
                  </span>
                )}
              </button>
              
              <button 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                title="Contact Info"
              >
                <Info className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-cyan-600" />
              </button>

              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group">
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-cyan-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center theme-text-accent mt-8">
            <p className="text-lg font-medium">No messages yet. Start the conversation!</p>
            <p className="text-sm opacity-70 mt-2">Send a message to begin chatting</p>
          </div>
        ) : (
          messages.map((message:ChatMessage) => {
            const isFavorite = favoriteMessages.some(fav => fav.id === message.id);
            return (
                    <Message
                      message={message}
                      key={message.id}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={isFavorite}
                      onForward={handleForwardMessage}
                      onDelete={handleDeleteMessage}
                      onEdit={handleEditMessage}
                      onAddNote={handleAddNoteToMessage}
                      onReply={handleReplyToMessage}
                      onPin={handlePinMessage}
                      onReact={handleReactToMessage}
                      isMenuOpen={openMessageMenuId === message.id}
                      onMenuToggle={() => handleMessageMenuToggle(message.id)}
                    />
            );
          })
        )}
        
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
        
        {/* Enhanced Recording Interface */}
        {(recordingState === 'recording' || recordingState === 'paused' || recordingState === 'reviewing') && (
          <div className="flex justify-end">
            <div className={`bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm px-6 py-4 rounded-xl border border-red-500/30 shadow-lg recording-state-indicator ${
              recordingState === 'recording' ? 'recording-active' : 
              recordingState === 'paused' ? 'recording-paused' : 
              'recording-review'
            }`}>
              {recordingState === 'recording' && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-300 text-sm font-medium">Recording</span>
                  </div>
                  <div className="text-white text-sm font-mono recording-timer">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={pauseRecording}
                      className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-full recording-control-button"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4 text-orange-300" />
                    </button>
                    <button
                      onClick={stopRecording}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full recording-control-button"
                      title="Stop"
                    >
                      <Square className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                </div>
              )}
              
              {recordingState === 'paused' && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-300 text-sm font-medium">Paused</span>
                  </div>
                  <div className="text-white text-sm font-mono recording-timer">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={resumeRecording}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-full recording-control-button"
                      title="Resume"
                    >
                      <Play className="w-4 h-4 text-green-300" />
                    </button>
                    <button
                      onClick={stopRecording}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full recording-control-button"
                      title="Stop"
                    >
                      <Square className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                </div>
              )}
              
              {recordingState === 'reviewing' && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-300 text-sm font-medium">Review Recording</span>
                  </div>
                  <div className="text-white text-sm font-mono recording-timer">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={togglePreviewPlayback}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-full recording-control-button"
                      title={isPlayingPreview ? "Pause" : "Play"}
                    >
                      {isPlayingPreview ? (
                        <Pause className="w-4 h-4 text-blue-300" />
                      ) : (
                        <Play className="w-4 h-4 text-blue-300" />
                      )}
                    </button>
                    <button
                      onClick={recordAgain}
                      className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-full recording-control-button"
                      title="Record Again"
                    >
                      <RotateCcw className="w-4 h-4 text-orange-300" />
                    </button>
                    <button
                      onClick={sendRecording}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-full recording-control-button"
                      title="Send"
                    >
                      <Send className="w-4 h-4 text-green-300" />
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full recording-control-button"
                      title="Cancel"
                    >
                      <X className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Temp Messages Section */}
        {tempMessages.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-600/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">Draft Messages</h3>
              <button
                onClick={() => setShowTempMessages(!showTempMessages)}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showTempMessages ? 'Hide' : 'Show'} ({tempMessages.length})
              </button>
            </div>
            
            {showTempMessages && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tempMessages.map((tempMsg) => (
                  <div key={tempMsg.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {tempMsg.type === 'text' && (
                          <div className="text-sm text-gray-200">{tempMsg.content}</div>
                        )}
                        
                        {tempMsg.type === 'image_caption' && (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-200">{tempMsg.content}</div>
                            {tempMsg.imageData && (
                              <img 
                                src={`data:image/jpeg;base64,${tempMsg.imageData}`}
                                alt="Draft image"
                                className="w-20 h-20 object-cover rounded"
                              />
                            )}
                          </div>
                        )}
                        
                        {tempMsg.type === 'audio' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Mic className="w-4 h-4 text-blue-300" />
                            </div>
                            <span className="text-sm text-gray-200">Audio Recording</span>
                          </div>
                        )}
                        
                        {tempMsg.type === 'location' && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-green-300" />
                            <span className="text-sm text-gray-200">{tempMsg.location?.address}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {tempMsg.timestamp.toLocaleTimeString()}
                          </span>
                          {tempMsg.isDraft && (
                            <span className="text-xs text-orange-400 ml-2">Draft</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        {tempMsg.isDraft && (
                          <button
                            onClick={() => setEditingTempMessage(tempMsg.id)}
                            className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3 text-gray-400" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => sendTempMessage(tempMsg)}
                          className="p-1 hover:bg-green-600/50 rounded transition-colors"
                          title="Send"
                        >
                          <Send className="w-3 h-3 text-green-400" />
                        </button>
                        
                        <button
                          onClick={() => deleteTempMessage(tempMsg.id)}
                          className="p-1 hover:bg-red-600/50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Edit mode */}
                    {editingTempMessage === tempMsg.id && (
                      <div className="mt-2 flex space-x-2">
                        <input
                          type="text"
                          defaultValue={tempMsg.content}
                          data-temp-id={tempMsg.id}
                          className="flex-1 px-2 py-1 text-sm bg-gray-600 border border-gray-500 rounded text-white"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              saveTempMessage(tempMsg.id, e.currentTarget.value);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveTempMessage(tempMsg.id, (document.querySelector(`input[data-temp-id="${tempMsg.id}"]`) as HTMLInputElement)?.value || tempMsg.content)}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTempMessage(null)}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
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
      <div className="tech-header p-4">
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-500/20 rounded-full transition-colors">
            <Smile className="w-5 h-5 theme-text-accent" />
          </button>
          
          {/* Image Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
          >
            <Image className="w-5 h-5 text-cyan-300" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Video Upload Button */}
          <button 
            onClick={() => videoInputRef.current?.click()}
            className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
          >
            <Video className="w-5 h-5 text-cyan-300" />
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
          
          {/* Template Button */}
          <button 
            onClick={() => setShowTemplatePopup(true)}
            className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
            title="Template Messages"
          >
            <FileText className="w-5 h-5 text-cyan-300" />
          </button>
          
          {/* Voice Recording Button */}
          <button 
            onClick={recordingState === 'idle' ? startRecording : undefined}
            disabled={recordingState !== 'idle'}
            className={`p-2 rounded-full recording-button ${
              recordingState === 'idle'
                ? 'hover:bg-cyan-500/20' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            title={recordingState === 'idle' ? 'Start Recording' : 'Recording in progress'}
          >
            <Mic className="w-5 h-5 text-cyan-300" />
          </button>
          
          {/* Location Button */}
          <button 
            onClick={getCurrentLocation}
            className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
            title="Share Location"
          >
            <MapPin className="w-5 h-5 text-cyan-300" />
          </button>
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyUp={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input w-full px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

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
                            {formatTime(message.timeStamp)}
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
          onClick={() => setShowTemplatePopup(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-cyan-500" />
                  Template Messages
                </h3>
                <button
                  onClick={() => setShowTemplatePopup(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => sendTemplateMessage(template)}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{template.content}</p>
                  </button>
                ))}
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

              {/* Close Chat Modal */}
              {showCloseModal && (
                <div 
                  className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
                  onClick={() => {
                    setShowCloseModal(false);
                    setCloseReasons([]);
                    setCloseOther('');
                  }}
                >
                  <div 
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <XCircle className="w-5 h-5 mr-2 text-red-500" />
                          Close Chat
                        </h3>
                        <button
                          onClick={() => {
                            setShowCloseModal(false);
                            setCloseReasons([]);
                            setCloseOther('');
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Please provide a reason for closing this chat with <strong className="text-gray-900 dark:text-white">{selectedConversation?.name}</strong>.
                        </p>
                        
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Closing Reason <span className="text-red-500">*</span>
                        </label>
                        <div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {availableCloseTags.map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => setSelectedCloseTagId(tag.id === selectedCloseTagId ? null : tag.id)}
                                className={`px-3 py-1.5 text-xs ${selectedCloseTagId === tag.id ? 'bg-cyan-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'} hover:opacity-90 rounded-full transition-colors border ${selectedCloseTagId === tag.id ? 'border-cyan-600' : 'border-gray-300 dark:border-gray-600'}`}
                              >
                                {tag.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* (replaced) selectable tag list and optional Other input above */}
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 rounded-b-xl">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowCloseModal(false);
                            setSelectedCloseTagId(null);
                          }}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCloseChat}
                          disabled={!selectedCloseTagId}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2 shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span>Close Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                  selectedUserId === assignUser.id
                                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-500'
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
                                    className="w-4 h-4 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
                                  />
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
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
                          className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors font-medium"
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