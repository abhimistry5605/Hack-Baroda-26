# MongoDB Database Schema Documentation

SafeDeploy uses MongoDB via Mongoose to store deployment states, service registrations, and failure/resolution histories.

## Entity Relationship Diagram (Conceptual)

```
+---------------+        +---------------+
|    Project    |<-------|    Module     |
|               | 1:N    |               |
+---------------+        +---------------+
        ^                        ^
        | 1:N                    | 1:N
        |                        |
+----------------------------------------+
|               Deployment               |
+----------------------------------------+
```

---

## Mongoose Schemas

### 1. Project Schema (`Project.js`)
Represents software platforms or organizational products containing multiple microservices.

```javascript
const ProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  description: { type: String },
  projectType: { type: String, enum: ['Web Application', 'Mobile Application', 'API Service', 'Microservice', 'Other'], default: 'Web Application' },
}, {
  timestamps: true // Auto adds createdAt and updatedAt fields
});
```

### 2. Module Schema (`Module.js`)
Represents an individual deployable component (microservice, service, API, dashboard app) belonging to a parent project.

```javascript
const ModuleSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  moduleName: { type: String, required: true },
  moduleType: { type: String, enum: ['Authentication', 'Payment', 'Orders', 'Database', 'Notifications', 'API Service', 'Admin Dashboard', 'Analytics', 'Other'], default: 'Other' },
  description: { type: String },
  owner: { type: String, required: true },
  version: { type: String, default: '1.0.0' }
}, {
  timestamps: true // Auto adds createdAt and updatedAt fields
});
```

### 3. Deployment Schema (`Deployment.js`)
Tracks the history of deployments, statuses, logs, error tracebacks, and developer fixes.

```javascript
const DeploymentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  developerName: { type: String, required: true },
  version: { type: String, required: true },
  environment: { type: String, enum: ['Development', 'Testing', 'Staging', 'Production'], required: true },
  issueTitle: { type: String },
  issueDescription: { type: String },
  rootCause: { type: String },
  fixApplied: { type: String },
  deploymentStatus: { type: String, enum: ['Success', 'Failed', 'Partial Success'], required: true },
  notes: { type: String },
  deploymentDate: { type: Date, default: Date.now }
}, {
  timestamps: true // Auto adds createdAt and updatedAt fields
});
```

### 4. QueryLog Schema (`QueryLog.js`)
Audits conversational queries run against the memory system and evaluates the match success rate.

```javascript
const QueryLogSchema = new mongoose.Schema({
  query: { type: String, required: true },
  answer: { type: String, required: true },
  matchedDeployments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deployment' }],
  score: { type: Number, default: 1.0 }, // Confidence rating or relevance
  createdAt: { type: Date, default: Date.now }
});
```
