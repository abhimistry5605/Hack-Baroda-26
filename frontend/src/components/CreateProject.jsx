import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { FolderPlus, CheckCircle, AlertTriangle, RefreshCw, Eye, Tag, Calendar, Layers } from 'lucide-react';

export default function CreateProject() {
  const navigate = useNavigate();
  
  // Form initial state
  const initialFormState = {
    projectName: '',
    teamName: '',
    description: '',
    projectType: 'Web Application',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load projects list
  const loadProjects = async () => {
    try {
      setLoading(true);
      const list = await apiService.getProjects();
      setProjectsList(list);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load project inventory. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Front-end validations
    if (!formData.projectName.trim()) {
      setError('Project Name cannot be empty.');
      return;
    }
    if (!formData.teamName.trim()) {
      setError('Team Name cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const created = await apiService.createProject(formData);
      setSuccess(true);
      
      // Reset fields
      setFormData(initialFormState);
      
      // Delay navigation slightly to let success notification render
      setTimeout(() => {
        navigate(`/projects/${created._id}`);
      }, 1200);

    } catch (err) {
      setError(err.message || 'An error occurred while creating project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 relative">
      <div className="glow-bg bg-violet-500/10 w-[350px] h-[350px] top-10 right-10"></div>
      <div className="glow-bg bg-cyan-500/10 w-[300px] h-[300px] bottom-10 left-10"></div>
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <FolderPlus className="w-8 h-8 text-violet-400" />
          Create New Project Space
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Configure a dedicated scope to group development modules, register revisions, and track builds.
        </p>
      </div>

      {/* Forms Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        
        {/* Creation Card */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border-slate-800">
          <h2 className="text-base font-bold text-white mb-6">Workspace Attributes</h2>
          
          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs mb-4 flex gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-semibold">Project Registered!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Redirecting to project page...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs mb-4 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="e.g. E-Commerce Core"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Team Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Team Name *
              </label>
              <input
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleChange}
                placeholder="e.g. Alpha Squad"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Project Type
              </label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Web Application">Web Application</option>
                <option value="Mobile Application">Mobile Application</option>
                <option value="API Service">API Service</option>
                <option value="Microservice">Microservice</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Project Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="A brief summary of what services this project includes..."
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>

        {/* Projects Cards Inventory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-violet-400" />
              Active Project Spaces
            </h2>
            <button
              onClick={loadProjects}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading && projectsList.length === 0 ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : projectsList.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-500 text-xs rounded-2xl">
              <FolderPlus className="w-10 h-10 mx-auto mb-2 opacity-30 animate-pulse" />
              <p>No active project spaces configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectsList.map((p) => (
                <div
                  key={p._id}
                  className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-violet-500/35 transition transform duration-200 hover:-translate-y-0.5 border border-slate-800/80 bg-slate-900/40 relative overflow-hidden group"
                >
                  {/* Subtle top decoration bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 group-hover:from-cyan-400/40 group-hover:to-violet-400/40 transition"></div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-extrabold text-white text-sm tracking-wide group-hover:text-cyan-300 transition">
                        {p.projectName}
                      </h3>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {p.projectType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 h-8">
                      {p.description || 'No description added yet.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">Team: <span className="font-medium text-slate-300">{p.teamName}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Modules: <span className="font-bold text-slate-300">{p.totalModules || 0}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/60 mt-4 pt-3 flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={() => navigate(`/projects/${p._id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/80 transition"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      View Project
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
