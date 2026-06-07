import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { Activity, Clock, Inbox, AlertTriangle, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface Props {
  dateRange: string;
}

export default function OperationsDashboard({ dateRange }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState({
    volume: null as any,
    sla: null as any,
    workload: null as any,
    peakHours: null as any
  });
  const [loading, setLoading] = useState(true);

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

        const [volRes, slaRes, workRes, peakRes] = await Promise.all([
          fetch(`${baseUrl}/api/reports/volume?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/sla?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/workload?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/peak-hours?dateRange=${dateRange}`, { headers })
        ]);

        setData({
          volume: volRes.ok ? await volRes.json() : null,
          sla: slaRes.ok ? await slaRes.json() : null,
          workload: workRes.ok ? await workRes.json() : null,
          peakHours: peakRes.ok ? await peakRes.json() : null
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [dateRange, token]);

  const exportOperationsDataToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Volume Trends
    const volRows = (data.volume?.trends || []).map((t: any) => ({
      'Date': t.date ? new Date(t.date).toLocaleDateString() : '',
      'Chat Volume': t.count,
    }));
    const wsVol = XLSX.utils.json_to_sheet(volRows);
    XLSX.utils.book_append_sheet(wb, wsVol, 'Volume Trends');

    // Sheet 2: SLA Statistics
    const slaRows = [
      { 'Metric': 'Compliance Rate (%)', 'Value': data.sla?.complianceRate || 0 },
      { 'Metric': 'Within SLA Chats', 'Value': data.sla?.withinSla || 0 },
      { 'Metric': 'Breached SLA Chats', 'Value': data.sla?.breachedSla || 0 },
      { 'Metric': 'Avg First Response Time (min)', 'Value': data.sla?.avgFrt || 0 },
      { 'Metric': 'Avg Resolution Time (min)', 'Value': data.sla?.avgArt || 0 }
    ];
    const wsSla = XLSX.utils.json_to_sheet(slaRows);
    XLSX.utils.book_append_sheet(wb, wsSla, 'SLA Statistics');

    // Sheet 3: Queue Trends
    const queueRows = (data.workload?.queueTrends || []).map((t: any) => ({
      'Date': t.date ? new Date(t.date).toLocaleDateString() : '',
      'Queue Size': t.queueSize,
    }));
    const wsQueue = XLSX.utils.json_to_sheet(queueRows);
    XLSX.utils.book_append_sheet(wb, wsQueue, 'Queue Trends');

    // Sheet 4: Peak Hours
    const peakRows = (data.peakHours?.hourly || []).map((h: any) => ({
      'Hour': `${h.hour}:00`,
      'Chats Count': h.chatsCount,
    }));
    const wsPeak = XLSX.utils.json_to_sheet(peakRows);
    XLSX.utils.book_append_sheet(wb, wsPeak, 'Peak Hours');

    XLSX.writeFile(wb, `operations-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-1">
            {label}
          </p>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Operations Dashboard</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Real-time status of queues, volume, and SLA compliance.</p>
        </div>
        <button
          onClick={exportOperationsDataToExcel}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export All Data
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl"><Activity className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Chats</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.volume?.metrics?.totalChats || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><Inbox className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Open Chats</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.volume?.metrics?.openChats || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Waiting in Queue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.workload?.waitingInQueue || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none relative overflow-hidden transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-indigo-50 dark:to-indigo-500/10 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">SLA Compliance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.sla?.complianceRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Volume Trend */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">Chat Volume Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.volume?.trends || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} className="dark:stroke-slate-700" />
                <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(v) => v ? new Date(v).toLocaleDateString() : ''} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Chat Volume" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Breakdown */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">SLA Status</h3>
          <div className="flex flex-col justify-center h-72 gap-6">
            <div>
              <div className="flex justify-between mb-2 text-sm font-medium">
                <span className="text-emerald-600 dark:text-emerald-400">Within SLA ({data.sla?.withinSla || 0})</span>
                <span className="text-rose-600 dark:text-rose-400">Breached ({data.sla?.breachedSla || 0})</span>
              </div>
              <div className="h-4 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${data.sla?.complianceRate || 0}%` }}
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${100 - (data.sla?.complianceRate || 0)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-transparent">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Avg First Response Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-200">{data.sla?.avgFrt || 0} min</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-transparent">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-200">{data.sla?.avgArt || 0} min</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Trends */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">Queue Size Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workload?.queueTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} className="dark:stroke-slate-700" />
                <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(v) => v ? new Date(v).toLocaleDateString() : ''} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="queueSize" name="Queue Size" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Traffic */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">Traffic by Hour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours?.hourly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} className="dark:stroke-slate-700" />
                <XAxis dataKey="hour" stroke="#94a3b8" tickFormatter={(v) => `${v}:00`} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="chatsCount" name="Chats Count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
