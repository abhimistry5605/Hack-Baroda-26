# Setup Guide

This guide will walk you through setting up and running the SafeDeploy application on your local development machine.

## Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on `mongodb://localhost:27017` or MongoDB Atlas URI)

---

## 1. Clone & Core Setup

Navigate to your workspace directory:
```bash
# Ensure you are inside the project root
cd Hackathon
```

---

## 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` folder:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/safedeploy
   ```
4. Run the database seed script to populate mock data (Optional, but highly recommended for testing):
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend server will launch on [http://localhost:5000](http://localhost:5000).

---

## 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   Open your browser to the URL output by Vite (typically [http://localhost:5173](http://localhost:5173)).

---

## 4. Testing the AI Chat Memory System

1. On the frontend, click on the **AI Chat** tab in the sidebar.
2. Enter a natural language query related to past problems, such as:
   - *"Why did Auth Service fail?"*
   - *"How did we fix the redis crash?"*
   - *"Give me the fix for memory overflow"*
3. The chatbot will query the backend, match relevant historical deployment logs, retrieve developer troubleshooting notes, and output a synthesized markdown answer.
