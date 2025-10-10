'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Timer,
  Star,
  Tag,
  Zap
} from 'lucide-react';

interface ReportStats {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  avgResponseTime: number;
  totalChats: number;
  openChats: number;
  closedChats: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
  activeAgents: number;
}

export default function ReportsPage() {
  const { authenticated, loading, user } = useAuth();
  const router = useRouter();
  const [dateRange, setDateRange] = useState('7days');
  const [stats, setStats] = useState<ReportStats>({
    totalMessages: 1247,
    sentMessages: 623,
    receivedMessages: 624,
    avgResponseTime: 3.5,
    totalChats: 156,
    openChats: 23,
    closedChats: 133,
    avgResolutionTime: 45,
    customerSatisfaction: 4.5,
    activeAgents: 8
  });

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push('/auth');
    }
  }, [authenticated, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Messages',
      value: stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avgResponseTime}m`,
      icon: Clock,
      color: 'bg-green-500',
      change: '-5%',
      trend: 'down'
    },
    {
      title: 'Open Chats',
      value: stats.openChats,
      icon: Activity,
      color: 'bg-orange-500',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Closed Chats',
      value: stats.closedChats,
      icon: CheckCircle,
      color: 'bg-purple-500',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Customer Satisfaction',
      value: `${stats.customerSatisfaction}/5`,
      icon: Star,
      color: 'bg-yellow-500',
      change: '+0.3',
      trend: 'up'
    },
    {
      title: 'Active Agents',
      value: stats.activeAgents,
      icon: Users,
      color: 'bg-cyan-500',
      change: '0%',
      trend: 'neutral'
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Reports</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analytics and insights for your WhatsApp conversations
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {/* Export Button */}
            <button className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center space-x-1">
                      {stat.trend === 'up' && (
                        <ArrowUp className="w-4 h-4 text-green-500" />
                      )}
                      {stat.trend === 'down' && (
                        <ArrowDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-500' :
                        stat.trend === 'down' ? 'text-red-500' :
                        'text-gray-500'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        vs last period
                      </span>
                    </div>
                  </div>
                  <div className={`${stat.color} rounded-xl p-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Message Volume Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Message Volume
              </h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats.sentMessages}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(stats.sentMessages / stats.totalMessages) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Received</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats.receivedMessages}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(stats.receivedMessages / stats.totalMessages) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalMessages} messages
                </span>
              </div>
            </div>
          </div>

          {/* Chat Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat Status
              </h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={`${(stats.closedChats / stats.totalChats) * 251.2} 251.2`}
                    className="text-green-500"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={`${(stats.openChats / stats.totalChats) * 251.2} 251.2`}
                    strokeDashoffset={`-${(stats.closedChats / stats.totalChats) * 251.2}`}
                    className="text-orange-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalChats}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Chats
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Closed</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.closedChats} ({((stats.closedChats / stats.totalChats) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Open</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.openChats} ({((stats.openChats / stats.totalChats) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Response Time Analysis
            </h3>
            <Timer className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                1.2m
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">First Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                3.5m
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                45m
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Resolution Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                98%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Within SLA</div>
            </div>
          </div>
        </div>

        {/* Peak Hours & Agent Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Peak Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Peak Hours
              </h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {[
                { time: '9:00 - 10:00', messages: 156, percentage: 85 },
                { time: '14:00 - 15:00', messages: 142, percentage: 78 },
                { time: '11:00 - 12:00', messages: 128, percentage: 70 },
                { time: '16:00 - 17:00', messages: 115, percentage: 63 },
                { time: '10:00 - 11:00', messages: 98, percentage: 54 }
              ].map((hour, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {hour.time}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {hour.messages} msgs
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${hour.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Most Used Tags
              </h3>
              <Tag className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {[
                { tag: 'Support', count: 234, color: 'bg-blue-500' },
                { tag: 'Sales', count: 189, color: 'bg-green-500' },
                { tag: 'Billing', count: 156, color: 'bg-purple-500' },
                { tag: 'Technical', count: 98, color: 'bg-orange-500' },
                { tag: 'General', count: 67, color: 'bg-gray-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${item.color} w-2 h-2 rounded-full`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.tag}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${item.color} h-2 rounded-full`}
                        style={{ width: `${(item.count / 234) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Performance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agent Performance
            </h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Agent
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Chats Handled
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg Response
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Resolution Rate
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'John Smith', chats: 45, response: '2.1m', resolution: 96, rating: 4.8 },
                  { name: 'Sarah Johnson', chats: 42, response: '2.5m', resolution: 94, rating: 4.7 },
                  { name: 'Mike Davis', chats: 38, response: '3.2m', resolution: 92, rating: 4.6 },
                  { name: 'Emma Wilson', chats: 35, response: '3.8m', resolution: 89, rating: 4.5 },
                  { name: 'Alex Brown', chats: 31, response: '4.1m', resolution: 87, rating: 4.4 }
                ].map((agent, index) => (
                  <tr 
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {agent.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {agent.chats}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {agent.response}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[80px]">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${agent.resolution}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white w-10">
                          {agent.resolution}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {agent.rating}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

