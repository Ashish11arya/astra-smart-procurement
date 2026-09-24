'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Search,
  Lock,
  Layers,
  FileText,
  History,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface VerificationStats {
  pendingVerifications: number;
  underVerification: number;
  verifiedFarmers: number;
  returnedApplications: number;
  rejectedApplications: number;
  totalApplications: number;
}

export default function VerificationDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        sessionStorage.getItem('astra_verification_token') ||
        localStorage.getItem('astra_verification_token') ||
        localStorage.getItem('astra_token');
      if (!token) {
        router.push('/verification/login');
        return;
      }

      const res = await apiRequest<VerificationStats>('/verification/stats', {
        token,
      });
      setStats(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load verification workload telemetry');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <main className="min-h-[85vh] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Official Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wide">
            <FileCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>FARMER VERIFICATION AUTHORITY • OPERATIONAL WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            Farmer Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Operational review, 8-point documentary scrutiny, land boundary cross-referencing, and final verification decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151C2F] border border-[#334155] hover:bg-[#1B2438] text-xs font-semibold text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          <Link
            href="/verification/applications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Open Applications Queue</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="underline hover:text-rose-200">
            Retry
          </button>
        </div>
      )}

      {/* 2. Operational Workload Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Scrutiny */}
        <Link
          href="/verification/applications?status=VERIFICATION_PENDING"
          className="rounded-xl p-5 border border-amber-500/30 hover:border-amber-400/60 transition-all bg-[#151C2F] hover:bg-[#1B2438] group block shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              Pending Scrutiny
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {loading ? '—' : stats?.pendingVerifications ?? 0}
            </span>
            <span className="text-xs text-amber-400 font-semibold">Queued</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-amber-300 transition">
            <span>Process pending submissions</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Verified Farmers */}
        <Link
          href="/verification/applications?status=VERIFIED"
          className="rounded-xl p-5 border border-emerald-500/30 hover:border-emerald-400/60 transition-all bg-[#151C2F] hover:bg-[#1B2438] group block shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Verified &amp; Approved
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {loading ? '—' : stats?.verifiedFarmers ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Procurement Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-emerald-300 transition">
            <span>View approved farmers</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Returned for Correction */}
        <Link
          href="/verification/applications?status=RETURNED_FOR_CORRECTION"
          className="rounded-xl p-5 border border-orange-500/30 hover:border-orange-400/60 transition-all bg-[#151C2F] hover:bg-[#1B2438] group block shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-300 uppercase tracking-wider">
              Returned for Correction
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {loading ? '—' : stats?.returnedApplications ?? 0}
            </span>
            <span className="text-xs text-orange-400 font-semibold">Farmer Action</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-orange-300 transition">
            <span>Review returned applications</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Rejected Applications */}
        <Link
          href="/verification/applications?status=REJECTED"
          className="rounded-xl p-5 border border-rose-500/30 hover:border-rose-400/60 transition-all bg-[#151C2F] hover:bg-[#1B2438] group block shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
              Rejected Applications
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {loading ? '—' : stats?.rejectedApplications ?? 0}
            </span>
            <span className="text-xs text-rose-400 font-semibold">Closed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-rose-300 transition">
            <span>View rejection dossier</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* 3. Action Portals & Scrutiny Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        {/* Card 1: Applications Queue */}
        <div className="rounded-xl p-6 border border-[#334155] bg-[#151C2F] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-md">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Full Applications Queue</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Filter and inspect farmer registrations across state districts. Access individual dossiers for in-depth scrutiny.
              </p>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-[#334155]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Bounded table scroll with sticky column headers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Multi-district &amp; status-based filtering</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Farmer search by name, code, or mobile</span>
              </div>
            </div>
          </div>

          <Link
            href="/verification/applications"
            className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-950/50"
          >
            <span>Open Applications Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 2: Verification Audit History */}
        <div className="rounded-xl p-6 border border-[#334155] bg-[#151C2F] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-md">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Decision Audit Log</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Immutable record of all historical approval, rejection, and return decisions executed by verification officers with timestamps and remarks.
              </p>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-[#334155]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Non-repudiation officer accountability</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mandatory justification verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Exportable compliance audit records</span>
              </div>
            </div>
          </div>

          <Link
            href="/verification/history"
            className="w-full h-10 rounded-xl bg-[#1B2438] hover:bg-[#232F48] text-white border border-[#334155] font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <span>View Audit History</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 3: 8-Point Scrutiny SOP */}
        <div className="rounded-xl p-6 border border-[#334155] bg-[#151C2F] flex flex-col justify-between space-y-4 shadow-md">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Standard Scrutiny Protocol</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Verification officers must validate each dossier against statutory criteria before taking action:
              </p>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400 pt-1">
              <li>Aadhaar identity &amp; name alignment</li>
              <li>District &amp; revenue village mapping</li>
              <li>Khasra / survey numbers vs. land registry</li>
              <li>Cultivated acreage within holding limits</li>
              <li>PFMS active bank account &amp; IFSC</li>
              <li>Mandatory return notes for deficiencies</li>
            </ol>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[10px] text-purple-300 font-semibold flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Decisions generate irreversible procurement eligibility.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
