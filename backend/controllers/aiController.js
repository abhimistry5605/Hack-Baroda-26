const mongoose = require('mongoose');
const memoryDb = require('../utils/memoryDb');
const Deployment = require('../models/Deployment');
const QueryLog = require('../models/QueryLog');
const Project = require('../models/Project');
const Module = require('../models/Module');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');

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

    let referencedIds = [];
    let matchedObjs = [];
    let bestScore = 0;
    let answer = '';
    let isLlmSuccess = false;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Build RAG Database context
    let databaseContextText = '';
    databaseContextText += '=== PROJECTS REGISTERED ===\n';
    projects.forEach(p => {
      databaseContextText += `- Name: ${p.projectName || p.name || 'N/A'}\n  Description: ${p.projectDescription || p.description || 'N/A'}\n  Team/Owner: ${p.teamName || p.owner || 'N/A'}\n`;
    });
    databaseContextText += '\n=== MICROSERVICE MODULES ===\n';
    modules.forEach(m => {
      databaseContextText += `- Name: ${m.moduleName || m.name || 'N/A'}\n  Version: v${m.version || 'N/A'}\n  Type: ${m.moduleType || m.type || 'N/A'}\n  Description/Config: ${m.description || 'N/A'}\n`;
    });
    databaseContextText += '\n=== TELEMETRY / DEPLOYMENT INCIDENTS ===\n';
    troubleDeployments.forEach(d => {
      const modName = d.moduleId ? (d.moduleId.moduleName || d.moduleId.name || 'N/A') : 'N/A';
      const projName = d.projectId ? (d.projectId.projectName || d.projectId.name || 'N/A') : 'N/A';
      databaseContextText += `- Service/Module: ${modName}\n  Project: ${projName}\n  Version: v${d.version || 'N/A'}\n  Environment: ${d.environment || 'N/A'}\n  Developer: ${d.developerName || 'N/A'}\n  Status: ${d.deploymentStatus || d.status || 'N/A'}\n  Incident Title: ${d.issueTitle || 'N/A'}\n  Incident Description: ${d.issueDescription || 'N/A'}\n  Root Cause: ${d.rootCause || 'N/A'}\n  Fix Applied: ${d.fixApplied || 'N/A'}\n  Database Record ID: ${d._id}\n\n`;
    });

    const systemPrompt = `You are SafeDeploy AI, an intelligent DevOps troubleshooting assistant. 
You are given the following database snapshot from SafeDeploy's memory database containing telemetry, microservice configurations, projects, and deployment incidents/resolutions:

${databaseContextText}

Your task is to answer the user's natural language query based on the database snapshot. 
Instructions:
1. Provide a professional, structured DevOps summary in Markdown.
2. If the query refers to a specific project, service, or deployment failure, locate it in the snapshot and summarize:
   - What service/module and version failed.
   - The Root Cause of the failure.
   - The Resolution / Fix that was applied.
3. Make sure to mention the Database Record ID of the matching incident (e.g., "Note: You can review this run under id: [Record ID]") so the system can link it on the dashboard.
4. If there are no failed records matching the query, check the general status of all modules and reassure the user, or guide them on what queries they can run.
5. Keep your tone professional, concise, and helpful. Do not mention that you were given a snapshot text; speak as if you have direct access to the database.

User query: "${query}"
Answer:`;

    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        answer = response.text();
        if (answer) {
          isLlmSuccess = true;
          bestScore = 0.95;
        }
      } catch (err) {
        console.error('Gemini API Error, falling back to other methods:', err);
      }
    }

    if (!isLlmSuccess && openaiKey && openaiKey.trim() !== '') {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are SafeDeploy AI, a DevOps troubleshooting assistant.' },
            { role: 'user', content: systemPrompt }
          ],
          temperature: 0.2
        });
        answer = completion.choices[0].message.content;
        if (answer) {
          isLlmSuccess = true;
          bestScore = 0.95;
        }
      } catch (err) {
        console.error('OpenAI API Error, falling back to offline search:', err);
      }
    }

    if (isLlmSuccess && answer) {
      // Search the LLM answer for references to actual deployments
      const lowercaseAnswer = answer.toLowerCase();
      troubleDeployments.forEach(d => {
        const idStr = String(d._id);
        const modName = d.moduleId ? (d.moduleId.moduleName || d.moduleId.name || '') : '';
        if (
          lowercaseAnswer.includes(idStr.toLowerCase()) || 
          (modName && lowercaseAnswer.includes(modName.toLowerCase()) && (lowercaseAnswer.includes('failed') || lowercaseAnswer.includes('incident') || lowercaseAnswer.includes('v' + d.version)))
        ) {
          referencedIds.push(d._id);
          matchedObjs.push(d);
        }
      });
    } else {
      // --- FALLBACK OFFLINE SEARCH ENGINE (EXISTING LOGIC) ---
      let matchedDeployments = [];
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
          matchedObjs = troubleDeployments;
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
              matchedObjs.push(m.deployment);
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
              referencedIds = troubleDeployments.map(d => d._id);
              matchedObjs = troubleDeployments;
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
      matchedDeployments: matchedObjs,
      score: bestScore
    });

  } catch (error) {
    res.status(500).json({ message: 'Error processing AI chat query', error: error.message });
  }
};

module.exports = {
  queryMemory
};
