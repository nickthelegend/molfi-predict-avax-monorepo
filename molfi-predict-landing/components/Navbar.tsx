'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, ChevronDown, Monitor, Smartphone, Wallet, BookOpen, Shield, Globe, Twitter, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const NavDropdown = ({ label, isOpen, onToggle, children }: DropdownProps) => {
  return (
    <div className="relative" onMouseEnter={onToggle} onMouseLeave={onToggle}>
      <button className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group ${isOpen ? 'text-white' : 'text-on-surface-variant hover:text-white'}`}>
        {label} <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-4 w-64 bg-surface-container-high border border-outline-variant/10 rounded-2xl shadow-2xl p-4 overflow-hidden z-[60]"
          >
            <div className="flex flex-col gap-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DropdownItem = ({ icon: Icon, title, desc, href = "#" }: { icon: any, title: string, desc: string, href?: string }) => (
  <Link href={href} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group">
    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
      <Icon size={20} />
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-black text-white uppercase tracking-wider">{title}</span>
      <span className="text-[10px] text-on-surface-variant font-medium leading-tight">{desc}</span>
    </div>
  </Link>
);

export function Navbar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (label: string | null) => {
    setOpenDropdown(label);
  };

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-center px-4 md:px-8 py-6">
      <div className="w-full max-w-7xl h-16 bg-background/60 backdrop-blur-2xl border border-outline-variant/10 rounded-2xl flex items-center justify-between px-8 shadow-2xl">
        {/* Logo Section */}
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Image 
                src="/logo.png" 
                alt="Molfi Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase font-headline">Molfi</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <NavDropdown 
              label="Products" 
              isOpen={openDropdown === 'products'} 
              onToggle={() => toggleDropdown(openDropdown === 'products' ? null : 'products')}
            >
              <DropdownItem href="/download" icon={Monitor} title="Extension" desc="Smart browser companion" />
              <DropdownItem href="/download" icon={Smartphone} title="Mobile App" desc="Trade on the go" />
              <DropdownItem href="/download" icon={Wallet} title="Agentic Wallet" desc="Autonomous automation" />
            </NavDropdown>

            <NavDropdown 
              label="Resources" 
              isOpen={openDropdown === 'resources'} 
              onToggle={() => toggleDropdown(openDropdown === 'resources' ? null : 'resources')}
            >
              <DropdownItem icon={BookOpen} title="Docs" desc="Integration guides" />
              <DropdownItem icon={Shield} title="Security" desc="Audits and safety" />
              <DropdownItem icon={Globe} title="Ecosystem" desc="Built on 0G Ethereum" />
            </NavDropdown>

            <div className="relative" onMouseEnter={() => toggleDropdown('token')} onMouseLeave={() => toggleDropdown(null)}>
              <div className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${openDropdown === 'token' ? 'bg-surface-container border-primary/20' : 'bg-surface-container border-outline-variant/10'}`}>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">$MOLFI</span>
                <ChevronDown size={12} className={`text-on-surface-variant transition-transform duration-300 ${openDropdown === 'token' ? 'rotate-180' : ''}`} />
              </div>
              <AnimatePresence>
                {openDropdown === 'token' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full right-0 mt-4 w-48 bg-surface-container-high border border-outline-variant/10 rounded-2xl shadow-2xl p-3 overflow-hidden z-[60]"
                  >
                    <div className="flex flex-col gap-1">
                      <Link href="#" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white">
                        <Twitter size={14} className="text-primary" /> Twitter
                      </Link>
                      <Link href="#" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white">
                        <MessageCircle size={14} className="text-primary" /> Telegram
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-4">
          <Link href="/download" className="hidden sm:flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] primary-glow hover:opacity-90 active:scale-95 transition-all">
            <Download size={16} />
            Download
          </Link>
        </div>
      </div>
    </nav>
  );
}
