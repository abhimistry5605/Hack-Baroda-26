const API_BASE_URL = 'http://localhost:5000/api';

// Helper to handle response and errors
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}

export const apiService = {
  // Statistics
  async getStats() {
    const res = await fetch(`${API_BASE_URL}/stats`);
    return handleResponse(res);
  },

  // Projects
  async getProjects() {
    const res = await fetch(`${API_BASE_URL}/projects`);
    return handleResponse(res);
  },

  async getProjectById(id) {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`);
    return handleResponse(res);
  },

  async createProject(projectData) {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  async updateProject(id, projectData) {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  async deleteProject(id) {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Modules
  async getModules(projectId = '') {
    const url = projectId 
      ? `${API_BASE_URL}/modules?projectId=${projectId}` 
      : `${API_BASE_URL}/modules`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getModulesByProjectId(projectId) {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/modules`);
    return handleResponse(res);
  },

  async getModuleById(id) {
    const res = await fetch(`${API_BASE_URL}/modules/${id}`);
    return handleResponse(res);
  },

  async createModule(moduleData) {
    const res = await fetch(`${API_BASE_URL}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData),
    });
    return handleResponse(res);
  },

  async updateModule(id, moduleData) {
    const res = await fetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData),
    });
    return handleResponse(res);
  },

  async deleteModule(id) {
    const res = await fetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Deployments
  async getDeployments(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });

    const url = params.toString() 
      ? `${API_BASE_URL}/deployments?${params.toString()}` 
      : `${API_BASE_URL}/deployments`;

    const res = await fetch(url);
    return handleResponse(res);
  },

  async getDeploymentById(id) {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}`);
    return handleResponse(res);
  },

  async getDeploymentsByModuleId(moduleId) {
    const res = await fetch(`${API_BASE_URL}/modules/${moduleId}/deployments`);
    return handleResponse(res);
  },

  async createDeployment(deploymentData) {
    const res = await fetch(`${API_BASE_URL}/deployments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deploymentData),
    });
    return handleResponse(res);
  },

  async updateDeployment(id, deploymentData) {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deploymentData),
    });
    return handleResponse(res);
  },

  async deleteDeployment(id) {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Analytics & Reports
  async getAnalyticsOverview(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const res = await fetch(`${API_BASE_URL}/analytics/overview?${params.toString()}`);
    return handleResponse(res);
  },

  async getAnalyticsModules(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const res = await fetch(`${API_BASE_URL}/analytics/modules?${params.toString()}`);
    return handleResponse(res);
  },

  async getAnalyticsDevelopers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const res = await fetch(`${API_BASE_URL}/analytics/developers?${params.toString()}`);
    return handleResponse(res);
  },

  async getAnalyticsDeployments(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const res = await fetch(`${API_BASE_URL}/analytics/deployments?${params.toString()}`);
    return handleResponse(res);
  },

  getReportExportUrl(reportType, format, filters = {}) {
    const params = new URLSearchParams({ reportType, format });
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    return `${API_BASE_URL}/reports/export?${params.toString()}`;
  },

  // Advanced Hackathon Features
  async summarizeIncident(deploymentId) {
    const res = await fetch(`${API_BASE_URL}/ai/summarize-incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deploymentId }),
    });
    return handleResponse(res);
  },

  async getRecommendations(id) {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/recommendations`);
    return handleResponse(res);
  },

  async getWeeklyReport() {
    const res = await fetch(`${API_BASE_URL}/reports/weekly`);
    return handleResponse(res);
  },

  async globalSearch(query) {
    const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
    return handleResponse(res);
  },

  async seedDemoData() {
    const res = await fetch(`${API_BASE_URL}/demo/seed`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // AI Chat
  async askAI(queryText) {
    const res = await fetch(`${API_BASE_URL}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText }),
    });
    return handleResponse(res);
  },
};
export default apiService;


