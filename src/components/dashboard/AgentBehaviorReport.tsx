'use client';

import React, { useState, useEffect } from 'react';
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Clock,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Activity
} from 'lucide-react';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AgentBehaviorReport: React.FC<AgentBehaviorReportProps> = ({
  agentId,
  fieldType,
  timeRange
}) => {
  const [behaviorData, setBehaviorData] = useState<BehaviorMetrics[]>([]);
  const [tatData, setTatData] = useState<TATData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBehaviorData();
  }, [agentId, fieldType, timeRange]);

  const fetchBehaviorData = async () => {
    setIsLoading(true);
    try {
      const endpoint = agentId 
        ? `/api/agent-report/${agentId}?timeRange=${timeRange}&field=${fieldType}`
        : `/api/dashboard?timeRange=${timeRange}&field=${fieldType}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setBehaviorData(data.agentMetrics || []);
        setTatData(data.tatData || []);
      }
    } catch (error) {
      console.error('Error fetching behavior data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldSpecificMetrics = () => {
    if (fieldType === 'medical') {
      return [
        { name: 'Response Time', value: 85, fullMark: 100 },
        { name: 'Empathy', value: 92, fullMark: 100 },
        { name: 'Medical Knowledge', value: 88, fullMark: 100 },
        { name: 'HIPAA Compliance', value: 98, fullMark: 100 },
        { name: 'Critical Response', value: 90, fullMark: 100 },
        { name: 'Documentation', value: 87, fullMark: 100 }
      ];
    } else if (fieldType === 'restaurant') {
      return [
        { name: 'Response Time', value: 88, fullMark: 100 },
        { name: 'Friendliness', value: 94, fullMark: 100 },
        { name: 'Menu Knowledge', value: 91, fullMark: 100 },
        { name: 'Order Accuracy', value: 96, fullMark: 100 },
        { name: 'Upselling', value: 78, fullMark: 100 },
        { name: 'Problem Solving', value: 89, fullMark: 100 }
      ];
    }
    return [
      { name: 'Response Time', value: 86, fullMark: 100 },
      { name: 'Customer Service', value: 90, fullMark: 100 },
      { name: 'Problem Solving', value: 88, fullMark: 100 },
      { name: 'Communication', value: 92, fullMark: 100 },
      { name: 'Efficiency', value: 85, fullMark: 100 },
      { name: 'Satisfaction', value: 89, fullMark: 100 }
    ];
  };

  const getPerformanceInsights = () => {
    if (fieldType === 'medical') {
      return [
        {
          title: 'Critical Response Excellence',
          description: 'Agent maintains excellent response times for critical medical cases',
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        },
        {
          title: 'HIPAA Compliance',
          description: 'Perfect compliance with patient privacy regulations',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Empathy Score',
          description: 'High empathy levels in patient interactions',
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
      ];
    } else if (fieldType === 'restaurant') {
      return [
        {
          title: 'Order Accuracy',
          description: 'Excellent accuracy in order taking and processing',
          icon: Target,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Customer Service',
          description: 'Outstanding customer service and friendliness',
          icon: MessageSquare,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          title: 'Upselling Opportunity',
          description: 'Room for improvement in upselling techniques',
          icon: TrendingUp,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        }
      ];
    }
    return [];
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={behaviorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="agentName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="customerSatisfaction" fill="#8884d8" name="Satisfaction %" />
            <Bar dataKey="productivityScore" fill="#82ca9d" name="Productivity Score" />
          </BarChart>
        </ResponsiveContainer>
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
                    {agent.agentName}
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      agent.customerSatisfaction >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      agent.customerSatisfaction >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {agent.customerSatisfaction}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
