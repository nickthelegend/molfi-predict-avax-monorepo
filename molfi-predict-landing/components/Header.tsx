'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-teal-500 p-1.5 rounded-lg group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <Zap className="text-black" size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase tracking-widest text-white font-mono">Starter V2</span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[2px] text-zinc-500">
            <Link href="#" className="hover:text-teal-500 transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-teal-500 transition-colors">Examples</Link>
          </nav>
          
          <div className="h-6 w-[1px] bg-zinc-800 hidden md:block" />
        </div>
      </div>
    </header>
  )
}
