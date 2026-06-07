# SAFEDEPLOY - AI-Powered Deployment Memory System

SafeDeploy is an intelligent deployment log memory and query system built for engineering teams. It acts as a single source of truth for deployment history, service registry, configuration details, troubleshooting histories, and previous fixes. By utilizing an AI-powered conversational search, new and existing developers can query past deployment failures, resolutions, and system changes using simple natural language.

## Repository Directory Structure

```text
safedeploy/
├── frontend/             # React (Vite) + Tailwind CSS dashboard application
├── backend/              # Node.js + Express.js + Mongoose REST API server
├── docs/                 # Hackathon markdown specifications and guides
├── screenshots/          # High-fidelity UI mockups and visual materials
├── api-docs/             # Complete REST API specifications
└── database/             # MongoDB schema details and sample dataset JSON
```

## Problem Statement

When service incidents occur or custom deployment fixes are applied, the troubleshooting knowledge is often lost in transient chat messages, personal notes, or unindexed logs. When a similar issue recurs, developers lose valuable hours re-diagnosing it. SafeDeploy solves this by index-linking deployment metadata, failure errors, and developer resolutions to an AI memory query engine.

## Core Modules & Features

- **Project Registry**: Track multi-team environments with visual status logs.
- **Module Registry**: Register microservices (Authentication, Database, Payment gateways, etc.) and view their status context.
- **Incident Logger**: Record deployment runs, target servers, failure root causes, and customized developer resolutions.
- **AI Memory Search**: Converse with system diagnostics history in natural language to retrieve troubleshooting suggestions instantly.
- **Analytics & Reports Panel**: Inspect operations KPIs (runs, active developers, success rates) with custom glowing SVG telemetry charts and download CSV, Excel, or print-styled PDF report sheets.

## Quick Start (Developer Setup)


To spin up the SafeDeploy hackathon environment:

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (port 27017) or MongoDB Atlas connection string

### 1. Database Seeding
Navigate to the `database` folder to view the schema design and seed sample data.

### 2. Run the Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```

For detailed setup, system architectures, and features, explore the [docs](file:///d:/HTML%20PROJECT/Hackathon/docs) folder.
