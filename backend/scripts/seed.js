const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const Project = require('../models/Project');
const Module = require('../models/Module');
const Deployment = require('../models/Deployment');
const QueryLog = require('../models/QueryLog');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safedeploy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Seeding Database... Database connected.');

    // Clear old data
    await Project.deleteMany({});
    await Module.deleteMany({});
    await Deployment.deleteMany({});
    await QueryLog.deleteMany({});

    console.log('Cleared existing collections.');

    // Read sample JSON dataset
    const sampleFilePath = path.join(__dirname, '../../database/sample_dataset.json');
    if (!fs.existsSync(sampleFilePath)) {
      throw new Error(`Sample dataset file not found at ${sampleFilePath}`);
    }

    const rawData = fs.readFileSync(sampleFilePath, 'utf8');
    const { projects, modules, deployments } = JSON.parse(rawData);

    // 1. Insert Projects
    const createdProjects = await Project.insertMany(projects);
    console.log(`Successfully seeded ${createdProjects.length} Projects.`);

    // Create lookup tables for ID mapping
    const projectLookup = {};
    createdProjects.forEach(p => {
      projectLookup[p.projectName] = p._id;
    });

    // 2. Insert Modules
    const processedModules = modules.map(m => {
      const projectId = projectLookup[m.projectName];
      if (!projectId) {
        throw new Error(`Missing project association for module: ${m.moduleName}`);
      }
      return {
        projectId,
        moduleName: m.moduleName,
        moduleType: m.moduleType,
        description: m.description,
        owner: m.owner,
      };
    });

    const createdModules = await Module.insertMany(processedModules);
    console.log(`Successfully seeded ${createdModules.length} Modules.`);

    const moduleLookup = {};
    createdModules.forEach(m => {
      moduleLookup[m.moduleName] = m._id;
    });

    // 3. Insert Deployments
    const processedDeployments = deployments.map(d => {
      const projectId = projectLookup[d.projectName];
      const moduleId = moduleLookup[d.moduleName];
      if (!projectId || !moduleId) {
        throw new Error(`Missing project or module association for deployment: ${d.version}`);
      }
      return {
        projectId,
        moduleId,
        developerName: d.developerName,
        version: d.version,
        environment: d.environment,
        issueTitle: d.issueTitle,
        issueDescription: d.issueDescription,
        rootCause: d.rootCause,
        fixApplied: d.fixApplied,
        deploymentStatus: d.deploymentStatus,
        notes: d.notes,
        deploymentDate: d.deploymentDate ? new Date(d.deploymentDate) : new Date(),
      };
    });

    const createdDeployments = await Deployment.insertMany(processedDeployments);
    console.log(`Successfully seeded ${createdDeployments.length} Deployments.`);

    // 4. Seed initial AI query logs
    const sampleQueries = [
      {
        query: 'Why did the Payment Gateway Linker v2.4.1 deployment fail?',
        answer: 'The Payment Gateway Linker v2.4.1 deployment failed in production due to a connection timeout at Stripe client link (port 443) caused by missing proxy headers in the custom firewall configuration. The team resolved it by adding ingress proxy headers and configuring the firewall to permit egress traffic on port 443.',
        matchedDeployments: [createdDeployments.find(d => d.version === '2.4.1')._id],
        score: 0.98
      },
      {
        query: 'What was the fix for MongoDB Atlas connection issue?',
        answer: 'The database connection issue on the Catalog Database Router was resolved by configuring custom DNS resolvers (coredns overrides) in Kubernetes pod configuration and whitelisting the VPC CIDR block inside MongoDB Atlas Security Settings.',
        matchedDeployments: [createdDeployments.find(d => d.version === '1.8.0')._id],
        score: 0.94
      }
    ];

    await QueryLog.insertMany(sampleQueries);
    console.log('Successfully seeded sample AI query logs.');

    console.log('Database Seeding Completed Successfully! Exiting.');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedData();
