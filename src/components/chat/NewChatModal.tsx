import React, { useState, useMemo } from 'react';
import { X, Phone, User, MessageSquare, Search, Send } from 'lucide-react';
import { Contact } from '../../../../Shared/Models';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (phoneNumber: string, message: string) => Promise<void> | void;
  contacts?: Contact[];
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
  contacts = []
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts.slice(0, 50);
    const lower = searchTerm.toLowerCase();
    const includesLower = (value: unknown) => String(value ?? '').toLowerCase().includes(lower);
    return contacts.filter(c =>
      includesLower(c.name) ||
      includesLower(c.phone)
    );
  }, [contacts, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    // Basic phone number validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      alert('Please enter a valid phone number');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateChat(cleanPhone, message.trim());
      onClose();
      setPhoneNumber('');
      setMessage('');
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setPhoneNumber(contact.phone);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-soft-popup"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-soft-primary/10 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-soft-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                New Message
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Send a direct message to a contact or number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Side: Contact List Selection */}
          <div className="w-full md:w-5/12 flex flex-col border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
            <div className="p-4 bg-white dark:bg-gray-900/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-700 rounded-xl transition-all text-sm text-gray-900 dark:text-white shadow-inner"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-gray-500 font-medium">No contacts found</p>
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left ${phoneNumber === contact.phone
                        ? 'bg-soft-primary text-white shadow-md'
                        : 'hover:bg-white dark:hover:bg-gray-800 theme-text-primary'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${phoneNumber === contact.phone ? 'bg-white/20' : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
                      }`}>
                      <User className={`w-5 h-5 ${phoneNumber === contact.phone ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${phoneNumber === contact.phone ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {contact.name || contact.phone}
                      </p>
                      <p className={`text-xs truncate ${phoneNumber === contact.phone ? 'text-white/80' : 'text-gray-500'}`}>
                        {contact.phone}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Message Input */}
          <div className="w-full md:w-7/12 p-8 flex flex-col bg-white dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="space-y-6 flex-1">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Message Details</h4>

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">
                    To Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 1234567890"
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-soft-primary focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Message Content */}
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">
                    Your Message
                  </label>
                  <div className="relative flex-1 min-h-[150px]">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full h-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-soft-primary focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={!phoneNumber.trim() || !message.trim() || isCreating}
                  className="w-full py-4 bg-soft-primary hover:bg-soft-primary-dark disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-xl shadow-soft-primary/20 font-black uppercase tracking-widest flex items-center justify-center space-x-3 active:scale-[0.98]"
                >
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
                <div className="mt-4 flex items-center justify-center space-x-2 text-[10px] text-gray-400">
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <p>Includes country code</p>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <p>Encrypted delivery</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
