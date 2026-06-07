const mongoose = require('mongoose');
const memoryDb = require('../utils/memoryDb');
const Project = require('../models/Project');
const Module = require('../models/Module');
const Deployment = require('../models/Deployment');
const QueryLog = require('../models/QueryLog');

const useMemory = () => mongoose.connection.readyState !== 1;

// POST /api/ai/summarize-incident
const summarizeIncident = async (req, res) => {
  try {
    const { deploymentId } = req.body;
    if (!deploymentId) {
      return res.status(400).json({ message: 'Deployment ID is required' });
    }

    let deployment = null;
    if (useMemory()) {
      deployment = await memoryDb.getDeploymentById(deploymentId);
    } else {
      deployment = await Deployment.findById(deploymentId).populate('projectId').populate('moduleId');
    }

    if (!deployment) {
      return res.status(404).json({ message: 'Deployment record not found' });
    }

    const pName = deployment.projectId?.projectName || 'N/A';
    const mName = deployment.moduleId?.moduleName || 'N/A';
    const title = deployment.issueTitle || 'Standard Operation Run';
    const desc = deployment.issueDescription || 'No explicit exception log provided.';
    const cause = deployment.rootCause || 'No root cause determined.';
    const fix = deployment.fixApplied || 'No troubleshooting steps documented.';

    // Generate markdown summarization
    const summaryMarkdown = `### SafeDeploy Copilot Diagnostic Summary

#### 🔍 Root Cause Analysis
- **Incident Target**: **${mName}** (v${deployment.version}) in **${deployment.environment}**
- **Trigger Condition**: ${title}
- **Underlying Cause**: ${cause}

#### ⚠️ Common Issues Linked to This Class
1. **Network Firewall Policies**: Lack of outbound route whitelisting causes downstream request sockets to hang.
2. **Container Host Resolving**: Cluster DNS settings override global upstream hosts, blocking hostname lookups.
3. **Secret Store Synchronizations**: Credentials/passphrases expiring inside secure Vault configurations.

#### 🛠️ Recommended Actions
1. **Verify Outbound Socket Egress**: Ensure port rules and proxies permit connections to upstream dependencies.
2. **Override coreDNS rules**: Review Helm Kubernetes cluster configurations for pod resolver override blocks.
3. **Vault Sync Check**: Re-run continuous credentials deployment jobs to update base64 values.`;

    res.json({
      deploymentId,
      projectName: pName,
      moduleName: mName,
      version: deployment.version,
      status: deployment.deploymentStatus,
      summary: summaryMarkdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling incident summary', error: error.message });
  }
};

// GET /api/deployments/:id/recommendations
const getSmartRecommendations = async (req, res) => {
  try {
    const { id } = req.params;

    if (useMemory()) {
      const recs = await memoryDb.getDeploymentRecommendations(id);
      if (!recs) return res.status(404).json({ message: 'Deployment record not found' });
      return res.json(recs);
    }

    const target = await Deployment.findById(id).populate('projectId').populate('moduleId');
    if (!target) {
      return res.status(404).json({ message: 'Deployment record not found' });
    }

    const candidates = await Deployment.find({
      _id: { $ne: id },
      deploymentStatus: { $in: ['Failed', 'Partial Success'] }
    }).populate('projectId').populate('moduleId');

    const matchFields = [target.issueTitle, target.issueDescription, target.rootCause].filter(Boolean);
    if (matchFields.length === 0) {
      return res.json({
        similarIssues: [],
        previousFixes: [],
        responsibleDevelopers: [],
        recommendedTroubleshooting: [
          'Verify container networking parameters & route ingress tags.',
          'Validate Vault API credential overrides inside Kubernetes environment variables.',
          'Review CoreDNS override specifications in cluster Helm settings.'
        ]
      });
    }

    const matched = [];
    candidates.forEach(cand => {
      const searchIn = [cand.issueTitle, cand.issueDescription, cand.rootCause, cand.fixApplied].filter(Boolean);
      let overlap = 0;
      matchFields.forEach(tWord => {
        const words = tWord.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        words.forEach(word => {
          searchIn.forEach(field => {
            if (field.toLowerCase().includes(word)) {
              overlap++;
            }
          });
        });
      });

      if (overlap > 0) {
        matched.push({
          deployment: cand,
          score: overlap
        });
      }
    });

    matched.sort((a, b) => b.score - a.score);
    const topMatches = matched.slice(0, 3).map(m => m.deployment);

    const previousFixes = topMatches.map(m => m.fixApplied).filter(Boolean);
    const responsibleDevelopers = [...new Set(topMatches.map(m => m.developerName))].filter(Boolean);

    // Compute actionable checklist based on issues metadata
    const recommendedTroubleshooting = [];
    const fullTextSearch = (target.issueTitle + ' ' + target.issueDescription + ' ' + target.rootCause).toLowerCase();

    if (fullTextSearch.includes('stripe') || fullTextSearch.includes('payment') || fullTextSearch.includes('webhook')) {
      recommendedTroubleshooting.push('Check outbound egress proxies & verify firewall policies on port 443.');
      recommendedTroubleshooting.push('Verify Stripe webhook sandbox/production secret variables.');
    }
    if (fullTextSearch.includes('dns') || fullTextSearch.includes('resolve') || fullTextSearch.includes('coredns')) {
      recommendedTroubleshooting.push('Check upstream nameservers inside Kubernetes CoreDNS deployment pod spec.');
      recommendedTroubleshooting.push('Run diagnostics using `nslookup` inside target container CLI.');
    }
    if (fullTextSearch.includes('mongo') || fullTextSearch.includes('atlas') || fullTextSearch.includes('database') || fullTextSearch.includes('connection')) {
      recommendedTroubleshooting.push('Check database connectivity whitelist settings inside Mongo Atlas settings.');
      recommendedTroubleshooting.push('Validate cluster connection strings & Vault password overrides.');
    }
    if (fullTextSearch.includes('redis') || fullTextSearch.includes('cache') || fullTextSearch.includes('auth')) {
      recommendedTroubleshooting.push('Validate base64 encoded token strings in staging Helm values configuration.');
      recommendedTroubleshooting.push('Review master Redis configuration key inside Vault password registry.');
    }

    if (recommendedTroubleshooting.length === 0) {
      recommendedTroubleshooting.push('Inspect standard system logs or output debug stack trace.');
      recommendedTroubleshooting.push('Audit environmental properties and variables files.');
      recommendedTroubleshooting.push('Check firewall rules and egress logs inside network manager.');
    }

    res.json({
      similarIssues: topMatches.map(m => ({
        _id: m._id,
        projectName: m.projectId?.projectName || 'N/A',
        moduleName: m.moduleId?.moduleName || 'N/A',
        version: m.version,
        issueTitle: m.issueTitle,
        fixApplied: m.fixApplied,
        developerName: m.developerName,
        deploymentDate: m.deploymentDate
      })),
      previousFixes,
      responsibleDevelopers,
      recommendedTroubleshooting
    });
  } catch (error) {
    res.status(500).json({ message: 'Error matching recommendations', error: error.message });
  }
};

// GET /api/reports/weekly
const getWeeklyReport = async (req, res) => {
  try {
    if (useMemory()) {
      const rep = await memoryDb.getWeeklyReport();
      return res.json(rep);
    }

    const lastWeek = new Date(Date.now() - 86400000 * 7);
    const targetDeploys = await Deployment.find({ deploymentDate: { $gte: lastWeek } }).populate('moduleId');
    
    // Fallback if database has no activity in past week
    const allDeploys = targetDeploys.length > 0 
      ? targetDeploys 
      : await Deployment.find({}).populate('moduleId');

    const total = allDeploys.length;
    const successes = allDeploys.filter(d => d.deploymentStatus === 'Success').length;
    const failures = allDeploys.filter(d => d.deploymentStatus === 'Failed').length;
    const partials = allDeploys.filter(d => d.deploymentStatus === 'Partial Success').length;

    const resolutions = allDeploys
      .filter(d => d.fixApplied && ['Failed', 'Partial Success'].includes(d.deploymentStatus))
      .map(d => ({
        moduleName: d.moduleId?.moduleName || 'N/A',
        issueTitle: d.issueTitle,
        fixApplied: d.fixApplied
      }));

    const devActivityMap = {};
    allDeploys.forEach(d => {
      if (!d.developerName) return;
      devActivityMap[d.developerName] = (devActivityMap[d.developerName] || 0) + 1;
    });

    const teamActivity = Object.entries(devActivityMap).map(([name, count]) => ({
      name,
      deploymentsCount: count
    }));

    res.json({
      timeframe: 'Last 7 Days',
      deploymentsCount: total,
      failuresCount: failures + partials,
      successesCount: successes,
      resolutions,
      teamActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating weekly report', error: error.message });
  }
};

// GET /api/search
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ projects: [], modules: [], deployments: [] });
    }

    if (useMemory()) {
      const results = await memoryDb.globalSearch(q);
      return res.json(results);
    }

    const searchRegex = { $regex: q, $options: 'i' };

    const matchedProjects = await Project.find({
      $or: [{ projectName: searchRegex }, { description: searchRegex }]
    });

    const matchedModules = await Module.find({
      $or: [{ moduleName: searchRegex }, { description: searchRegex }]
    }).populate('projectId');

    const matchedDeployments = await Deployment.find({
      $or: [
        { version: searchRegex },
        { developerName: searchRegex },
        { issueTitle: searchRegex },
        { rootCause: searchRegex }
      ]
    }).populate('projectId').populate('moduleId');

    res.json({
      projects: matchedProjects.slice(0, 5).map(p => ({
        id: p._id,
        title: p.projectName,
        type: 'Project',
        subtitle: p.projectType,
        url: `#/projects/${p._id}`
      })),
      modules: matchedModules.slice(0, 5).map(m => ({
        id: m._id,
        title: m.moduleName,
        type: 'Module',
        subtitle: m.projectId?.projectName || 'N/A',
        url: `#/modules`
      })),
      deployments: matchedDeployments.slice(0, 5).map(d => ({
        id: d._id,
        title: d.issueTitle || `Deployment v${d.version}`,
        type: 'Deployment Log',
        subtitle: `${d.moduleId?.moduleName || 'N/A'} - v${d.version} (${d.deploymentStatus})`,
        url: `#/deployments`
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing global search', error: error.message });
  }
};

// POST /api/demo/seed
const seedDemoData = async (req, res) => {
  try {
    if (useMemory()) {
      await memoryDb.seedDemoData();
      return res.json({ message: 'Mock data initialized successfully in memory mode.' });
    }

    console.log('Seeding Database via Controller...');
    
    // Delete existing records
    await Project.deleteMany({});
    await Module.deleteMany({});
    await Deployment.deleteMany({});
    await QueryLog.deleteMany({});

    // 1. Seed Projects
    const projectsList = [
      {
        projectName: 'E-Commerce Suite',
        teamName: 'Alpha Checkout Squad',
        description: 'Full-scale online retail application, including checkout, user registry, cart systems, and payment endpoints.',
        projectType: 'Web Application'
      },
      {
        projectName: 'SafeDeploy Core API',
        teamName: 'Core DevOps Team',
        description: 'The logging processor engine, AI parser endpoints, and UI dashboard backend for SafeDeploy.',
        projectType: 'API Service'
      },
      {
        projectName: 'Mobile Shipping Link',
        teamName: 'Logistics Squad',
        description: 'React Native android & iOS package linking dispatch logistics API routers.',
        projectType: 'Mobile Application'
      },
      {
        projectName: 'Billing Router Engine',
        teamName: 'Financials Team',
        description: 'Highly secure microservice processor directing payment gateway ledger entries.',
        projectType: 'Microservice'
      }
    ];

    const createdProjects = await Project.insertMany(projectsList);

    const projectMap = {};
    createdProjects.forEach(p => {
      projectMap[p.projectName] = p._id;
    });

    // 2. Seed Modules
    const modulesList = [
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleName: 'Payment Gateway Linker',
        moduleType: 'Payment',
        description: 'Handles Stripe checkout integrations and webhook receivers.',
        owner: 'Sarah Jenkins',
        version: '2.4.2'
      },
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleName: 'Catalog Database Router',
        moduleType: 'Database',
        description: 'Controls product catalog lookup indexes and MongoDB aggregations.',
        owner: 'Marcus Chen',
        version: '1.8.0'
      },
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleName: 'Customer Web Portal',
        moduleType: 'Admin Dashboard',
        description: 'Web client interface for online purchasers.',
        owner: 'Dave Wilson',
        version: '1.0.1'
      },
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleName: 'Redis Session Cacher',
        moduleType: 'Other',
        description: 'Distributed session caching cluster.',
        owner: 'Marcus Chen',
        version: '3.1.2'
      },
      {
        projectId: projectMap['SafeDeploy Core API'],
        moduleName: 'Ingress Log Parser',
        moduleType: 'API Service',
        description: 'Ingests server stdout logs and tags tracebacks.',
        owner: 'Sarah Jenkins',
        version: '1.0.5'
      },
      {
        projectId: projectMap['Mobile Shipping Link'],
        moduleName: 'Push SMS Broker',
        moduleType: 'Notifications',
        description: 'Twilio SMS dispatcher queues.',
        owner: 'Dave Wilson',
        version: '0.9.8'
      },
      {
        projectId: projectMap['Mobile Shipping Link'],
        moduleName: 'Auth Token Guard',
        moduleType: 'Authentication',
        description: 'OAuth2 JWKS validation endpoint.',
        owner: 'Lara Croft',
        version: '2.1.0'
      },
      {
        projectId: projectMap['Billing Router Engine'],
        moduleName: 'Billing Microservice',
        moduleType: 'API Service',
        description: 'Directs payment gateway ledger entries.',
        owner: 'Sarah Jenkins',
        version: '1.4.0'
      }
    ];

    const createdModules = await Module.insertMany(modulesList);

    const moduleMap = {};
    createdModules.forEach(m => {
      moduleMap[m.moduleName] = m._id;
    });

    // 3. Seed Deployments
    const deploymentsList = [
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleId: moduleMap['Payment Gateway Linker'],
        developerName: 'Jenkins CI',
        version: '2.4.0',
        environment: 'Production',
        issueTitle: '',
        issueDescription: '',
        rootCause: '',
        fixApplied: '',
        deploymentStatus: 'Success',
        notes: 'Initial build run... Passed all health checks.',
        deploymentDate: new Date(Date.now() - 86400000 * 10)
      },
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleId: moduleMap['Payment Gateway Linker'],
        developerName: 'Sarah Jenkins',
        version: '2.4.1',
        environment: 'Production',
        issueTitle: 'Stripe API Webhook Connection Failure',
        issueDescription: 'Stripe API connection timed out due to missing proxy headers in the custom firewall configuration.',
        rootCause: 'Container firewall policies blocked egress traffic on port 443 to external hosts without explicit proxy headers.',
        fixApplied: 'Added ingress proxy headers and configured the firewall to permit egress traffic on port 443 to *.stripe.com. Added strict timeout settings of 5000ms.',
        deploymentStatus: 'Failed',
        notes: 'Mongoose connection timed out at Stripe client link (port 443).',
        deploymentDate: new Date(Date.now() - 86400000 * 9)
      },
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleId: moduleMap['Payment Gateway Linker'],
        developerName: 'Sarah Jenkins',
        version: '2.4.2',
        environment: 'Production',
        issueTitle: '',
        issueDescription: '',
        rootCause: '',
        fixApplied: 'Patched firewall configuration and verified Stripe webhook replies.',
        deploymentStatus: 'Success',
        notes: 'Egress proxies verified. Webhooks listening successfully.',
        deploymentDate: new Date(Date.now() - 86400000 * 8)
      },
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleId: moduleMap['Catalog Database Router'],
        developerName: 'Marcus Chen',
        version: '1.8.0',
        environment: 'Production',
        issueTitle: 'Mongo Atlas Host Resolution Error',
        issueDescription: 'Unable to resolve MongoDB Atlas hostname inside the VPC container due to DNS misconfiguration.',
        rootCause: 'VPC container Kubernetes CoreDNS lacked host file entry resolvers for Atlas public cluster shards.',
        fixApplied: 'Configured custom DNS resolvers in Kubernetes pod configuration (coredns overrides) and whitelisted VPC CIDR block inside MongoDB Atlas Security Settings.',
        deploymentStatus: 'Failed',
        notes: 'MongooseServerSelectionError: connection timed out after 30000ms.',
        deploymentDate: new Date(Date.now() - 86400000 * 7)
      },
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleId: moduleMap['Customer Web Portal'],
        developerName: 'Dave Wilson',
        version: '1.0.0',
        environment: 'Staging',
        issueTitle: '',
        issueDescription: '',
        rootCause: '',
        fixApplied: '',
        deploymentStatus: 'Success',
        notes: 'Babel build optimized. Static assets uploaded to CDN.',
        deploymentDate: new Date(Date.now() - 86400000 * 6)
      },
      {
        projectId: projectMap['E-Commerce Suite'],
        moduleId: moduleMap['Redis Session Cacher'],
        developerName: 'Marcus Chen',
        version: '3.1.2',
        environment: 'Staging',
        issueTitle: 'Redis Cluster Socket Auth Refused',
        issueDescription: 'Redis cache container cluster threw AUTH errors upon connecting via TCP socket client.',
        rootCause: 'Secret password token in Helm values-staging file was outdated, mismatching active Redis cluster master passphrase.',
        fixApplied: 'Sync-loaded the Vault staging secrets manager parameters, re-generated base64 token inside staging config values file and rolled out the deployment again.',
        deploymentStatus: 'Failed',
        notes: 'Redis cluster AUTH failed: Connection closed by remote client.',
        deploymentDate: new Date(Date.now() - 86400000 * 5)
      },
      {
        projectId: projectMap['Mobile Shipping Link'],
        moduleId: moduleMap['Push SMS Broker'],
        developerName: 'Dave Wilson',
        version: '0.9.7',
        environment: 'Testing',
        issueTitle: 'Twilio Hook Socket Timeout',
        issueDescription: 'Outbound webhook trigger failed to get status callback response from Twilio SMS servers.',
        rootCause: 'Container lacked custom DNS entries for resolution of api.twilio.com.',
        fixApplied: 'Added explicit CoreDNS routing table entry in pod settings.',
        deploymentStatus: 'Partial Success',
        notes: 'SMS sent successfully, but webhook dispatcher timed out.',
        deploymentDate: new Date(Date.now() - 86400000 * 4)
      },
      {
        projectId: projectMap['Mobile Shipping Link'],
        moduleId: moduleMap['Auth Token Guard'],
        developerName: 'Lara Croft',
        version: '2.1.0',
        environment: 'Staging',
        issueTitle: 'OAuth2 JWKS Endpoint Resolution Error',
        issueDescription: 'Verify token validation failed because container could not fetch signing keys from identity provider.',
        rootCause: 'Kubernetes CoreDNS lacked resolving access rules for external auth subdomains inside Staging network namespaces.',
        fixApplied: 'Configured upstream nameservers inside Kubernetes pod CoreDNS spec configuration sheets.',
        deploymentStatus: 'Failed',
        notes: 'Failed to retrieve JSON Web Key Set (JWKS) signature parameters.',
        deploymentDate: new Date(Date.now() - 86400000 * 3)
      },
      {
        projectId: projectMap['Billing Router Engine'],
        moduleId: moduleMap['Billing Microservice'],
        developerName: 'Sarah Jenkins',
        version: '1.4.0',
        environment: 'Production',
        issueTitle: 'Stripe Merchant Key Ingress Error',
        issueDescription: 'Billing router transaction queue failed with invalid API key errors.',
        rootCause: 'Production environment parameters were loaded with sandbox testing Stripe keys.',
        fixApplied: 'Vault secret values updated. Pod deployments rolled back and initialized with correct merchant key configurations.',
        deploymentStatus: 'Failed',
        notes: 'Outbound Stripe transaction response: 401 Unauthorized Merchant API Key.',
        deploymentDate: new Date(Date.now() - 86400000 * 2)
      },
      {
        projectId: projectMap['SafeDeploy Core API'],
        moduleId: moduleMap['Ingress Log Parser'],
        developerName: 'Sarah Jenkins',
        version: '1.0.5',
        environment: 'Staging',
        issueTitle: '',
        issueDescription: '',
        rootCause: '',
        fixApplied: '',
        deploymentStatus: 'Success',
        notes: 'Logs pipeline listener initialized. Performance parameters optimal.',
        deploymentDate: new Date(Date.now() - 86400000 * 1)
      }
    ];

    await Deployment.insertMany(deploymentsList);

    // 4. Seed query logs
    const seedQueries = [
      {
        query: 'Stripe webhook gateway connection timed out in production',
        answer: 'The Stripe webhook gateway timed out in production because container firewall policies blocked egress traffic on port 443 to *.stripe.com without explicit proxy headers. This was resolved by adding ingress proxy headers and configuring custom proxy values in Stripe client settings.',
        matchedDeployments: [],
        score: 0.95
      }
    ];

    await QueryLog.insertMany(seedQueries);

    res.json({ message: 'MongoDB Database initialized successfully with advanced hackathon seed values.' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding MongoDB database', error: error.message });
  }
};

module.exports = {
  summarizeIncident,
  getSmartRecommendations,
  getWeeklyReport,
  globalSearch,
  seedDemoData
};
