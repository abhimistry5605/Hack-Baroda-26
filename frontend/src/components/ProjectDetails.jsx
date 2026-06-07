import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Folder, Tag, Calendar, Layers, Terminal, ArrowLeft, Trash2, Edit, Save, CheckCircle, AlertTriangle, RefreshCw, Plus, X, User, Shield, Layers2, Clock } from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [modules, setModules] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Project Edit Mode states
  const [isEditingProj, setIsEditingProj] = useState(false);
  const [projForm, setProjForm] = useState({
    projectName: '',
    teamName: '',
    description: '',
    projectType: '',
  });

  // Module Modal states
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [isEditingMod, setIsEditingMod] = useState(false);
  const [selectedModId, setSelectedModId] = useState('');
  const [modForm, setModForm] = useState({
    moduleName: '',
    moduleType: 'Other',
    description: '',
    owner: '',
  });

  const [savingProj, setSavingProj] = useState(false);
  const [savingMod, setSavingMod] = useState(false);
  const [deletingProj, setDeletingProj] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const proj = await apiService.getProjectById(id);
      setProject(proj);
      setProjForm({
        projectName: proj.projectName,
        teamName: proj.teamName,
        description: proj.description || '',
        projectType: proj.projectType,
      });

      const mods = await apiService.getModules(id);
      setModules(mods);

      const deploys = await apiService.getDeployments({ projectId: id });
      setDeployments(deploys);

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve project workspace details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!projForm.projectName.trim() || !projForm.teamName.trim()) {
      alert('Project Name and Team Name are required.');
      return;
    }

    setSavingProj(true);
    try {
      const updated = await apiService.updateProject(id, projForm);
      setProject(updated);
      setIsEditingProj(false);
      loadProjectData();
    } catch (err) {
      alert(err.message || 'Error updating project.');
    } finally {
      setSavingProj(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('WARNING: Deleting this project space will cascade delete all registered modules and deployment histories. This action is permanent. Proceed?')) {
      return;
    }

    setDeletingProj(true);
    try {
      await apiService.deleteProject(id);
      navigate('/create-project');
    } catch (err) {
      alert(err.message || 'Error deleting project.');
      setDeletingProj(false);
    }
  };

  // Module actions
  const handleOpenAddModule = () => {
    setIsEditingMod(false);
    setSelectedModId('');
    setModForm({
      moduleName: '',
      moduleType: 'Other',
      description: '',
      owner: '',
    });
    setSuccessMessage('');
    setShowModuleModal(true);
  };

  const handleOpenEditModule = (mod) => {
    setIsEditingMod(true);
    setSelectedModId(mod._id);
    setModForm({
      moduleName: mod.moduleName,
      moduleType: mod.moduleType,
      description: mod.description || '',
      owner: mod.owner || '',
    });
    setSuccessMessage('');
    setShowModuleModal(true);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!modForm.moduleName.trim()) {
      alert('Module Name is required.');
      return;
    }
    if (!modForm.owner.trim()) {
      alert('Owner / Developer Name is required.');
      return;
    }

    setSavingMod(true);
    try {
      if (isEditingMod) {
        await apiService.updateModule(selectedModId, modForm);
        setSuccessMessage('Module updated successfully!');
      } else {
        const payload = { ...modForm, projectId: id };
        await apiService.createModule(payload);
        setSuccessMessage('Module added successfully!');
      }

      // Refresh data
      const mods = await apiService.getModules(id);
      setModules(mods);

      // Brief delay to display notification before closing modal
      setTimeout(() => {
        setShowModuleModal(false);
        setSuccessMessage('');
      }, 1000);

    } catch (err) {
      alert(err.message || 'Error saving module.');
    } finally {
      setSavingMod(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module? This will also cascade delete all its deployment logs.')) {
      return;
    }

    try {
      await apiService.deleteModule(moduleId);
      // Refresh list
      const mods = await apiService.getModules(id);
      setModules(mods);
      const deploys = await apiService.getDeployments({ projectId: id });
      setDeployments(deploys);
    } catch (err) {
      alert(err.message || 'Error deleting module.');
    }
  };

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
        <h2 className="text-xl font-bold text-white">Project Workspace Error</h2>
        <p className="text-sm text-slate-400">{error || 'Project space not found.'}</p>
        <button
          onClick={() => navigate('/create-project')}
          className="mt-4 px-4 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-slate-200 hover:text-white"
        >
          Back to Projects List
        </button>
      </div>
    );
  }

  // Count Success vs Failed deployments
  const successDeploys = deployments.filter(d => d.status === 'success').length;
  const failedDeploys = deployments.filter(d => ['failed', 'rolled_back'].includes(d.status)).length;

  return (
    <div className="space-y-8 relative">
      <div className="glow-bg bg-violet-500/10 w-[300px] h-[300px] top-10 left-10"></div>
      <div className="glow-bg bg-cyan-500/10 w-[300px] h-[300px] bottom-10 right-10"></div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-10">
        <button
          onClick={() => navigate('/create-project')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          Back to Projects List
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditingProj(!isEditingProj)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition"
          >
            <Edit className="w-3.5 h-3.5 text-cyan-400" />
            {isEditingProj ? 'Cancel Edit' : 'Edit Workspace'}
          </button>
          
          <button
            onClick={handleDeleteProject}
            disabled={deletingProj}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 text-xs text-rose-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            {deletingProj ? 'Deleting...' : 'Delete Workspace'}
          </button>
        </div>
      </div>

      {/* Details Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        
        {/* Left Project Space Details Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          {isEditingProj ? (
            /* Editing form */
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <h2 className="text-lg font-bold text-white">Edit Workspace Settings</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Name</label>
                  <input
                    type="text"
                    value={projForm.projectName}
                    onChange={e => setProjForm(prev => ({ ...prev, projectName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team Name</label>
                  <input
                    type="text"
                    value={projForm.teamName}
                    onChange={e => setProjForm(prev => ({ ...prev, teamName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Type</label>
                  <select
                    value={projForm.projectType}
                    onChange={e => setProjForm(prev => ({ ...prev, projectType: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Web Application">Web Application</option>
                    <option value="Mobile Application">Mobile Application</option>
                    <option value="API Service">API Service</option>
                    <option value="Microservice">Microservice</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={projForm.description}
                    onChange={e => setProjForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProj(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProj}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingProj ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode details */
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Folder className="w-5 h-5 text-violet-400 shrink-0" />
                  <h1 className="text-2xl font-extrabold text-white tracking-wide">{project.projectName}</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                    {project.projectType}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
                  {project.description || 'No workspace description registered.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/60 pt-6 text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500">Ownership</span>
                    <span className="font-semibold text-slate-200">{project.teamName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500">Registered</span>
                    <span className="font-semibold text-slate-200">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500">Last Synced</span>
                    <span className="font-semibold text-slate-200">{new Date(project.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Counters Panel */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Workspace Health</h2>
          <div className="space-y-3">
            {[
              { label: 'Registered Modules', value: modules.length, icon: Layers, color: 'text-violet-400' },
              { label: 'Successful Builds', value: successDeploys, icon: CheckCircle, color: 'text-emerald-400' },
              { label: 'Incident Records', value: failedDeploys, icon: AlertTriangle, color: 'text-rose-400' },
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
                <span className="text-base font-extrabold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modules Registry Section */}
      <div className="space-y-6 relative z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            Project Modules Registry
          </h2>
          <button
            onClick={handleOpenAddModule}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Module
          </button>
        </div>

        {/* Modules Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.length === 0 ? (
            <div className="col-span-full glass-panel p-12 text-center text-slate-500 text-xs rounded-2xl">
              <Layers2 className="w-10 h-10 mx-auto mb-2 opacity-30 animate-pulse" />
              <p>No active modules registered to this project space yet.</p>
            </div>
          ) : (
            modules.map((m) => (
              <div
                key={m._id}
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-slate-800/85 hover:border-cyan-500/25 bg-slate-900/30 group transition"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-xs group-hover:text-cyan-400 transition">{m.moduleName}</h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {m.moduleType}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 h-8">
                    {m.description || 'No description provided.'}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-850">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      Owner: <span className="font-medium text-slate-300 truncate max-w-[100px]">{m.owner || 'N/A'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => navigate(`/deployments?moduleId=${m._id}`)}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-750 transition"
                  >
                    <Clock className="w-3 h-3 text-cyan-400" />
                    History
                  </button>
                  <button
                    onClick={() => handleOpenEditModule(m)}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-[10px] font-semibold text-slate-300 border border-slate-750 transition"
                  >
                    <Edit className="w-3 h-3 text-violet-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteModule(m._id)}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-955/20 hover:bg-rose-955/40 text-[10px] font-semibold text-rose-300 border border-rose-900/30 transition"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Latest Deployments timeline list */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col h-[320px] relative z-10">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Recent Deployment Executions ({deployments.length})
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {deployments.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-12">No deployments logs recorded yet.</div>
          ) : (
            deployments.map((d) => (
              <div
                key={d._id}
                onClick={() => navigate('/deployments')}
                className="p-3.5 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex gap-3 items-center">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    d.status === 'success' 
                      ? 'bg-emerald-500' 
                      : d.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                  }`} />
                  <div>
                    <span className="font-semibold text-slate-200 text-xs block">
                      {d.moduleId?.moduleName || d.moduleId?.name || d.moduleId || 'Unknown Module'} (v{d.version})
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {new Date(d.createdAt).toLocaleString()} • {d.environment}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  d.status === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : d.status === 'failed'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {d.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Module Add/Edit Modal Overlay */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0d1321] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                {isEditingMod ? 'Edit Service Module' : 'Register New Module'}
              </h3>
              <button
                onClick={() => setShowModuleModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification message */}
            {successMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveModule} className="space-y-4">
              {/* Module Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Module Name *
                </label>
                <input
                  type="text"
                  value={modForm.moduleName}
                  onChange={e => setModForm(prev => ({ ...prev, moduleName: e.target.value }))}
                  placeholder="e.g. Stripe Payment Linker"
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Module Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Module Type
                </label>
                <select
                  value={modForm.moduleType}
                  onChange={e => setModForm(prev => ({ ...prev, moduleType: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Authentication">Authentication</option>
                  <option value="Payment">Payment</option>
                  <option value="Orders">Orders</option>
                  <option value="Database">Database</option>
                  <option value="Notifications">Notifications</option>
                  <option value="API Service">API Service</option>
                  <option value="Admin Dashboard">Admin Dashboard</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Owner */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Owner / Developer Name *
                </label>
                <input
                  type="text"
                  value={modForm.owner}
                  onChange={e => setModForm(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Module Description
                </label>
                <textarea
                  rows={2}
                  value={modForm.description}
                  onChange={e => setModForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this module's responsibilities or stack detail..."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-805">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMod}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50"
                >
                  {savingMod ? 'Saving...' : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
