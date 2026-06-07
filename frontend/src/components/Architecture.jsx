import React from 'react';
import { 
  Terminal, 
  Cpu, 
  Database, 
  MessageSquare, 
  ArrowDown, 
  ArrowUp,
  Layers,
  Activity,
  Bot,
  Zap
} from 'lucide-react';

export default function Architecture() {
  return (
    <div className="space-y-8 relative pb-12">
      {/* Glow effects */}
      <div className="glow-bg bg-cyan-500/10 w-[300px] h-[300px] top-10 right-10"></div>
      <div className="glow-bg bg-violet-500/10 w-[400px] h-[400px] bottom-10 left-10"></div>

      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          SafeDeploy System Architecture
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Trace how telemetry logs, keyword analysis matrices, and incident summaries circulate across the stack.
        </p>
      </div>

      {/* Architecture Diagrams Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Core Stack Layers List */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Architectural Layers</h2>
          
          {[
            { 
              title: 'Frontend Client App', 
              icon: Cpu, 
              color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/20', 
              desc: 'React.js (Vite compiler) styled with Tailwind CSS. Includes custom SVG charting canvases, print preview portals, and continuous polling states.' 
            },
            { 
              title: 'Express REST Server', 
              icon: Terminal, 
              color: 'text-violet-400 bg-violet-950/40 border-violet-500/20', 
              desc: 'Node.js server listening on port 5000. Coordinates REST APIs, global regex query parsers, and custom CSV tabular formatting triggers.' 
            },
            { 
              title: 'Hybrid Database Adapter', 
              icon: Database, 
              color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20', 
              desc: 'A check on Mongoose readyState automatically switches between active MongoDB Atlas pipelines and our local array aggregate file database manager.' 
            },
            { 
              title: 'AI Correlation Memory', 
              icon: Bot, 
              color: 'text-amber-400 bg-amber-950/40 border-amber-500/20', 
              desc: 'Calculates keyword overlap scoring against root cause columns to find similar incident resolutions. Gracefully falls back to OpenAI synthesis when keys are present.' 
            }
          ].map((layer, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl flex gap-4 hover:border-slate-700/60 transition">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-lg ${layer.color}`}>
                <layer.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">{layer.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual API Flow & Request Pipe */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between h-[650px] relative">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800/80 pb-3 flex items-center justify-between mb-4">
            <span>Operational Data Pipeline Flow</span>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              Real-time telemetry routing
            </span>
          </h2>

          <div className="flex-1 flex flex-col justify-around relative px-4">
            
            {/* Flow Step 1: User Request */}
            <div className="flex items-center justify-between border border-slate-800 bg-slate-900/40 p-3.5 rounded-xl hover:border-cyan-500/30 transition duration-300">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/20 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-400">1</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Interactive User Workspace</h4>
                  <p className="text-[10px] text-slate-400">Initiates search query, exports reports, or posts incident details.</p>
                </div>
              </div>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>

            {/* Down Connector */}
            <div className="flex justify-center my-0.5">
              <ArrowDown className="w-4 h-4 text-slate-600 animate-bounce" />
            </div>

            {/* Flow Step 2: REST Client */}
            <div className="flex items-center justify-between border border-slate-800 bg-slate-900/40 p-3.5 rounded-xl hover:border-violet-500/30 transition duration-300">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-950 border border-violet-500/20 flex items-center justify-center text-[10px] font-mono font-bold text-violet-400">2</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">REST Client Handler API</h4>
                  <p className="text-[10px] text-slate-400">Serializes input parameters and directs fetch commands to http://localhost:5000/api.</p>
                </div>
              </div>
              <Activity className="w-4 h-4 text-violet-400" />
            </div>

            {/* Down Connector */}
            <div className="flex justify-center my-0.5">
              <ArrowDown className="w-4 h-4 text-slate-600" />
            </div>

            {/* Flow Step 3: Server middleware readyState routing */}
            <div className="flex items-center justify-between border border-slate-800 bg-slate-900/40 p-3.5 rounded-xl hover:border-emerald-500/30 transition duration-300 relative">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400">3</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Node Database connection check</h4>
                  <p className="text-[10px] text-slate-400">Checks mongoose.connection.readyState. Selects MongoDB or memoryDb.js adapter.</p>
                </div>
              </div>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Split Connectors */}
            <div className="flex justify-around px-8 my-0.5">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-emerald-500 font-bold mb-1">State: 1 (Online)</span>
                <ArrowDown className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-rose-500 font-bold mb-1">State: 0 (Offline)</span>
                <ArrowDown className="w-4 h-4 text-rose-500" />
              </div>
            </div>

            {/* Dual Paths */}
            <div className="grid grid-cols-2 gap-4">
              {/* Path A */}
              <div className="border border-emerald-500/20 bg-emerald-950/10 p-3 rounded-xl text-center">
                <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Mongo Atlas Cluster</h5>
                <p className="text-[9px] text-slate-400 mt-1">Aggregates dataset indices using Mongoose schemas.</p>
              </div>
              {/* Path B */}
              <div className="border border-rose-500/20 bg-rose-950/10 p-3 rounded-xl text-center">
                <h5 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">memoryDb.js Local Engine</h5>
                <p className="text-[9px] text-slate-400 mt-1">Executes filter algorithms over normalized memory tables.</p>
              </div>
            </div>

            {/* Up Connector */}
            <div className="flex justify-center mt-3">
              <ArrowUp className="w-4 h-4 text-slate-600" />
            </div>

            {/* Flow Step 4: AI Reply */}
            <div className="flex items-center justify-between border border-slate-800 bg-slate-900/40 p-3.5 rounded-xl hover:border-amber-500/30 transition duration-300">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-950 border border-amber-500/20 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 font-sans">4</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">AI Response Compiler & Exporter</h4>
                  <p className="text-[10px] text-slate-400">Formats CSV blobs or builds markdown suggestions to load onto the UI viewport.</p>
                </div>
              </div>
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
