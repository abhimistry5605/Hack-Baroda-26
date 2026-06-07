import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Layers, 
  Search, 
  Bot, 
  ArrowRight, 
  GitBranch, 
  Users, 
  FileText, 
  BookOpen, 
  HelpCircle,
  FolderPlus,
  FileCode,
  AlertTriangle,
  CheckCircle,
  Database
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  
  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-visible');
          }
        });
      },
      { threshold: 0.05 }
    );

    const animatedElements = document.querySelectorAll('.fade-in-section');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-container">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <ShieldAlert className="w-5 h-5 animate-pulse text-blue-600" />
            SAFEDEPLOY
          </Link>
          <div className="nav-links hidden md:flex">
            <button onClick={() => handleScrollTo('features')} className="nav-link cursor-pointer bg-transparent border-none">Features</button>
            <button onClick={() => handleScrollTo('workflow')} className="nav-link cursor-pointer bg-transparent border-none">Workflow</button>
            <button onClick={() => handleScrollTo('ai-assistant')} className="nav-link cursor-pointer bg-transparent border-none">AI Assistant</button>
            <button onClick={() => handleScrollTo('about')} className="nav-link cursor-pointer bg-transparent border-none">About</button>
          </div>
          <Link to="/dashboard" className="btn-primary">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section fade-in-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Bot className="w-3.5 h-3.5" />
            <span>DevOps Memory Agent Core</span>
          </div>
          <h1 className="hero-title">
            Build Better Projects With Organizational Memory
          </h1>
          <p className="hero-subtitle">
            Capture project history, module knowledge, decisions, fixes, and team expertise in one intelligent platform.
          </p>
          <div className="hero-actions">
            <Link to="/create-project" className="btn-primary">
              <FolderPlus className="w-4 h-4" />
              Start Project
            </Link>
            <button onClick={() => handleScrollTo('features')} className="btn-secondary">
              Explore Platform
            </button>
          </div>
        </div>

        {/* Hero Mockup Illustration */}
        <div className="hero-illustration">
          <div className="mockup-main space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-800 font-mono">Workspace Overview</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            </div>
            
            <div className="space-y-2.5">
              <div className="h-2.5 bg-slate-100 rounded w-3/4"></div>
              <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
            </div>

            {/* Custom SVG telemetry mock */}
            <svg viewBox="0 0 100 35" className="w-full bg-slate-50/50 rounded-lg p-2 border border-slate-100">
              <path d="M 0,25 C 20,20 40,30 60,10 C 80,15 90,5 100,15" fill="none" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 0,25 C 20,20 40,30 60,10 C 80,15 90,5 100,15 L 100,35 L 0,35 Z" fill="rgba(30, 58, 138, 0.05)" />
            </svg>

            <div className="text-[10px] text-slate-400 font-mono text-center pt-2">
              Telemetries aggregated successfully
            </div>
          </div>

          {/* Floating Card 1: Authentication Module */}
          <div className="floating-card card-auth animate-float-slow">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Authentication Module</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500">OAuth2 JWKS Token validation active.</p>
            <span className="text-[9px] font-bold text-slate-400">Owner: Lara Croft</span>
          </div>

          {/* Floating Card 2: Payment Service */}
          <div className="floating-card card-payment animate-float-medium">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Payment Service</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">Stripe API webhook connection secured.</p>
            <span className="text-[9px] font-bold text-slate-400">Status: Verified</span>
          </div>

          {/* Floating Card 3: Bug History */}
          <div className="floating-card card-bug animate-float-fast">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Bug History</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">Mongo VPC timeout resolved by whitelisting subnet CIDR.</p>
            <span className="text-[9px] font-bold text-slate-400">Fixed: June 7</span>
          </div>

          {/* Floating Card 4: AI Knowledge Assistant */}
          <div className="floating-card card-chat animate-float-slowest">
            <div className="flex gap-2 items-start">
              <Bot className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">AI Knowledge Assistant</span>
                <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                  "Found 2 related incidents in authentication module history."
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section fade-in-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">System Platform Features</span>
            <h2 className="section-title">Fully Integrated Operations Registry</h2>
          </div>

          <div className="features-grid">
            {[
              { 
                title: 'Module Knowledge Management', 
                icon: Layers, 
                desc: 'Document owners, microservice parameters, JWKS configurations, and custom version tags per module.' 
              },
              { 
                title: 'Historical Change Tracking', 
                icon: GitBranch, 
                desc: 'Audit release configurations chronologically, tracing target target groups (Staging, Prod) and initiated developers.' 
              },
              { 
                title: 'AI-Powered Search', 
                icon: Bot, 
                desc: 'Ask natural language queries to search past incidents and instantly compile correlation resolution answers.' 
              },
              { 
                title: 'Team Collaboration', 
                icon: Users, 
                desc: 'Assign code module ownerships and track workloads, successes, and failures per team member.' 
              },
              { 
                title: 'Smart Documentation', 
                icon: FileText, 
                desc: 'Generate printable operations summaries and CSV data sheets with advanced filters.' 
              },
              { 
                title: 'Decision Traceability', 
                icon: BookOpen, 
                desc: 'Connect the complete telemetry flow Project Workspace → Microservice Module → Release Run → Outage → Applied Fix.' 
              }
            ].map((feat, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon-wrapper">
                  <feat.icon className="feature-icon" />
                </div>
                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="workflow-section fade-in-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Operations Workflow</span>
            <h2 className="section-title">Six Simple Steps to AI Memory</h2>
          </div>

          <div className="workflow-grid">
            {[
              { num: '01', title: 'Create Project', desc: 'Define your parent project spaces (e.g. E-Commerce, Billing Suite) to separate concerns.' },
              { num: '02', title: 'Select Module', desc: 'Register code microservice modules (Payment gateway, Auth JWKS router) under target projects.' },
              { num: '03', title: 'Add Knowledge & History', desc: 'Log deployment runs, versions, environments, and details of any bugs, causes, or resolutions.' },
              { num: '04', title: 'Store in Knowledge Base', desc: 'Securely indexes incident metadata whitelists automatically on MongoDB or memoryDb fallback.' },
              { num: '05', title: 'Ask AI Assistant', desc: 'Query the chatbot in conversational English: "Why did payment webhook key ingress fail?"' },
              { num: '06', title: 'Get Context-Aware Answers', desc: 'Retrieve matching incident details, experiences developers contact info, and applied fix codes.' }
            ].map((work, idx) => (
              <div key={idx} className="workflow-card">
                <span className="workflow-num">{work.num}</span>
                <h3 className="workflow-title">{work.title}</h3>
                <p className="workflow-desc">{work.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Callout block */}
      <section id="ai-assistant" className="about-section bg-[#0F172A] py-20 text-white fade-in-section">
        <div className="about-container max-w-4xl px-4">
          <div className="about-logo text-cyan-400">
            <Bot className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="about-title">Cognitive Diagnostic Assistant</h2>
          <p className="about-desc max-w-2xl mx-auto">
            SafeDeploy matches keyword tokens and correlation statistics to query logs. Judges and developers can ask details of past gateway timeouts, cluster AUTH failures, or DNS lookup crashes and get troubleshooting checklists instantly.
          </p>
          <div className="about-cta flex gap-4 mt-6">
            <Link to="/ai-chat" className="btn-primary bg-cyan-600 border-cyan-600 hover:bg-cyan-500 hover:border-cyan-500 text-white">
              Query AI Assistant
            </Link>
            <Link to="/timeline" className="btn-secondary bg-slate-900 border-slate-800 hover:bg-slate-800 text-white">
              Visual Trace Flow
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="features-section bg-slate-50 border-none fade-in-section">
        <div className="about-container max-w-3xl px-4 py-8 text-center">
          <h2 className="text-xl font-bold text-slate-800">About the Platform</h2>
          <p className="text-slate-600 leading-relaxed mt-2 text-sm">
            Designed for teams to preserve project knowledge, reduce onboarding time, and prevent repeated mistakes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <span className="footer-logo">SAFEDEPLOY</span>
          <p className="footer-text">
            © {new Date().getFullYear()} SafeDeploy. Hackathon Showcase Edition. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
