const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    unique: true,
    trim: true,
  },
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  projectType: {
    type: String,
    enum: ['Web Application', 'Mobile Application', 'API Service', 'Microservice', 'Other'],
    default: 'Web Application',
  }
}, {
  timestamps: true // Auto adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Project', ProjectSchema);
