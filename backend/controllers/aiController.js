const mongoose = require('mongoose');
const memoryDb = require('../utils/memoryDb');
const Deployment = require('../models/Deployment');
const QueryLog = require('../models/QueryLog');
const Project = require('../models/Project');
const Module = require('../models/Module');

const useMemory = () => mongoose.connection.readyState !== 1;

// Helper to calculate keyword overlap score between query and target texts
function calculateRelevanceScore(query, targetTexts) {
  const stopWords = new Set([
    'any', 'there', 'what', 'why', 'who', 'how', 'when', 'where', 'which',
    'this', 'that', 'these', 'those', 'the', 'and', 'but', 'for', 'with',
    'from', 'some', 'more', 'about', 'here', 'have', 'were', 'been', 'was', 'is', 'are', 'did'
  ]);

  const queryWords = query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  let matchCount = 0;
  
  if (queryWords.length === 0) return 0;

  targetTexts.forEach(text => {
    if (!text) return;
    const cleanText = text.toLowerCase();
    queryWords.forEach(word => {
      if (cleanText.includes(word)) {
        matchCount++;
      }
    });
  });

  return matchCount / queryWords.length;
}

// Process natural language queries against deployment history database
const queryMemory = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Query string is required' });
    }

    let projects = [];
    let modules = [];
    let troubleDeployments = [];

    if (useMemory()) {
      projects = await memoryDb.getProjects();
      modules = await memoryDb.getModules();
      
      const allDeploys = await memoryDb.getDeployments();
      troubleDeployments = allDeploys.filter(d => ['Failed', 'Partial Success'].includes(d.deploymentStatus));
    } else {
      // Retrieve all projects and modules to match names in query
      projects = await Project.find({});
      modules = await Module.find({});
      
      // Find failed or rolled_back deployments containing troubleshooting memory
      troubleDeployments = await Deployment.find({
        deploymentStatus: { $in: ['Failed', 'Partial Success'] }
      })
      .populate('projectId')
      .populate('moduleId');
    }

    let matchedDeployments = [];
    let bestScore = 0;
    let answer = '';
    let referencedIds = [];
    const lowerQuery = query.toLowerCase();

    // Check if user is asking a general question about failures/errors
    const asksAboutFailures = lowerQuery.includes('failed') || 
                              lowerQuery.includes('failure') || 
                              lowerQuery.includes('error') || 
                              lowerQuery.includes('incident') || 
                              lowerQuery.includes('issue');

    const isGeneralQuery = lowerQuery.includes('any') || 
                           lowerQuery.includes('all') || 
                           lowerQuery.includes('list') || 
                           lowerQuery.includes('show') || 
                           lowerQuery.includes('what are') || 
                           lowerQuery.includes('status') ||
                           lowerQuery.trim() === 'failed' ||
                           lowerQuery.trim() === 'failures' ||
                           lowerQuery.includes('is there');

    if (asksAboutFailures && isGeneralQuery) {
      if (troubleDeployments.length > 0) {
        const failList = troubleDeployments.map(d => {
          const modName = d.moduleId ? (d.moduleId.moduleName || d.moduleId.name || 'Unknown Module') : 'Unknown Module';
          const projName = d.projectId ? (d.projectId.projectName || d.projectId.name || 'Unknown Project') : 'Unknown Project';
          return `- **${modName}** (v${d.version}, Project: ${projName}) - *Issue: ${d.issueTitle || 'Unspecified Error'}*`;
        }).join('\n');
        answer = `I found the following active failed deployment records in SafeDeploy database memory:\n\n${failList}`;
        referencedIds = troubleDeployments.map(d => d._id);
      } else {
        answer = `There are currently no failed deployment records in the database. All registered microservice modules are operating successfully!`;
      }
    } else {
      // Evaluate relevance for each deployment with issues
      troubleDeployments.forEach(d => {
        const searchFields = [
          d.projectId ? (d.projectId.projectName || d.projectId.name || '') : '',
          d.moduleId ? (d.moduleId.moduleName || d.moduleId.name || '') : '',
          d.version,
          d.issueTitle || '',
          d.issueDescription || '',
          d.rootCause || '',
          d.fixApplied || '',
          d.notes || '',
          d.environment
        ];

        const score = calculateRelevanceScore(query, searchFields);
        if (score >= 0.4) {
          matchedDeployments.push({
            deployment: d,
            score: score
          });
        }
      });

      // Sort by relevance score descending
      matchedDeployments.sort((a, b) => b.score - a.score);

      if (matchedDeployments.length > 0) {
        const bestMatch = matchedDeployments[0].deployment;
        bestScore = matchedDeployments[0].score;

        // Add all references above a basic threshold
        matchedDeployments.forEach(m => {
          if (m.score >= 0.1) {
            referencedIds.push(m.deployment._id);
          }
        });

        // Synthesize conversational markdown response based on matching resolution notes
        answer = `Based on SafeDeploy records, I found a matching incident history.
 
### Incident Summary
- **Service/Module**: ${bestMatch.moduleId ? (bestMatch.moduleId.moduleName || bestMatch.moduleId.name || bestMatch.moduleId) : 'Unknown Service'}
- **Project**: ${bestMatch.projectId ? (bestMatch.projectId.projectName || bestMatch.projectId.name || bestMatch.projectId) : 'Unknown Project'}
- **Failed Version**: v${bestMatch.version} (Deployed to **${bestMatch.environment}**)
- **Operator/Developer**: ${bestMatch.developerName || 'Unknown Developer'}
 
---
 
### Root Cause
- **Issue**: ${bestMatch.issueTitle || 'No Title'}
- **Description**: ${bestMatch.issueDescription || 'No explicit failure reason documented.'}
- **Root Cause**: ${bestMatch.rootCause || 'No root cause documented.'}
 
### Solution & Resolution
**The following fix was successfully applied to resolve the incident:**
\`\`\`text
${bestMatch.fixApplied || 'Fix detail is unavailable.'}
\`\`\`
 
*Note: You can review this run in the Deployment History panel under id: **${bestMatch._id}**.*`;

      } else {
        // General fallbacks if no exact deployment failure records match the terms
        bestScore = 0;
        
        if (asksAboutFailures) {
          if (troubleDeployments.length > 0) {
            const failList = troubleDeployments.map(d => {
              const modName = d.moduleId ? (d.moduleId.moduleName || d.moduleId.name || 'Unknown Module') : 'Unknown Module';
              const projName = d.projectId ? (d.projectId.projectName || d.projectId.name || 'Unknown Project') : 'Unknown Project';
              return `- **${modName}** (v${d.version}, Project: ${projName}) - *Issue: ${d.issueTitle || 'Unspecified Error'}*`;
            }).join('\n');
            answer = `I found the following active failed deployment records in SafeDeploy database memory:\n\n${failList}`;
          } else {
            answer = `There are currently no failed deployment records in the database. All registered microservice modules are operating successfully!`;
          }
        } else if (lowerQuery.includes('project') || lowerQuery.includes('list')) {
          const projList = projects.map(p => `- **${p.projectName || p.name}** (Team: ${p.teamName || p.owner})`).join('\n');
          answer = `I couldn't find specific deployment failures. However, here are the projects registered in SafeDeploy:\n\n${projList || 'No projects registered yet.'}`;
        } else if (lowerQuery.includes('module') || lowerQuery.includes('service')) {
          const modList = modules.map(m => `- **${m.moduleName || m.name}** (v${m.version}, Type: ${m.moduleType || m.type})`).join('\n');
          answer = `I couldn't find a matching incident. Here is a catalog of the currently active modules:\n\n${modList || 'No modules registered yet.'}`;
        } else {
          answer = `I analyzed our deployment memory database but couldn't find a recorded failure or resolution matching **"${query}"**. 
 
**Here are some query ideas you can try:**
- *"Why did the stripe webhook fail?"* (queries Payment Gateway Linker failure logs)
- *"What is the resolution for the mongo connection timeout?"* (queries Catalog Database Router incident)
- *"Explain the auth failure on redis cluster setup"* (queries Redis Session Cacher incident)
- *"Who deployed the E-Commerce suite?"*`;
        }
      }
    }

    // Save Query Log
    if (useMemory()) {
      await memoryDb.createQueryLog({
        query,
        answer,
        matchedDeployments: referencedIds,
        score: bestScore || 0.5
      });
    } else {
      const queryLog = new QueryLog({
        query,
        answer,
        matchedDeployments: referencedIds,
        score: bestScore || 0.5
      });
      await queryLog.save();
    }

    res.json({
      query,
      answer,
      matchedDeployments: matchedDeployments.map(m => m.deployment),
      score: bestScore
    });

  } catch (error) {
    res.status(500).json({ message: 'Error processing AI chat query', error: error.message });
  }
};

module.exports = {
  queryMemory
};
