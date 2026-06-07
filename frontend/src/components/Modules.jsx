import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Layers, Folder, Cpu, Plus, CheckCircle, XCircle, AlertTriangle, RefreshCw, User } from 'lucide-react';

const moduleFields = {
  Payment: [
    { name: "gatewayProvider", label: "Gateway Provider" },
    { name: "currencyCode", label: "Settlement Currency" },
    { name: "webhookUrl", label: "Stripe Webhook URL" },
    { name: "sandboxMode", label: "Sandbox Mode Enabled" },
    { name: "secureKeyVaultPath", label: "API Key Vault Path" }
  ],
  Authentication: [
    { name: "identityProvider", label: "Identity Provider" },
    { name: "tokenExpirationMinutes", label: "Token Lifespan (Minutes)" },
    { name: "mfaMethod", label: "MFA Method" },
    { name: "sessionRegistryCache", label: "Session Cache Endpoint" },
    { name: "allowedRedirectDomains", label: "Allowed Redirect Domains" }
  ],
  Orders: [
    { name: "orderStatusSchema", label: "Order Status Schema" },
    { name: "taxCalculationEngine", label: "Tax Engine Provider" },
    { name: "shippingCarrierIntegration", label: "Shipping Carrier Integration" },
    { name: "inventoryFulfillmentCenter", label: "Fulfillment Center ID" },
    { name: "invoiceGenerationTrigger", label: "Invoice Generation Trigger" }
  ],
  Database: [
    { name: "dbEngineType", label: "Database Engine" },
    { name: "connectionStringVaultUri", label: "Connection String Vault URI" },
    { name: "maxConnectionPoolSize", label: "Max Pool Size" },
    { name: "readReplicaEndpoints", label: "Read Replica Endpoints" },
    { name: "backupSchedule", label: "Backup Schedule (Cron)" }
  ],
  Notifications: [
    { name: "deliveryChannel", label: "Delivery Channel" },
    { name: "serviceCredentialsPath", label: "Service Credentials Path" },
    { name: "rateLimitPerMinute", label: "Rate Limit (per min)" },
    { name: "retryPolicyBackoff", label: "Retry Backoff Policy" },
    { name: "defaultTemplateLocale", label: "Default Template Locale" }
  ],
  "API Service": [
    { name: "apiBaseUrl", label: "API Base URL" },
    { name: "authHeaderSchema", label: "Authorization Schema" },
    { name: "rateLimitPolicy", label: "Rate Limit policy" },
    { name: "timeoutMilliseconds", label: "Request Timeout (ms)" },
    { name: "corsAllowedOrigins", label: "CORS Allowed Origins" }
  ],
  "Admin Dashboard": [
    { name: "dashboardLayoutTemplate", label: "Dashboard Layout Template" },
    { name: "allowedRoles", label: "Allowed Admin Roles" },
    { name: "defaultThemeMode", label: "Default Theme Mode" },
    { name: "customBrandLogoUrl", label: "Custom Logo Asset URL" },
    { name: "auditLoggingEnabled", label: "Audit Action Logs Enabled" }
  ],
  Analytics: [
    { name: "dataStorageDestination", label: "Data Lake Destination" },
    { name: "metricAggregatorSchedule", label: "Aggregation Frequency" },
    { name: "trackingId", label: "Segment/Analytics Tracking ID" },
    { name: "retentionDays", label: "Raw Data Retention (Days)" },
    { name: "anonymousIpHashing", label: "Anonymize IP Addresses (GDPR)" }
  ],
  Other: [
    { name: "customModuleDescriptor", label: "Custom Module Description" },
    { name: "portNumber", label: "Inbound Port Number" },
    { name: "externalServiceDependencies", label: "External Dependencies" },
    { name: "healthCheckEndpoint", label: "Health Check Endpoint Path" }
  ]
};

function renderDescriptionAndConfig(description) {
  if (!description) return null;
  const parts = description.split('\n\nConfiguration Parameters:\n');
  const descText = parts[0];
  const configText = parts[1];

  let configPills = [];
  if (configText) {
    configPills = configText.split('\n').map(line => {
      const match = line.match(/^-\s*([^:]+):\s*(.*)$/);
      if (match) {
        return { label: match[1], value: match[2] };
      }
      return null;
    }).filter(Boolean);
  }

  return (
    <div className="space-y-1.5 mt-1 text-left">
      {descText && <p className="text-[11px] text-slate-400 leading-relaxed">{descText}</p>}
      {configPills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {configPills.map((pill, idx) => (
            <span key={idx} className="bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 text-[9px] font-mono px-2 py-0.5 rounded-full">
              <strong>{pill.label}</strong>: {pill.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Modules() {
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [newModule, setNewModule] = useState({
    moduleName: '',
    projectId: '',
    moduleType: 'Other',
    description: '',
    owner: '',
  });

  const [dynamicFieldsData, setDynamicFieldsData] = useState({});

  useEffect(() => {
    setDynamicFieldsData({});
  }, [newModule.moduleType]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const projData = await apiService.getProjects();
      setProjects(projData);

      // Auto-select first project in register form
      if (projData.length > 0 && !newModule.projectId) {
        setNewModule(prev => ({ ...prev, projectId: projData[0]._id }));
      }

      const modData = await apiService.getModules(selectedProjectId);
      setModules(modData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not fetch modules data. Please check MongoDB connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModule.projectId) {
      setError('You must create a project space first before registering modules.');
      return;
    }
    if (!newModule.moduleName.trim()) {
      setError('Module name is required.');
      return;
    }
    if (!newModule.owner.trim()) {
      setError('Owner Name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg('');

    try {
      const configLines = Object.entries(dynamicFieldsData)
        .filter(([_, val]) => val && val.trim() !== '')
        .map(([key, val]) => {
          const label = moduleFields[newModule.moduleType]?.find(f => f.name === key)?.label || key;
          return `- ${label}: ${val}`;
        });
      
      const finalDescription = newModule.description.trim() + 
        (configLines.length > 0 ? `\n\nConfiguration Parameters:\n${configLines.join('\n')}` : '');

      await apiService.createModule({
        ...newModule,
        description: finalDescription
      });
      setSuccessMsg(`Module "${newModule.moduleName}" registered successfully!`);
      setNewModule(prev => ({
        ...prev,
        moduleName: '',
        description: '',
        owner: '',
        moduleType: 'Other'
      }));
      setDynamicFieldsData({});
      // Refresh list
      const modData = await apiService.getModules(selectedProjectId);
      setModules(modData);
    } catch (err) {
      setError(err.message || 'Error occurred while saving module.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && modules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="glow-bg bg-cyan-500/10 w-[300px] h-[300px] top-10 left-10"></div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-8 h-8 text-cyan-400" />
          Service & Module Registry
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Catalog and manage active microservices, running builds, databases, and cached dependencies.
        </p>
      </div>

      {/* Main Grid: Add Module Form on left, Inventory List on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        
        {/* Register New Module */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Register Module
          </h2>

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateModule} className="space-y-4">
            {/* Associated Project */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Parent Project Space *
              </label>
              <select
                value={newModule.projectId}
                onChange={e => setNewModule(prev => ({ ...prev, projectId: e.target.value }))}
                required
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.projectName}</option>
                ))}
                {projects.length === 0 && (
                  <option value="">-- No Projects Available --</option>
                )}
              </select>
            </div>

            {/* Module Name */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Module Name *
              </label>
              <input
                type="text"
                value={newModule.moduleName}
                onChange={e => setNewModule(prev => ({ ...prev, moduleName: e.target.value }))}
                required
                placeholder="e.g. Auth Gateway API"
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Owner */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Owner / Developer *
              </label>
              <input
                type="text"
                value={newModule.owner}
                onChange={e => setNewModule(prev => ({ ...prev, owner: e.target.value }))}
                required
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Module Type */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Module Type
              </label>
              <select
                value={newModule.moduleType}
                onChange={e => setNewModule(prev => ({ ...prev, moduleType: e.target.value }))}
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

            {/* Dynamic Fields */}
            {moduleFields[newModule.moduleType] && (
              <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  {newModule.moduleType} Parameters
                </span>
                {moduleFields[newModule.moduleType].map(field => (
                  <div key={field.name}>
                    <label className="block text-[9px] font-semibold text-slate-400 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={dynamicFieldsData[field.name] || ''}
                      onChange={e => setDynamicFieldsData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={newModule.description}
                onChange={e => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Core responsibilities of this module..."
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Service Module'}
            </button>
          </form>
        </div>

        {/* Modules Inventory */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Active Inventory
            </h2>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <Folder className="w-4 h-4 text-slate-400" />
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.projectName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table List */}
          <div className="overflow-x-auto">
            {modules.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-30 animate-pulse" />
                <p>No service modules match this filter.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2">Module Info</th>
                    <th className="py-3 px-2">Associated Project</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Owner / Lead</th>
                    <th className="py-3 px-2">Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {modules.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-2">
                        <div className="font-semibold text-slate-200">{m.moduleName}</div>
                        {renderDescriptionAndConfig(m.description)}
                      </td>
                      <td className="py-4 px-2 text-slate-400">
                        {m.projectId ? (m.projectId.projectName || m.projectId.name) : 'Unallocated'}
                      </td>
                      <td className="py-4 px-2">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                          {m.moduleType}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-slate-300 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        <span>{m.owner || 'Lead Developer'}</span>
                      </td>
                      <td className="py-4 px-2 text-slate-300 font-mono">
                        v{m.version || '1.0.0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
