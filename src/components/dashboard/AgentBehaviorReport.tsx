'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BehaviorMetrics {
  agentId: string;
  agentName: string;
  responseTime: number;
  resolutionTime: number;
  customerSatisfaction: number;
  empathyScore: number;
  professionalismScore: number;
  problemSolvingScore: number;
  complianceScore: number;
  upsellScore: number;
  productivityScore?: number;
  totalAssignedChats?: number;
  resolvedChats?: number;
  openChats?: number;
  isActive?: boolean;
  fieldType: 'medical' | 'restaurant' | 'general';
}

interface TATData {
  date: string;
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  totalChats: number;
  fastResponseRate: number;
  quickResolutionRate: number;
}

interface AgentBehaviorReportProps {
  agentId?: string;
  fieldType: 'medical' | 'restaurant' | 'general';
  timeRange: string;
}


export const AgentBehaviorReport: React.FC<AgentBehaviorReportProps> = ({
  agentId,
  fieldType,
  timeRange
}) => {
  const { token } = useAuth();
  const [behaviorData, setBehaviorData] = useState<BehaviorMetrics[]>([]);
  const [tatData, setTatData] = useState<TATData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getApiBaseUrl = () => (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/').replace(/\/$/, '');

  const getAverage = (values: number[]) => {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((acc, value) => acc + value, 0) / values.length);
  };

  const to100ScoreFromSeconds = (seconds: number, ideal: number, max: number) => {
    if (seconds <= ideal) return 100;
    if (seconds >= max) return 0;
    return Math.max(0, Math.round(((max - seconds) / (max - ideal)) * 100));
  };

  const fetchBehaviorData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = `${getApiBaseUrl()}/api/dashboard?timeRange=${timeRange}&field=${fieldType}`;

      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        const source: BehaviorMetrics[] = Array.isArray(data.agentMetrics) ? data.agentMetrics : [];
        const filtered = agentId ? source.filter((item) => item.agentId === agentId) : source;
        setBehaviorData(filtered);
        setTatData(data.tatData || []);
      } else {
        setBehaviorData([]);
        setTatData([]);
      }
    } catch (error) {
      console.error('Error fetching behavior data:', error);
      setBehaviorData([]);
      setTatData([]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, timeRange, fieldType, token]);

  useEffect(() => {
    fetchBehaviorData();
  }, [fetchBehaviorData]);

  const getFieldSpecificMetrics = () => {
    const responseScore = to100ScoreFromSeconds(getAverage(behaviorData.map((a) => a.responseTime || 0)), 30, 600);
    const resolutionScore = to100ScoreFromSeconds(getAverage(behaviorData.map((a) => a.resolutionTime || 0)), 300, 7200);
    const satisfaction = getAverage(behaviorData.map((a) => a.customerSatisfaction || 0));
    const empathy = getAverage(behaviorData.map((a) => a.empathyScore || 0));
    const professional = getAverage(behaviorData.map((a) => a.professionalismScore || 0));
    const solving = getAverage(behaviorData.map((a) => a.problemSolvingScore || 0));
    const compliance = getAverage(behaviorData.map((a) => a.complianceScore || 0));
    const upsell = getAverage(behaviorData.map((a) => a.upsellScore || 0));

    if (fieldType === 'medical') {
      return [
        { name: 'Response Speed', value: responseScore, fullMark: 100 },
        { name: 'Resolution Speed', value: resolutionScore, fullMark: 100 },
        { name: 'Satisfaction', value: satisfaction, fullMark: 100 },
        { name: 'Empathy', value: empathy, fullMark: 100 },
        { name: 'Compliance', value: compliance, fullMark: 100 },
        { name: 'Problem Solving', value: solving, fullMark: 100 }
      ];
    }

    if (fieldType === 'restaurant') {
      return [
        { name: 'Response Speed', value: responseScore, fullMark: 100 },
        { name: 'Resolution Speed', value: resolutionScore, fullMark: 100 },
        { name: 'Satisfaction', value: satisfaction, fullMark: 100 },
        { name: 'Service Quality', value: professional, fullMark: 100 },
        { name: 'Upsell', value: upsell, fullMark: 100 },
        { name: 'Problem Solving', value: solving, fullMark: 100 }
      ];
    }

    return [
      { name: 'Response Speed', value: responseScore, fullMark: 100 },
      { name: 'Resolution Speed', value: resolutionScore, fullMark: 100 },
      { name: 'Satisfaction', value: satisfaction, fullMark: 100 },
      { name: 'Empathy', value: empathy, fullMark: 100 },
      { name: 'Professionalism', value: professional, fullMark: 100 },
      { name: 'Problem Solving', value: solving, fullMark: 100 }
    ];
  };

  const getPerformanceInsights = () => {
    const activeAgents = behaviorData.filter((a) => a.isActive).length;
    const totalAgents = behaviorData.length;
    const avgResponseSec = getAverage(behaviorData.map((a) => a.responseTime || 0));
    const avgSatisfaction = getAverage(behaviorData.map((a) => a.customerSatisfaction || 0));

    const insights = [
      {
        title: 'Logged-In Agents',
        description: `${activeAgents} of ${totalAgents} agents are currently active`,
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Average Response Time',
        description: `Current first response average is ${avgResponseSec}s`,
        icon: AlertTriangle,
        color: avgResponseSec <= 60 ? 'text-green-600' : 'text-yellow-600',
        bgColor: avgResponseSec <= 60 ? 'bg-green-100' : 'bg-yellow-100'
      },
      {
        title: 'Satisfaction Trend',
        description: `Team-wide satisfaction average is ${avgSatisfaction}%`,
        icon: avgSatisfaction >= 80 ? CheckCircle : TrendingUp,
        color: avgSatisfaction >= 80 ? 'text-green-600' : 'text-amber-600',
        bgColor: avgSatisfaction >= 80 ? 'bg-green-100' : 'bg-amber-100'
      }
    ];

    if (fieldType === 'restaurant') {
      const avgUpsell = getAverage(behaviorData.map((a) => a.upsellScore || 0));
      insights[2] = {
        title: 'Upsell Performance',
        description: `Average upsell score is ${avgUpsell}%`,
        icon: TrendingUp,
        color: avgUpsell >= 70 ? 'text-green-600' : 'text-amber-600',
        bgColor: avgUpsell >= 70 ? 'bg-green-100' : 'bg-amber-100'
      };
    }

    return insights;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agent Behavior Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {fieldType === 'medical' ? 'Medical Field' :
                fieldType === 'restaurant' ? 'Restaurant Field' : 'General'} Performance Metrics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Time Range: {timeRange}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {getPerformanceInsights().map((insight, index) => (
          <div key={index} className={`${insight.bgColor} rounded-lg p-6`}>
            <div className="flex items-center space-x-3">
              <insight.icon className={`w-8 h-8 ${insight.color}`} />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TAT Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Turn Around Time (TAT) Analysis
        </h3>
        {tatData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            No TAT data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tatData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgFirstResponseTime"
                stroke="#8884d8"
                name="First Response Time (s)"
              />
              <Line
                type="monotone"
                dataKey="avgResolutionTime"
                stroke="#82ca9d"
                name="Resolution Time (s)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Agent Performance Radar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Agent Performance Radar
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={getFieldSpecificMetrics()}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Agent Performance Comparison
        </h3>
        {behaviorData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            No agent metrics available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={behaviorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agentName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="customerSatisfaction" fill="#8884d8" name="Satisfaction %" />
              <Bar dataKey="productivityScore" fill="#82ca9d" name="Assigned Chats" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detailed Performance Metrics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Resolution Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Satisfaction
                </th>
                {fieldType === 'medical' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      HIPAA Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Critical Response
                    </th>
                  </>
                )}
                {fieldType === 'restaurant' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Order Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Upsell Rate
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Overall Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {behaviorData.map((agent) => (
                <tr key={agent.agentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{agent.agentName}</span>
                      {agent.isActive ? (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                          Offline
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {agent.responseTime}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {agent.resolutionTime}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {agent.customerSatisfaction}%
                  </td>
                  {fieldType === 'medical' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {agent.complianceScore}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {agent.problemSolvingScore}%
                      </td>
                    </>
                  )}
                  {fieldType === 'restaurant' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {agent.problemSolvingScore}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {agent.upsellScore}%
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${agent.customerSatisfaction >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      agent.customerSatisfaction >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                      {agent.customerSatisfaction}%
                    </span>
                  </td>
                </tr>
              ))}
              {behaviorData.length === 0 && (
                <tr>
                  <td colSpan={fieldType === 'medical' || fieldType === 'restaurant' ? 7 : 5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No agent performance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
