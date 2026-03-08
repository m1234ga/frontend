'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Users, UserPlus, PhoneCall } from 'lucide-react';
import Chat from '@/components/chat/ChatRouters';

interface ContactItem {
  phone: string;
  lid?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  pushName?: string;
  businessName?: string;
  isMyContact?: boolean;
  isLead?: boolean;
}

type ContactTypeFilter = 'all' | 'contact' | 'lead';
type ContactSort = 'name' | 'phone';

export default function ContactsPage() {
  const { token, authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const chatRouter = useMemo(() => Chat(token || ''), [token]);

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactTypeFilter>('all');
  const [sortBy, setSortBy] = useState<ContactSort>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chatRouter.GetContacts();
      const list = Array.isArray(data) ? data : [];

      const normalized = list
        .map((item: unknown) => {
          const entry = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
          return {
            phone: String(entry.phone || ''),
            lid: entry.lid ? String(entry.lid) : undefined,
            name: entry.name ? String(entry.name) : undefined,
            fullName: entry.fullName ? String(entry.fullName) : undefined,
            firstName: entry.firstName ? String(entry.firstName) : undefined,
            pushName: entry.pushName ? String(entry.pushName) : undefined,
            businessName: entry.businessName ? String(entry.businessName) : undefined,
            isMyContact: Boolean(entry.isMyContact),
            isLead: Boolean(entry.isLead),
          } as ContactItem;
        })
        .filter((c) => c.phone);

      setContacts(normalized);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [chatRouter]);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/auth');
      return;
    }

    if (authenticated) {
      fetchContacts();
    }
  }, [authenticated, authLoading, router, fetchContacts]);

  const filteredContacts = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();

    let result = [...contacts];
    if (typeFilter === 'contact') {
      result = result.filter((c) => !!c.isMyContact);
    } else if (typeFilter === 'lead') {
      result = result.filter((c) => !!c.isLead);
    }

    if (lower) {
      result = result.filter((c) => {
        return [c.name, c.fullName, c.firstName, c.pushName, c.businessName, c.phone]
          .some((value) => String(value || '').toLowerCase().includes(lower));
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'phone') {
        return String(a.phone || '').localeCompare(String(b.phone || ''));
      }
      const nameA = a.fullName || a.firstName || a.pushName || a.businessName || a.name || a.phone;
      const nameB = b.fullName || b.firstName || b.pushName || b.businessName || b.name || b.phone;
      return String(nameA || '').localeCompare(String(nameB || ''));
    });

    return result;
  }, [contacts, searchTerm, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + rowsPerPage);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const pages: number[] = [];
    const half = Math.floor(maxButtons / 2);

    let start = Math.max(1, safePage - half);
    const end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  }, [safePage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, sortBy, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (authLoading || loading) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Loading contacts...</p>
        </div>
      </div>
    );
  }

  const contactCount = contacts.filter((c) => c.isMyContact).length;
  const leadCount = contacts.filter((c) => c.isLead).length;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-gray-600 dark:text-gray-400">Dedicated contact list screen with search and filters.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{contacts.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">My Contacts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{contactCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-semibold">Leads</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{leadCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or phone"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${typeFilter === 'all' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('contact')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${typeFilter === 'contact' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                Contacts
              </button>
              <button
                onClick={() => setTypeFilter('lead')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${typeFilter === 'lead' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                Leads
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ContactSort)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="name">Sort: Name</option>
                <option value="phone">Sort: Phone</option>
              </select>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <button
                onClick={fetchContacts}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-semibold"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No contacts found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/60">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Phone</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Type</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedContacts.map((contact) => {
                      const displayName = contact.fullName || contact.firstName || contact.pushName || contact.businessName || contact.name || contact.phone;

                      return (
                        <tr key={`${contact.phone}-${contact.lid || ''}`} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[260px] truncate">{displayName}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{contact.phone}</td>
                          <td className="px-4 py-3">
                            {contact.isMyContact ? (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Contact</span>
                            ) : contact.isLead ? (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Lead</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Unknown</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => router.push(`/chat?contact=${encodeURIComponent(contact.phone)}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-semibold"
                            >
                              <PhoneCall className="w-4 h-4" />
                              Chat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredContacts.length)} of {filteredContacts.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
                  >
                    Prev
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${page === safePage ? 'bg-emerald-500 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
