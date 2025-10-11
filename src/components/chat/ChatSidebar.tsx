'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, MoreVertical, LogOut, User, Send, X, MessageSquare, Tag, Settings, Archive, VolumeX, UserPlus, Plus, BarChart3, Check, SlidersHorizontal, Mail, Users, Calendar, ArrowUpDown } from 'lucide-react';
import Chat from './ChatRouters';
import { NewChatModal } from './NewChatModal';
import { Contact, Chat as ChatModel, ChatTag } from '../../../../Shared/Models';
import TagPill from '../common/TagPill';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatSidebarProps {
  conversations: ChatModel[];
  onSelectConversation: (conversation: ChatModel) => void;
  onNewChat: () => void;
  selectedConversationId?: string;
  onConversationsUpdate?: (conversations: ChatModel[]) => void;
  onLogout?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onSelectConversation,
  onNewChat,
  selectedConversationId,
  onConversationsUpdate,
  onLogout
}) => {
  const [conversations, setConversations] = useState<ChatModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [Contacts, setAllContacts] = useState<Contact[]>([]);
  const [showUsersList, setShowUsersList] = useState(false);
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [availableTags, setAvailableTags] = useState<ChatTag[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactTagManager, setShowContactTagManager] = useState(false);
  const [selectedContactForTags, setSelectedContactForTags] = useState<Contact | null>(null);
  const [showChatTagManager, setShowChatTagManager] = useState(false);
  const [selectedChatForTags, setSelectedChatForTags] = useState<ChatModel | null>(null);
  const [showCreateTagDialog, setShowCreateTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'archived' | 'assigned' | 'open' | 'closed'>('chats');
  const [archivedChats, setArchivedChats] = useState<ChatModel[]>([]);
  const [assignedChats, setAssignedChats] = useState<ChatModel[]>([]);
  const [openChats, setOpenChats] = useState<ChatModel[]>([]);
  const [closedChats, setClosedChats] = useState<ChatModel[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    unreadOnly: false,
    onlineOnly: false,
    sortBy: 'date' as 'date' | 'name' | 'unread',
    dateFilter: 'all' as 'all' | 'today' | 'yesterday' | 'week' | 'month'
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedChatToAssign, setSelectedChatToAssign] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; username: string; firstName?: string; lastName?: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const { user, token } = useAuth();
  const chatRouter = useMemo(() => Chat(token || ""), [token]);
  const { onChatUpdate } = useSocket();

  // Helper function to assign colors to parsed tags
  const getTagColor = useCallback((tagName: string): string => {
    const colors = [
      '#ef4444', // red
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // yellow
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
      '#ec4899', // pink
      '#6b7280'  // gray
    ];
    
    // Use tag name to consistently assign the same color
    const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const contacts = await chatRouter.GetContacts();
      setAllContacts(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setAllContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatRouter]);

  const fetchConversations = useCallback(async () => {
    try {
      const chats = await chatRouter.GetChatsWithTags();
      
      // Parse tagsname field and convert to ChatTag array
      const chatsWithParsedTags = chats.map((chat: ChatModel & { tagsname?: string }) => {
        let parsedTags: ChatTag[] = [];
        
        if (chat.tagsname && typeof chat.tagsname === 'string') {
          // Split by '-_-' delimiter and create ChatTag objects
          const tagData = chat.tagsname.split('-_-').filter((data: string) => data.trim() !== '');
          parsedTags = tagData.map((data: string, index: number) => {
            const [tagName,tagId] = data.split('_-_');
            return {
              id: tagId || `parsed-${chat.id}-${index}`,
              name: tagName || data.trim(),
              color: getTagColor(tagName || data.trim()),
              status: 'available' as const,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          });
        }
        
        return {
          ...chat,
          tags: parsedTags
        };
      });
      
      const sortedChats = chatsWithParsedTags.sort(
        (a: ChatModel, b: ChatModel) =>
        Number(b.lastMessageTime) - Number(a.lastMessageTime)
      );
      setConversations(sortedChats);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    }
  }, [chatRouter, getTagColor]);

  // Fetch archived chats
  const fetchArchivedChats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const archived = await chatRouter.GetArchivedChats(user.id);
      setArchivedChats(archived);
    } catch (error) {
      console.error('Error fetching archived chats:', error);
    }
  }, [user?.id, chatRouter]);

  // Fetch assigned chats
  const fetchAssignedChats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const assigned = await chatRouter.GetAssignedChats(user.id);
      setAssignedChats(assigned);
    } catch (error) {
      console.error('Error fetching assigned chats:', error);
    }
  }, [user?.id, chatRouter]);

  // Fetch open chats
  const fetchOpenChats = useCallback(async () => {
    try {
      const open = await chatRouter.GetChatsByStatus('open');
      setOpenChats(open);
    } catch (error) {
      console.error('Error fetching open chats:', error);
    }
  }, [chatRouter]);

  // Fetch closed chats
  const fetchClosedChats = useCallback(async () => {
    try {
      const closed = await chatRouter.GetChatsByStatus('closed');
      setClosedChats(closed);
    } catch (error) {
      console.error('Error fetching closed chats:', error);
    }
  }, [chatRouter]);

  // Archive/Unarchive chat functions
  const handleArchiveChat = async (chatId: string) => {
    if (!user?.id) return;
    
    try {
      await chatRouter.ArchiveChat(chatId, user.id);
      fetchArchivedChats();
      fetchConversations();
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  };

  const handleUnarchiveChat = async (chatId: string) => {
    if (!user?.id) return;
    
    try {
      await chatRouter.UnarchiveChat(chatId, user.id);
      fetchArchivedChats();
      fetchConversations();
    } catch (error) {
      console.error('Error unarchiving chat:', error);
    }
  };

  // Mute/Unmute chat functions
  const handleMuteChat = async (chatId: string) => {
    if (!user?.id) return;
    
    try {
      await chatRouter.MuteChat(chatId, user.id);
      fetchConversations();
    } catch (error) {
      console.error('Error muting chat:', error);
    }
  };

  const handleUnmuteChat = async (chatId: string) => {
    if (!user?.id) return;
    
    try {
      await chatRouter.UnmuteChat(chatId, user.id);
      fetchConversations();
    } catch (error) {
      console.error('Error unmuting chat:', error);
    }
  };

  // Create new chat function
  const handleCreateNewChat = async (phoneNumber: string, contactName?: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/CreateNewChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          contactName, 
          userId: user.id 
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh conversations list
        fetchConversations();
        // Select the new chat
        onSelectConversation(result.chat);
        setShowNewChatModal(false);
      } else if (response.status === 409) {
        // Chat already exists
        const result = await response.json();
        alert('Chat already exists with this number');
        // Optionally select the existing chat
        onSelectConversation(result.existingChat);
        setShowNewChatModal(false);
      } else {
        throw new Error('Failed to create chat');
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert('Failed to create chat. Please try again.');
    }
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
  const handleAssignChat = async (chatId: string) => {
    if (!user?.id) return;
    setSelectedChatToAssign(chatId);
    setSelectedUserId(null);
    setUserSearchTerm('');
    setShowAssignModal(true);
    fetchUsers();
  };

  // Perform the actual assignment
  const performAssignment = async () => {
    if (!user?.id || !selectedChatToAssign || !selectedUserId) return;
    await chatRouter.AssignChat(selectedChatToAssign, selectedUserId, user.id);
    fetchAssignedChats();
    fetchConversations();
    setShowAssignModal(false);
    setSelectedChatToAssign(null);
    setSelectedUserId(null);
    setUserSearchTerm('');
  };

  // Toggle chat status (open/closed)
  const handleToggleChatStatus = async (chatId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    await chatRouter.UpdateChatStatus(chatId, newStatus);
    fetchConversations();
    fetchOpenChats();
    fetchClosedChats();
  };

  // Socket event handlers - use useCallback to prevent infinite re-renders
  const handleChatUpdate = useCallback((updatedChat: ChatModel & { tagsname?: string }) => {
    setConversations(prevConversations => {
      const existingIndex = prevConversations.findIndex(chat => chat.id === updatedChat.id);
      let newConversations;
      
      // Parse tagsname field for the updated chat
      let parsedTags: ChatTag[] = [];
      if (updatedChat.tagsname && typeof updatedChat.tagsname === 'string') {
        const tagNames = updatedChat.tagsname.split('-_-').filter((name: string) => name.trim() !== '');
        parsedTags = tagNames.map((tagName: string, index: number) => ({
          id: `parsed-${updatedChat.id}-${index}`,
          name: tagName.trim(),
          color: getTagColor(tagName.trim()),
          status: 'available' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }
      
      if (existingIndex >= 0) {
        // Update existing conversation
        newConversations = [...prevConversations];
        newConversations[existingIndex] = {
          ...newConversations[existingIndex],
          lastMessage: updatedChat.lastMessage,
          lastMessageTime: updatedChat.lastMessageTime,
          unreadCount: updatedChat.unreadCount,
          isOnline: updatedChat.isOnline,
          isTyping: updatedChat.isTyping,
          tags: parsedTags
        };
      } else {
        // Add new conversation
        newConversations = [{ ...updatedChat, tags: parsedTags }, ...prevConversations];
      }
      
      // Sort by last message time
      const sortedConversations = newConversations.sort(
        (a: ChatModel, b: ChatModel) =>
        Number(b.lastMessageTime) - Number(a.lastMessageTime)
      );
      
      return sortedConversations;
    });
  }, [getTagColor]);

  useEffect(() => {
    onChatUpdate(handleChatUpdate);
  }, [onChatUpdate, handleChatUpdate]);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
    fetchArchivedChats();
    fetchAssignedChats();
    fetchOpenChats();
    fetchClosedChats();
  }, [fetchConversations, fetchContacts, fetchArchivedChats, fetchAssignedChats, fetchOpenChats, fetchClosedChats]);


  // Set client-side flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isClient) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, isClient]);

  // Theme toggle functionality (currently unused but available for future use)
  // const toggleTheme = () => {
  //   setIsDarkMode(!isDarkMode);
  // };

  // Update parent component when conversations change
  useEffect(() => {
    if (onConversationsUpdate) {
      onConversationsUpdate(conversations);
    }
  }, [conversations, onConversationsUpdate]);

  // Client-side only debugging - removed to prevent console spam
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && isClient) {
  //     console.log('Search term:', searchTerm);
  //     console.log('All conversations:', conversations);
  //     console.log('All contacts:', Contacts);
  //   }
  // }, [searchTerm, conversations, Contacts, isClient]);

  // Apply all filters
  const filteredConversations = useMemo(() => {
    if (!isClient) return []; // Prevent hydration mismatch
    
    let filtered = conversations.filter(conversation => {
      if(conversation.name) {
        return conversation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });

    // Apply unread filter
    if (filters.unreadOnly) {
      filtered = filtered.filter(chat => chat.unreadCount > 0);
    }

    // Apply online filter
    if (filters.onlineOnly) {
      filtered = filtered.filter(chat => chat.isOnline);
    }

    // Apply date filter
    if (filters.dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      filtered = filtered.filter(chat => {
        const chatDate = new Date(chat.lastMessageTime);
        switch (filters.dateFilter) {
          case 'today':
            return chatDate >= today;
          case 'yesterday':
            return chatDate >= yesterday && chatDate < today;
          case 'week':
            return chatDate >= weekAgo;
          case 'month':
            return chatDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'unread':
          return b.unreadCount - a.unreadCount;
        case 'date':
        default:
          return Number(b.lastMessageTime) - Number(a.lastMessageTime);
      }
    });

    return sorted;
  }, [conversations, searchTerm, filters, isClient]);

  const filteredContacts = useMemo(() => {
    if (!isClient) return []; // Prevent hydration mismatch
    return Contacts.filter(contact =>
      (contact.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone || '').includes(searchTerm)
    );
  }, [Contacts, searchTerm, isClient]);

  const formatTime = useCallback((dateString?: string) => {
    if (!isClient || !dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }, [isClient]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Bulk message functions
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    setSelectedContacts(Contacts.map(contact => contact.id));
  };

  const clearSelection = () => {
    setSelectedContacts([]);
  };

  const sendBulkMessage = async () => {
    if (!bulkMessage.trim() || selectedContacts.length === 0) return;

    try {
      // Here you would implement the bulk message sending logic
      // For now, we'll just show an alert
      alert(`Sending message to ${selectedContacts.length} contacts: "${bulkMessage}"`);
      
      // Reset form
      setBulkMessage('');
      setSelectedContacts([]);
      setShowBulkMessage(false);
    } catch (error) {
      console.error('Error sending bulk message:', error);
    }
  };

  // Tag management functions
  const initializeTags = useCallback(async () => {
    try {
      const dbTags = await chatRouter.GetTags();
      const formattedTags: ChatTag[] = dbTags.map((tag: { tagId: number; tagName: string }) => ({
        id: tag.tagId.toString(),
        name: tag.tagName,
        color: getTagColor(tag.tagName),
        status: 'available' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      setAvailableTags(formattedTags);
    } catch (error) {
      console.error('Error fetching tags from database:', error);
      // Fallback to empty array if database fetch fails
      setAvailableTags([]);
    }
  }, [chatRouter, getTagColor]);

  // Initialize tags on component mount
  useEffect(() => {
    initializeTags();
  }, [initializeTags]);

  const addTag = async (name: string) => {
    try {
      const newTag = await chatRouter.CreateTag(name);
      const formattedTag: ChatTag = {
        id: newTag.tagId.toString(),
        name: newTag.name,
        color: getTagColor(newTag.tagName),
        status: 'available',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setAvailableTags(prev => [...prev, formattedTag]);
      return formattedTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  };


  const deleteTag = async (id: string) => {
    try {
      await chatRouter.DeleteTag(id);
      setAvailableTags(prev => prev.filter(tag => tag.id !== id));
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  };

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagFilter(selectedTagFilter === tagId ? null : tagId);
  };

  const clearTagFilter = () => {
    setSelectedTagFilter(null);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsCreatingTag(true);
    try {
      await addTag(newTagName.trim());
      setNewTagName('');
      setShowCreateTagDialog(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      // You could show a toast notification here
    } finally {
      setIsCreatingTag(false);
    }
  };

  // Contact tag management functions
  const assignTagToContact = async (contactId: string, tagId: string) => {
    const contact = Contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const tag = availableTags.find(t => t.id === tagId);
    if (!tag || contact.tags?.some(t => t.id === tagId)) return;
    
    const updatedTags = [...(contact.tags || []), tag];
    
    try {
      await chatRouter.UpdateContactTags(contactId, updatedTags.map(t => t.id));
      setAllContacts(prev => 
        prev.map(c => c.id === contactId ? { ...c, tags: updatedTags } : c)
      );
    } catch (error) {
      console.error('Error assigning tag to contact:', error);
    }
  };

  const removeTagFromContact = async (contactId: string, tagId: string) => {
    const contact = Contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const updatedTags = contact.tags?.filter(tag => tag.id !== tagId) || [];
    
    try {
      await chatRouter.UpdateContactTags(contactId, updatedTags.map(t => t.id));
      setAllContacts(prev => 
        prev.map(c => c.id === contactId ? { ...c, tags: updatedTags } : c)
      );
    } catch (error) {
      console.error('Error removing tag from contact:', error);
    }
  };

  const openContactTagManager = (contact: Contact) => {
    setSelectedContactForTags(contact);
    setShowContactTagManager(true);
  };

  const openChatTagManager = (chat: ChatModel) => {
    setSelectedChatForTags(chat);
    setShowChatTagManager(true);
  };

  const handleChatRightClick = (e: React.MouseEvent, chat: ChatModel) => {
    e.preventDefault();
    openChatTagManager(chat);
  };

  // Chat tag management functions
  const assignTagToChat = async (chatId: string, tagId: string) => {
    try {
      await chatRouter.AssignTagToChat(chatId, tagId, user?.username || 'current_user');
      
      // Refresh conversations to get updated tags
      await fetchConversations();
    } catch (error) {
      console.error('Error assigning tag to chat:', error);
    }
  };

  const removeTagFromChat = async (chatId: string, tagId: string) => {
    try {
      await chatRouter.RemoveTagFromChat(chatId, tagId);
      
      // Refresh conversations to get updated tags
      await fetchConversations();
    } catch (error) {
      console.error('Error removing tag from chat:', error);
    }
  };

  // Show loading state during hydration to prevent mismatch
  if (!isClient) {
    return (
      <div className="w-100 tech-sidebar flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100 tech-sidebar flex flex-col h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
            <p className="theme-text-secondary">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="tech-header p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold theme-text-primary">{user?.firstName || user?.username || 'User'}</h2>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 hover:bg-gray-500/20 rounded-lg transition-colors"
                title="Start New Chat"
              >
                <Plus className="w-5 h-5 text-gray-300 hover:text-white" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 theme-text-accent" />
                </button>
                {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <a
                    href="/dashboard"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-2 flex items-center justify-center space-x-4 border-b theme-border-primary">
            <button
              onClick={() => setShowBulkMessage(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              title="Send Bulk Message"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Bulk Message</span>
            </button>
            <button
              onClick={() => setShowCreateTagDialog(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Create New Tag"
            >
              <Tag className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Add Tag</span>
            </button>
            <button
              onClick={() => setShowTagManagement(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              title="Manage Tags"
            >
              <Settings className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Settings</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b theme-border-primary">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-accent" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="chat-input w-full pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                  showFilters || filters.unreadOnly || filters.onlineOnly || filters.dateFilter !== 'all' || filters.sortBy !== 'date'
                    ? 'bg-cyan-500 text-white'
                    : 'theme-text-accent hover:bg-gray-500/20'
                }`}
                title="Toggle Filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="space-y-3 p-3 theme-bg-secondary rounded-lg border theme-border-primary">
                {/* Quick Filters */}
                <div>
                  <h4 className="text-xs font-medium theme-text-secondary mb-2">Quick Filters</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, unreadOnly: !prev.unreadOnly }))}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.unreadOnly
                          ? 'bg-cyan-500 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>Unread Only</span>
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, onlineOnly: !prev.onlineOnly }))}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.onlineOnly
                          ? 'bg-green-500 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>Online Only</span>
                    </button>
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h4 className="text-xs font-medium theme-text-secondary mb-2 flex items-center space-x-1">
                    <ArrowUpDown className="w-3 h-3" />
                    <span>Sort By</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'date' }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.sortBy === 'date'
                          ? 'bg-gray-800 dark:bg-gray-600 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      Recent
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'name' }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.sortBy === 'name'
                          ? 'bg-gray-800 dark:bg-gray-600 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      Name
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'unread' }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.sortBy === 'unread'
                          ? 'bg-gray-800 dark:bg-gray-600 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      Unread
                    </button>
                  </div>
                </div>

                {/* Date Filter */}
                <div>
                  <h4 className="text-xs font-medium theme-text-secondary mb-2 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Time Period</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, dateFilter: 'all' }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.dateFilter === 'all'
                          ? 'bg-gray-800 dark:bg-gray-600 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, dateFilter: 'today' }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.dateFilter === 'today'
                          ? 'bg-gray-800 dark:bg-gray-600 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, dateFilter: 'yesterday' }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.dateFilter === 'yesterday'
                          ? 'bg-gray-800 dark:bg-gray-600 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, dateFilter: 'week' }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.dateFilter === 'week'
                          ? 'bg-gray-800 dark:bg-gray-600 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, dateFilter: 'month' }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.dateFilter === 'month'
                          ? 'bg-gray-800 dark:bg-gray-600 text-white'
                          : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-primary'
                      }`}
                    >
                      Last Month
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                {(filters.unreadOnly || filters.onlineOnly || filters.dateFilter !== 'all' || filters.sortBy !== 'date') && (
                  <button
                    onClick={() => setFilters({
                      unreadOnly: false,
                      onlineOnly: false,
                      sortBy: 'date',
                      dateFilter: 'all'
                    })}
                    className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b theme-border-primary overflow-x-auto">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'chats'
                  ? 'theme-text-primary border-b-2 border-cyan-500'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'open'
                  ? 'theme-text-primary border-b-2 border-cyan-500'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'closed'
                  ? 'theme-text-primary border-b-2 border-cyan-500'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'archived'
                  ? 'theme-text-primary border-b-2 border-cyan-500'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'assigned'
                  ? 'theme-text-primary border-b-2 border-cyan-500'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              Assigned
            </button>
          </div>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div className="p-4 border-b theme-border-primary">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium theme-text-secondary">Filter by Tags</h3>
                {selectedTagFilter && (
                  <button
                    onClick={clearTagFilter}
                    className="text-xs theme-text-accent hover:text-gray-600 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTagFilter === tag.id
                        ? 'bg-gray-800 text-white'
                        : 'theme-bg-tertiary theme-text-secondary hover:theme-bg-secondary'
                    }`}
                    style={{ 
                      backgroundColor: selectedTagFilter === tag.id ? tag.color : undefined,
                      borderColor: tag.color,
                      borderWidth: '1px'
                    }}
                  >
                    <Tag className="w-3 h-3 inline mr-1" />
                    {tag.name}
                    <span className={`ml-1 text-xs ${
                      tag.status === 'available' ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {tag.status === 'available' ? '●' : '●'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b theme-border-primary">
            <button
              onClick={() => { setActiveTab('chats'); setShowUsersList(false); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chats' && !showUsersList ? 'theme-text-accent border-b-2 border-gray-600' : 'theme-text-secondary hover:theme-text-accent'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => { setActiveTab('archived'); setShowUsersList(false); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'archived' ? 'theme-text-accent border-b-2 border-gray-600' : 'theme-text-secondary hover:theme-text-accent'
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => { setActiveTab('assigned'); setShowUsersList(false); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'assigned' ? 'theme-text-accent border-b-2 border-gray-600' : 'theme-text-secondary hover:theme-text-accent'
              }`}
            >
              Assigned
            </button>
            <button
              onClick={() => setShowUsersList(true)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                showUsersList ? 'theme-text-accent border-b-2 border-gray-600' : 'theme-text-secondary hover:theme-text-accent'
              }`}
            >
              Contacts
            </button>
          </div>

          {/* Conversations/Users List */}
          <div className="flex-1 overflow-y-auto">
            {!showUsersList ? (
              // Conversations list 
              <div>
                {(() => {
                  if (!isClient) {
                    return (
                      <div className="p-4 text-center theme-text-accent">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                        <p className="theme-text-secondary">Loading...</p>
                      </div>
                    );
                  }

                  let currentConversations: ChatModel[] = [];
                  
                  switch (activeTab) {
                    case 'chats':
                      currentConversations = filteredConversations;
                      break;
                    case 'open':
                      currentConversations = openChats.filter(chat =>
                        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        chat.phone.includes(searchTerm)
                      );
                      break;
                    case 'closed':
                      currentConversations = closedChats.filter(chat =>
                        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        chat.phone.includes(searchTerm)
                      );
                      break;
                    case 'archived':
                      currentConversations = archivedChats.filter(chat =>
                        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        chat.phone.includes(searchTerm)
                      );
                      break;
                    case 'assigned':
                      currentConversations = assignedChats.filter(chat =>
                        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        chat.phone.includes(searchTerm)
                      );
                      break;
                  }

                  if (currentConversations.length === 0) {
                    return (
                      <div className="p-4 text-center theme-text-accent">
                        {searchTerm ? 'No conversations found' : 
                         activeTab === 'open' ? 'No open conversations' :
                         activeTab === 'closed' ? 'No closed conversations' :
                         activeTab === 'archived' ? 'No archived conversations' :
                         activeTab === 'assigned' ? 'No assigned conversations' :
                         'No conversations yet'}
                      </div>
                    );
                  }

                  return currentConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => onSelectConversation(conversation)}
                      onContextMenu={(e) => handleChatRightClick(e, conversation)}
                      className={`p-4 border-b theme-border-primary cursor-pointer hover:bg-gray-500/10 transition-colors ${
                        selectedConversationId === conversation.id ? 'bg-gray-500/20 border-l-4 border-l-gray-600' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-md">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-visible">
                            <div className="flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-gray-800 truncate">
                                  {conversation.name}
                                </h3>
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                                {conversation.status && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    conversation.status === 'closed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {conversation.status === 'closed' ? 'Closed' : 'Open'}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-medium text-gray-600 truncate">
                                {conversation.phone}
                              </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Online/Offline indicator */}
                              <div className={`w-2 h-2 rounded-full ${conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              {/* Archive button */}
                              {activeTab === 'chats' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveChat(conversation.id);
                                  }}
                                  className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                                  title="Archive Chat"
                                >
                                  <Archive className="w-3 h-3 theme-text-accent" />
                                </button>
                              )}
                              
                              {/* Unarchive button */}
                              {activeTab === 'archived' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnarchiveChat(conversation.id);
                                  }}
                                  className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                                  title="Unarchive Chat"
                                >
                                  <Archive className="w-3 h-3 theme-text-accent" />
                                </button>
                              )}
                              
                              {/* Mute/Unmute button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (conversation.isMuted) {
                                    handleUnmuteChat(conversation.id);
                                  } else {
                                    handleMuteChat(conversation.id);
                                  }
                                }}
                                className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                                title={conversation.isMuted ? "Unmute Chat" : "Mute Chat"}
                              >
                                <VolumeX className={`w-3 h-3 ${conversation.isMuted ? 'text-red-500' : 'theme-text-accent'}`} />
                              </button>
                              
                              {/* Assign button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignChat(conversation.id);
                                }}
                                className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                                title="Assign Chat"
                              >
                                <UserPlus className="w-3 h-3 theme-text-accent" />
                              </button>
                              
                              {/* Status toggle button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleChatStatus(conversation.id, conversation.status || 'open');
                                }}
                                className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                                title={conversation.status === 'closed' ? 'Reopen Chat' : 'Close Chat'}
                              >
                                <Check className={`w-3 h-3 ${conversation.status === 'closed' ? 'text-green-500' : 'theme-text-accent'}`} />
                              </button>
                              
                              {/* Tag button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChatTagManager(conversation);
                                }}
                                className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                                title="Manage Tags"
                              >
                                <Tag className="w-3 h-3 theme-text-accent" />
                              </button>
                              {conversation.lastMessageTime && (
                                <span className="text-xs theme-text-accent">
                                  {formatTime(conversation.lastMessageTime.toString())}
                                </span>
                              )}
                            </div>
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-sm theme-text-secondary truncate">
                              {conversation.lastMessage}
                            </p>
                          )}
                          {/* Display chat tags */}
                          {conversation.tags && conversation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 overflow-visible">
                              {conversation.tags.map((tag) => (
                                <div key={tag.id}>
                                  <TagPill id={tag.id} name={tag.name} color={tag.color} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              // Users list
              <div>
                {!isClient ? (
                  <div className="p-4 text-center theme-text-accent">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                    <p className="theme-text-secondary">Loading...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-4 text-center theme-text-secondary">
                    {searchTerm ? 'No users found' : 'No users available'}
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 border-b theme-border-primary hover:theme-bg-secondary transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={() => onNewChat()}
                          className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-md cursor-pointer"
                        >
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-visible">
                          <div className="flex items-center justify-between">
                            <h3 
                              onClick={() => onNewChat()}
                              className="text-sm font-medium theme-text-primary truncate cursor-pointer"
                            >
                              {contact.name}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openContactTagManager(contact);
                              }}
                              className="p-1 hover:bg-gray-500/20 rounded transition-colors"
                              title="Manage Tags"
                            >
                              <Tag className="w-4 h-4 theme-text-accent" />
                            </button>
                          </div>
                          <p 
                            onClick={() => onNewChat()}
                            className="text-sm theme-text-secondary truncate cursor-pointer"
                          >
                            {contact.phone}
                          </p>
                          {/* Display contact tags */}
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 overflow-visible">
                              {contact.tags.map((tag) => (
                                <div key={tag.id}>
                                  <TagPill id={tag.id} name={tag.name} color={tag.color} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Bulk Message Side Popup */}
          {showBulkMessage && (
            <div className="fixed inset-0 bg-black/50 z-50">
              <div className="absolute left-0 top-0 h-full w-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Bulk Message</h3>
                    <button
                      onClick={() => setShowBulkMessage(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                <div className="space-y-4">
                  {/* Message Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={bulkMessage}
                      onChange={(e) => setBulkMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Contact Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Contacts ({selectedContacts.length} selected)
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={selectAllContacts}
                          className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-900 rounded text-white transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearSelection}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      {Contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            selectedContacts.includes(contact.id) ? 'bg-gray-500/20' : ''
                          }`}
                          onClick={() => toggleContactSelection(contact.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 border-2 rounded ${
                              selectedContacts.includes(contact.id) 
                                ? 'bg-gray-800 border-gray-800' 
                                : 'border-gray-400'
                            }`}>
                              {selectedContacts.includes(contact.id) && (
                                <div className="w-full h-full bg-white rounded-sm scale-50"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowBulkMessage(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendBulkMessage}
                      disabled={!bulkMessage.trim() || selectedContacts.length === 0}
                      className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send to {selectedContacts.length}</span>
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Tag Manager Popup - Side Slide */}
          {showContactTagManager && selectedContactForTags && (
            <div className="fixed inset-0 bg-black/50 z-50">
              <div className="absolute left-0 top-0 h-full w-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Manage Tags for {selectedContactForTags.name}
                    </h3>
                    <button
                      onClick={() => setShowContactTagManager(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                <div className="space-y-4">
                  {/* Current Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current Tags</h4>
                    {selectedContactForTags.tags && selectedContactForTags.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedContactForTags.tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                            <button
                              onClick={() => removeTagFromContact(selectedContactForTags.id, tag.id)}
                              className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No tags assigned</p>
                    )}
                  </div>

                  {/* Available Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Available Tags</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableTags
                        .filter(tag => !selectedContactForTags.tags?.some(t => t.id === tag.id))
                        .map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => assignTagToContact(selectedContactForTags.id, tag.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            ></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{tag.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{tag.status}</p>
                            </div>
                          </div>
                          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                            <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowContactTagManager(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Tag Management Popup - Side Slide */}
          {showTagManagement && (
            <div className="fixed inset-0 bg-black/50 z-50">
              <div className="absolute left-0 top-0 h-full w-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Tags</h3>
                    <button
                      onClick={() => setShowTagManagement(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                <div className="space-y-4">
                  {/* Add New Tag */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Tag</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Tag name"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="newTagName"
                      />
                      <button
                        onClick={async () => {
                          const name = (document.getElementById('newTagName') as HTMLInputElement)?.value;
                          if (name) {
                            try {
                              await addTag(name);
                              (document.getElementById('newTagName') as HTMLInputElement).value = '';
                            } catch (error) {
                              console.error('Failed to create tag:', error);
                            }
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>

                  {/* Existing Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Existing Tags</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableTags.map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            ></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{tag.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{tag.status}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={async () => {
                                try {
                                  await deleteTag(tag.id);
                                } catch (error) {
                                  console.error('Failed to delete tag:', error);
                                }
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                              title="Delete"
                            >
                              <X className="w-3 h-3 text-red-500 dark:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowTagManagement(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Tag Manager Popup - Side Slide */}
          {showChatTagManager && selectedChatForTags && (
            <div className="fixed inset-0 bg-black/50 z-50">
              <div className="absolute left-0 top-0 h-full w-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Manage Tags for {selectedChatForTags.name}
                    </h3>
                    <button
                      onClick={() => setShowChatTagManager(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Current Tags */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current Tags</h4>
                      {selectedChatForTags.tags && selectedChatForTags.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedChatForTags.tags.map((tag) => (
                            <div
                              key={tag.id}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                              <button
                                onClick={() => removeTagFromChat(selectedChatForTags.id, tag.id)}
                                className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No tags assigned</p>
                      )}
                    </div>

                    {/* Available Tags */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Available Tags</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableTags
                          .filter(tag => !selectedChatForTags.tags?.some(t => t.id === tag.id))
                          .map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => assignTagToChat(selectedChatForTags.id, tag.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              ></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{tag.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{tag.status}</p>
                              </div>
                            </div>
                            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                              <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => setShowChatTagManager(false)}
                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

           {/* Create Tag Side Dialog */}
           {showCreateTagDialog && (
             <div className="fixed inset-0 bg-black/50 z-50">
               <div className="absolute left-0 top-0 h-full w-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
                 <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Tag</h3>
                    <button
                      onClick={() => {
                        setShowCreateTagDialog(false);
                        setNewTagName('');
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tag Name
                    </label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter tag name..."
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTag();
                        }
                      }}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowCreateTagDialog(false);
                        setNewTagName('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim() || isCreatingTag}
                      className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center justify-center space-x-2"
                    >
                      {isCreatingTag ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Tag className="w-4 h-4" />
                          <span>Create Tag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
        </>
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
                    setSelectedChatToAssign(null);
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
                    setSelectedChatToAssign(null);
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

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreateChat={handleCreateNewChat}
      />
    </div>
  );
};