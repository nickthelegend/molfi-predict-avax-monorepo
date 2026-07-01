'use client';

import React from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Download, ArrowUpRight, Zap, Shield, Cpu, BarChart3, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-background text-on-surface antialiased overflow-x-hidden selection:bg-primary selection:text-on-primary">
      <Navbar />

      {/* Hero Section */}
      <header className="relative pt-48 pb-24 px-6 overflow-hidden flex flex-col items-center text-center">
        {/* Top Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-12"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Powered by 0G Ethereum
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-[5.5rem] font-black tracking-[-0.04em] mb-8 leading-[1.0] font-headline max-w-4xl"
        >
          The Most <span className="text-primary italic">Profitable</span> Way <br /> to Trade for Degens
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-on-surface-variant text-lg md:text-xl font-medium max-w-2xl mb-12 leading-relaxed"
        >
          Research, trade, and deploy with Molfi — the ultimate agentic wallet designed for high-performance trading on 0G Ethereum.
        </motion.p>

        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link 
            href="/download"
            className="bg-primary text-on-primary px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 primary-glow hover:opacity-90 active:scale-95 transition-all mb-24"
          >
            <Download size={18} />
            Download Molfi App
          </Link>
        </motion.div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[10s]" />
      </header>

      {/* Grid Section */}
      <section className="px-6 pb-48 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Feature 1: Molfi Extension (Large Top Card) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 group relative h-[500px] md:h-[600px] bg-surface-container rounded-[2.5rem] overflow-hidden border border-outline-variant/10 hover:border-primary/20 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <div className="relative z-10 p-12 h-full flex flex-col justify-end">
              <div className="max-w-md">
                <h3 className="text-3xl font-black text-white mb-4 tracking-tight flex items-center gap-3">
                  Molfi Extension <ArrowUpRight className="text-on-surface-variant group-hover:text-primary transition-colors" />
                </h3>
                <p className="text-on-surface-variant font-medium leading-relaxed">
                  Your smart crypto companion in the browser. Research, track, and trade — all in one seamless extension powered by AI agents.
                </p>
              </div>
            </div>
            {/* Image Placeholder */}
            <div className="absolute top-12 left-12 right-12 bottom-48 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center overflow-hidden">
               <span className="text-white/10 font-black uppercase tracking-widest text-sm">Molfi Extension UI Placeholder</span>
               {/* Decorative elements to look like a UI */}
               <div className="absolute top-4 left-4 right-4 h-8 bg-white/5 rounded-lg flex items-center px-4 gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500/50" />
                 <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                 <div className="w-2 h-2 rounded-full bg-green-500/50" />
               </div>
            </div>
          </motion.div>

          {/* Feature 2: Molfi Mobile App */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative h-[600px] bg-surface-container rounded-[2.5rem] overflow-hidden border border-outline-variant/10 hover:border-primary/20 transition-colors"
          >
            <div className="relative z-10 p-12 h-full flex flex-col justify-end">
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight flex items-center gap-3">
                Molfi Mobile App <ArrowUpRight className="text-on-surface-variant group-hover:text-primary transition-colors" />
              </h3>
              <p className="text-on-surface-variant font-medium leading-relaxed">
                Trade and track on the go. Your entire portfolio, available anywhere, anytime with enterprise-grade security.
              </p>
            </div>
            {/* Image Placeholder */}
            <div className="absolute top-12 left-12 right-12 bottom-48 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center">
               <span className="text-white/10 font-black uppercase tracking-widest text-sm text-center px-8">Mobile App Mockup Placeholder</span>
            </div>
          </motion.div>

          {/* Feature 3: Agentic Wallet */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative h-[600px] bg-surface-container rounded-[2.5rem] overflow-hidden border border-outline-variant/10 hover:border-primary/20 transition-colors"
          >
            <div className="relative z-10 p-12 h-full flex flex-col justify-end">
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight flex items-center gap-3">
                Agentic Wallet <ArrowUpRight className="text-on-surface-variant group-hover:text-primary transition-colors" />
              </h3>
              <p className="text-on-surface-variant font-medium leading-relaxed">
                Secure, AI-powered wallet with smart automation and safety checks built-in. Let your wallet work for you.
              </p>
            </div>
            {/* Image Placeholder */}
            <div className="absolute top-12 left-12 right-12 bottom-48 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center">
               <span className="text-white/10 font-black uppercase tracking-widest text-sm text-center px-8">Agentic Wallet Visual Placeholder</span>
            </div>
          </motion.div>

          {/* Feature 4: Research AI */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative h-[500px] bg-surface-container rounded-[2.5rem] overflow-hidden border border-outline-variant/10 hover:border-primary/20 transition-colors"
          >
            <div className="relative z-10 p-12 h-full flex flex-col justify-end">
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight flex items-center gap-3">
                Research AI <ArrowUpRight className="text-on-surface-variant group-hover:text-primary transition-colors" />
              </h3>
              <p className="text-on-surface-variant font-medium leading-relaxed">
                Deep market insights instantly. Make informed decisions with AI-powered analysis of on-chain data.
              </p>
            </div>
            {/* Image Placeholder */}
            <div className="absolute top-12 left-12 right-12 bottom-48 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center">
               <BarChart3 className="text-white/5" size={100} />
            </div>
          </motion.div>

          {/* Feature 5: Built for Speed */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative h-[500px] bg-surface-container rounded-[2.5rem] overflow-hidden border border-outline-variant/10 hover:border-primary/20 transition-colors"
          >
            <div className="relative z-10 p-12 h-full flex flex-col justify-end">
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight flex items-center gap-3">
                Built for Speed <ArrowUpRight className="text-on-surface-variant group-hover:text-primary transition-colors" />
              </h3>
              <p className="text-on-surface-variant font-medium leading-relaxed">
                Lightning fast execution and data retrieval on 0G Ethereum. Zero lag, maximum efficiency.
              </p>
            </div>
            {/* Image Placeholder */}
            <div className="absolute top-12 left-12 right-12 bottom-48 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center">
               <Zap className="text-white/5" size={100} />
            </div>
          </motion.div>

        </div>
      </section>

      {/* Values Section */}
      <section className="py-48 bg-surface-container-low border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-24">
           <div className="space-y-6">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Shield size={32} />
             </div>
             <h4 className="text-2xl font-black text-white">Trustless Security</h4>
             <p className="text-on-surface-variant font-medium leading-relaxed">
               Your keys, your crypto. Molfi is non-custodial and open-source, ensuring complete transparency and security.
             </p>
           </div>
           <div className="space-y-6">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Cpu size={32} />
             </div>
             <h4 className="text-2xl font-black text-white">AI-First Engine</h4>
             <p className="text-on-surface-variant font-medium leading-relaxed">
               Powered by advanced Large Language Models tailored for the crypto ecosystem, providing real-time alpha.
             </p>
           </div>
           <div className="space-y-6">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Globe size={32} />
             </div>
             <h4 className="text-2xl font-black text-white">0G Native</h4>
             <p className="text-on-surface-variant font-medium leading-relaxed">
               Optimized specifically for the 0G data availability layer, offering unprecedented speed and scalability.
             </p>
           </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}