import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import CreateProject from './components/CreateProject';
import Modules from './components/Modules';
import DeploymentHistory from './components/DeploymentHistory';
import Analytics from './components/Analytics';
import AIChat from './components/AIChat';
import ProjectDetails from './components/ProjectDetails';
import Timeline from './components/Timeline';
import Architecture from './components/Architecture';
import apiService from './services/api';

import { 
  ShieldAlert, 
  BarChart2, 
  FolderPlus, 
  Layers, 
  History, 
  Bot, 
  Menu, 
  X, 
  LineChart, 
  GitBranch, 
  Cpu, 
  Search, 
  Bell, 
  Zap, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

function NavigationSidebar({ mobileOpen, setMobileOpen, onSeed }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [seeding, setSeeding] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart2 },
    { name: 'Create Project', path: '/create-project', icon: FolderPlus },
    { name: 'Modules Registry', path: '/modules', icon: Layers },
    { name: 'Deployment Logs', path: '/deployments', icon: History },
    { name: 'Deployment Timeline', path: '/timeline', icon: GitBranch },
    { name: 'Analytics & Reports', path: '/analytics', icon: LineChart },
    { name: 'AI Chat Assistant', path: '/ai-chat', icon: Bot },
    { name: 'System Architecture', path: '/architecture', icon: Cpu },
  ];

  const handleSeedClick = async () => {
    try {
      setSeeding(true);
      await onSeed();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1321]/95 border-r border-slate-800/80 w-64 p-5 shrink-0 justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800/80 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white tracking-widest uppercase block">SafeDeploy</span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-wider font-bold">AI MEMORY SYSTEM</span>
          </div>
        </div>

        {/* Nav Link List */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600/20 to-violet-600/20 text-cyan-400 border-l-2 border-cyan-400 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Seeder & Version Info */}
      <div className="pt-4 border-t border-slate-800/80 space-y-4">
        <button
          onClick={handleSeedClick}
          disabled={seeding}
          className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 border border-emerald-500/30 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/5 transition transform active:scale-95 disabled:opacity-50"
        >
          {seeding ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
          )}
          {seeding ? 'Seeding Database...' : 'Load Hackathon Demo'}
        </button>
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[10px] text-slate-500">
          <p className="font-semibold text-slate-400 text-center">SafeDeploy Core v1.1.0</p>
          <p className="text-center mt-1">Hackathon Special Edition</p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);

  const searchRef = useRef(null);
  const bellRef = useRef(null);

  // Fetch recent notifications (Failed/Partial deployments)
  const fetchRecentNotifications = async () => {
    try {
      const data = await apiService.getDeployments();
      const failed = data.filter(d => ['Failed', 'Partial Success'].includes(d.deploymentStatus));
      setNotifications(failed.slice(0, 10)); // Top 10 recent failed releases
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchRecentNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchRecentNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Global Search trigger
  useEffect(() => {
    const triggerSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        return;
      }
      try {
        const results = await apiService.globalSearch(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      }
    };

    const delayDebounce = setTimeout(triggerSearch, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside handlers to close floating dropdown panels
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults(null);
      }
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeedDemo = async () => {
    try {
      const res = await apiService.seedDemoData();
      showToast(res.message || 'Demo data seeded successfully!', 'success');
      // Delay reload to let user read toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast('Failed to seed demo data.', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (isLandingPage) {
    return (
      <div className="landing-wrapper">
        {toast && (
          <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-xl transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' 
              : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        )}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/deployments" element={<DeploymentHistory />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070b13] relative overflow-hidden">
      
      {/* Toast Alert Popups */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-xl transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Background Gradient Blurs */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-cyan-600/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-violet-600/5 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <NavigationSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onSeed={handleSeedDemo} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/70 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 max-w-xs h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <NavigationSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onSeed={handleSeedDemo} />
          </div>
        </div>
      )}

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        
        {/* Universal Top Header Bar (Global Search & Notification Center) */}
        <header className="flex items-center justify-between px-6 py-4 md:px-10 bg-[#0d1321]/60 border-b border-slate-800/60 backdrop-blur-md relative z-30">
          
          {/* Logo on Mobile */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white mr-1"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <ShieldAlert className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-extrabold text-xs text-white tracking-widest">SAFEDEPLOY</span>
          </div>

          {/* Global Search Component */}
          <div ref={searchRef} className="relative max-w-md w-full hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects, modules, developers, issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-950/80 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 outline-none transition"
              />
            </div>

            {/* Dropdown Floating Results Grid */}
            {searchResults && (searchQuery.trim() !== '') && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-4 max-h-[400px] overflow-y-auto z-50 backdrop-blur-lg">
                <div className="space-y-4">
                  {/* Projects Section */}
                  {searchResults.projects?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5">Projects</h4>
                      <div className="space-y-1">
                        {searchResults.projects.map(p => (
                          <a 
                            key={p.id} 
                            href={p.url} 
                            onClick={() => setSearchQuery('')}
                            className="block px-3 py-2 rounded-lg bg-slate-950/40 hover:bg-slate-800 text-xs text-slate-300 font-medium transition"
                          >
                            {p.title} <span className="text-[10px] text-slate-500 font-normal">({p.subtitle})</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modules Section */}
                  {searchResults.modules?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1.5">Modules</h4>
                      <div className="space-y-1">
                        {searchResults.modules.map(m => (
                          <a 
                            key={m.id} 
                            href={m.url} 
                            onClick={() => setSearchQuery('')}
                            className="block px-3 py-2 rounded-lg bg-slate-950/40 hover:bg-slate-800 text-xs text-slate-300 font-medium transition"
                          >
                            {m.title} <span className="text-[10px] text-slate-500 font-normal">({m.subtitle})</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deployments Section */}
                  {searchResults.deployments?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">Incident Logs</h4>
                      <div className="space-y-1">
                        {searchResults.deployments.map(d => (
                          <a 
                            key={d.id} 
                            href={d.url} 
                            onClick={() => setSearchQuery('')}
                            className="block px-3 py-2 rounded-lg bg-slate-950/40 hover:bg-slate-800 text-xs text-slate-300 font-medium transition"
                          >
                            {d.title} <span className="text-[10px] text-slate-500 font-normal">({d.subtitle})</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results Fallback */}
                  {(!searchResults.projects?.length && !searchResults.modules?.length && !searchResults.deployments?.length) && (
                    <div className="text-center py-4 text-xs text-slate-500">
                      No matching records found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Notification Bell Center */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-white transition relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Notification Center Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-lg">
                  <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Alert Center</span>
                    <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-extrabold font-mono">
                      {notifications.length} incidents
                    </span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-850">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        Zero operations exceptions detected.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <Link
                          key={notif._id}
                          to="/deployments"
                          onClick={() => setShowNotifications(false)}
                          className="block p-3 hover:bg-slate-800 text-left transition"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-slate-200 truncate">
                              {notif.moduleId?.moduleName || 'Unknown Module'}
                            </span>
                            <span className="text-[9px] font-bold text-rose-400 font-mono">v{notif.version}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug truncate">
                            {notif.issueTitle || 'Deployment failed.'}
                          </p>
                          <div className="flex justify-between mt-1.5 text-[8px] text-slate-500">
                            <span>{notif.environment}</span>
                            <span>{new Date(notif.deploymentDate).toLocaleDateString()}</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </header>

        {/* Main Panel Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-12 relative">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/deployments" element={<DeploymentHistory />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
          </Routes>
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
