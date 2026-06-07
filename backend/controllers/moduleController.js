const mongoose = require('mongoose');
const memoryDb = require('../utils/memoryDb');
const Module = require('../models/Module');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');

const useMemory = () => mongoose.connection.readyState !== 1;

// Get all modules (optionally filtered by projectId in query)
const getModules = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (useMemory()) {
      const list = await memoryDb.getModules(projectId);
      return res.json(list);
    }

    const filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }

    const modules = await Module.find(filter)
      .populate('projectId')
      .sort({ createdAt: -1 });

    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving modules', error: error.message });
  }
};

// Get modules belonging to specific project ID
const getModulesByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (useMemory()) {
      const list = await memoryDb.getModulesByProjectId(projectId);
      return res.json(list);
    }

    const modules = await Module.find({ projectId })
      .populate('projectId')
      .sort({ createdAt: -1 });

    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving project modules', error: error.message });
  }
};

// Get single module details by ID
const getModuleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (useMemory()) {
      const mod = await memoryDb.getModuleById(id);
      if (!mod) {
        return res.status(404).json({ message: 'Module not found' });
      }
      return res.json(mod);
    }

    const mod = await Module.findById(id).populate('projectId');
    if (!mod) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json(mod);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving module', error: error.message });
  }
};

// Create a new module
const createModule = async (req, res) => {
  try {
    const { projectId, moduleName, moduleType, description, owner } = req.body;

    if (!moduleName || !moduleName.trim()) {
      return res.status(400).json({ message: 'Module name is required' });
    }
    if (!owner || !owner.trim()) {
      return res.status(400).json({ message: 'Owner / Developer is required' });
    }

    if (useMemory()) {
      const created = await memoryDb.createModule(req.body);
      return res.status(201).json(created);
    }

    // Verify parent project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Parent project not found' });
    }

    const moduleObj = new Module({
      projectId,
      moduleName,
      moduleType,
      description,
      owner,
    });

    const createdModule = await moduleObj.save();
    res.status(201).json(createdModule);
  } catch (error) {
    res.status(500).json({ message: 'Error creating module', error: error.message });
  }
};

// Update an existing module
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { moduleName, moduleType, description, owner } = req.body;

    if (useMemory()) {
      const updated = await memoryDb.updateModule(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Module not found' });
      }
      return res.json(updated);
    }

    const updatedModule = await Module.findByIdAndUpdate(
      id,
      { moduleName, moduleType, description, owner },
      { new: true, runValidators: true }
    );

    if (!updatedModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json(updatedModule);
  } catch (error) {
    res.status(500).json({ message: 'Error updating module', error: error.message });
  }
};

// Delete a module (with cascade deletion of deployments)
const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    if (useMemory()) {
      const deleted = await memoryDb.deleteModule(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Module not found' });
      }
      return res.json({ message: 'Module and associated deployment logs deleted successfully' });
    }

    const deletedModule = await Module.findByIdAndDelete(id);
    if (!deletedModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Cascade delete related deployments
    await Deployment.deleteMany({ moduleId: id });

    res.json({ message: 'Module and associated deployment logs deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting module', error: error.message });
  }
};

module.exports = {
  getModules,
  getModulesByProjectId,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
};
