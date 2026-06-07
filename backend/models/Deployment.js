const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project association is required'],
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module association is required'],
  },
  developerName: {
    type: String,
    required: [true, 'Developer Name is required'],
    trim: true,
  },
  version: {
    type: String,
    required: [true, 'Deployment Version is required'],
    trim: true,
  },
  environment: {
    type: String,
    required: [true, 'Environment is required'],
    enum: ['Development', 'Testing', 'Staging', 'Production'],
    default: 'Production',
  },
  issueTitle: {
    type: String,
    default: '',
  },
  issueDescription: {
    type: String,
    default: '',
  },
  rootCause: {
    type: String,
    default: '',
  },
  fixApplied: {
    type: String,
    default: '',
  },
  deploymentStatus: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Success', 'Failed', 'Partial Success'],
    default: 'Success',
  },
  notes: {
    type: String,
    default: '',
  },
  deploymentDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true // Auto adds createdAt and updatedAt
});

module.exports = mongoose.model('Deployment', DeploymentSchema);
