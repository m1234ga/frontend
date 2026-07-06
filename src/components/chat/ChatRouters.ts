'use client';
import type { ChatMessage } from '../../../../Shared/Models';

const baseApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/').replace(/\/$/, '');
const apiUrl = baseApiUrl + '/api/chat/api';
export default function Chat(token: string) {
  async function GetContacts() {
    try {

      const response = await fetch(apiUrl + '/GetContacts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // ✅ Add the token here
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();

      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return "Erorr"
    }
  };

  async function GetCleanedContacts() {
    try {
      const response = await fetch(apiUrl + '/GetCleanedContacts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching cleaned contacts:', error);
      return "Error";
    }
  };

  async function GetChats() {
    try {
      const response = await fetch(apiUrl + '/GetChats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ Add the token here
        }
      });
      if (response.ok) {
        return await response.json();

      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return "Erorr"
    }
  };

  async function GetChatsPage(page = 1, limit = 200, status?: string, tab?: string) {
    try {
      const url = new URL(apiUrl + '/GetChatsPage');
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      if (status) url.searchParams.set('status', status);
      if (tab) url.searchParams.set('tab', tab);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        return await response.json();
      } else {
        // Try to decode error body for diagnostics
        let body: string | null = null;
        try { body = await response.text(); } catch { /* ignore */ }
        console.error('GetChatsPage failed', { status: response.status, body });
        // Return a predictable shape so callers can display an error
        return { error: `Request failed with status ${response.status}`, details: body } as { error: string; details: string | null };
      }
    } catch (error) {
      console.error('Error fetching chats page:', error);
      return null;
    }
  }

  async function UpdateContactTags(contactId: string, tags: string[]) {
    try {
      const response = await fetch(apiUrl + `/UpdateContactTags/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tags })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to update contact tags');
      }
    } catch (error) {
      console.error('Error updating contact tags:', error);
      throw error;
    }
  }
  async function GetWuzUserInfo(phones: string | string[]) {
    try {
      const phoneArray = Array.isArray(phones) ? phones : [phones];
      const response = await fetch(`${apiUrl}/user/info`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Phone: phoneArray })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching Wuz user info:', error);
      return "Error";
    }
  }

  async function GetWuzProfile(phone: string) {
    try {
      const response = await fetch(`${apiUrl}/GetWuzProfile/${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }

      throw new Error('Failed to fetch Wuz profile');
    } catch (error) {
      console.error('Error fetching Wuz profile:', error);
      throw error;
    }
  }

  async function GetUserLid(phone: string) {
    try {
      const response = await fetch(`${apiUrl}/GetUserLid/${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Error fetching user LID:', error);
      return null;
    }
  }

  // Session actions
  async function GetSessionStatus() {
    const response = await fetch(`${apiUrl}/settings/session/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch session status');
    return response.json();
  }

  async function ConnectSession(subscribe?: string[], immediate: boolean = true) {
    const response = await fetch(`${apiUrl}/settings/session/connect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Subscribe: Array.isArray(subscribe) && subscribe.length > 0 ? subscribe : ['Message', 'ReadReceipt', 'HistorySync', 'ChatPresence'],
        Immediate: immediate
      })
    });
    if (!response.ok) throw new Error('Failed to connect session');
    return response.json();
  }

  async function DisconnectSession() {
    const response = await fetch(`${apiUrl}/settings/session/disconnect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to disconnect session');
    return response.json();
  }

  async function LogoutSession() {
    const response = await fetch(`${apiUrl}/settings/session/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to logout session');
    return response.json();
  }

  async function GetSessionQr() {
    const response = await fetch(`${apiUrl}/settings/session/qr`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch session QR');
    return response.json();
  }

  // Group actions
  async function GetGroupsList() {
    const response = await fetch(`${apiUrl}/settings/groups/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to list groups');
    return response.json();
  }

  async function GetGroupInfo(groupJid: string) {
    const response = await fetch(`${apiUrl}/settings/groups/info?groupJid=${encodeURIComponent(groupJid)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to get group info');
    return response.json();
  }

  async function GetGroupInviteLink(groupJid: string) {
    const response = await fetch(`${apiUrl}/settings/groups/invite-link?groupJid=${encodeURIComponent(groupJid)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to get group invite link');
    return response.json();
  }

  async function CreateGroup(name: string, participants: string[]) {
    const response = await fetch(`${apiUrl}/settings/groups/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, participants })
    });
    if (!response.ok) throw new Error('Failed to create group');
    return response.json();
  }

  async function SetGroupName(groupJid: string, name: string) {
    const response = await fetch(`${apiUrl}/settings/groups/name`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupJid, name })
    });
    if (!response.ok) throw new Error('Failed to set group name');
    return response.json();
  }

  async function SetGroupPhoto(groupJid: string, image: string) {
    const response = await fetch(`${apiUrl}/settings/groups/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupJid, image })
    });
    if (!response.ok) throw new Error('Failed to set group photo');
    return response.json();
  }

  async function RemoveGroupPhoto(groupJid: string) {
    const response = await fetch(`${apiUrl}/settings/groups/photo/remove`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupJid })
    });
    if (!response.ok) throw new Error('Failed to remove group photo');
    return response.json();
  }

  async function SetGroupLocked(groupJid: string, locked: boolean) {
    const response = await fetch(`${apiUrl}/settings/groups/locked`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupJid, locked })
    });
    if (!response.ok) throw new Error('Failed to set group locked status');
    return response.json();
  }

  async function SetGroupEphemeral(groupJid: string, duration: '24h' | '7d' | '90d' | 'off') {
    const response = await fetch(`${apiUrl}/settings/groups/ephemeral`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupJid, duration })
    });
    if (!response.ok) throw new Error('Failed to set group ephemeral duration');
    return response.json();
  }

  async function SetGroupParticipants(groupJid: string, participants: string[]) {
    const response = await fetch(`${apiUrl}/settings/groups/participants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupJid, participants })
    });
    if (!response.ok) throw new Error('Failed to set group participants');
    return response.json();
  }

  async function DeleteGroup(groupJid: string) {
    const response = await fetch(`${apiUrl}/settings/groups/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupJid })
    });
    if (!response.ok) throw new Error('Failed to delete group');
    return response.json();
  }
  async function GetMessagesById(id: string, limit: number = 10, before?: string, beforeId?: string) {
    try {
      const url = new URL(`${apiUrl}/GetMessages/${id}`);
      url.searchParams.set('limit', String(limit));
      if (before) {
        url.searchParams.set('before', before);
      }
      if (beforeId) {
        url.searchParams.set('beforeId', beforeId);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.messages || data; // Support both new format (with messages) and old format
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      return "Error"
    }
  };
  async function SendImage(phone: string, imageFile: File, caption?: string, replyToId?: string) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('phone', phone);
      if (caption) formData.append('message', caption);
      if (replyToId) formData.append('replyToId', replyToId);

      const response = await fetch(apiUrl + '/sendImage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error sending image:', error);
      return "Error";
    }
  };

  async function SendVideo(phone: string, videoFile: File, caption?: string, replyToId?: string) {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('phone', phone);
      if (caption) formData.append('message', caption);
      if (replyToId) formData.append('replyToId', replyToId);

      const response = await fetch(apiUrl + '/sendVideo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error sending video:', error);
      return "Error";
    }
  };

  async function SendAudio(phone: string, audioFile: File, replyToId?: string, seconds?: number, waveform?: number[]) {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('phone', phone);
      if (replyToId) formData.append('replyToId', replyToId);
      if (seconds) formData.append('seconds', seconds.toString());
      if (waveform) formData.append('waveform', JSON.stringify(waveform));

      const response = await fetch(apiUrl + '/sendAudio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      return "Error";
    }
  };

  async function GetTags() {
    try {
      const response = await fetch(apiUrl + '/GetTags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  async function CreateTag(name: string) {
    try {
      const response = await fetch(apiUrl + '/CreateTag', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  async function DeleteTag(id: string) {
    try {
      const response = await fetch(apiUrl + `/DeleteTag/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  // Chat tag management functions
  async function AssignTagToChat(chatId: string, tagId: string, createdBy: string) {
    try {
      const response = await fetch(apiUrl + '/AssignTagToChat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId, tagId, createdBy })
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign tag to chat');
      }
    } catch (error) {
      console.error('Error assigning tag to chat:', error);
      throw error;
    }
  }

  async function RemoveTagFromChat(chatId: string, tagId: string) {
    try {
      const response = await fetch(apiUrl + `/RemoveTagFromChat/${chatId}/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove tag from chat');
      }
    } catch (error) {
      console.error('Error removing tag from chat:', error);
      throw error;
    }
  }

  async function GetChatTags(chatId: string) {
    try {
      const response = await fetch(apiUrl + `/GetChatTags/${chatId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chat tags');
      }
    } catch (error) {
      console.error('Error fetching chat tags:', error);
      throw error;
    }
  }

  async function GetChatsWithTags() {
    try {
      const response = await fetch(apiUrl + '/GetChatsWithTags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chats with tags');
      }
    } catch (error) {
      console.error('Error fetching chats with tags:', error);
      throw error;
    }
  }

  // Chat status management
  async function UpdateChatStatus(chatId: string, status: 'open' | 'closed', reason?: string) {
    try {
      const response = await fetch(apiUrl + `/UpdateChatStatus/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to update chat status');
      }
    } catch (error) {
      console.error('Error updating chat status:', error);
      throw error;
    }
  }

  async function RefreshChatAvatar(chatId: string, phone: string) {
    try {
      const response = await fetch(apiUrl + `/RefreshChatAvatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId, phone })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to refresh chat avatar');
      }
    } catch (error) {
      console.error('Error refreshing chat avatar:', error);
      throw error;
    }
  }

  // Mark chat as read
  async function MarkChatAsRead(chatId: string) {
    try {
      const response = await fetch(apiUrl + `/MarkChatAsRead/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to mark chat as read');
      }
    } catch (error) {
      console.error('Error marking chat as read:', error);
      throw error;
    }
  }

  // User management for assignment
  async function GetUsers() {
    try {
      const response = await fetch(baseApiUrl + `/api/user-management`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.users || [];
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Chat assignment
  async function AssignChat(chatId: string, assignedTo: string, assignedBy: string) {
    try {
      const response = await fetch(apiUrl + `/AssignChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, assignedTo, assignedBy })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to assign chat');
      }
    } catch (error) {
      console.error('Error assigning chat:', error);
      throw error;
    }
  }

  // Message templates
  async function GetMessageTemplates() {
    try {
      const response = await fetch(apiUrl + `/GetMessageTemplates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch message templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  async function CreateMessageTemplate(name: string, content: string, createdBy: string, imageFile?: File) {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('content', content);
      formData.append('createdBy', createdBy);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(apiUrl + `/CreateMessageTemplate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create message template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async function UpdateMessageTemplate(id: string, name: string, content: string) {
    try {
      const response = await fetch(apiUrl + `/UpdateMessageTemplate/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, content })
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update message template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async function DeleteMessageTemplate(id: string) {
    try {
      const response = await fetch(apiUrl + `/DeleteMessageTemplate/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete message template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // Message operations
  async function ForwardMessage(originalMessage: ChatMessage, targetChatId: string, senderId: string) {
    try {
      const response = await fetch(apiUrl + `/ForwardMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          originalMessage,
          targetChatId,
          senderId
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to forward message');
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      throw error;
    }
  }

  async function ReplyToMessage(originalMessageId: string, replyMessage: string, chatId: string, senderId: string) {
    try {
      const response = await fetch(apiUrl + `/ReplyToMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          originalMessageId,
          replyMessage,
          chatId,
          senderId
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to reply to message');
      }
    } catch (error) {
      console.error('Error replying to message:', error);
      throw error;
    }
  }

  async function EditMessage(msg: ChatMessage, newMessage: string) {
    try {
      const messageId = msg.id;
      const response = await fetch(apiUrl + `/EditMessage/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...msg,
          message: newMessage,
          newMessage,
          Id: messageId,
          Body: newMessage,
          Phone: msg.contactId || msg.chatId
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  async function AddNoteToMessage(messageId: string, note: string) {
    try {
      const response = await fetch(apiUrl + `/AddNoteToMessage/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to add note to message');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  async function PinMessage(messageId: string, isPinned: boolean) {
    try {
      const response = await fetch(apiUrl + `/PinMessage/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPinned })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to pin message');
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      throw error;
    }
  }

  async function AddReaction(messageId: string, userId: string, emoji: string, phone: string) {
    try {
      const response = await fetch(apiUrl + `/AddReaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId,
          userId,
          emoji,
          phone
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  async function DeleteMessage(msg: ChatMessage) {
    try {
      const messageId = msg.id;
      const response = await fetch(apiUrl + `/DeleteMessage/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...msg,
          Id: messageId,
          Phone: msg.contactId || msg.chatId
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Chat archive and filter functions
  async function GetArchivedChats(userId: string) {
    try {
      const response = await fetch(apiUrl + `/GetArchivedChats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch archived chats');
      }
    } catch (error) {
      console.error('Error fetching archived chats:', error);
      throw error;
    }
  }

  async function GetAssignedChats(userId: string) {
    try {
      const response = await fetch(apiUrl + `/GetAssignedChats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch assigned chats');
      }
    } catch (error) {
      console.error('Error fetching assigned chats:', error);
      throw error;
    }
  }

  async function GetChatsByStatus(status: 'open' | 'closed') {
    try {
      const response = await fetch(apiUrl + `/GetChatsByStatus/${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to fetch ${status} chats`);
      }
    } catch (error) {
      console.error(`Error fetching ${status} chats:`, error);
      throw error;
    }
  }

  async function ArchiveChat(chatId: string, userId: string) {
    try {
      const response = await fetch(apiUrl + `/ArchiveChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, userId })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to archive chat');
      }
    } catch (error) {
      console.error('Error archiving chat:', error);
      throw error;
    }
  }

  async function UnarchiveChat(chatId: string, userId: string) {
    try {
      const response = await fetch(apiUrl + `/UnarchiveChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, userId })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to unarchive chat');
      }
    } catch (error) {
      console.error('Error unarchiving chat:', error);
      throw error;
    }
  }

  async function MuteChat(chatId: string, userId: string) {
    try {
      const response = await fetch(apiUrl + `/MuteChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, userId })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to mute chat');
      }
    } catch (error) {
      console.error('Error muting chat:', error);
      throw error;
    }
  }

  async function UnmuteChat(chatId: string, userId: string) {
    try {
      const response = await fetch(apiUrl + `/UnmuteChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, userId })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to unmute chat');
      }
    } catch (error) {
      console.error('Error unmuting chat:', error);
      throw error;
    }
  }

  async function CreateNewChat(contactId: string, userId: string) {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/CreateNewChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contactId, userId })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to create chat');
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
  }

  return {
    GetContacts,
    GetCleanedContacts,
    GetChats,
    GetMessagesById,
    SendImage,
    SendVideo,
    SendAudio,
    UpdateContactTags,
    GetTags,
    CreateTag,
    DeleteTag,
    AssignTagToChat,
    RemoveTagFromChat,
    GetChatTags,
    GetChatsWithTags,
    UpdateChatStatus,
    MarkChatAsRead,
    GetUsers,
    AssignChat,
    GetMessageTemplates,
    CreateMessageTemplate,
    UpdateMessageTemplate,
    DeleteMessageTemplate,
    ForwardMessage,
    ReplyToMessage,
    EditMessage,
    AddNoteToMessage,
    PinMessage,
    AddReaction,
    DeleteMessage,
    GetArchivedChats,
    GetAssignedChats,
    GetChatsByStatus,
    ArchiveChat,
    UnarchiveChat,
    MuteChat,
    UnmuteChat,
    CreateNewChat,
    GetChatsPage,
    RefreshChatAvatar,
    GetWuzUserInfo,
    GetWuzProfile,
    GetUserLid,
    GetSessionStatus,
    ConnectSession,
    DisconnectSession,
    LogoutSession,
    GetSessionQr,
    GetGroupsList,
    GetGroupInfo,
    GetGroupInviteLink,
    CreateGroup,
    SetGroupName,
    SetGroupPhoto,
    RemoveGroupPhoto,
    SetGroupLocked,
    SetGroupEphemeral,
    SetGroupParticipants,
    DeleteGroup
  }
}

