const mongoose = require('mongoose');
const memoryDb = require('../utils/memoryDb');
const Project = require('../models/Project');
const Module = require('../models/Module');
const Deployment = require('../models/Deployment');

const useMemory = () => mongoose.connection.readyState !== 1;

// Helper to build match criteria for Mongoose queries
const buildMongooseMatch = (query) => {
  const match = {};
  if (query.projectId) {
    match.projectId = new mongoose.Types.ObjectId(query.projectId);
  }
  if (query.moduleId) {
    match.moduleId = new mongoose.Types.ObjectId(query.moduleId);
  }
  if (query.status) {
    match.deploymentStatus = query.status;
  }
  if (query.environment) {
    match.environment = query.environment;
  }
  if (query.version) {
    match.version = query.version;
  }
  if (query.startDate || query.endDate) {
    match.deploymentDate = {};
    if (query.startDate) {
      match.deploymentDate.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      match.deploymentDate.$lte = end;
    }
  }
  return match;
};

// GET /api/analytics/overview
const getOverviewStats = async (req, res) => {
  try {
    if (useMemory()) {
      const stats = await memoryDb.getAnalyticsOverview(req.query);
      return res.json(stats);
    }

    const match = buildMongooseMatch(req.query);
    const totalProjects = await Project.countDocuments();
    const totalModules = await Module.countDocuments();

    const deploymentStats = await Deployment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalDeployments: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Failed'] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Partial Success'] }, 1, 0] } },
          developers: { $addToSet: '$developerName' }
        }
      }
    ]);

    let totalDeployments = 0;
    let successful = 0;
    let failed = 0;
    let partial = 0;
    let activeDevelopers = 0;

    if (deploymentStats.length > 0) {
      totalDeployments = deploymentStats[0].totalDeployments;
      successful = deploymentStats[0].successful;
      failed = deploymentStats[0].failed;
      partial = deploymentStats[0].partial;
      activeDevelopers = deploymentStats[0].developers.filter(Boolean).length;
    }

    const successRate = totalDeployments > 0 
      ? Math.round((successful / totalDeployments) * 100) 
      : 100;

    // AI Summary Generator
    let aiSummary = `During the selected timeframe, ${totalDeployments} deployments were recorded across our project workspaces. Out of these, ${successful} were completely successful, ${failed} failed with exceptions, and ${partial} achieved partial success. `;

    const failedDeploysMatch = { ...match, deploymentStatus: { $in: ['Failed', 'Partial Success'] } };
    const failedModulesGroup = await Deployment.aggregate([
      { $match: failedDeploysMatch },
      {
        $group: {
          _id: '$moduleId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 2 }
    ]);

    if (failedModulesGroup.length > 0) {
      const moduleIds = failedModulesGroup.map(item => item._id);
      const failedModules = await Module.find({ _id: { $in: moduleIds } });
      const topFailed = failedModulesGroup.map(item => {
        const mod = failedModules.find(m => m._id.toString() === item._id.toString());
        return mod ? mod.moduleName : 'Unknown Module';
      });

      if (topFailed.length > 0) {
        aiSummary += `The **${topFailed.join('** and **')}** modules experienced the highest frequency of build incidents and exceptions, requiring active diagnostics.`;
      }
    } else {
      aiSummary += 'All service dependencies showed stable operations with zero recorded build incidents or outages during this cycle.';
    }

    res.json({
      totalProjects,
      totalModules,
      totalDeployments,
      successful,
      failed,
      partial,
      successRate,
      activeDevelopers,
      aiSummary
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving overview analytics', error: error.message });
  }
};

// GET /api/analytics/modules
const getModulesStats = async (req, res) => {
  try {
    if (useMemory()) {
      const stats = await memoryDb.getAnalyticsModules(req.query);
      return res.json(stats);
    }

    const match = buildMongooseMatch(req.query);
    const moduleFilter = {};
    if (req.query.projectId) {
      moduleFilter.projectId = new mongoose.Types.ObjectId(req.query.projectId);
    }
    const allModules = await Module.find(moduleFilter);

    const deploymentStats = await Deployment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$moduleId',
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Failed'] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Partial Success'] }, 1, 0] } },
          issuesCount: { $sum: { $cond: [{ $in: ['$deploymentStatus', ['Failed', 'Partial Success']] }, 1, 0] } }
        }
      }
    ]);

    const statsMap = {};
    allModules.forEach(m => {
      statsMap[m._id.toString()] = {
        moduleId: m._id,
        moduleName: m.moduleName,
        total: 0,
        success: 0,
        failed: 0,
        partial: 0,
        issuesCount: 0
      };
    });

    deploymentStats.forEach(stat => {
      const idStr = stat._id ? stat._id.toString() : '';
      if (statsMap[idStr]) {
        statsMap[idStr].total = stat.total;
        statsMap[idStr].success = stat.success;
        statsMap[idStr].failed = stat.failed;
        statsMap[idStr].partial = stat.partial;
        statsMap[idStr].issuesCount = stat.issuesCount;
      }
    });

    const result = Object.values(statsMap).sort((a, b) => b.total - a.total);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving module analytics', error: error.message });
  }
};

// GET /api/analytics/developers
const getDevelopersStats = async (req, res) => {
  try {
    if (useMemory()) {
      const stats = await memoryDb.getAnalyticsDevelopers(req.query);
      return res.json(stats);
    }

    const match = buildMongooseMatch(req.query);
    const developerStats = await Deployment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$developerName',
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Failed'] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Partial Success'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          developerName: '$_id',
          total: 1,
          success: 1,
          failed: 1,
          partial: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(developerStats);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving developer analytics', error: error.message });
  }
};

// GET /api/analytics/deployments
const getDeploymentsStats = async (req, res) => {
  try {
    if (useMemory()) {
      const stats = await memoryDb.getAnalyticsDeployments(req.query);
      return res.json(stats);
    }

    const match = buildMongooseMatch(req.query);
    const trendStats = await Deployment.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$deploymentDate' }
          },
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Failed'] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ['$deploymentStatus', 'Partial Success'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          success: 1,
          failed: 1,
          partial: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(trendStats);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving deployment trend analytics', error: error.message });
  }
};

// GET /api/reports/export
const exportReports = async (req, res) => {
  try {
    const { reportType = 'summary', format = 'csv' } = req.query;

    let data = [];
    if (useMemory()) {
      // Pull and aggregate appropriate memory collections
      const deployments = await memoryDb.getDeployments(req.query);
      const modulesList = await memoryDb.getModules(req.query.projectId);
      const projectsList = await memoryDb.getProjects();

      if (reportType === 'summary') {
        data = deployments.map(d => ({
          Date: new Date(d.deploymentDate).toLocaleDateString(),
          Project: d.projectId?.projectName || 'N/A',
          Module: d.moduleId?.moduleName || 'N/A',
          Version: d.version,
          Developer: d.developerName,
          Environment: d.environment,
          Status: d.deploymentStatus,
          IssueTitle: d.issueTitle || '',
          FixApplied: d.fixApplied || ''
        }));
      } else if (reportType === 'failed') {
        data = deployments
          .filter(d => ['Failed', 'Partial Success'].includes(d.deploymentStatus))
          .map(d => ({
            Date: new Date(d.deploymentDate).toLocaleDateString(),
            Project: d.projectId?.projectName || 'N/A',
            Module: d.moduleId?.moduleName || 'N/A',
            Version: d.version,
            Developer: d.developerName,
            Environment: d.environment,
            Status: d.deploymentStatus,
            IssueTitle: d.issueTitle,
            Description: d.issueDescription,
            RootCause: d.rootCause,
            FixApplied: d.fixApplied
          }));
      } else if (reportType === 'developer') {
        const devMap = {};
        deployments.forEach(d => {
          if (!d.developerName) return;
          if (!devMap[d.developerName]) {
            devMap[d.developerName] = { name: d.developerName, total: 0, success: 0, failed: 0, partial: 0 };
          }
          devMap[d.developerName].total++;
          if (d.deploymentStatus === 'Success') devMap[d.developerName].success++;
          else if (d.deploymentStatus === 'Failed') devMap[d.developerName].failed++;
          else if (d.deploymentStatus === 'Partial Success') devMap[d.developerName].partial++;
        });
        data = Object.values(devMap).map(dev => ({
          'Developer Name': dev.name,
          'Total Deployments': dev.total,
          'Successful Deployments': dev.success,
          'Failed Deployments': dev.failed,
          'Partial Deployments': dev.partial,
          'Success Rate (%)': dev.total > 0 ? Math.round((dev.success / dev.total) * 100) : 100
        }));
      } else if (reportType === 'health') {
        const modMap = {};
        modulesList.forEach(m => {
          modMap[m._id] = { name: m.moduleName, project: m.projectId?.projectName || 'N/A', total: 0, issues: 0 };
        });
        deployments.forEach(d => {
          const mId = d.moduleId?._id || d.moduleId;
          if (modMap[mId]) {
            modMap[mId].total++;
            if (d.deploymentStatus !== 'Success') {
              modMap[mId].issues++;
            }
          }
        });
        data = Object.values(modMap).map(mod => ({
          'Module Name': mod.name,
          'Project Name': mod.project,
          'Total Deployments': mod.total,
          'Incidents Logged': mod.issues,
          'Success Rate (%)': mod.total > 0 ? Math.round(((mod.total - mod.issues) / mod.total) * 100) : 100
        }));
      }
    } else {
      const match = buildMongooseMatch(req.query);
      const deployments = await Deployment.find(match)
        .populate('projectId')
        .populate('moduleId')
        .sort({ deploymentDate: -1 });

      if (reportType === 'summary') {
        data = deployments.map(d => ({
          Date: new Date(d.deploymentDate).toLocaleDateString(),
          Project: d.projectId?.projectName || 'N/A',
          Module: d.moduleId?.moduleName || 'N/A',
          Version: d.version,
          Developer: d.developerName,
          Environment: d.environment,
          Status: d.deploymentStatus,
          IssueTitle: d.issueTitle || '',
          FixApplied: d.fixApplied || ''
        }));
      } else if (reportType === 'failed') {
        data = deployments
          .filter(d => ['Failed', 'Partial Success'].includes(d.deploymentStatus))
          .map(d => ({
            Date: new Date(d.deploymentDate).toLocaleDateString(),
            Project: d.projectId?.projectName || 'N/A',
            Module: d.moduleId?.moduleName || 'N/A',
            Version: d.version,
            Developer: d.developerName,
            Environment: d.environment,
            Status: d.deploymentStatus,
            IssueTitle: d.issueTitle,
            Description: d.issueDescription,
            RootCause: d.rootCause,
            FixApplied: d.fixApplied
          }));
      } else if (reportType === 'developer') {
        const devMap = {};
        deployments.forEach(d => {
          if (!d.developerName) return;
          if (!devMap[d.developerName]) {
            devMap[d.developerName] = { name: d.developerName, total: 0, success: 0, failed: 0, partial: 0 };
          }
          devMap[d.developerName].total++;
          if (d.deploymentStatus === 'Success') devMap[d.developerName].success++;
          else if (d.deploymentStatus === 'Failed') devMap[d.developerName].failed++;
          else if (d.deploymentStatus === 'Partial Success') devMap[d.developerName].partial++;
        });
        data = Object.values(devMap).map(dev => ({
          'Developer Name': dev.name,
          'Total Deployments': dev.total,
          'Successful Deployments': dev.success,
          'Failed Deployments': dev.failed,
          'Partial Deployments': dev.partial,
          'Success Rate (%)': dev.total > 0 ? Math.round((dev.success / dev.total) * 100) : 100
        }));
      } else if (reportType === 'health') {
        const modulesList = await Module.find(req.query.projectId ? { projectId: req.query.projectId } : {}).populate('projectId');
        const modMap = {};
        modulesList.forEach(m => {
          modMap[m._id.toString()] = { name: m.moduleName, project: m.projectId?.projectName || 'N/A', total: 0, issues: 0 };
        });
        deployments.forEach(d => {
          const mId = d.moduleId?._id?.toString() || d.moduleId?.toString();
          if (modMap[mId]) {
            modMap[mId].total++;
            if (d.deploymentStatus !== 'Success') {
              modMap[mId].issues++;
            }
          }
        });
        data = Object.values(modMap).map(mod => ({
          'Module Name': mod.name,
          'Project Name': mod.project,
          'Total Deployments': mod.total,
          'Incidents Logged': mod.issues,
          'Success Rate (%)': mod.total > 0 ? Math.round(((mod.total - mod.issues) / mod.total) * 100) : 100
        }));
      }
    }

    if (format === 'json') {
      return res.json(data);
    }

    // Convert data array to CSV format
    if (data.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}.csv`);
      return res.send('No records match the specified filters.');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(fieldName => {
          const val = row[fieldName];
          // Escape quotes and commas
          const valStr = val === undefined || val === null ? '' : String(val);
          const cleanVal = valStr.replace(/"/g, '""');
          return cleanVal.includes(',') || cleanVal.includes('\n') || cleanVal.includes('"') 
            ? `"${cleanVal}"` 
            : cleanVal;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report export', error: error.message });
  }
};

module.exports = {
  getOverviewStats,
  getModulesStats,
  getDevelopersStats,
  getDeploymentsStats,
  exportReports
};
