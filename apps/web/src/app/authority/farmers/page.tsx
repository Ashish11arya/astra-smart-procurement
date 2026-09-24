'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Users, LayoutDashboard, ArrowLeft, ArrowRight, Lock } from 'lucide-react';

export default function AuthorityFarmersDelegatedNoticePage() {
  return (
    <main className="min-h-[85vh] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto flex items-center justify-center">
      <div className="w-full glass-card rounded-3xl border border-slate-800 p-8 sm:p-10 space-y-6 text-center shadow-2xl bg-slate-950/80 backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-950">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>ORGANIZATIONAL SEPARATION ENFORCED</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Farmer Verification Department Separation
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            In accordance with official procurement governance regulations, direct farmer verification scrutiny, document review, and approval/rejection decisions are exclusively performed by the dedicated{' '}
            <strong className="text-purple-300">Farmer Verification Authority</strong>.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-300 space-y-2 max-w-lg mx-auto">
          <div className="font-bold text-slate-200">State Authority Governance Role:</div>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
            <li>Monitor statewide verification telemetry on the Authority Dashboard.</li>
            <li>Appoint and authorize designated Farmer Verification Authority officers.</li>
            <li>Maintain officer assignment lifecycle and credential governance.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/authority/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Return to Authority Dashboard</span>
          </Link>

          <Link
            href="/authority/personnel"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950 transition"
          >
            <Users className="w-4 h-4" />
            <span>Appoint Verification Officers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
