"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Zap, Terminal, Shield, Star, Wallet, Send, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Navbar } from "@/components/Navbar";

export default function AgentPromptPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch the agent on mount
  useEffect(() => {
    async function loadAgent() {
      try {
        const res = await fetch(`/api/agents`);
        const data = await res.json();
        // Finds the matching agent by walletAddress
        const found = data.find((a: any) => a.walletAddress?.toString() === agentId);
        if (found) {
          setAgent(found);
        }
      } catch (err) {
        console.error("Failed to load agent", err);
      }
    }
    loadAgent();
  }, [agentId]);

  const handleExecute = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      // Standard fetch instead of X402 payment fetch
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        // if user cancelled wallet popup or API threw 500
        throw new Error(data.error || "Execution failed");
      }
      setResponse(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-background text-on-surface antialiased overflow-x-hidden selection:bg-primary selection:text-on-primary font-body">
      <Navbar />

      <div className="container mx-auto p-6 md:p-12 max-w-4xl pt-40">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-headline font-black text-white flex items-center gap-4">
            <Shield className="text-primary" size={32} />
            Agent Profile
          </h1>
          <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Verified Worker
          </div>
        </div>
        
        {agent ? (
          <div className="glass p-10 rounded-[2.5rem] border border-white/5 mb-10 group hover:border-primary/40 transition-all ambient-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <Zap size={200} />
            </div>

            <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                      <Zap size={32} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">{agent.name}</h2>
                      <p className="text-primary text-xs font-bold uppercase tracking-[0.2em]">Autonomous Protocol Agent</p>
                   </div>
                </div>
                <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl">
                  {agent.description || "Experimental autonomous agent registered on the Promptly protocol, ready to facilitate on-chain tasks and data processing."}
                </p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center min-w-[160px]">
                <span className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Reputation</span>
                <span className="text-3xl font-black text-white flex items-center justify-center gap-2">
                  <Star className="text-yellow-500 fill-yellow-500" size={24} />
                  {agent.reputation || 0}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5 relative z-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-primary">
                CATEGORY: {agent.category || 'WORKER'}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">
                <Wallet size={14} />
                {agent.walletAddress}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                <ExternalLink size={14} />
                EXPLORER
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-24 bg-surface-container-low border border-outline-variant/10 rounded-[2.5rem] animate-pulse">
            <Loader2 className="animate-spin text-primary mb-6" size={48} />
            <p className="text-white/20 font-black uppercase tracking-[0.3em] text-sm">Authenticating Protocol Identity...</p>
          </div>
        )}

        {/* Interaction Console */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Command Input</span>
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">AI INTERACTION ACTIVE</span>
          </div>
          <div className="relative group">
            <textarea 
              placeholder="Enter your instructions for this agent..."
              className="w-full min-h-[200px] bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-8 text-white focus:border-primary/50 transition-all outline-none text-xl tracking-tight placeholder:text-white/5 shadow-inner"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
            <div className="absolute bottom-6 right-8 text-white/5 pointer-events-none group-hover:text-primary/10 transition-colors">
              <Terminal size={60} strokeWidth={1} />
            </div>
          </div>
          
          <button 
            onClick={handleExecute} 
            disabled={!prompt.trim() || loading || !agent}
            className="w-full bg-primary text-on-primary py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm primary-glow hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
            <div className="relative z-10 flex items-center gap-4">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Initiating Compute...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Delegate Task to Agent
                </>
              )}
            </div>
          </button>
        </div>

        {error && (
          <div className="mt-10 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-5 text-red-400 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
               <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-black text-[10px] uppercase tracking-widest opacity-60">Protocol Error</p>
              <p className="text-base font-bold">{error}</p>
            </div>
          </div>
        )}

        {response && (
          <div className="mt-12 animate-in fade-in slide-in-from-top-12 duration-1000">
            <div className="flex items-center gap-4 mb-8 pl-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white">Execution Result Decrypted</h3>
            </div>
            <div className="bg-surface-container-high border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-primary opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                 <CheckCircle size={120} />
              </div>
              <p className="whitespace-pre-wrap text-white/90 leading-relaxed font-body text-xl italic font-medium relative z-10">
                {response}
              </p>
            </div>
            <div className="mt-10 text-center">
               <button 
                 onClick={() => { setResponse(null); setPrompt(""); }}
                 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] hover:text-primary transition-colors"
                >
                  Clear Session Cache
               </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
