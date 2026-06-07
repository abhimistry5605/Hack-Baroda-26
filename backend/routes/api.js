const express = require('express');
const router = express.Router();

const { getProjects, getProjectById, createProject, updateProject, deleteProject, getStats } = require('../controllers/projectController');
const { getModules, getModulesByProjectId, getModuleById, createModule, updateModule, deleteModule } = require('../controllers/moduleController');
const { getDeployments, getDeploymentById, getDeploymentsByModuleId, createDeployment, updateDeployment, deleteDeployment } = require('../controllers/deploymentController');
const { queryMemory } = require('../controllers/aiController');
const { getOverviewStats, getModulesStats, getDevelopersStats, getDeploymentsStats, exportReports } = require('../controllers/analyticsController');
const { summarizeIncident, getSmartRecommendations, getWeeklyReport, globalSearch, seedDemoData } = require('../controllers/hackathonController');

// Projects Routes
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.get('/projects/:id', getProjectById);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);
router.get('/stats', getStats);

// Modules Routes
router.get('/modules', getModules);
router.post('/modules', createModule);
router.get('/modules/:id', getModuleById);
router.get('/projects/:projectId/modules', getModulesByProjectId);
router.put('/modules/:id', updateModule);
router.delete('/modules/:id', deleteModule);

// Deployments Routes
router.get('/deployments', getDeployments);
router.post('/deployments', createDeployment);
router.get('/deployments/:id', getDeploymentById);
router.get('/modules/:moduleId/deployments', getDeploymentsByModuleId);
router.put('/deployments/:id', updateDeployment);
router.delete('/deployments/:id', deleteDeployment);

// Analytics & Reports Routes
router.get('/analytics/overview', getOverviewStats);
router.get('/analytics/modules', getModulesStats);
router.get('/analytics/developers', getDevelopersStats);
router.get('/analytics/deployments', getDeploymentsStats);
router.get('/reports/export', exportReports);

// Advanced Hackathon Routes
router.post('/ai/summarize-incident', summarizeIncident);
router.get('/deployments/:id/recommendations', getSmartRecommendations);
router.get('/reports/weekly', getWeeklyReport);
router.get('/search', globalSearch);
router.post('/demo/seed', seedDemoData);

// AI Router
router.post('/ai-chat', queryMemory);

module.exports = router;


