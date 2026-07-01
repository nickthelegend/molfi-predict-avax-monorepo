'use client';

import React from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Download, Chrome, Smartphone, Monitor, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DownloadPage() {
  return (
    <main className="flex flex-col min-h-screen bg-background text-on-surface antialiased overflow-x-hidden">
      <Navbar />

      <section className="pt-48 pb-32 px-6 flex flex-col items-center text-center">
        {/* Top Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-12"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Multi-platform access
        </motion.div>

        {/* Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-[-0.04em] mb-8 leading-[1.0] font-headline"
        >
          Download Molfi
        </motion.h1>

        {/* Subtext */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-on-surface-variant text-lg md:text-xl font-medium max-w-2xl mb-24 leading-relaxed"
        >
          Start your journey into high-performance agentic trading on 0G Ethereum today.
        </motion.p>

        {/* Download Cards */}
        <div className="w-full max-w-4xl space-y-6">
          
          {/* Card 1: Desktop App */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group bg-surface-container rounded-[2rem] p-10 text-left border border-outline-variant/10 hover:border-primary/20 transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1">
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Molfi Desktop App</h3>
                <p className="text-on-surface-variant font-medium leading-relaxed mb-8 max-w-xl">
                  The primary Molfi experience. High-performance trading dashboard and real-time AI market analysis.
                </p>
                <div className="flex items-center gap-6">
                  <button className="bg-primary text-on-primary px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] primary-glow hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                    <Download size={16} />
                    Download for Windows
                  </button>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                    Version 1.0 • Powered by 0G Ethereum
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/20">
                <Monitor size={48} strokeWidth={1} />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          </motion.div>

          {/* Card 2: Android Beta */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group bg-surface-container rounded-[2rem] p-8 text-left border border-outline-variant/10 hover:border-primary/20 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Smartphone size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-black text-white tracking-tight">Android Beta Available</h3>
                  <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest">New</span>
                </div>
                <p className="text-on-surface-variant text-sm font-medium">Want to try it early? Download the APK directly.</p>
              </div>
            </div>
            <button className="bg-surface-container-high text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-outline-variant/10 hover:bg-surface-container-highest transition-all flex items-center gap-3">
              <Download size={16} />
              Download Beta
            </button>
          </motion.div>

          {/* Card 3: Terminal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="group bg-surface-container rounded-[2rem] p-10 text-left border border-outline-variant/10 hover:border-primary/20 transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">Molfi Extension</h3>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest">Coming Soon</span>
                </div>
                <p className="text-on-surface-variant font-medium leading-relaxed mb-8 max-w-xl">
                  The pro desktop experience. Built for power users who need dedicated performance and customized workspaces.
                </p>
                
                <div className="max-w-md flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={16} />
                    <input 
                      type="email" 
                      placeholder="Enter email" 
                      className="w-full bg-black/20 border border-outline-variant/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold text-white placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/40 transition-all"
                    />
                  </div>
                  <button className="bg-primary text-on-primary px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] primary-glow hover:opacity-90 active:scale-95 transition-all">
                    Submit
                  </button>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/20">
                <Monitor size={48} strokeWidth={1} />
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
