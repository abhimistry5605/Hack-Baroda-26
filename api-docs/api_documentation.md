# SafeDeploy REST API Documentation

Base URL: `http://localhost:5000`

---

## 1. Projects API

### GET `/api/projects`
Retrieves a list of all registered projects with their module counts.
* **Response Status**: `200 OK`
* **Response Body**:
```json
[
  {
    "_id": "60d5ec4b8f1a2c3d4e5f6a7b",
    "projectName": "E-Commerce Suite",
    "teamName": "Alpha Squad",
    "description": "Full-scale online retail application.",
    "projectType": "Web Application",
    "totalModules": 4,
    "createdAt": "2026-06-07T12:00:00.000Z",
    "updatedAt": "2026-06-07T12:00:00.000Z"
  }
]
```

### POST `/api/projects`
Creates a new project space.
* **Request Body**:
```json
{
  "projectName": "Project Omega",
  "teamName": "Gamma Team",
  "description": "New cloud microservice platform.",
  "projectType": "Microservice"
}
```
* **Response Status**: `201 Created`

### GET `/api/projects/:id`
Retrieves details of a single project.
* **Response Status**: `200 OK`

### PUT `/api/projects/:id`
Updates project attributes.
* **Request Body**:
```json
{
  "projectName": "Project Omega Update",
  "teamName": "Gamma Team Redux",
  "description": "Updated project description",
  "projectType": "Microservice"
}
```
* **Response Status**: `200 OK`

### DELETE `/api/projects/:id`
Deletes a project workspace and cascade-clears all registered modules and deployment histories.
* **Response Status**: `200 OK`

---

## 2. Modules API

### GET `/api/modules`
Retrieves a list of all microservice modules, optionally filtered by `projectId`.
* **Query Params**: `?projectId=60d5ec4b8f1a2c3d4e5f6a7b`
* **Response Status**: `200 OK`

### POST `/api/modules`
Registers a new module under a project.
* **Request Body**:
```json
{
  "projectId": "60d5ec4b8f1a2c3d4e5f6a7b",
  "moduleName": "Stripe Integration API",
  "moduleType": "Payment",
  "description": "Handles Stripe checkout webhooks and invoice queries.",
  "owner": "Sarah Jenkins"
}
```
* **Response Status**: `201 Created`

### GET `/api/modules/:id`
Retrieves details of a single module.
* **Response Status**: `200 OK`

### GET `/api/projects/:projectId/modules`
Retrieves a list of all modules belonging to a specific project.
* **Response Status**: `200 OK`

### PUT `/api/modules/:id`
Updates module metadata.
* **Request Body**:
```json
{
  "moduleName": "Stripe Payment Linker",
  "moduleType": "Payment",
  "description": "Updated description",
  "owner": "Sarah J."
}
```
* **Response Status**: `200 OK`

### DELETE `/api/modules/:id`
Deletes a module and cascade-clears all associated deployment histories.
* **Response Status**: `200 OK`

---

## 3. Deployments API

### GET `/api/deployments`
Retrieves a list of deployment records, support queries like `searchIssue`, `searchDeveloper`, `moduleId`, `status`, and `version`.
* **Query Params**: `?moduleId=60d5ec5a8f1a2c3d4e5f6a7c&status=Failed`
* **Response Status**: `200 OK`

### POST `/api/deployments`
Logs a new deployment audit record.
* **Request Body**:
```json
{
  "projectId": "60d5ec4b8f1a2c3d4e5f6a7b",
  "moduleId": "60d5ec5a8f1a2c3d4e5f6a7c",
  "developerName": "Sarah Jenkins",
  "version": "2.4.2",
  "environment": "Production",
  "issueTitle": "Payment Connection Timeout",
  "issueDescription": "Failed to resolve Stripe API proxy host",
  "rootCause": "Missing proxy environment variables in production container settings",
  "fixApplied": "Added corporate outbound proxies to Helm values.yaml variables",
  "deploymentStatus": "Failed",
  "notes": "Build succeeded, container initialization failed.",
  "deploymentDate": "2026-06-07T12:00:00.000Z"
}
```
* **Response Status**: `201 Created`

### GET `/api/deployments/:id`
Retrieves detailed timeline metrics for a single deployment record.
* **Response Status**: `200 OK`

### GET `/api/modules/:moduleId/deployments`
Retrieves historical logs for a specific module service.
* **Response Status**: `200 OK`

### PUT `/api/deployments/:id`
Updates deployment metadata (issue diagnostics, notes).
* **Request Body**:
```json
{
  "developerName": "Sarah J.",
  "notes": "Added post-deploy diagnostics run logs."
}
```
* **Response Status**: `200 OK`

### DELETE `/api/deployments/:id`
Deletes a deployment record.
* **Response Status**: `200 OK`

---

## 4. Statistics API

### GET `/api/stats`
Retrieves aggregate metrics for the dashboard view.
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "totalProjects": 2,
  "totalModules": 5,
  "totalDeployments": 4,
  "totalQueries": 12,
  "recentActivities": [
    {
      "type": "deployment",
      "status": "failed",
      "message": "Payment Gateway Linker (v2.4.1) deployment failed in production",
      "timestamp": "2026-06-07T12:15:00.000Z"
    }
  ]
}
```

---

## 5. AI Memory Chat API

### POST `/api/ai-chat`
Submits a query to the deployment history memory. The system returns an AI generated analysis and points to the historical deployment links matching the issue.
* **Request Body**:
```json
{
  "query": "How did we resolve the mongo atlas connection timeout?"
}
```
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "query": "How did we resolve the mongo atlas connection timeout?",
  "answer": "The database connection timeout issue on **Catalog Database Router** was resolved by configuring custom DNS resolvers (coredns overrides) in the Kubernetes pod specifications and whitelisting the VPC CIDR block inside MongoDB Atlas Security Settings.",
  "matchedDeployments": [
    {
      "_id": "60d5ec9e8f1a2c3d4e5f6a7g",
      "projectName": "E-Commerce Suite",
      "moduleName": "Catalog Database Router",
      "version": "1.8.0",
      "status": "failed",
      "failureReason": "Unable to resolve MongoDB Atlas hostname inside the VPC container due to DNS misconfiguration.",
      "troubleshootingFix": "Configured custom DNS resolvers in Kubernetes pod configuration (coredns overrides) and whitelisted VPC CIDR block inside MongoDB Atlas Security Settings.",
      "createdAt": "2026-06-07T10:30:00.000Z"
    }
  ],
  "score": 0.95
}
```

---

## 6. Analytics & Reports API

### GET `/api/analytics/overview`
Retrieves general system operations statistics including project/module counts, deployment stats, and a conversational AI summary block.
* **Query Params**: `?projectId=...&moduleId=...&status=...&environment=...&version=...&startDate=...&endDate=...`
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "totalProjects": 2,
  "totalModules": 5,
  "totalDeployments": 12,
  "successful": 9,
  "failed": 2,
  "partial": 1,
  "successRate": 75,
  "activeDevelopers": 3,
  "aiSummary": "During the selected timeframe, 12 deployments were recorded across our project workspaces. Out of these, 9 were completely successful, 2 failed with exceptions, and 1 achieved partial success."
}
```

### GET `/api/analytics/modules`
Retrieves details of deployments and incidents grouped by module.
* **Query Params**: `?projectId=...&moduleId=...&status=...&environment=...&version=...&startDate=...&endDate=...`
* **Response Status**: `200 OK`

### GET `/api/analytics/developers`
Retrieves developer metrics, including total runs and status breakdowns.
* **Query Params**: `?projectId=...&moduleId=...&status=...&environment=...&version=...&startDate=...&endDate=...`
* **Response Status**: `200 OK`

### GET `/api/analytics/deployments`
Retrieves daily trend analytics of deployments.
* **Query Params**: `?projectId=...&moduleId=...&status=...&environment=...&version=...&startDate=...&endDate=...`
* **Response Status**: `200 OK`

### GET `/api/reports/export`
Generates and exports CSV/Excel report sheets or raw JSON previews.
* **Query Params**: `?reportType=summary&format=csv&projectId=...`
* **Response Status**: `200 OK`
* **Response Header**: `Content-Type: text/csv`
* **Response Body**: Comma-separated values sheet file.

