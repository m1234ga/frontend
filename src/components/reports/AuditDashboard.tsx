import React, { useEffect, useState } from 'react';
import { ShieldCheck, User as UserIcon, Clock, HardDrive, Search, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

export default function AuditDashboard() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const baseUrl = rawBaseUrl.replace(/\/$/, '');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const res = await fetch(`${baseUrl}/api/reports/audit?page=${page}&limit=50`, { headers });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAudit();
  }, [page, token]);

  const filteredLogs = logs.filter(log => 
    (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.entityType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    const rows = filteredLogs.map((log: any) => ({
      'Timestamp': new Date(log.timestamp).toLocaleString(),
      'User': log.user || 'System',
      'Action': log.action,
      'Entity Type': log.entityType,
      'Entity ID': log.entityId,
      'Old Value': log.oldValue || '',
      'New Value': log.newValue || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    XLSX.writeFile(wb, `audit-logs-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Audit & Compliance
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">System-wide activity logs, security events, and change tracking.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm dark:shadow-none transition-colors"
            />
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto min-h-[500px]">
          {loading && logs.length === 0 ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-slate-900/80 text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Entity Type</th>
                  <th className="px-6 py-4 font-semibold">Entity ID</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 text-sm">
                {filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-gray-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        {log.user || 'System'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 shadow-sm dark:shadow-none">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        {log.entityType}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-transparent rounded px-2 mx-4">{log.entityId}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-xs">
                      {log.oldValue && <div><span className="text-rose-500 dark:text-rose-400 line-through mr-1 bg-rose-50 dark:bg-transparent px-1 rounded">{log.oldValue}</span></div>}
                      {log.newValue && <div><span className="text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-transparent px-1 rounded">{log.newValue}</span></div>}
                      {!log.oldValue && !log.newValue && '-'}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <ShieldCheck className="w-10 h-10 mb-3 opacity-20" />
                        <p>No audit logs found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
          <p className="text-sm text-gray-500 dark:text-slate-400">Showing page {page}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm dark:shadow-none transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < 50}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm dark:shadow-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
