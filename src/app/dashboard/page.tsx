'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type FieldType = 'medical' | 'restaurant' | 'general';

interface DashboardData {
  allChats: number;
  processing: number;
  pending: number;
  unassigned: number;
  followUp: number;
  done: number;
  allInstances: number;
  allUsers: number;
  allContacts: number;
  allBots: number;
  allSpeedMessages: number;
  allSpeedFiles: number;
  allBroadcasts: number;
  allBulks: number;
  activeUsers?: number;
  totalUsers?: number;
  agentMetrics?: AgentPerformance[];
  messagesData: {
    incoming: number;
    outgoing: number;
  };
  companyUnitsData: {
    interactiveContacts: number;
    aiReplies: number;
    campaignSent: number;
  };
  contactsAnalyticsData: {
    newContacts: number;
    newGroupContacts: number;
    restContacts: number;
  };
  broadcastData: {
    cantSend: number;
    sent: number;
    pending: number;
  };
  fieldType: FieldType;
}

interface AgentPerformance {
  agentId: string;
  agentName: string;
  responseTime: number;
  resolutionTime: number;
  customerSatisfaction: number;
  productivityScore?: number;
  totalAssignedChats?: number;
  resolvedChats?: number;
  isActive?: boolean;
}

interface MetricConfig {
  title: string;
  description: string;
  key: keyof Pick<DashboardData,
    'allChats' | 'processing' | 'pending' | 'unassigned' | 'followUp' | 'done' |
    'allInstances' | 'allUsers' | 'allContacts' | 'allBots' | 'allSpeedMessages' | 'allSpeedFiles' | 'allBroadcasts' | 'allBulks'
  >;
  showGraph?: boolean;
}

interface ChartConfig {
  title: string;
  value: (data: DashboardData | null) => number;
  legend: Array<{ label: string; color: string }>;
}

const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';
const sum = (...values: number[]) => values.reduce((acc, current) => acc + current, 0);

const REALTIME_METRICS: MetricConfig[] = [
  { title: 'all chats', key: 'allChats', description: 'Current Chat by contact', showGraph: true },
  { title: 'processing', key: 'processing', description: 'Current Handling contacts', showGraph: true },
  { title: 'pending', key: 'pending', description: 'Contacts Not Answered Yet', showGraph: true },
  { title: 'unassigned', key: 'unassigned', description: 'Contacts On waiting List', showGraph: true },
  { title: 'follow up', key: 'followUp', description: 'Contancts Under Following', showGraph: true },
  { title: 'done', key: 'done', description: 'Copmleted Conversations', showGraph: true }
];

const ALL_TIME_METRICS: MetricConfig[] = [
  { title: 'all instances', key: 'allInstances', description: 'Current Handling contacts' },
  { title: 'active users', key: 'allUsers', description: 'Currently logged-in users' },
  { title: 'all contacts', key: 'allContacts', description: 'Current Handling contacts' },
  { title: 'all bots', key: 'allBots', description: 'Current Handling contacts' },
  { title: 'all speed messages', key: 'allSpeedMessages', description: 'Current Handling contacts' },
  { title: 'all speed files', key: 'allSpeedFiles', description: 'Current Handling contacts' },
  { title: 'all broadcasts', key: 'allBroadcasts', description: 'Current Handling contacts' },
  { title: 'all bulks', key: 'allBulks', description: 'Current Handling contacts' }
];

const CHARTS: ChartConfig[] = [
  {
    title: 'All Messages',
    value: (data) => data ? sum(data.messagesData.incoming, data.messagesData.outgoing) : 0,
    legend: [
      { label: 'Incoming', color: 'bg-yellow-400' },
      { label: 'Outgoing', color: 'bg-blue-500' }
    ]
  },
  {
    title: 'Company Units',
    value: (data) => data ? sum(data.companyUnitsData.interactiveContacts, data.companyUnitsData.aiReplies, data.companyUnitsData.campaignSent) : 0,
    legend: [
      { label: 'Interactive Contacts', color: 'bg-green-500' },
      { label: 'AI Replies', color: 'bg-purple-500' },
      { label: 'Campaign Sent', color: 'bg-red-500' }
    ]
  },
  {
    title: 'Contacts Analytics',
    value: (data) => data ? sum(data.contactsAnalyticsData.newContacts, data.contactsAnalyticsData.newGroupContacts, data.contactsAnalyticsData.restContacts) : 0,
    legend: [
      { label: 'New Contacts', color: 'bg-blue-500' },
      { label: 'New Group Contacts', color: 'bg-green-500' },
      { label: 'Rest Contacts', color: 'bg-yellow-400' }
    ]
  },
  {
    title: 'broadcast & BULK CONTACTS',
    value: (data) => data ? sum(data.broadcastData.cantSend, data.broadcastData.sent, data.broadcastData.pending) : 0,
    legend: [
      { label: "can't send", color: 'bg-red-500' },
      { label: 'sent', color: 'bg-green-500' },
      { label: 'pending', color: 'bg-yellow-400' }
    ]
  },
  {
    title: 'messages',
    value: (data) => data ? sum(data.messagesData.incoming, data.messagesData.outgoing) : 0,
    legend: [
      { label: 'Incoming', color: 'bg-blue-500' },
      { label: 'Outgoing', color: 'bg-purple-500' }
    ]
  }
];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedField, setSelectedField] = useState<FieldType>('general');
  const [isLoading, setIsLoading] = useState(true);
  const selectedTimeRange = 'today';
  const { token } = useAuth();

  const formatDurationMinutes = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    return `${Math.round(safeSeconds / 60)}m`;
  };

  const getResolutionRate = (agent: AgentPerformance) => {
    const handled = agent.totalAssignedChats ?? agent.productivityScore ?? 0;
    const resolved = agent.resolvedChats ?? 0;
    if (handled <= 0) return 0;
    return Math.round((resolved / handled) * 100);
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}api/dashboard?timeRange=${selectedTimeRange}&field=${selectedField}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Dashboard request failed with status ${response.status}`);
      }

      const data: DashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedField, selectedTimeRange, token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">Real Time</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Start Date:</span>
              <input type="date" className="px-2 py-1 border border-gray-300 rounded text-sm" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">End Date:</span>
              <input type="date" className="px-2 py-1 border border-gray-300 rounded text-sm" />
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-1 border border-gray-300 rounded text-sm w-48"
              />
            </div>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value as FieldType)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="general">General</option>
              <option value="medical">Medical</option>
              <option value="restaurant">Restaurant</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Real Time</h2>
          <div className="grid grid-cols-6 gap-4">
            {REALTIME_METRICS.map((metric) => (
              <MetricCard
                key={metric.key}
                title={metric.title}
                value={dashboardData?.[metric.key] || 0}
                description={metric.description}
                showGraph={metric.showGraph}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Time</h2>
          <div className="grid grid-cols-8 gap-4">
            {ALL_TIME_METRICS.map((metric) => (
              <MetricCard
                key={metric.key}
                title={metric.title}
                value={dashboardData?.[metric.key] || 0}
                description={metric.description}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Active Users</h3>
            <p className="text-2xl font-bold text-emerald-600">{dashboardData?.activeUsers ?? dashboardData?.allUsers ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Currently logged-in users</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.totalUsers ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">All app users</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Active Ratio</h3>
            <p className="text-2xl font-bold text-blue-600">
              {(() => {
                const active = dashboardData?.activeUsers ?? dashboardData?.allUsers ?? 0;
                const total = dashboardData?.totalUsers ?? 0;
                if (!total) return '0%';
                return `${Math.round((active / total) * 100)}%`;
              })()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Logged-in users / all users</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {CHARTS.map((chart) => (
            <ChartPanel key={chart.title} title={chart.title} value={chart.value(dashboardData)} legend={chart.legend} />
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Agent Performance</h2>
            <p className="text-xs text-gray-500 mt-1">Real user performance from dashboard API</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Chats Handled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Avg Response</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Resolution Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(dashboardData?.agentMetrics || []).map((agent) => {
                  const handled = agent.totalAssignedChats ?? agent.productivityScore ?? 0;
                  const rating = agent.customerSatisfaction ?? 0;
                  const resolutionRate = getResolutionRate(agent);

                  return (
                    <tr key={agent.agentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{agent.agentName}</span>
                          {agent.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Offline</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{handled}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{formatDurationMinutes(agent.responseTime)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{resolutionRate}%</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{rating}%</td>
                    </tr>
                  );
                })}

                {(dashboardData?.agentMetrics || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      No agent performance data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NoDataPanel title="bot options" />
          <NoDataPanel title="Chat Reason" />
        </div>
      </div>

      <button className="fixed bottom-6 right-6 w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors">
        <MessageSquare className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  showGraph?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, showGraph = false }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 uppercase">{title}</h3>
        {showGraph && <div className="w-4 h-4 bg-gray-300 rounded"></div>}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

interface ChartPanelProps {
  title: string;
  value: number;
  legend: Array<{ label: string; color: string }>;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ title, value, legend }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-600 uppercase mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 mb-4">{value}</div>
      <div className="flex flex-wrap gap-2">
        {legend.map((item, index) => (
          <div key={index} className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface NoDataPanelProps {
  title: string;
}

const NoDataPanel: React.FC<NoDataPanelProps> = ({ title }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-600 uppercase mb-4">{title}</h3>
      <div className="flex flex-col items-center justify-center h-32">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
          <Monitor className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No data</p>
      </div>
    </div>
  );
};
