'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
    return (
        <footer className="py-32 px-6 border-t border-white/5 bg-background">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-24">
                <div className="flex flex-col items-start gap-8">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                            <Image 
                                src="/logo.png" 
                                alt="Molfi Logo" 
                                fill 
                                className="object-contain"
                            />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter uppercase font-headline">Molfi</span>
                    </div>
                    <p className="text-on-surface-variant text-base font-medium max-w-sm leading-relaxed">
                        The ultimate agentic wallet for high-performance trading on 0G Ethereum. Research, trade, and deploy with AI.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-24 text-sm w-full md:w-auto">
                    <div className="space-y-8">
                        <h4 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Product</h4>
                        <ul className="space-y-4 font-bold text-on-surface-variant">
                            <li><Link href="#" className="hover:text-primary transition-colors">Extension</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Mobile App</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Agentic Wallet</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-8">
                        <h4 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Resources</h4>
                        <ul className="space-y-4 font-bold text-on-surface-variant">
                            <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div className="space-y-8">
                        <h4 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Community</h4>
                        <ul className="space-y-4 font-bold text-on-surface-variant">
                            <li><a href="#" className="hover:text-primary transition-colors">X / Twitter</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Discord</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Telegram</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/20">
                <span>© 2026 Molfi</span>
                <span>Powered by 0G Ethereum</span>
            </div>
        </footer>
    );
}