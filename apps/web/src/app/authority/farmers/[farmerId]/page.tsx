'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LayoutDashboard, ArrowLeft, Lock } from 'lucide-react';

export default function AuthorityFarmerDetailDelegatedNoticePage() {
  return (
    <main className="min-h-[85vh] p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto flex items-center justify-center">
      <div className="w-full glass-card rounded-3xl border border-slate-800 p-8 space-y-5 text-center shadow-2xl bg-slate-950/80 backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-950">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>OPERATIONAL ACTION RESTRICTED</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Direct Verification Scrutiny Restricted
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            State Authority cannot execute operational farmer verification decisions. Operational scrutiny and decision execution have been delegated to appointed officers in the dedicated{' '}
            <strong className="text-purple-300">Farmer Verification Authority</strong> workspace.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/authority/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Return to Authority Dashboard</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
