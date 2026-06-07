import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { Send, Bot, User, RefreshCw, Terminal, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AIChat() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'welcome',
      type: 'bot',
      text: `Hello! I am **SafeDeploy AI**, your intelligent deployment troubleshooting memory. 

I parse our entire database of deployment runs, build outputs, failure messages, and applied resolutions to help you quickly identify solutions for recurring DevOps bugs.

**Try asking me questions like:**
- *"Why did the payment-service fail v2.4.1?"*
- *"What was the fix for the database connection timeout?"*
- *"Explain the auth failure on redis cluster setup"*`,
      references: [],
    }
  ]);
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef(null);
  const location = useLocation();

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Deep linking triggers
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialQuery = params.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      submitQuery(initialQuery);
      // Remove query param to prevent loop on updates
      window.history.replaceState(null, '', window.location.pathname + window.location.hash.split('?')[0]);
    }
  }, [location]);

  const submitQuery = async (queryText) => {
    if (!queryText || queryText.trim() === '') return;

    setLoading(true);
    setQuery('');

    // Append User Message
    const userMsg = {
      id: Date.now().toString(),
      type: 'user',
      text: queryText,
      references: [],
    };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const result = await apiService.askAI(queryText);
      
      const botMsg = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: result.answer,
        references: result.matchedDeployments || [],
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: `Error processing query: **${err.message || 'Server connection failed'}**. Make sure the backend server is running and the database is seeded.`,
        references: [],
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    submitQuery(query);
  };

  // Helper to format custom markdown highlights in simulated bot response
  const renderFormattedText = (text) => {
    return text.split('\n').map((line, index) => {
      // Heading 3
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-sm font-bold text-white mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      // Horizontal Rule
      if (line.trim() === '---') {
        return <hr key={index} className="my-4 border-slate-800" />;
      }
      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <blockquote key={index} className="p-3 my-2 border-l-4 border-rose-500 bg-rose-950/10 text-rose-200 rounded-r-lg italic text-xs leading-relaxed">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      // Code Block Start/End placeholder removal
      if (line.startsWith('```')) {
        return null;
      }
      // Normal code inline highlight
      if (line.includes('`')) {
        const parts = line.split('`');
        return (
          <p key={index} className="text-xs text-slate-300 leading-relaxed my-1.5">
            {parts.map((part, i) => (
              i % 2 === 1 
                ? <code key={i} className="bg-slate-900 border border-slate-800 text-cyan-400 px-1.5 py-0.5 rounded font-mono text-[10px]">{part}</code>
                : part
            ))}
          </p>
        );
      }
      // Bullet items
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="list-none flex gap-2 items-start my-1 text-slate-300">
            <span className="text-cyan-500 mt-1.5 shrink-0">•</span>
            <span>{line.replace('- ', '')}</span>
          </li>
        );
      }
      // Default line
      return line.trim() !== '' ? <p key={index} className="text-xs text-slate-300 leading-relaxed my-1.5">{line}</p> : <div key={index} className="h-2" />;
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-[82vh] relative">
      <div className="glow-bg bg-cyan-500/10 w-[400px] h-[400px] bottom-10 left-10"></div>
      <div className="glow-bg bg-violet-500/10 w-[300px] h-[300px] top-10 right-10"></div>

      {/* Header */}
      <div className="shrink-0 relative z-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Bot className="w-8 h-8 text-cyan-400" />
          AI Deployment Memory Chat
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Query SafeDeploy database memory in natural language to troubleshoot incident history and past resolutions.
        </p>
      </div>

      {/* Chat Area Container */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden relative z-10">
        
        {/* Chat History scroll panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-4 items-start ${msg.type === 'user' ? 'justify-end' : ''}`}>
              
              {/* Bot Icon */}
              {msg.type === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              {/* Message bubble */}
              <div className={`max-w-[85%] rounded-2xl p-5 border text-xs shadow-md ${
                msg.type === 'user'
                  ? 'bg-violet-950/20 border-violet-500/30 text-white rounded-tr-none'
                  : 'bg-slate-900/40 border-slate-800/80 rounded-tl-none space-y-3'
              }`}>
                {msg.type === 'user' ? (
                  <p className="leading-relaxed font-medium">{msg.text}</p>
                ) : (
                  <div>
                    {renderFormattedText(msg.text)}

                    {/* Matched References Section */}
                    {msg.references.length > 0 && (
                      <div className="mt-5 border-t border-slate-800/60 pt-4 space-y-3">
                        <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          Matched Deployment Memory References
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {msg.references.map((ref) => (
                            <div
                              key={ref._id}
                              onClick={() => window.location.hash = `/deployments`}
                              className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition flex items-start justify-between"
                            >
                              <div>
                                <span className="font-semibold text-slate-200 block text-[11px]">
                                  {ref.moduleId?.name || 'Service Module'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                                  v{ref.version} • {ref.environment}
                                </span>
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                ref.status === 'success' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {ref.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Icon */}
              {msg.type === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-violet-950/60 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-violet-400" />
                </div>
              )}
            </div>
          ))}

          {/* Bot loader placeholder */}
          {loading && (
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <div className="bg-slate-900/40 border-slate-800/80 rounded-2xl rounded-tl-none p-5 text-xs text-slate-400 flex items-center gap-2">
                <span>Analyzing logs and compiling solutions...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about deployment incidents..."
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-cyan-400 rounded-xl py-3.5 pl-4 pr-12 text-xs text-white focus:outline-none transition font-sans"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2.5 p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-30 disabled:hover:bg-cyan-600 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
