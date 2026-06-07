import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Award, UserCheck, MessageSquare, Timer, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface Props {
  dateRange: string;
}

export default function EmployeePerformanceDashboard({ dateRange }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState({
    performance: null as any,
    csat: null as any,
    workload: null as any
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

        const [perfRes, csatRes, workRes] = await Promise.all([
          fetch(`${baseUrl}/api/reports/performance?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/csat?dateRange=${dateRange}`, { headers }),
          fetch(`${baseUrl}/api/reports/workload?dateRange=${dateRange}`, { headers })
        ]);

        setData({
          performance: perfRes.ok ? await perfRes.json() : null,
          csat: csatRes.ok ? await csatRes.json() : null,
          workload: workRes.ok ? await workRes.json() : null
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [dateRange, token]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const agents = data.performance?.agentMetrics || [];
  
  // Combine CSAT score with agent performance data
  const csatMap = new Map(data.csat?.byEmployee?.map((e: any) => [e.employee, parseFloat(e.score)]) || []);
  const mergedAgents = agents.map((agent: any) => ({
    ...agent,
    csatScore: csatMap.get(agent.agentId) || 0
  })).sort((a: any, b: any) => b.resolved - a.resolved);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Employee Performance</h2>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Evaluate agent productivity, efficiency, and customer satisfaction.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl"><UserCheck className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Active Agents</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{agents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><MessageSquare className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Assigned</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{agents.reduce((sum: number, a: any) => sum + a.assigned, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><Timer className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Avg Resolution</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {Math.round(agents.reduce((sum: number, a: any) => sum + a.avgArt, 0) / (agents.length || 1))}m
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none relative overflow-hidden transition-colors duration-300">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent to-amber-50 dark:to-amber-500/10 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl"><Award className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Avg CSAT Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{data.csat?.avgScore || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Workload & Resolution */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">Assigned vs Resolved</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mergedAgents.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} className="dark:stroke-slate-700" />
                <XAxis dataKey="agentName" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} interval={0} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="assigned" name="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CSAT vs Resolution Time Scatter */}
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-6">Efficiency vs Satisfaction</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} className="dark:stroke-slate-700" />
                <XAxis type="number" dataKey="avgArt" name="Resolution Time" unit="m" stroke="#94a3b8" domain={['auto', 'auto']} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="csatScore" name="CSAT Score" stroke="#94a3b8" domain={[0, 5]} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <ZAxis type="number" dataKey="resolved" range={[50, 400]} name="Chats Resolved" />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Agents" data={mergedAgents.filter((a: any) => a.csatScore > 0)} fill="#8b5cf6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-700/50 dark:backdrop-blur-sm shadow-sm dark:shadow-none overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Agent Performance Roster</h3>
          <button
            onClick={() => {
              const rows = mergedAgents.map((a: any) => ({
                'Agent': a.agentName,
                'Assigned': a.assigned,
                'Resolved': a.resolved,
                'Active': a.active,
                'Avg FRT (min)': Math.round(a.avgFrt || 0),
                'Avg ART (min)': Math.round(a.avgArt || 0),
                'Messages Handled': a.messagesHandled,
                'Escalated': a.escalated,
                'Reopened': a.reopened,
              }));
              const ws = XLSX.utils.json_to_sheet(rows);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Agent Performance');
              XLSX.writeFile(wb, `agent-performance-${new Date().toISOString().split('T')[0]}.xlsx`);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs uppercase text-gray-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Agent</th>
                <th className="px-6 py-4 font-semibold">Assigned</th>
                <th className="px-6 py-4 font-semibold">Resolved</th>
                <th className="px-6 py-4 font-semibold">Avg FRT</th>
                <th className="px-6 py-4 font-semibold">Avg ART</th>
                <th className="px-6 py-4 font-semibold">CSAT</th>
                <th className="px-6 py-4 font-semibold">Escalated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 text-sm">
              {mergedAgents.map((agent: any) => (
                <tr key={agent.agentId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-200">{agent.agentName}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{agent.assigned}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {agent.resolved}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{agent.avgFrt}m</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{agent.avgArt}m</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${agent.csatScore >= 4.5 ? 'text-emerald-600 dark:text-emerald-400' : agent.csatScore >= 3.5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {agent.csatScore > 0 ? agent.csatScore : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{agent.escalated}</td>
                </tr>
              ))}
              {mergedAgents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">No agents found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
