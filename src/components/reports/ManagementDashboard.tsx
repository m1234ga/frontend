import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { Briefcase, TrendingUp, TrendingDown, Target, Star, Users, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface Props {
  dateRange: string;
}

export default function ManagementDashboard({ dateRange }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState({
    executive: null as any,
    volume: null as any,
    csat: null as any,
    performance: null as any
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

        const [execRes, volRes, csatRes, perfRes] = await Promise.all([
          fetch(`${baseUrl}/api/reports/executive?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/volume?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/csat?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/performance?dateRange=${dateRange}`, { headers })
        ]);

        setData({
          executive: execRes.ok ? await execRes.json() : null,
          volume: volRes.ok ? await volRes.json() : null,
          csat: csatRes.ok ? await csatRes.json() : null,
          performance: perfRes.ok ? await perfRes.json() : null
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [dateRange, token]);

  const exportTopAgentsToExcel = () => {
    const rows = (data.performance?.agentMetrics || []).map((agent: any) => ({
      'Agent Name': agent.agentName,
      'Total Assigned Chats': agent.totalAssignedChats,
      'Resolved Chats': agent.resolvedChats,
      'Open Chats': agent.openChats,
      'Avg Response Time (sec)': agent.responseTime,
      'Avg Resolution Time (sec)': agent.resolutionTime,
      'CSAT Score (%)': agent.customerSatisfaction,
      'Status': agent.isActive ? 'Online' : 'Offline',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agent Performance');
    XLSX.writeFile(wb, `management-agents-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const trendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
    return <Target className="w-4 h-4 text-gray-400 dark:text-slate-400" />;
  };

  const trendColor = (value: number) => {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (value < 0) return 'text-rose-600 dark:text-rose-400';
    return 'text-gray-500 dark:text-slate-400';
  };

  const agents = [...(data.performance?.agentMetrics || [])].sort((a, b) => b.resolved - a.resolved).slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-200 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Executive Dashboard</h2>
        <p className="text-gray-500 dark:text-slate-400 mt-1">High-level management overview of KPIs and system health.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Volume</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1">{data.executive?.totalChats || 0}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl"><Briefcase className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg">
            {trendIcon(data.volume?.metrics?.chatGrowthTrend)}
            <span className={`font-semibold ${trendColor(data.volume?.metrics?.chatGrowthTrend)}`}>
              {data.volume?.metrics?.chatGrowthTrend}%
            </span>
            <span className="text-gray-500 dark:text-slate-500">vs previous period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">CSAT Score</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1">{data.executive?.csatScore || '0.0'}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl"><Star className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg">
            <Target className="w-4 h-4 text-gray-400 dark:text-slate-400" />
            <span className="text-gray-500 dark:text-slate-400">Based on <span className="font-semibold text-gray-700 dark:text-slate-300">{data.csat?.totalRatings || 0}</span> ratings</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Active Agents</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1">{data.executive?.activeAgents || 0}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><Users className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
            <span className="text-gray-500 dark:text-slate-500">currently resolving chats</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none relative overflow-hidden transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 dark:from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Resolution Rate</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                {data.executive?.totalChats > 0 
                  ? Math.round((data.executive.closedChats / data.executive.totalChats) * 100) 
                  : 100}%
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><Target className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm relative z-10 bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg">
            <span className="text-gray-500 dark:text-slate-400">
              <span className="font-semibold text-gray-700 dark:text-slate-300">{data.executive?.closedChats}</span> of <span className="font-semibold text-gray-700 dark:text-slate-300">{data.executive?.totalChats}</span> closed
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Analysis Span 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">System Health Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.volume?.trends || []}>
                <defs>
                  <linearGradient id="colorCountExec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} className="dark:stroke-slate-700" />
                <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(v) => v ? new Date(v).toLocaleDateString() : ''} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Chat Volume" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCountExec)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Agents List */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none flex flex-col transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Top Performing Agents</h3>
            <button
              onClick={exportTopAgentsToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-100 dark:border-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          <div className="flex-1 space-y-4">
            {agents.map((agent: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                    i === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300' :
                    i === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                    'bg-blue-50 text-blue-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                  }`}>
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{agent.agentName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5"><span className="font-medium text-gray-700 dark:text-slate-300">{agent.resolved}</span> resolved</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">{agent.avgArt}m ART</p>
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <div className="text-center text-gray-500 dark:text-slate-500 py-10 flex flex-col items-center justify-center">
                <Users className="w-10 h-10 mb-3 opacity-20" />
                <p>No agent data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
