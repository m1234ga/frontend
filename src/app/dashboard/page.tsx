'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalChats: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
  firstCallResolution: number;
  activeChats: number;
  completedChats: number;
  pendingChats: number;
  escalationRate: number;
  productivityScore: number;
}

interface DashboardData {
  // Real-time metrics
  allChats: number;
  processing: number;
  pending: number;
  unassigned: number;
  followUp: number;
  done: number;
  
  // All-time metrics
  allInstances: number;
  allUsers: number;
  allContacts: number;
  allBots: number;
  allSpeedMessages: number;
  allSpeedFiles: number;
  allBroadcasts: number;
  allBulks: number;
  
  // Chart data
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
  
  fieldType: 'medical' | 'restaurant' | 'general';
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [selectedField, setSelectedField] = useState<'medical' | 'restaurant' | 'general'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange, selectedField]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}api/dashboard?timeRange=${selectedTimeRange}&field=${selectedField}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Fallback to sample data if API is not available
        setDashboardData(getSampleData());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to sample data on error
      setDashboardData(getSampleData());
    } finally {
      setIsLoading(false);
    }
  };

  const getSampleData = (): DashboardData => {
    const baseMultiplier = selectedField === 'medical' ? 150 : selectedField === 'restaurant' ? 200 : 100;
    
    return {
      // Real-time metrics
      allChats: Math.floor(Math.random() * 50) + 10,
      processing: Math.floor(Math.random() * 30) + 5,
      pending: Math.floor(Math.random() * 20) + 3,
      unassigned: Math.floor(Math.random() * 15) + 2,
      followUp: Math.floor(Math.random() * 25) + 4,
      done: Math.floor(Math.random() * 100) + 50,
      
      // All-time metrics
      allInstances: baseMultiplier + Math.floor(Math.random() * 50),
      allUsers: Math.floor(baseMultiplier * 0.1) + Math.floor(Math.random() * 10),
      allContacts: baseMultiplier + Math.floor(Math.random() * 100),
      allBots: Math.floor(baseMultiplier * 0.05) + Math.floor(Math.random() * 5),
      allSpeedMessages: Math.floor(baseMultiplier * 0.3) + Math.floor(Math.random() * 20),
      allSpeedFiles: Math.floor(baseMultiplier * 0.1) + Math.floor(Math.random() * 10),
      allBroadcasts: Math.floor(baseMultiplier * 0.2) + Math.floor(Math.random() * 15),
      allBulks: Math.floor(baseMultiplier * 0.15) + Math.floor(Math.random() * 12),
      
      // Chart data
      messagesData: {
        incoming: Math.floor(baseMultiplier * 0.6) + Math.floor(Math.random() * 30),
        outgoing: Math.floor(baseMultiplier * 0.4) + Math.floor(Math.random() * 20)
      },
      companyUnitsData: {
        interactiveContacts: Math.floor(baseMultiplier * 0.7) + Math.floor(Math.random() * 20),
        aiReplies: Math.floor(baseMultiplier * 0.2) + Math.floor(Math.random() * 10),
        campaignSent: Math.floor(baseMultiplier * 0.1) + Math.floor(Math.random() * 5)
      },
      contactsAnalyticsData: {
        newContacts: Math.floor(baseMultiplier * 0.6) + Math.floor(Math.random() * 25),
        newGroupContacts: Math.floor(baseMultiplier * 0.2) + Math.floor(Math.random() * 8),
        restContacts: Math.floor(baseMultiplier * 0.2) + Math.floor(Math.random() * 12)
      },
      broadcastData: {
        cantSend: Math.floor(Math.random() * 5) + 1,
        sent: Math.floor(baseMultiplier * 0.8) + Math.floor(Math.random() * 15),
        pending: Math.floor(Math.random() * 8) + 2
      },
      
      fieldType: selectedField
    };
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
              onChange={(e) => setSelectedField(e.target.value as 'medical' | 'restaurant' | 'general')}
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
        {/* Real-Time Metrics Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Real Time</h2>
          <div className="grid grid-cols-6 gap-4">
            <MetricCard 
              title="all chats" 
              value={dashboardData?.allChats || 0} 
              description="Current Chat by contact"
              showGraph={true}
            />
            <MetricCard 
              title="processing" 
              value={dashboardData?.processing || 0} 
              description="Current Handling contacts"
              showGraph={true}
            />
            <MetricCard 
              title="pending" 
              value={dashboardData?.pending || 0} 
              description="Contacts Not Answered Yet"
              showGraph={true}
            />
            <MetricCard 
              title="unassigned" 
              value={dashboardData?.unassigned || 0} 
              description="Contacts On waiting List"
              showGraph={true}
            />
            <MetricCard 
              title="follow up" 
              value={dashboardData?.followUp || 0} 
              description="Contancts Under Following"
              showGraph={true}
            />
            <MetricCard 
              title="done" 
              value={dashboardData?.done || 0} 
              description="Copmleted Conversations"
              showGraph={true}
            />
          </div>
        </div>

        {/* All Time Metrics Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Time</h2>
          <div className="grid grid-cols-8 gap-4">
            <MetricCard 
              title="all instances" 
              value={dashboardData?.allInstances || 0} 
              description="Current Handling contacts"
            />
            <MetricCard 
              title="all users" 
              value={dashboardData?.allUsers || 0} 
              description="Current Handling contacts"
            />
            <MetricCard 
              title="all contacts" 
              value={dashboardData?.allContacts || 0} 
              description="Current Handling contacts"
            />
            <MetricCard 
              title="all bots" 
              value={dashboardData?.allBots || 0} 
              description="Current Handling contacts"
            />
            <MetricCard 
              title="all speed messages" 
              value={dashboardData?.allSpeedMessages || 0} 
              description="Current Handling contacts"
            />
            <MetricCard 
              title="all speed files" 
              value={dashboardData?.allSpeedFiles || 0} 
              description="Current Handling contacts"
            />
            <MetricCard 
              title="all broadcasts" 
              value={dashboardData?.allBroadcasts || 0} 
              description="Current Handling contacts"
            />
            <MetricCard 
              title="all bulks" 
              value={dashboardData?.allBulks || 0} 
              description="Current Handling contacts"
            />
          </div>
        </div>

        {/* Chart Panels Section */}
        <div className="grid grid-cols-5 gap-4">
          <ChartPanel 
            title="All Messages" 
            value={dashboardData?.messagesData ? 
              dashboardData.messagesData.incoming + dashboardData.messagesData.outgoing : 0}
            legend={[
              { label: "Incoming", color: "bg-yellow-400" },
              { label: "Outgoing", color: "bg-blue-500" }
            ]}
          />
          <ChartPanel 
            title="Company Units" 
            value={dashboardData?.companyUnitsData ? 
              dashboardData.companyUnitsData.interactiveContacts + 
              dashboardData.companyUnitsData.aiReplies + 
              dashboardData.companyUnitsData.campaignSent : 0}
            legend={[
              { label: "Interactive Contacts", color: "bg-green-500" },
              { label: "AI Replies", color: "bg-purple-500" },
              { label: "Campaign Sent", color: "bg-red-500" }
            ]}
          />
          <ChartPanel 
            title="Contacts Analytics" 
            value={dashboardData?.contactsAnalyticsData ? 
              dashboardData.contactsAnalyticsData.newContacts + 
              dashboardData.contactsAnalyticsData.newGroupContacts + 
              dashboardData.contactsAnalyticsData.restContacts : 0}
            legend={[
              { label: "New Contacts", color: "bg-blue-500" },
              { label: "New Group Contacts", color: "bg-green-500" },
              { label: "Rest Contacts", color: "bg-yellow-400" }
            ]}
          />
          <ChartPanel 
            title="broadcast & BULK CONTACTS" 
            value={dashboardData?.broadcastData ? 
              dashboardData.broadcastData.cantSend + 
              dashboardData.broadcastData.sent + 
              dashboardData.broadcastData.pending : 0}
            legend={[
              { label: "can't send", color: "bg-red-500" },
              { label: "sent", color: "bg-green-500" },
              { label: "pending", color: "bg-yellow-400" }
            ]}
          />
          <ChartPanel 
            title="messages" 
            value={dashboardData?.messagesData ? 
              dashboardData.messagesData.incoming + dashboardData.messagesData.outgoing : 0}
            legend={[
              { label: "Incoming", color: "bg-blue-500" },
              { label: "Outgoing", color: "bg-purple-500" }
            ]}
          />
        </div>

        {/* Bottom Panels */}
        <div className="grid grid-cols-2 gap-4">
          <NoDataPanel title="bot options" />
          <NoDataPanel title="Chat Reason" />
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors">
        <MessageSquare className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}

// Metric Card Component
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
        {showGraph && (
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

// Chart Panel Component
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

// No Data Panel Component
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
