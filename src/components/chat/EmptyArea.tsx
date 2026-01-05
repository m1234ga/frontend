import React, { useMemo } from "react";
import {
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Clock,
  User,
  TrendingUp,
  Activity,
  ArrowRight
} from "lucide-react";
import { Chat as ChatModel } from "../../../../Shared/Models";

interface EmptyAreaProps {
  conversations: ChatModel[];
  currentUser: any;
}

export function EmptyArea({ conversations, currentUser }: EmptyAreaProps) {
  const stats = useMemo(() => {
    if (!currentUser) return null;

    const assignedToMe = conversations.filter(c => c.assignedTo === currentUser.id);
    const myOpen = assignedToMe.filter(c => c.status === 'open' || !c.status).length;
    const myClosed = assignedToMe.filter(c => c.status === 'closed').length;

    const globalOpen = conversations.filter(c => c.status === 'open' || !c.status).length;
    const globalClosed = conversations.filter(c => c.status === 'closed').length;

    const unreadCount = assignedToMe.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

    return {
      assignedCount: assignedToMe.length,
      myOpen,
      myClosed,
      globalOpen,
      globalClosed,
      unreadCount,
      totalCount: conversations.length
    };
  }, [conversations, currentUser]);

  if (!currentUser || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0b141a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#0b141a] overflow-y-auto p-8 lg:p-12 transition-colors duration-300">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto w-full mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              {getTimeGreeting()}, <span className="text-soft-primary">{currentUser.firstName || currentUser.username}</span>!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Here's how your performance looks for today.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-white dark:bg-[#1f2c33] p-2 rounded-2xl shadow-soft-sm border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 bg-soft-primary/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-soft-primary" />
            </div>
            <div className="pr-4">
              <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400">System Status</span>
              <span className="block text-sm font-bold text-gray-900 dark:text-white">Active & Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Assigned to Me"
          value={stats.assignedCount}
          icon={<User className="w-6 h-6 text-blue-500" />}
          color="blue"
          description="Total chats your handling"
        />
        <StatCard
          title="My Open Chats"
          value={stats.myOpen}
          icon={<MessageSquare className="w-6 h-6 text-green-500" />}
          color="green"
          description="Currently active responses"
        />
        <StatCard
          title="My Resolved"
          value={stats.myClosed}
          icon={<CheckCircle2 className="w-6 h-6 text-purple-500" />}
          color="purple"
          description="Successfully closed chats"
        />
        <StatCard
          title="Unread Messages"
          value={stats.unreadCount}
          icon={<Clock className="w-6 h-6 text-amber-500" />}
          color="amber"
          description="Messages awaiting attention"
          highlight={stats.unreadCount > 0}
        />
      </div>

      {/* Performance & Global Insights */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1f2c33] rounded-3xl p-8 shadow-soft-md border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-soft-primary" />
              Global Performance Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <ProgressStat
                label="Global Open Chats"
                value={stats.globalOpen}
                total={stats.totalCount}
                color="bg-green-500"
              />
              <ProgressStat
                label="Global Closed Chats"
                value={stats.globalClosed}
                total={stats.totalCount}
                color="bg-purple-500"
              />
            </div>

            <div className="bg-gray-50 dark:bg-[#2a3942] rounded-2xl p-6 flex flex-col justify-center">
              <div className="text-center">
                <span className="block text-4xl font-black text-soft-primary mb-1">
                  {stats.totalCount > 0 ? Math.round((stats.myClosed / (stats.myOpen + stats.myClosed || 1)) * 100) : 0}%
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Your Success Rate</span>
              </div>
              <div className="mt-6 flex items-center justify-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#2a3942] bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden`}>
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
                <span className="ml-3 text-xs font-medium text-gray-500 dark:text-gray-400">Join other 12 agents</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips / Engagement */}
        <div className="bg-soft-primary rounded-3xl p-8 text-white shadow-xl flex flex-col relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <TrendingUp className="w-10 h-10 mb-6 text-white/80" />
          <h3 className="text-2xl font-bold mb-4 leading-tight">Ready to boost your metrics?</h3>
          <p className="text-white/80 text-sm mb-8 leading-relaxed">
            Consistent response times and clear communication are key to raising your success rate. Check your unread messages to start!
          </p>
          <div className="mt-auto">
            <button className="flex items-center font-bold text-sm bg-white text-soft-primary px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg active:scale-95">
              View Assignments
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, description, highlight }: any) {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-500/10",
    green: "bg-green-50 dark:bg-green-500/10",
    purple: "bg-purple-50 dark:bg-purple-500/10",
    amber: "bg-amber-50 dark:bg-amber-500/10",
  };

  return (
    <div className={`p-6 rounded-3xl bg-white dark:bg-[#1f2c33] shadow-soft-md border border-gray-100 dark:border-gray-800 hover:scale-[1.02] transition-all duration-300 group ${highlight ? 'ring-2 ring-amber-500/50' : ''}`}>
      <div className={`${colors[color]} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="space-y-1">
        <span className="block text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</span>
        <span className="block text-sm font-bold text-gray-600 dark:text-gray-300">{title}</span>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider pt-1">{description}</p>
      </div>
    </div>
  );
}

function ProgressStat({ label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-xs font-black text-gray-400">{value} / {total}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
