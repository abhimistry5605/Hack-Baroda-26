const mongoose = require('mongoose');
const memoryDb = require('../utils/memoryDb');
const Project = require('../models/Project');
const Module = require('../models/Module');
const Deployment = require('../models/Deployment');
const QueryLog = require('../models/QueryLog');

// Check if we should fall back to memory database
const useMemory = () => mongoose.connection.readyState !== 1;

// Get all projects
const getProjects = async (req, res) => {
  try {
    if (useMemory()) {
      const list = await memoryDb.getProjects();
      return res.json(list);
    }
    
    const projects = await Project.find({}).sort({ createdAt: -1 });
    
    // Dynamically calculate totalModules for each project
    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const totalModules = await Module.countDocuments({ projectId: p._id });
      return {
        ...p.toObject(),
        totalModules
      };
    }));

    res.json(projectsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving projects', error: error.message });
  }
};

// Get single project details by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (useMemory()) {
      const project = await memoryDb.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.json(project);
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const totalModules = await Module.countDocuments({ projectId: project._id });
    res.json({
      ...project.toObject(),
      totalModules
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving project', error: error.message });
  }
};

// Create a new project
const createProject = async (req, res) => {
  try {
    const { projectName, teamName, description, projectType } = req.body;
    
    if (!projectName || !projectName.trim()) {
      return res.status(400).json({ message: 'Project Name is required' });
    }
    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ message: 'Team Name is required' });
    }

    if (useMemory()) {
      const projectExists = await memoryDb.findProjectByName(projectName);
      if (projectExists) {
        return res.status(400).json({ message: 'Project name already exists' });
      }
      const createdProject = await memoryDb.createProject(req.body);
      return res.status(201).json(createdProject);
    }

    // Check if project name already exists in Mongo
    const projectExists = await Project.findOne({ projectName });
    if (projectExists) {
      return res.status(400).json({ message: 'Project name already exists' });
    }

    const project = new Project({
      projectName,
      teamName,
      description,
      projectType,
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// Update an existing project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, teamName, description, projectType } = req.body;

    if (useMemory()) {
      const updated = await memoryDb.updateProject(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.json(updated);
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { projectName, teamName, description, projectType },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

// Delete a project (with cascading deletes)
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (useMemory()) {
      const deleted = await memoryDb.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.json({ message: 'Project and associated modules/deployments deleted successfully' });
    }

    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Cascading deletions in MongoDB
    await Module.deleteMany({ projectId: id });
    await Deployment.deleteMany({ projectId: id });

    res.json({ message: 'Project and associated modules/deployments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

// Get Dashboard Stats
const getStats = async (req, res) => {
  try {
    if (useMemory()) {
      const stats = await memoryDb.getStats();
      return res.json(stats);
    }

    const totalProjects = await Project.countDocuments();
    const totalModules = await Module.countDocuments();
    const totalDeployments = await Deployment.countDocuments();
    const totalQueries = await QueryLog.countDocuments();

    // Fetch recent deployments and recent queries to construct a unified recent activity feed
    const recentDeploys = await Deployment.find({})
      .populate('projectId')
      .populate('moduleId')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentQueries = await QueryLog.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivities = [];

    recentDeploys.forEach(d => {
      recentActivities.push({
        id: d._id,
        type: 'deployment',
        status: d.status,
        projectName: d.projectId ? (d.projectId.projectName || d.projectId.name) : 'Unknown Project',
        moduleName: d.moduleId ? d.moduleId.name : 'Unknown Module',
        version: d.version,
        initiatedBy: d.initiatedBy,
        timestamp: d.createdAt,
        message: `${d.moduleId ? d.moduleId.name : 'Module'} (v${d.version}) deployed to ${d.environment} by ${d.initiatedBy}`,
      });
    });

    recentQueries.forEach(q => {
      recentActivities.push({
        id: q._id,
        type: 'query',
        status: 'success',
        query: q.query,
        timestamp: q.createdAt,
        message: `AI Query processed: "${q.query.substring(0, 50)}${q.query.length > 50 ? '...' : ''}"`,
      });
    });

    // Sort combined activities by timestamp descending
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      totalProjects,
      totalModules,
      totalDeployments,
      totalQueries,
      recentActivities: recentActivities.slice(0, 10), // Limit to top 10 activities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling dashboard statistics', error: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getStats,
};
