import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { 
  GitCommit, 
  Folder, 
  Layers, 
  Terminal, 
  AlertTriangle, 
  CheckCircle, 
  Wrench, 
  ArrowRight,
  TrendingUp,
  Clock,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function Timeline() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeploy, setSelectedDeploy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDeployments();
      setDeployments(data);
      if (data.length > 0) {
        setSelectedDeploy(data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch deployment pipeline records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Compiling visual timeline pathways...</p>
        </div>
      </div>
    );
  }

  // Get project and module names safely
  const pName = selectedDeploy?.projectId?.projectName || 'N/A';
  const pType = selectedDeploy?.projectId?.projectType || 'N/A';
  const mName = selectedDeploy?.moduleId?.moduleName || 'N/A';
  const mType = selectedDeploy?.moduleId?.moduleType || 'N/A';
  
  const statusColor = selectedDeploy?.deploymentStatus === 'Success' 
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
    : selectedDeploy?.deploymentStatus === 'Failed'
      ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
      : 'text-amber-400 border-amber-500/30 bg-amber-500/10';

  return (
    <div className="space-y-8 relative pb-12">
      {/* Glow effects */}
      <div className="glow-bg bg-cyan-500/10 w-[300px] h-[300px] top-10 left-10"></div>
      <div className="glow-bg bg-violet-500/10 w-[400px] h-[400px] bottom-10 right-10"></div>

      {/* Header */}
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Continuous Deployment Timeline
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Interactive trace diagram of software releases, logged errors, and applied fixes.
          </p>
        </div>
        <button
          onClick={fetchDeployments}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Side: Timeline Feed */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-[600px]">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
            <Clock className="w-4.5 h-4.5 text-cyan-400" />
            Deployment Run Feed
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {deployments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                <span>No deployments recorded. Try seeding demo data.</span>
              </div>
            ) : (
              deployments.map(dep => {
                const isSelected = selectedDeploy?._id === dep._id;
                const statusBadge = dep.deploymentStatus === 'Success' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : dep.deploymentStatus === 'Failed'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400';

                return (
                  <div
                    key={dep._id}
                    onClick={() => setSelectedDeploy(dep)}
                    className={`p-3.5 rounded-xl cursor-pointer border transition duration-200 text-left ${
                      isSelected
                        ? 'bg-slate-800/60 border-cyan-400/60 shadow-lg shadow-cyan-500/5'
                        : 'bg-slate-900/40 border-slate-850 hover:border-slate-800 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-200 truncate block max-w-[160px]">
                        {dep.moduleId?.moduleName || 'Unknown Module'}
                      </span>
                      <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${statusBadge}`}>
                        {dep.deploymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>v{dep.version}</span>
                      <span>•</span>
                      <span>{dep.environment}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-1">
                      {new Date(dep.deploymentDate).toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Visual Flow Node Mapping */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-[600px] justify-between relative overflow-hidden">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800/80 pb-3 flex items-center justify-between">
            <span>Dependency Path Tracing</span>
            <span className="text-[10px] font-mono text-cyan-400">{selectedDeploy ? `ID: ${selectedDeploy._id}` : ''}</span>
          </h2>

          {selectedDeploy ? (
            <div className="flex-1 flex flex-col justify-center py-6">
              
              {/* Timeline nodes flowchart */}
              <div className="space-y-6 max-w-lg mx-auto w-full relative z-10">
                
                {/* Node 1: Project */}
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/5 transition duration-300 group-hover:scale-105 shrink-0">
                    <Folder className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 transition">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-200">{pName}</span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{pType}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Project Workspace</span>
                  </div>
                </div>

                {/* Vertical Connector Line */}
                <div className="w-12 flex justify-center h-5">
                  <div className="w-0.5 bg-gradient-to-b from-cyan-400 to-violet-500 h-full"></div>
                </div>

                {/* Node 2: Module */}
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/5 transition duration-300 group-hover:scale-105 shrink-0">
                    <Layers className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 transition">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-200">{mName}</span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{mType}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Microservice Module</span>
                  </div>
                </div>

                {/* Vertical Connector Line */}
                <div className="w-12 flex justify-center h-5">
                  <div className="w-0.5 bg-gradient-to-b from-violet-500 to-indigo-500 h-full"></div>
                </div>

                {/* Node 3: Deployment Run */}
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shadow-lg transition duration-300 group-hover:scale-105 shrink-0">
                    <Terminal className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 transition">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-200">v{selectedDeploy.version}</span>
                      <span className="text-[9px] bg-slate-850 px-1.5 py-0.5 rounded text-indigo-300 font-mono">env: {selectedDeploy.environment}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-slate-400">Triggered by {selectedDeploy.developerName}</span>
                      <span className="text-[9px] text-slate-500">{new Date(selectedDeploy.deploymentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status-Dependent Branches */}
                {selectedDeploy.deploymentStatus === 'Success' ? (
                  <>
                    {/* Success path */}
                    <div className="w-12 flex justify-center h-5">
                      <div className="w-0.5 bg-gradient-to-b from-indigo-500 to-emerald-500 h-full"></div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/5 transition duration-300 group-hover:scale-105 shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1 p-3 rounded-xl bg-emerald-950/10 border border-emerald-500/20">
                        <span className="text-xs font-bold text-emerald-400 block">Deploy Status: SUCCESS</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{selectedDeploy.notes || 'No deployment logs submitted.'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Failed / Partial Success paths */}
                    <div className="w-12 flex justify-center h-5">
                      <div className="w-0.5 bg-gradient-to-b from-indigo-500 to-rose-500 h-full"></div>
                    </div>

                    {/* Node 4: Issue */}
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/5 transition duration-300 group-hover:scale-105 shrink-0">
                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                      </div>
                      <div className="flex-1 p-3 rounded-xl bg-rose-950/10 border border-rose-500/20 text-left">
                        <span className="text-xs font-bold text-rose-400 block leading-tight">{selectedDeploy.issueTitle || 'Incident Outage'}</span>
                        <span className="text-[10px] text-slate-300 block mt-1 font-sans leading-relaxed">{selectedDeploy.issueDescription || 'No description provided.'}</span>
                        <span className="text-[9px] text-rose-300/80 block mt-1.5 font-mono">Root Cause: {selectedDeploy.rootCause || 'Under investigation.'}</span>
                      </div>
                    </div>

                    {/* Vertical Connector Line */}
                    <div className="w-12 flex justify-center h-5">
                      <div className="w-0.5 bg-gradient-to-b from-rose-500 to-amber-500 h-full"></div>
                    </div>

                    {/* Node 5: Fix Applied */}
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/5 transition duration-300 group-hover:scale-105 shrink-0">
                        <Wrench className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1 p-3 rounded-xl bg-amber-950/10 border border-amber-500/20 text-left">
                        <span className="text-xs font-bold text-amber-400 block">Applied Fix Action</span>
                        <span className="text-[10px] text-slate-300 block mt-1 leading-relaxed font-sans">{selectedDeploy.fixApplied || 'Troubleshooting in progress...'}</span>
                        <span className={`text-[9px] mt-1.5 inline-block font-extrabold px-1.5 py-0.5 rounded font-mono ${
                          selectedDeploy.deploymentStatus === 'Failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          Result: {selectedDeploy.deploymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <span>Select a deployment to audit pipeline path.</span>
            </div>
          )}

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] text-slate-500 text-center relative z-10">
            Click any deployment card in the left list feed to dynamically trace its project dependency tree.
          </div>
        </div>
      </div>

    </div>
  );
}
