const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project association is required'],
  },
  moduleName: {
    type: String,
    required: [true, 'Module name is required'],
    trim: true,
  },
  moduleType: {
    type: String,
    required: [true, 'Module type is required'],
    enum: [
      'Authentication',
      'Payment',
      'Orders',
      'Database',
      'Notifications',
      'API Service',
      'Admin Dashboard',
      'Analytics',
      'Other'
    ],
    default: 'Other',
  },
  description: {
    type: String,
    default: '',
  },
  owner: {
    type: String,
    required: [true, 'Module owner / developer is required'],
    trim: true,
  },
  version: {
    type: String,
    default: '1.0.0', // Keep compatibility for deployments version tagging
  }
}, {
  timestamps: true // Auto adds createdAt and updatedAt
});

module.exports = mongoose.model('Module', ModuleSchema);
