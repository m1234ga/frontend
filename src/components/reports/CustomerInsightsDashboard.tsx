'use client';
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, Smile, Tag as TagIcon, Repeat, Download, Search, Clock, User, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface Props {
  dateRange: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function CustomerInsightsDashboard({ dateRange }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState({
    customers: null as any,
    tags: null as any,
    csat: null as any,
    chatTags: null as any,
  });
  const [loading, setLoading] = useState(true);
  const [tagSearch, setTagSearch] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('all');
  const [tagScope, setTagScope] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const baseUrl = rawBaseUrl.replace(/\/$/, '');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [custRes, tagsRes, csatRes, chatTagsRes] = await Promise.all([
          fetch(`${baseUrl}/api/reports/customers?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/tags?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/csat?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/chat-tags?dateRange=${dateRange}&scope=${tagScope}&limit=200`, { headers }),
        ]);

        setData({
          customers: custRes.ok ? await custRes.json() : null,
          tags: tagsRes.ok ? await tagsRes.json() : null,
          csat: csatRes.ok ? await csatRes.json() : null,
          chatTags: chatTagsRes.ok ? await chatTagsRes.json() : null,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [dateRange, token, tagScope]);

  const tagData = data.tags?.tags || [];
  const topTags = [...tagData].sort((a: any, b: any) => b.chatsPerTag - a.chatsPerTag).slice(0, 5);

  // Flat list of all individual tag assignments for the detail table
  const allTagAssignments: any[] = [];
  (data.chatTags?.taggedChats || []).forEach((chat: any) => {
    (chat.tags || []).forEach((tag: any) => {
      allTagAssignments.push({
        chatId: chat.chatId,
        chatName: chat.chatName,
        contactId: chat.contactId,
        status: chat.status,
        tagName: tag.tagName,
        taggedBy: tag.createdBy,
        taggedAt: tag.creationDate,
      });
    });
  });

  // Sort by most recent
  allTagAssignments.sort((a, b) => new Date(b.taggedAt).getTime() - new Date(a.taggedAt).getTime());

  // Filter by search
  const uniqueTagNames = [...new Set(allTagAssignments.map(a => a.tagName))];
  const filteredAssignments = allTagAssignments.filter(a => {
    const matchSearch = !tagSearch || 
      a.chatName?.toLowerCase().includes(tagSearch.toLowerCase()) ||
      a.tagName?.toLowerCase().includes(tagSearch.toLowerCase()) ||
      a.taggedBy?.toLowerCase().includes(tagSearch.toLowerCase());
    const matchTag = activeTagFilter === 'all' || a.tagName === activeTagFilter;
    return matchSearch && matchTag;
  });

  // Export handlers
  const exportTagActivityToExcel = () => {
    const rows = filteredAssignments.map(a => ({
      'Chat / Contact': a.chatName,
      'Contact ID': a.contactId,
      'Tag': a.tagName,
      'Tagged By': a.taggedBy,
      'Tagged At': a.taggedAt ? new Date(a.taggedAt).toLocaleString() : '',
      'Chat Status': a.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tag Activity');
    XLSX.writeFile(wb, `tag-activity-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportTopCustomersToExcel = () => {
    const rows = (data.customers?.topCustomers || []).map((c: any) => ({
      'Customer Name': c.name,
      'Total Chats': c.chats,
      'Total Messages': c.messages,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Top Customers');
    XLSX.writeFile(wb, `customers-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportTagDistributionToExcel = () => {
    const rows = tagData.map((t: any) => ({
      'Tag Name': t.tagName,
      'Chats': t.chatsPerTag,
      'Open Chats': t.openChats,
      'Closed Chats': t.closedChats,
      'Avg Resolution Time (min)': Math.round(t.avgArt || 0),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tag Distribution');
    XLSX.writeFile(wb, `tag-distribution-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill || '#3b82f6' }} />
              <span className="text-gray-600 dark:text-slate-400">{entry.name}:</span>
              <span className="font-semibold text-gray-900 dark:text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'closed': case 'resolved': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'pending': return 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Customer Insights</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Understand customer engagement, tag distributions, and satisfaction trends.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.customers?.totalCustomers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><Repeat className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Returning Customers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.customers?.returningCustomers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl"><Smile className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Positive Ratings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.csat?.positive || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><TagIcon className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Tagged Chats</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.chatTags?.summary?.taggedChats || topTags[0]?.chatsPerTag || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">Customer Engagement</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.customers?.engagementTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(v) => v ? new Date(v).toLocaleDateString() : ''} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="activeCustomers" name="Active Customers" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CSAT Trend */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">Satisfaction Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.csat?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(v) => v ? new Date(v).toLocaleDateString() : ''} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" domain={[0, 5]} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" name="CSAT Score" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tag Distribution + Active Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tag Distribution Pie */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Tag Distribution</h3>
            <button
              onClick={exportTagDistributionToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-100 dark:border-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          <div className="h-64 flex items-center">
            {topTags.length > 0 ? (
              <>
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={topTags} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="chatsPerTag" stroke="none">
                      {topTags.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-1/2 px-4 space-y-3">
                  {topTags.map((tag: any, i: number) => (
                    <div key={tag.tagId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-sm text-gray-600 dark:text-slate-300 truncate w-24 font-medium">{tag.tagName}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">{tag.chatsPerTag}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                <TagIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No tag data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Most Active Customers */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none overflow-hidden flex flex-col transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Most Active Customers</h3>
            <button
              onClick={exportTopCustomersToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-100 dark:border-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-3">
              {(data.customers?.topCustomers || []).slice(0, 5).map((customer: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold text-sm uppercase">
                      {customer.name?.substring(0, 2) || 'UK'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{customer.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5"><span className="font-medium text-gray-700 dark:text-slate-300">{customer.chats}</span> chats</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">{customer.messages}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">msgs</p>
                  </div>
                </div>
              ))}
              {!(data.customers?.topCustomers?.length) && (
                <div className="text-center text-gray-500 dark:text-slate-500 py-8 flex flex-col items-center justify-center">
                  <Users className="w-10 h-10 mb-3 opacity-20" />
                  <p>No active customers found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tag Analytics Table - Full Width */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Tag Activity Log</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Detailed record of which chats were tagged, by whom, and when</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Scope filter */}
              <select
                value={tagScope}
                onChange={(e) => setTagScope(e.target.value)}
                className="text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm dark:shadow-none"
              >
                <option value="all">All Users</option>
                <option value="mine">My Tags</option>
              </select>
              {/* Tag name filter */}
              <select
                value={activeTagFilter}
                onChange={(e) => setActiveTagFilter(e.target.value)}
                className="text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm dark:shadow-none"
              >
                <option value="all">All Tags</option>
                {uniqueTagNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 w-52 shadow-sm dark:shadow-none"
                />
              </div>
              {/* Export */}
              <button
                onClick={exportTagActivityToExcel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Summary row */}
        {data.chatTags?.summary && (
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-700/50 border-b border-gray-100 dark:border-slate-700/50">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{data.chatTags.summary.tagAssignments}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Total Tag Assignments</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{data.chatTags.summary.taggedChats}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Unique Chats Tagged</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{data.chatTags.summary.uniqueTags}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Unique Tags Used</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs uppercase text-gray-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Client / Chat</th>
                <th className="px-6 py-4 font-semibold">Contact ID</th>
                <th className="px-6 py-4 font-semibold">Tag Applied</th>
                <th className="px-6 py-4 font-semibold">Tagged By</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Chat Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 text-sm">
              {filteredAssignments.slice(0, 100).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {(row.chatName || '?').substring(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-slate-200 truncate max-w-[160px]">{row.chatName || row.chatId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-slate-400">{row.contactId || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                      <TagIcon className="w-3 h-3" />
                      {row.tagName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                      <span className="font-medium">{row.taggedBy || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                      <span>{row.taggedAt ? new Date(row.taggedAt).toLocaleString() : '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${statusColor(row.status)}`}>
                      {row.status || 'unknown'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                    <div className="flex flex-col items-center">
                      <TagIcon className="w-10 h-10 mb-3 opacity-20" />
                      <p>No tag activity found for this period.</p>
                      <p className="text-xs mt-1 text-gray-400 dark:text-slate-600">Try assigning tags to chats first.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredAssignments.length > 100 && (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700/50">
              Showing 100 of {filteredAssignments.length} records. Export to Excel for full data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
