import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { History, Plus, AlertCircle, CheckCircle, ChevronRight, RefreshCw, Layers, Edit, Trash2, Eye, X, Search, Calendar, User, Clock, ShieldAlert, Bot, Wrench } from 'lucide-react';


export default function DeploymentHistory() {
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [filterModules, setFilterModules] = useState([]);

  // Search/Filters state
  const [filters, setFilters] = useState({
    projectId: '',
    moduleId: '',
    status: '',
    environment: '',
    version: '',
    searchIssue: '',
    searchDeveloper: '',
  });

  // Unique list of versions for dropdown filter
  const [versionsList, setVersionsList] = useState([]);

  // Form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDeployId, setSelectedDeployId] = useState('');
  
  const [formProjId, setFormProjId] = useState('');
  const [formModulesList, setFormModulesList] = useState([]);

  const initialFormState = {
    moduleId: '',
    developerName: '',
    version: '',
    environment: 'Production',
    issueTitle: '',
    issueDescription: '',
    rootCause: '',
    fixApplied: '',
    deploymentStatus: 'Success',
    notes: '',
    deploymentDate: new Date().toISOString().substring(0, 10),
  };

  const [formData, setFormData] = useState(initialFormState);

  // Details Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [inspectedRecord, setInspectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'copilot'
  const [aiSummary, setAiSummary] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');


  // Initial load projects and deployments
  const loadData = async () => {
    try {
      setLoading(true);
      const projData = await apiService.getProjects();
      setProjects(projData);

      // Auto-select first project for logging form
      if (projData.length > 0 && !formProjId) {
        setFormProjId(projData[0]._id);
      }

      // Check URL parameters for deep linking
      const params = new URLSearchParams(location.search);
      const urlModuleId = params.get('moduleId');
      
      const activeFilters = { ...filters };
      if (urlModuleId) {
        activeFilters.moduleId = urlModuleId;
        setFilters(activeFilters);
      }

      const deploys = await apiService.getDeployments(activeFilters);
      setDeployments(deploys);

      // Extract unique versions for version filter dropdown
      const versions = [...new Set(deploys.map(d => d.version))].filter(Boolean);
      setVersionsList(versions);

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not fetch deployment histories. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load modules list on project select for filters
  useEffect(() => {
    const loadFilterModules = async () => {
      try {
        const modData = await apiService.getModules(filters.projectId);
        setFilterModules(modData);
      } catch (err) {
        console.error(err);
      }
    };
    loadFilterModules();
  }, [filters.projectId]);

  // Load modules list for the insert form on project change
  useEffect(() => {
    const loadFormModules = async () => {
      if (!formProjId) return;
      try {
        const modData = await apiService.getModules(formProjId);
        setFormModulesList(modData);
        if (modData.length > 0) {
          setFormData(prev => ({ ...prev, moduleId: modData[0]._id }));
        } else {
          setFormData(prev => ({ ...prev, moduleId: '' }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadFormModules();
  }, [formProjId]);

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleOpenAddForm = () => {
    setIsEditing(false);
    setSelectedDeployId('');
    if (projects.length > 0) {
      setFormProjId(projects[0]._id);
    }
    setFormData(initialFormState);
    setSuccessMsg('');
    setShowFormModal(true);
  };

  const handleOpenEditForm = async (record) => {
    setIsEditing(true);
    setSelectedDeployId(record._id);
    
    // Set associated parent project
    const projId = record.projectId?._id || record.projectId;
    setFormProjId(projId);

    setFormData({
      moduleId: record.moduleId?._id || record.moduleId,
      developerName: record.developerName,
      version: record.version,
      environment: record.environment || 'Production',
      issueTitle: record.issueTitle || '',
      issueDescription: record.issueDescription || '',
      rootCause: record.rootCause || '',
      fixApplied: record.fixApplied || '',
      deploymentStatus: record.deploymentStatus || 'Success',
      notes: record.notes || '',
      deploymentDate: record.deploymentDate 
        ? new Date(record.deploymentDate).toISOString().substring(0, 10)
        : new Date().toISOString().substring(0, 10),
    });

    setSuccessMsg('');
    setShowFormModal(true);
  };

  const handleOpenDetails = async (record) => {
    setInspectedRecord(record);
    setShowDetailsModal(true);
    setActiveTab('details');
    setAiSummary(null);
    setRecommendations(null);
    setAiLoading(true);

    try {
      const summaryRes = await apiService.summarizeIncident(record._id);
      setAiSummary(summaryRes.summary);
      
      const recsRes = await apiService.getRecommendations(record._id);
      setRecommendations(recsRes);
    } catch (err) {
      console.error('Failed to retrieve AI analysis parameters:', err);
    } finally {
      setAiLoading(false);
    }
  };


  const handleResetForm = () => {
    setFormData(initialFormState);
    setError(null);
    setSuccessMsg('');
  };

  const handleSaveDeployment = async (e) => {
    e.preventDefault();
    if (!formProjId || !formData.moduleId) {
      alert('You must select a project space and module service to log.');
      return;
    }
    if (!formData.developerName.trim()) {
      alert('Developer Name is required.');
      return;
    }
    if (!formData.version.trim()) {
      alert('Version tag is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        projectId: formProjId,
      };

      if (isEditing) {
        await apiService.updateDeployment(selectedDeployId, payload);
        setSuccessMsg('Deployment history record updated successfully!');
      } else {
        await apiService.createDeployment(payload);
        setSuccessMsg('Deployment log recorded successfully!');
      }

      // Refresh list
      const deploys = await apiService.getDeployments(filters);
      setDeployments(deploys);

      setTimeout(() => {
        setShowFormModal(false);
        setSuccessMsg('');
      }, 1000);

    } catch (err) {
      setError(err.message || 'Error occurred while saving deployment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDeployment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deployment audit record?')) {
      return;
    }

    try {
      await apiService.deleteDeployment(id);
      const deploys = await apiService.getDeployments(filters);
      setDeployments(deploys);
    } catch (err) {
      alert(err.message || 'Error deleting deployment record.');
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="glow-bg bg-emerald-500/10 w-[300px] h-[300px] top-10 left-10"></div>
      <div className="glow-bg bg-cyan-500/10 w-[300px] h-[300px] bottom-10 right-10"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-8 h-8 text-emerald-400" />
            Deployment History Logs
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Comprehensive audit trace of environment builds, associated issues, applied updates, and fixes.
          </p>
        </div>
        
        <button
          onClick={handleOpenAddForm}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Log Record
        </button>
      </div>

      {/* Filter and Search Layout Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-4 relative z-10">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Search & Filters</h2>
        
        {/* Row 1: Text search inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Issue title, description, or fix..."
              value={filters.searchIssue}
              onChange={e => setFilters(prev => ({ ...prev, searchIssue: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Developer / Operator Name..."
              value={filters.searchDeveloper}
              onChange={e => setFilters(prev => ({ ...prev, searchDeveloper: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Row 2: Select drop list filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          {/* Project dropdown */}
          <div>
            <select
              value={filters.projectId}
              onChange={e => setFilters(prev => ({ ...prev, projectId: e.target.value, moduleId: '' }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          {/* Module dropdown */}
          <div>
            <select
              value={filters.moduleId}
              onChange={e => setFilters(prev => ({ ...prev, moduleId: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none"
            >
              <option value="">All Modules</option>
              {filterModules.map(m => (
                <option key={m._id} value={m._id}>{m.moduleName}</option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Partial Success">Partial Success</option>
            </select>
          </div>

          {/* Environment dropdown */}
          <div>
            <select
              value={filters.environment}
              onChange={e => setFilters(prev => ({ ...prev, environment: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none"
            >
              <option value="">All Env</option>
              <option value="Development">Development</option>
              <option value="Testing">Testing</option>
              <option value="Staging">Staging</option>
              <option value="Production">Production</option>
            </select>
          </div>

          {/* Version dropdown */}
          <div>
            <select
              value={filters.version}
              onChange={e => setFilters(prev => ({ ...prev, version: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none"
            >
              <option value="">All Versions</option>
              {versionsList.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Audit Log Table View */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 relative z-10">
        <div className="overflow-x-auto">
          {loading && deployments.length === 0 ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : deployments.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30 animate-pulse" />
              <p>No deployment records match the selected query configurations.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-4 font-bold">Module / Service</th>
                  <th className="py-4 px-2 font-bold">Version</th>
                  <th className="py-4 px-2 font-bold">Developer</th>
                  <th className="py-4 px-2 font-bold">Status</th>
                  <th className="py-4 px-4 font-bold">Issue / Incident</th>
                  <th className="py-4 px-2 font-bold">Date</th>
                  <th className="py-4 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deployments.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-900/30 transition duration-150">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-200">{d.moduleId?.moduleName || 'Unknown Module'}</div>
                      <div className="text-[10px] text-slate-500 uppercase mt-0.5">{d.environment}</div>
                    </td>
                    
                    <td className="py-4 px-2 text-slate-300 font-mono">
                      v{d.version}
                    </td>

                    <td className="py-4 px-2 text-slate-300 flex items-center gap-1.5 mt-2.5">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>{d.developerName}</span>
                    </td>

                    <td className="py-4 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        d.deploymentStatus === 'Success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : d.deploymentStatus === 'Failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {d.deploymentStatus}
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-[200px] truncate">
                      <span className={d.issueTitle ? 'text-slate-300 font-semibold' : 'text-slate-500 italic'}>
                        {d.issueTitle || 'No issue recorded'}
                      </span>
                    </td>

                    <td className="py-4 px-2 text-slate-400">
                      {new Date(d.deploymentDate).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetails(d)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition inline-flex items-center"
                        title="View Complete details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditForm(d)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition inline-flex items-center"
                        title="Edit Record"
                      >
                        <Edit className="w-3.5 h-3.5 text-violet-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteDeployment(d._id)}
                        className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/60 text-rose-300 hover:text-white border border-rose-900/10 transition inline-flex items-center"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Form Modal Dialog Overlay */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0d1321] border border-slate-800 rounded-2xl shadow-2xl p-6 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                {isEditing ? 'Edit Deployment Audit Record' : 'Record New Deployment Run'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification messages */}
            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveDeployment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Associated Project */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Parent Project Space *
                  </label>
                  <select
                    value={formProjId}
                    onChange={e => setFormProjId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  >
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.projectName}</option>
                    ))}
                  </select>
                </div>

                {/* Associated Module */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Service / Module *
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={e => setFormData(prev => ({ ...prev, moduleId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  >
                    {formModulesList.map(m => (
                      <option key={m._id} value={m._id}>{m.moduleName}</option>
                    ))}
                    {formModulesList.length === 0 && (
                      <option value="">-- Register a module first --</option>
                    )}
                  </select>
                </div>

                {/* Developer Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Developer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.developerName}
                    onChange={e => setFormData(prev => ({ ...prev, developerName: e.target.value }))}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                {/* Version */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Deployment Version *
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={e => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g. 2.4.1"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                {/* Environment */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Deployment Environment
                  </label>
                  <select
                    value={formData.environment}
                    onChange={e => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Development">Development</option>
                    <option value="Testing">Testing</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                  </select>
                </div>

                {/* Deployment Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Deployment Date
                  </label>
                  <input
                    type="date"
                    value={formData.deploymentDate}
                    onChange={e => setFormData(prev => ({ ...prev, deploymentDate: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Status */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Deployment Status
                  </label>
                  <select
                    value={formData.deploymentStatus}
                    onChange={e => setFormData(prev => ({ ...prev, deploymentStatus: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Success">Success</option>
                    <option value="Failed">Failed</option>
                    <option value="Partial Success">Partial Success</option>
                  </select>
                </div>
              </div>

              {/* Incidents Details Fields (only relevant if Failed/Partial Success) */}
              {(formData.deploymentStatus === 'Failed' || formData.deploymentStatus === 'Partial Success') && (
                <div className="grid grid-cols-1 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-850">
                  <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">Incident Diagnostics</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Issue Title *</label>
                    <input
                      type="text"
                      value={formData.issueTitle}
                      onChange={e => setFormData(prev => ({ ...prev, issueTitle: e.target.value }))}
                      placeholder="e.g. Memory leak under high cart loads"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Issue Description</label>
                      <textarea
                        rows={2}
                        value={formData.issueDescription}
                        onChange={e => setFormData(prev => ({ ...prev, issueDescription: e.target.value }))}
                        placeholder="Detail the error messages, trace logs, or symptoms..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Root Cause</label>
                      <textarea
                        rows={2}
                        value={formData.rootCause}
                        onChange={e => setFormData(prev => ({ ...prev, rootCause: e.target.value }))}
                        placeholder="Why did this occur? (e.g. missing firewall proxy configuration)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Fix Applied / Mitigation</label>
                    <textarea
                      rows={2}
                      value={formData.fixApplied}
                      onChange={e => setFormData(prev => ({ ...prev, fixApplied: e.target.value }))}
                      placeholder="e.g. Whitelisted Stripe CIDR blocks and configured Kubernetes DNS overrides..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  General Build Notes / Logs
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional observations, packages updated, or links..."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal Overlay */}
      {showDetailsModal && inspectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-[#0d1321] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {inspectedRecord.moduleId?.moduleName || 'Unknown Module'} — Release Trace
                </h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  Revision v{inspectedRecord.version} • Environment: <span className="uppercase font-bold text-cyan-400">{inspectedRecord.environment}</span>
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 px-4 border-b-2 transition ${
                  activeTab === 'details'
                    ? 'border-cyan-400 text-cyan-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Log Details
              </button>
              <button
                onClick={() => setActiveTab('copilot')}
                className={`pb-2.5 px-4 border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'copilot'
                    ? 'border-cyan-400 text-cyan-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                AI Copilot Assistance
              </button>
            </div>

            {/* Content Details Grid */}
            <div className="space-y-4 text-xs text-slate-300 max-h-[55vh] overflow-y-auto pr-1">
              
              {activeTab === 'details' ? (
                <>
                  {/* Deployment Status & Timeline banner */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Deployed: <strong>{new Date(inspectedRecord.deploymentDate).toLocaleString()}</strong></span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inspectedRecord.deploymentStatus === 'Success' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : inspectedRecord.deploymentStatus === 'Failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {inspectedRecord.deploymentStatus}
                    </span>
                  </div>

                  {/* Developer Metadata */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Triggered / Executed By: <strong className="text-white">{inspectedRecord.developerName}</strong></span>
                  </div>

                  {/* Incident report if exists */}
                  {inspectedRecord.issueTitle && (
                    <div className="space-y-3.5 border-t border-slate-850 pt-4">
                      <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
                        Recorded Incident Diagnostics
                      </h4>
                      
                      <div className="p-3 bg-rose-950/15 border border-rose-500/20 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-rose-300 uppercase block">Issue Title</span>
                        <p className="font-semibold text-white leading-relaxed">{inspectedRecord.issueTitle}</p>
                        {inspectedRecord.issueDescription && (
                          <p className="text-slate-400 leading-relaxed mt-2 text-[11px]">{inspectedRecord.issueDescription}</p>
                        )}
                      </div>

                      {inspectedRecord.rootCause && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Root Cause</span>
                          <p className="leading-relaxed text-slate-300 text-[11px]">{inspectedRecord.rootCause}</p>
                        </div>
                      )}

                      {inspectedRecord.fixApplied && (
                        <div className="p-3 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase block font-semibold">Fix Applied (Troubleshooting Memory)</span>
                          <p className="leading-relaxed text-emerald-100 font-medium text-[11px]">{inspectedRecord.fixApplied}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Build Notes */}
                  {inspectedRecord.notes && (
                    <div className="space-y-2 border-t border-slate-850 pt-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">General Build Notes & Logs</h4>
                      <pre className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10px] leading-relaxed max-h-36 overflow-y-auto">
                        {inspectedRecord.notes}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                      <span className="text-[11px] text-slate-400">Synthesizing diagnostics data...</span>
                    </div>
                  ) : (
                    <>
                      {/* AI Summarizer */}
                      {aiSummary ? (
                        <div className="p-4 rounded-xl bg-cyan-950/10 border border-cyan-500/20 space-y-2 text-left">
                          <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Bot className="w-4 h-4" />
                            AI Copilot Diagnostic
                          </h4>
                          <div className="text-slate-300 text-[11px] leading-relaxed font-sans space-y-2">
                            {aiSummary.split('\n\n').map((para, pIdx) => {
                              if (para.startsWith('###')) {
                                return <h5 key={pIdx} className="font-bold text-slate-200 mt-2">{para.replace(/###/g, '')}</h5>;
                              }
                              if (para.startsWith('####')) {
                                return <h5 key={pIdx} className="font-bold text-slate-200 mt-2">{para.replace(/####/g, '')}</h5>;
                              }
                              if (para.startsWith('-')) {
                                return (
                                  <ul key={pIdx} className="list-disc pl-4 space-y-1">
                                    {para.split('\n').map((li, lIdx) => (
                                      <li key={lIdx}>{li.replace(/^- /g, '')}</li>
                                    ))}
                                  </ul>
                                );
                              }
                              if (para.match(/^\d\./)) {
                                return (
                                  <ol key={pIdx} className="list-decimal pl-4 space-y-1">
                                    {para.split('\n').map((li, lIdx) => (
                                      <li key={lIdx}>{li.replace(/^\d\.\s/g, '')}</li>
                                    ))}
                                  </ol>
                                );
                              }
                              return <p key={pIdx}>{para}</p>;
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-500">No incident summaries available for this run.</div>
                      )}

                      {/* Smart Recommendations */}
                      {recommendations && (
                        <div className="space-y-4 border-t border-slate-850 pt-4 text-left">
                          
                          {/* Recommended Troubleshooting steps */}
                          {recommendations.recommendedTroubleshooting?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Recommended Troubleshooting Checklist</h4>
                              <div className="space-y-1.5">
                                {recommendations.recommendedTroubleshooting.map((step, sIdx) => (
                                  <label key={sIdx} className="flex items-start gap-2.5 p-2 rounded bg-slate-900 border border-slate-850 cursor-pointer hover:border-slate-700 transition">
                                    <input type="checkbox" className="mt-0.5 accent-cyan-400" />
                                    <span className="text-[11px] text-slate-300 font-sans leading-relaxed">{step}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Similar past issues */}
                          {recommendations.similarIssues?.length > 0 ? (
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Similar Past Incidents</h4>
                              <div className="space-y-2">
                                {recommendations.similarIssues.map((issue, iIdx) => (
                                  <div 
                                    key={iIdx} 
                                    onClick={() => handleOpenDetails(issue)}
                                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition text-left"
                                  >
                                    <div className="flex justify-between items-baseline font-mono text-[10px]">
                                      <span className="text-slate-400 font-bold">{issue.moduleName} (v{issue.version})</span>
                                      <span className="text-slate-500">{new Date(issue.deploymentDate).toLocaleDateString()}</span>
                                    </div>
                                    <p className="font-semibold text-slate-200 mt-1 leading-snug">{issue.issueTitle}</p>
                                    {issue.fixApplied && (
                                      <div className="mt-2 text-[10px] bg-slate-900/60 p-2 rounded text-emerald-400 border border-emerald-500/10">
                                        <strong className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold mb-0.5">Applied Fix:</strong>
                                        {issue.fixApplied}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center text-slate-500 text-[11px]">
                              Zero correlated past failures matching this root cause.
                            </div>
                          )}

                          {/* Responsible developers / Previous fixes summaries */}
                          {recommendations.responsibleDevelopers?.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experienced Contacts:</span>
                              {recommendations.responsibleDevelopers.map((dev, dIdx) => (
                                <span key={dIdx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-[10px] text-slate-300">
                                  {dev}
                                </span>
                              ))}
                            </div>
                          )}

                        </div>
                      )}

                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
