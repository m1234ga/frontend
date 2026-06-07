'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  LineChart, 
  Briefcase, 
  ShieldCheck, 
  Calendar
} from 'lucide-react';
import OperationsDashboard from '@/components/reports/OperationsDashboard';
import EmployeePerformanceDashboard from '@/components/reports/EmployeePerformanceDashboard';
import CustomerInsightsDashboard from '@/components/reports/CustomerInsightsDashboard';
import ManagementDashboard from '@/components/reports/ManagementDashboard';
import AuditDashboard from '@/components/reports/AuditDashboard';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('management');
  const [dateRange, setDateRange] = useState('7days');

  const tabs = [
    { id: 'management', label: 'Management', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'operations', label: 'Operations', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'performance', label: 'Employee Performance', icon: <Users className="w-5 h-5" /> },
    { id: 'customers', label: 'Customer Insights', icon: <LineChart className="w-5 h-5" /> },
    { id: 'audit', label: 'Audit & Compliance', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  const renderActiveDashboard = () => {
    switch (activeTab) {
      case 'management':
        return <ManagementDashboard dateRange={dateRange} />;
      case 'operations':
        return <OperationsDashboard dateRange={dateRange} />;
      case 'performance':
        return <EmployeePerformanceDashboard dateRange={dateRange} />;
      case 'customers':
        return <CustomerInsightsDashboard dateRange={dateRange} />;
      case 'audit':
        return <AuditDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-soft-bg dark:bg-slate-900 text-gray-900 dark:text-slate-200 overflow-hidden transition-colors duration-300">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white/80 dark:bg-slate-800/80 border-r border-gray-200 dark:border-slate-700/50 flex flex-col z-10 backdrop-blur-md transition-colors duration-300">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Enterprise Reporting</p>
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.5)]'
                  : 'hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Global Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700/50 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-2 px-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">
            <Calendar className="w-4 h-4" /> Date Range
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm dark:shadow-none"
            disabled={activeTab === 'audit'} // Audit doesn't use date range
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto relative bg-gray-50/50 dark:bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="p-8 max-w-7xl mx-auto w-full relative z-0">
          {renderActiveDashboard()}
        </div>
      </div>
    </div>
  );
}
