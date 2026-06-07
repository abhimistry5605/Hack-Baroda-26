import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Layers, Folder, Cpu, Terminal, MessageSquare, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalModules: 0,
    totalDeployments: 0,
    totalQueries: 0,
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system metrics. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Synchronizing SafeDeploy system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Glow backgrounds */}
      <div className="glow-bg bg-cyan-500/10 w-[300px] h-[300px] top-10 left-10"></div>
      <div className="glow-bg bg-violet-500/10 w-[400px] h-[400px] bottom-10 right-10"></div>

      {/* Header */}
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            System Operations Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time status overview of active software modules and troubleshooting memories.
          </p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex gap-3 items-start relative z-10">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Connection Error</p>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
        {[
          { label: 'Total Projects', value: stats.totalProjects, icon: Folder, color: 'text-cyan-400', border: 'hover:border-cyan-500/30' },
          { label: 'Total Modules', value: stats.totalModules, icon: Layers, color: 'text-violet-400', border: 'hover:border-violet-500/30' },
          { label: 'Deployment Records', value: stats.totalDeployments, icon: Terminal, color: 'text-emerald-400', border: 'hover:border-emerald-500/30' },
          { label: 'AI Memory Queries', value: stats.totalQueries, icon: MessageSquare, color: 'text-amber-400', border: 'hover:border-amber-500/30' },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`glass-panel p-6 rounded-2xl transition duration-300 transform hover:-translate-y-1 ${item.border}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">{item.label}</span>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold tracking-tight text-white">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col h-[520px]">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Recent Deployment & Query Activities
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {stats.recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm py-12">
                <Layers className="w-10 h-10 mb-2 opacity-30" />
                <p>No recent activity detected. Try seeding the database or creating a project.</p>
              </div>
            ) : (
              stats.recentActivities.map((act) => (
                <div key={act.id} className="p-4 rounded-xl glass-card flex gap-4 hover:border-slate-700/60 transition">
                  <div className="shrink-0 mt-1">
                    {act.type === 'deployment' ? (
                      act.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      )
                    ) : (
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-sm text-slate-200 font-medium leading-relaxed">{act.message}</p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {act.type === 'deployment' && (
                      <div className="mt-2 flex gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          act.status === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : act.status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {act.status}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {act.projectName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Quickstart Helper / Info Box */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-violet-400" />
            AI Query Prompt Ideas
          </h2>
          <div className="space-y-4 flex-1">
            <p className="text-xs text-slate-400 leading-relaxed">
              SafeDeploy utilizes keyword correlation algorithms to scan through historical failures and developer resolution logs. Paste some of these examples into the **AI Chat** interface:
            </p>
            <div className="space-y-3">
              {[
                'Why did the Stripe integration fail?',
                'How was the MongoDB VPC connection restored?',
                'Explain the Redis auth failure on Node 2',
                'What was the timeout error fix for Stripe?',
              ].map((query, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 font-mono hover:border-slate-700 cursor-pointer transition"
                  onClick={() => window.location.hash = `/ai-chat?q=${encodeURIComponent(query)}`}
                >
                  &gt; {query}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20">
            <h3 className="text-xs font-bold text-violet-300">Hackathon Tip</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Log fresh deployments inside the **Deployment History** panel using the manual logger. If they fail, document a specific fix, and watch the AI query system instantly update to remember that solution!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
