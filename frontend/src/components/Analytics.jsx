import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { 
  BarChart2, 
  Layers, 
  Folder, 
  Terminal, 
  Bot, 
  RefreshCw, 
  Calendar, 
  Filter, 
  Download, 
  FileText, 
  Users, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Printer, 
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function Analytics() {
  // Filters state
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [filters, setFilters] = useState({
    projectId: '',
    moduleId: '',
    status: '',
    environment: '',
    startDate: '',
    endDate: '',
  });

  // Analytics data state
  const [overview, setOverview] = useState({
    totalProjects: 0,
    totalModules: 0,
    totalDeployments: 0,
    successful: 0,
    failed: 0,
    partial: 0,
    successRate: 100,
    activeDevelopers: 0,
    aiSummary: 'SafeDeploy AI engine initializing metrics analysis...',
  });

  const [modulesStats, setModulesStats] = useState([]);
  const [developersStats, setDevelopersStats] = useState([]);
  const [deploymentsTrend, setDeploymentsTrend] = useState([]);
  
  // UI Loading/Error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report generation state
  const [selectedReport, setSelectedReport] = useState('summary'); // 'summary', 'failed', 'developer', 'health'
  const [selectedFormat, setSelectedFormat] = useState('csv'); // 'csv', 'excel', 'pdf'
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Initial Fetch: Projects and all Modules for filtering dropdowns
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const projs = await apiService.getProjects();
        setProjects(projs);
        const mods = await apiService.getModules();
        setModules(mods);
      } catch (err) {
        console.error('Failed to load metadata for filters:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Whenever a project filter changes, filter the list of available modules in dropdown
  const [filteredModulesDropdown, setFilteredModulesDropdown] = useState([]);
  useEffect(() => {
    if (filters.projectId) {
      setFilteredModulesDropdown(modules.filter(m => {
        // Handle in-memory mock vs DB population differences
        const pId = m.projectId?._id || m.projectId;
        return pId === filters.projectId;
      }));
      // Reset module filter if it belongs to another project
      setFilters(prev => ({ ...prev, moduleId: '' }));
    } else {
      setFilteredModulesDropdown(modules);
    }
  }, [filters.projectId, modules]);

  // Main analytics fetch triggered by filter changes
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Trigger all endpoint requests in parallel
      const [overviewData, modsData, devsData, trendData] = await Promise.all([
        apiService.getAnalyticsOverview(filters),
        apiService.getAnalyticsModules(filters),
        apiService.getAnalyticsDevelopers(filters),
        apiService.getAnalyticsDeployments(filters)
      ]);

      setOverview(overviewData);
      setModulesStats(modsData);
      setDevelopersStats(devsData);
      setDeploymentsTrend(trendData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analytics metrics. Verify that backend service is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const handleFilterReset = () => {
    setFilters({
      projectId: '',
      moduleId: '',
      status: '',
      environment: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Report Export Handler
  const handleExport = async () => {
    if (selectedReport === 'weekly') {
      try {
        setPreviewLoading(true);
        setShowPreviewModal(true);
        const data = await apiService.getWeeklyReport();
        setPreviewData(data);
      } catch (err) {
        console.error(err);
        setError('Failed to generate weekly AI operations report.');
      } finally {
        setPreviewLoading(false);
      }
      return;
    }

    if (selectedFormat === 'pdf') {
      // Trigger a printable layout preview modal
      try {
        setPreviewLoading(true);
        setShowPreviewModal(true);
        // Request format=json to display report table preview
        const exportUrl = apiService.getReportExportUrl(selectedReport, 'json', filters);
        const res = await fetch(exportUrl);
        const data = await res.json();
        setPreviewData(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch report preview data.');
      } finally {
        setPreviewLoading(false);
      }
    } else {
      // CSV and Excel: open file directly to download
      const targetFormat = selectedFormat === 'excel' ? 'csv' : 'csv'; // Both output standard formatted CSV
      const url = apiService.getReportExportUrl(selectedReport, targetFormat, filters);
      window.open(url, '_blank');
    }
  };


  const triggerPrint = () => {
    const printContent = document.getElementById('report-printable-area').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple window printable viewport swap
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SafeDeploy DevOps Diagnostics - Report Export</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background-color: #ffffff; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
            p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background-color: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-weight: bold; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            .header-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; background: #e2e8f0; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 20px;">
            <h1>SafeDeploy Operations Report: ${selectedReport.toUpperCase()}</h1>
            <p>Generated on ${new Date().toLocaleString()} | Filter criteria: Project: ${filters.projectId || 'All'}, Module: ${filters.moduleId || 'All'}, Status: ${filters.status || 'All'}</p>
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Helper calculation for SVG Donut Chart
  const donutRadius = 35;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutTotal = overview.successful + overview.failed + overview.partial;
  const successPercentage = donutTotal > 0 ? overview.successful / donutTotal : 0;
  const failedPercentage = donutTotal > 0 ? overview.failed / donutTotal : 0;
  const partialPercentage = donutTotal > 0 ? overview.partial / donutTotal : 0;

  const strokeSuccess = donutCircumference * successPercentage;
  const strokeFailed = donutCircumference * failedPercentage;
  const strokePartial = donutCircumference * partialPercentage;

  const offsetSuccess = donutCircumference;
  const offsetFailed = donutCircumference - strokeSuccess;
  const offsetPartial = donutCircumference - strokeSuccess - strokeFailed;

  // Helper calculation for SVG Deployments Over Time Line Chart
  const svgW = 540;
  const svgH = 220;
  const padL = 45;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const maxTrendTotal = deploymentsTrend.length > 0 
    ? Math.max(...deploymentsTrend.map(d => d.total), 5) 
    : 5;

  const trendPoints = deploymentsTrend.map((t, idx) => {
    const x = deploymentsTrend.length > 1
      ? padL + (idx / (deploymentsTrend.length - 1)) * plotW
      : padL + plotW / 2;
    const y = padT + plotH - (t.total / maxTrendTotal) * plotH;
    return { x, y, data: t };
  });

  const linePathD = trendPoints.length > 0
    ? `M ${trendPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';

  const areaPathD = trendPoints.length > 0
    ? `${linePathD} L ${trendPoints[trendPoints.length - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} L ${trendPoints[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`
    : '';

  return (
    <div className="space-y-8 relative pb-12">
      {/* Background Neon Blurs */}
      <div className="glow-bg bg-cyan-500/10 w-[400px] h-[400px] top-10 right-10"></div>
      <div className="glow-bg bg-violet-500/10 w-[500px] h-[500px] bottom-10 left-10"></div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            System Analytics & Reports
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Audit logs statistics, SVG telemetries, and file exporter panel.
          </p>
        </div>
        <button
          onClick={fetchAnalyticsData}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Stats
        </button>
      </div>

      {/* Connection Errors */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex gap-3 items-start relative z-10">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Metrics Offline</p>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Collapsible Filter Panel */}
      <div className="glass-panel p-5 rounded-2xl relative z-10">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            Global Context Filters
          </span>
          <button 
            onClick={handleFilterReset}
            className="text-[10px] uppercase font-bold text-slate-400 hover:text-cyan-400 transition"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Project Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Workspace</label>
            <select
              name="projectId"
              value={filters.projectId}
              onChange={handleInputChange}
              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-400/50 outline-none transition"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          {/* Module Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Microservice Module</label>
            <select
              name="moduleId"
              value={filters.moduleId}
              onChange={handleInputChange}
              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-400/50 outline-none transition"
            >
              <option value="">All Modules</option>
              {filteredModulesDropdown.map(m => (
                <option key={m._id} value={m._id}>{m.moduleName}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Build Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleInputChange}
              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-400/50 outline-none transition"
            >
              <option value="">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Partial Success">Partial Success</option>
            </select>
          </div>

          {/* Environment */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Environment</label>
            <select
              name="environment"
              value={filters.environment}
              onChange={handleInputChange}
              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-400/50 outline-none transition"
            >
              <option value="">All Envs</option>
              <option value="Development">Development</option>
              <option value="Testing">Testing</option>
              <option value="Staging">Staging</option>
              <option value="Production">Production</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleInputChange}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-400/50 outline-none transition"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End Date</label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleInputChange}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-400/50 outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Memory Summary */}
      <div className="glass-panel p-6 rounded-2xl relative z-10 border-l-4 border-l-cyan-400 flex flex-col md:flex-row gap-5 items-center">
        <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/5">
          <Bot className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex-1 space-y-1 text-center md:text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">SafeDeploy Cognitive AI Engine</h3>
            <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400 hidden sm:inline">Context-Aware Analysis</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans mt-1">
            {overview.aiSummary.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i} className="text-cyan-300">{chunk}</strong> : chunk)}
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7 relative z-10">
        {[
          { label: 'Workspaces', value: overview.totalProjects, icon: Folder, color: 'text-cyan-400' },
          { label: 'Active Modules', value: overview.totalModules, icon: Layers, color: 'text-violet-400' },
          { label: 'Total Runs', value: overview.totalDeployments, icon: Terminal, color: 'text-emerald-400' },
          { label: 'Successes', value: overview.successful, icon: CheckCircle, color: 'text-teal-400' },
          { label: 'Failures', value: overview.failed, icon: AlertTriangle, color: 'text-rose-400' },
          { label: 'Success Rate', value: `${overview.successRate}%`, icon: Activity, color: 'text-indigo-400' },
          { label: 'Developers', value: overview.activeDevelopers, icon: Users, color: 'text-amber-400' },
        ].map((item, idx) => (
          <div key={idx} className="glass-panel p-4 rounded-xl flex flex-col justify-between hover:border-slate-700/60 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
            </div>
            <span className="text-xl font-extrabold text-white mt-2 block tracking-tight">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Donut Chart: Deployment Status Distribution */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[320px]">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider border-b border-slate-800/80 pb-2">
            Status Distribution
          </h3>
          <div className="flex-1 flex items-center justify-between relative gap-4">
            <div className="relative w-36 h-36 shrink-0">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Underlay shadow ring */}
                <circle cx="50" cy="50" r={donutRadius} fill="transparent" stroke="#1e293b" strokeWidth="8" />
                
                {donutTotal === 0 ? (
                  <circle cx="50" cy="50" r={donutRadius} fill="transparent" stroke="#334155" strokeWidth="8" />
                ) : (
                  <>
                    {/* Success segment */}
                    {strokeSuccess > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray={`${strokeSuccess} ${donutCircumference}`}
                        strokeDashoffset={offsetSuccess}
                        className="transition-all duration-500"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Failed segment */}
                    {strokeFailed > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="8"
                        strokeDasharray={`${strokeFailed} ${donutCircumference}`}
                        strokeDashoffset={offsetFailed}
                        className="transition-all duration-500"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Partial segment */}
                    {strokePartial > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="8"
                        strokeDasharray={`${strokePartial} ${donutCircumference}`}
                        strokeDashoffset={offsetPartial}
                        className="transition-all duration-500"
                        strokeLinecap="round"
                      />
                    )}
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white leading-none">{donutTotal}</span>
                <span className="text-[8px] text-slate-400 font-bold tracking-widest mt-1">TOTAL</span>
              </div>
            </div>
            {/* Legend info */}
            <div className="flex-1 space-y-3.5">
              {[
                { label: 'Success', count: overview.successful, color: 'bg-emerald-500' },
                { label: 'Failed', count: overview.failed, color: 'bg-rose-500' },
                { label: 'Partial', count: overview.partial, color: 'bg-amber-500' }
              ].map((leg, i) => {
                const pct = donutTotal > 0 ? Math.round((leg.count / donutTotal) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${leg.color}`} />
                    <div className="flex-1 flex justify-between items-baseline min-w-0">
                      <span className="text-xs text-slate-300 font-medium truncate">{leg.label}</span>
                      <span className="text-xs text-slate-400 font-bold ml-2 font-mono">
                        {leg.count} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Deployments Over Time Line Chart */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[320px] lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider border-b border-slate-800/80 pb-2">
            Deployment Run Trends
          </h3>
          <div className="flex-1 min-h-0 relative">
            {deploymentsTrend.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <Activity className="w-8 h-8 opacity-25" />
                <span>No deployment historical trends detected.</span>
              </div>
            ) : (
              <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
                <defs>
                  {/* Fill Area Gradient */}
                  <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padT + ratio * plotH;
                  const labelVal = Math.round(maxTrendTotal - ratio * maxTrendTotal);
                  return (
                    <g key={i}>
                      <line 
                        x1={padL} 
                        y1={y} 
                        x2={svgW - padR} 
                        y2={y} 
                        stroke="#1e293b" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x={padL - 8} 
                        y={y + 4} 
                        fill="#64748b" 
                        fontSize="9" 
                        textAnchor="end" 
                        fontFamily="monospace"
                      >
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area under the line */}
                {trendPoints.length > 0 && (
                  <path d={areaPathD} fill="url(#areaGlow)" />
                )}

                {/* Main line path */}
                {trendPoints.length > 0 && (
                  <path 
                    d={linePathD} 
                    fill="none" 
                    stroke="url(#lineGrad)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    className="filter drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                  />
                )}

                {/* Trend Points dots */}
                {trendPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="4.5" 
                      fill="#06b6d4" 
                      stroke="#0b0f19" 
                      strokeWidth="1.5" 
                    />
                    {/* Hover trigger tooltip label helper */}
                    <text 
                      x={pt.x} 
                      y={pt.y - 8} 
                      fill="#ffffff" 
                      fontSize="9" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      fontFamily="monospace"
                      opacity={deploymentsTrend.length > 15 ? '0' : '1'}
                    >
                      {pt.data.total}
                    </text>
                  </g>
                ))}

                {/* X-Axis labels */}
                {trendPoints.map((pt, idx) => {
                  // Label spacing
                  const skip = Math.ceil(trendPoints.length / 6);
                  if (idx % skip !== 0 && idx !== trendPoints.length - 1) return null;
                  
                  // Format Date string: MM/DD
                  const dObj = new Date(pt.data.date);
                  const label = `${dObj.getMonth() + 1}/${dObj.getDate()}`;
                  return (
                    <text 
                      key={idx} 
                      x={pt.x} 
                      y={padT + plotH + 18} 
                      fill="#64748b" 
                      fontSize="9" 
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  );
                })}

                {/* Glow Gradients Definition */}
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>

      </div>

      {/* Grid: Developers & Modules Detail Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

        {/* Modules Stats list */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px]">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider border-b border-slate-800/80 pb-2 flex items-center justify-between">
            <span>Deployments Per Module</span>
            <span className="text-[10px] text-slate-500 lowercase font-medium">Sorted by popularity</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {modulesStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                <span>No modules aggregated.</span>
              </div>
            ) : (
              modulesStats.map((mod, idx) => {
                const maxModDeploys = Math.max(...modulesStats.map(m => m.total), 1);
                const pct = (mod.total / maxModDeploys) * 100;
                const healthPct = mod.total > 0 ? Math.round(((mod.total - mod.issuesCount) / mod.total) * 100) : 100;

                return (
                  <div key={mod.moduleId} className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-300 truncate max-w-[170px]">{mod.moduleName}</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-400 font-mono">{mod.total} deploys</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          healthPct > 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {healthPct}% OK
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative border border-slate-800/60">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most Active Developers */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px]">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider border-b border-slate-800/80 pb-2 flex items-center justify-between">
            <span>Active Developers</span>
            <span className="text-[10px] text-slate-500 lowercase font-medium">Sorted by total runs</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {developersStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                <span>No developer activity logged.</span>
              </div>
            ) : (
              developersStats.map((dev, idx) => {
                const maxDevDeploys = Math.max(...developersStats.map(d => d.total), 1);
                const pct = (dev.total / maxDevDeploys) * 100;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-300 truncate">{dev.developerName}</span>
                      <div className="flex gap-3 text-[10px] font-mono text-slate-400">
                        <span>{dev.total} total</span>
                        <span className="text-emerald-400">{dev.success} OK</span>
                        <span className="text-rose-400">{dev.failed} err</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative border border-slate-800/60">
                      <div 
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Issues and Build Quality Metrics */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px]">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider border-b border-slate-800/80 pb-2">
            Incidents By Module
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {modulesStats.filter(m => m.issuesCount > 0).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                <CheckCircle className="w-6 h-6 text-emerald-500/50 mb-2" />
                <span>Zero system build errors recorded!</span>
              </div>
            ) : (
              modulesStats
                .filter(m => m.issuesCount > 0)
                .sort((a, b) => b.issuesCount - a.issuesCount)
                .map((mod, idx) => {
                  const maxIssues = Math.max(...modulesStats.map(m => m.issuesCount), 1);
                  const pct = (mod.issuesCount / maxIssues) * 100;

                  return (
                    <div key={mod.moduleId} className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-300 truncate max-w-[180px]">{mod.moduleName}</span>
                        <span className="text-[10px] text-rose-400 font-bold font-mono">{mod.issuesCount} exceptions</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative border border-slate-800/60">
                        <div 
                          className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

      {/* Reports and PDF/CSV Export Section */}
      <div className="glass-panel p-6 rounded-2xl relative z-10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <FileText className="w-5.5 h-5.5 text-cyan-400" />
          Operations Report Generator
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Report Selection cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { 
                id: 'summary', 
                title: 'Deployment Summary', 
                desc: 'Audited log of deployment versions, dates, status, environment targets, and logged developers.' 
              },
              { 
                id: 'failed', 
                title: 'Failed Deployments & Exceptions', 
                desc: 'Filtered log of failed & partially successful builds with error logs, root causes, and fixes.' 
              },
              { 
                id: 'developer', 
                title: 'Developer Run Activity', 
                desc: 'Developer performance matrix including total runs, successful builds, failed builds, and success rate.' 
              },
              { 
                id: 'health', 
                title: 'Module Quality Health', 
                desc: 'Calculated success scores, recorded exceptions, and total deployments per registered module.' 
              },
              { 
                id: 'weekly', 
                title: 'Weekly AI Operations Report', 
                desc: 'AI-synthesized weekly summary reviewing team runs, incident categories, resolutions, and system health status.' 
              },
            ].map(rep => (

              <div 
                key={rep.id}
                onClick={() => setSelectedReport(rep.id)}
                className={`p-4 rounded-xl cursor-pointer border transition duration-200 ${
                  selectedReport === rep.id 
                    ? 'bg-slate-800/60 border-cyan-400/60 text-cyan-400 shadow-md shadow-cyan-500/5' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/60 text-slate-300'
                }`}
              >
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedReport === rep.id ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  {rep.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{rep.desc}</p>
              </div>
            ))}
          </div>

          {/* Format selection and generator trigger */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Export Format</h3>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'csv', label: 'CSV File', icon: FileText },
                  { id: 'excel', label: 'Excel (CSV)', icon: FileSpreadsheet },
                  { id: 'pdf', label: 'PDF Report', icon: Printer },
                ].map(form => {
                  const Icon = form.icon;
                  return (
                    <button
                      key={form.id}
                      onClick={() => setSelectedFormat(form.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition ${
                        selectedFormat === form.id
                          ? 'bg-slate-800 text-cyan-400 border-cyan-400/50'
                          : 'bg-slate-950/40 border-slate-800 hover:bg-slate-850 hover:text-white text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {form.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-3 font-semibold rounded-xl text-xs bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/10 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="w-4 h-4" />
              Generate & Export Report
            </button>
          </div>
        </div>
      </div>

      {/* PDF Export Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-cyan-400" />
                  Print Preview: {selectedReport.toUpperCase()} Report
                </h3>
                <p className="text-xs text-slate-400 mt-1">Review aggregated results before saving as PDF document.</p>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#070b13]">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="text-xs text-slate-400">Compiling database logs...</span>
                </div>
              ) : selectedReport === 'weekly' ? (
                previewData && (
                  <div id="report-printable-area" className="w-full space-y-6 text-left text-slate-200">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-cyan-400" />
                        Weekly AI Diagnostic Summary
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        During the {previewData.timeframe} timeframe, SafeDeploy monitored a total of <strong>{previewData.deploymentsCount}</strong> release runs across workspace clusters. 
                        A total of <strong>{previewData.successesCount}</strong> builds successfully completed health integrity tests, and <strong>{previewData.failuresCount}</strong> incidents occurred. 
                        The team has actively applied structured resolutions to restore systems.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Team activity summary */}
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Team Deployment Logs</h4>
                        <table className="w-full text-[11px] border-collapse text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                              <th className="py-2 text-left">Developer Name</th>
                              <th className="py-2 text-right">Runs count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.teamActivity?.map((act, i) => (
                              <tr key={i} className="border-b border-slate-850 hover:bg-slate-850/20">
                                <td className="py-2">{act.name}</td>
                                <td className="py-2 text-right font-mono font-bold text-slate-200">{act.deploymentsCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* General metrics summary */}
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 flex flex-col justify-around">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Operations Performance</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>Total Operations Runs:</span>
                            <strong className="text-white font-mono">{previewData.deploymentsCount}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Successful Releases:</span>
                            <strong className="text-emerald-400 font-mono">{previewData.successesCount}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Logged Exceptions:</span>
                            <strong className="text-rose-400 font-mono">{previewData.failuresCount}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Quality Run Rate:</span>
                            <strong className="text-cyan-400 font-mono">
                              {previewData.deploymentsCount > 0 ? Math.round((previewData.successesCount / previewData.deploymentsCount) * 100) : 100}%
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Incident resolutions list */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Weekly Incident Resolutions</h4>
                      {previewData.resolutions?.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No operations errors logged this week.</p>
                      ) : (
                        <div className="divide-y divide-slate-850">
                          {previewData.resolutions?.map((res, i) => (
                            <div key={i} className="py-2.5 text-xs text-slate-300">
                              <span className="font-bold text-slate-200 font-mono block">[{res.moduleName}] {res.issueTitle}</span>
                              <p className="text-[11px] text-slate-400 mt-1"><strong className="text-emerald-400 font-semibold">Resolution:</strong> {res.fixApplied}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : previewData && previewData.length > 0 ? (
                <div id="report-printable-area" className="w-full">
                  <table className="w-full text-xs text-slate-200 border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                        {Object.keys(previewData[0]).map((h, i) => (
                          <th key={i} className="p-3 text-left border-b border-slate-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40 border-b border-slate-800/60 transition">
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} className="p-3 max-w-[200px] truncate">
                              {typeof val === 'string' && ['Success', 'Failed', 'Partial Success'].includes(val) ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  val === 'Success' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : val === 'Failed' 
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {val}
                                </span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No records match your selected timeframe and filters.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Close
              </button>
              <button
                onClick={triggerPrint}
                disabled={!previewData}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white disabled:opacity-50 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print/Save PDF
              </button>
            </div>


          </div>
        </div>
      )}

    </div>
  );
}
