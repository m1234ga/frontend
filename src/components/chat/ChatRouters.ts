'use client';
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/') + 'Chat/api';
export default function Chat(token:string){
  async function GetContacts  () {
    try {
      
      const response = await fetch( apiUrl+'/GetContacts', {
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
  
  async function GetChats  () {
    try {
      const response = await fetch( apiUrl+'/GetChats', {
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
  async function GetMessagesById  (id:string) {
    try {
      const response = await fetch( apiUrl+'/GetMessages/'+id, {
        method:"GET",
        headers: {
          'Authorization': `Bearer ${token}`, // ✅ Add the token here
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();
        
      }
    } catch (error) {
      console.error('Error fetching Conf:', error);
      return "Erorr"
    }
  };
  async function SendImage(phone: string, imageFile: File, caption?: string) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('phone', phone);
      if (caption) formData.append('message', caption);

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

  async function SendVideo(phone: string, videoFile: File, caption?: string) {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('phone', phone);
      if (caption) formData.append('message', caption);

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

  async function SendAudio(phone: string, audioFile: File) {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('phone', phone);

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

  // User management for assignment
  async function GetUsers() {
    try {
      const response = await fetch(apiUrl + `/users`, {
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

  async function EditMessage(messageId: string, newMessage: string) {
    try {
      const response = await fetch(apiUrl + `/EditMessage/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newMessage })
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

  async function AddReaction(messageId: string, userId: string, reaction: string) {
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
          reaction
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

  async function DeleteMessage(messageId: string) {
    try {
      const response = await fetch(apiUrl + `/DeleteMessage/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/CreateNewChat`, {
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
    GetUsers,
    AssignChat,
    GetMessageTemplates,
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
    CreateNewChat
}
}

