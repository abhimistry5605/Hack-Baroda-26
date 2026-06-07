const mongoose = require('mongoose');
const memoryDb = require('../utils/memoryDb');
const Deployment = require('../models/Deployment');
const Module = require('../models/Module');
const Project = require('../models/Project');

const useMemory = () => mongoose.connection.readyState !== 1;

// Get all deployments, with optional filters & query strings
const getDeployments = async (req, res) => {
  try {
    const { projectId, moduleId, status, environment, version, searchIssue, searchDeveloper } = req.query;

    if (useMemory()) {
      const list = await memoryDb.getDeployments({
        projectId,
        moduleId,
        status,
        environment,
        version,
        searchIssue,
        searchDeveloper
      });
      return res.json(list);
    }

    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (moduleId) filter.moduleId = moduleId;
    if (status) filter.deploymentStatus = status;
    if (environment) filter.environment = environment;
    if (version) filter.version = version;

    // Search query matches
    if (searchIssue) {
      const query = { $regex: searchIssue, $options: 'i' };
      filter.$or = [
        { issueTitle: query },
        { issueDescription: query },
        { rootCause: query },
        { fixApplied: query }
      ];
    }

    if (searchDeveloper) {
      filter.developerName = { $regex: searchDeveloper, $options: 'i' };
    }

    const deployments = await Deployment.find(filter)
      .populate('projectId')
      .populate('moduleId')
      .sort({ deploymentDate: -1 });

    res.json(deployments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving deployment logs', error: error.message });
  }
};

// Get single deployment record by ID
const getDeploymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (useMemory()) {
      const dep = await memoryDb.getDeploymentById(id);
      if (!dep) {
        return res.status(404).json({ message: 'Deployment record not found' });
      }
      return res.json(dep);
    }

    const dep = await Deployment.findById(id).populate('projectId').populate('moduleId');
    if (!dep) {
      return res.status(404).json({ message: 'Deployment record not found' });
    }

    res.json(dep);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving deployment details', error: error.message });
  }
};

// Get deployments for a specific module ID
const getDeploymentsByModuleId = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (useMemory()) {
      const list = await memoryDb.getDeploymentsByModuleId(moduleId);
      return res.json(list);
    }

    const deployments = await Deployment.find({ moduleId })
      .populate('projectId')
      .populate('moduleId')
      .sort({ deploymentDate: -1 });

    res.json(deployments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving module deployments', error: error.message });
  }
};

// Log a new deployment record
const createDeployment = async (req, res) => {
  try {
    const {
      projectId,
      moduleId,
      developerName,
      version,
      environment,
      issueTitle,
      issueDescription,
      rootCause,
      fixApplied,
      deploymentStatus,
      notes,
      deploymentDate,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project reference is required' });
    }
    if (!moduleId) {
      return res.status(400).json({ message: 'Module reference is required' });
    }
    if (!developerName || !developerName.trim()) {
      return res.status(400).json({ message: 'Developer Name is required' });
    }
    if (!version || !version.trim()) {
      return res.status(400).json({ message: 'Version is required' });
    }

    if (useMemory()) {
      const created = await memoryDb.createDeployment(req.body);
      return res.status(201).json(created);
    }

    // Verify project and module exist
    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const moduleExists = await Module.findById(moduleId);
    if (!moduleExists) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const deployment = new Deployment({
      projectId,
      moduleId,
      developerName,
      version,
      environment,
      issueTitle,
      issueDescription,
      rootCause,
      fixApplied,
      deploymentStatus,
      notes,
      deploymentDate: deploymentDate || new Date(),
    });

    const savedDeployment = await deployment.save();

    // If successful, auto-update module version tag
    if (deploymentStatus === 'Success') {
      await Module.findByIdAndUpdate(moduleId, { version });
    }

    res.status(201).json(savedDeployment);
  } catch (error) {
    res.status(500).json({ message: 'Error logging deployment', error: error.message });
  }
};

// Update an existing deployment record
const updateDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      developerName,
      version,
      environment,
      issueTitle,
      issueDescription,
      rootCause,
      fixApplied,
      deploymentStatus,
      notes,
      deploymentDate,
    } = req.body;

    if (useMemory()) {
      const updated = await memoryDb.updateDeployment(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Deployment record not found' });
      }
      return res.json(updated);
    }

    const updatedDeployment = await Deployment.findByIdAndUpdate(
      id,
      {
        developerName,
        version,
        environment,
        issueTitle,
        issueDescription,
        rootCause,
        fixApplied,
        deploymentStatus,
        notes,
        deploymentDate: deploymentDate ? new Date(deploymentDate) : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!updatedDeployment) {
      return res.status(404).json({ message: 'Deployment record not found' });
    }

    res.json(updatedDeployment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating deployment record', error: error.message });
  }
};

// Delete a deployment record
const deleteDeployment = async (req, res) => {
  try {
    const { id } = req.params;

    if (useMemory()) {
      const deleted = await memoryDb.deleteDeployment(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Deployment record not found' });
      }
      return res.json({ message: 'Deployment record deleted successfully' });
    }

    const deletedDeployment = await Deployment.findByIdAndDelete(id);
    if (!deletedDeployment) {
      return res.status(404).json({ message: 'Deployment record not found' });
    }

    res.json({ message: 'Deployment record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting deployment record', error: error.message });
  }
};

module.exports = {
  getDeployments,
  getDeploymentById,
  getDeploymentsByModuleId,
  createDeployment,
  updateDeployment,
  deleteDeployment,
};
