'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Search,
  Lock,
  Calendar,
  Layers,
  FileText,
  Activity,
  Award,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { AuthorityDashboardStatsDto } from '@astra/shared';

export default function AuthorityDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AuthorityDashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        sessionStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_token');
      if (!token) {
        router.push('/authority/login');
        return;
      }

      const res = await apiRequest<AuthorityDashboardStatsDto>('/api/admin/stats', {
        token,
      });
      setStats(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load authority operational metrics');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <main className="min-h-[85vh] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#F8FAFC]">
      {/* 1. Official Header Strip */}
      <div className="rounded-xl border border-[#334155] bg-[#151C2F] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 tracking-wide font-mono uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>State & District Procurement Authority Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight mt-2">
            Procurement Authority
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Central telemetry, farmer verification lifecycle, depot readiness, and departmental officer roster control.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-xs font-semibold text-[#CBD5E1] hover:text-[#F8FAFC] transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            href="/authority/personnel"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Appoint Personnel</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="underline hover:text-rose-200">
            Retry
          </button>
        </div>
      )}

      {/* 2. Operational Metrics Cards (Supervisory Telemetry) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Verifications */}
        <div className="rounded-xl p-4 border border-[#334155] bg-[#151C2F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Pending Verifications
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#F8FAFC] font-mono">
              {loading ? '—' : stats?.pendingVerifications ?? 0}
            </span>
            <span className="text-xs text-amber-400 font-semibold">Under Scrutiny</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-2">
            Assigned to Verification Authority
          </p>
        </div>

        {/* Verified Farmers */}
        <div className="rounded-xl p-4 border border-[#334155] bg-[#151C2F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Verified Farmers
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#F8FAFC] font-mono">
              {loading ? '—' : stats?.verifiedFarmers ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Procurement Eligible</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-2">
            Approved by designated scrutiny officers
          </p>
        </div>

        {/* Returned for Correction */}
        <div className="rounded-xl p-4 border border-[#334155] bg-[#151C2F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              Returned Applications
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-950/80 border border-orange-800/80 flex items-center justify-center text-orange-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#F8FAFC] font-mono">
              {loading ? '—' : stats?.returnedApplications ?? 0}
            </span>
            <span className="text-xs text-orange-400 font-semibold">Action Required</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-2">
            Awaiting farmer document resubmission
          </p>
        </div>

        {/* Depots & Personnel */}
        <div className="rounded-xl p-4 border border-[#334155] bg-[#151C2F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              Centres & Personnel
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 pt-1 border-t border-[#242E42]">
            <div>
              <span className="text-[10px] text-[#94A3B8] block uppercase">Active Depots</span>
              <span className="text-2xl font-black text-[#F8FAFC] font-mono">
                {loading ? '—' : stats?.activeCentres ?? 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#94A3B8] block uppercase">Staff Roster</span>
              <span className="text-2xl font-black text-indigo-300 font-mono">
                {loading ? '—' : stats?.totalPersonnel ?? 0}
              </span>
            </div>
          </div>
          <Link
            href="/authority/personnel"
            className="text-[11px] text-indigo-300 mt-2 flex items-center gap-1 hover:text-indigo-200"
          >
            <span>Manage personnel assignments</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 3. Operational Portals (Governance & Supervision Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Portal A: Farmer Verification Department Telemetry */}
        <div className="rounded-xl p-5 border border-[#334155] bg-[#151C2F] shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-500/50 transition-all">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 mb-1.5 font-mono">
                <span>INDEPENDENT AUTHORITY</span>
              </div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Farmer Verification Department</h2>
              <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                Farmer registration scrutiny, land boundary cross-referencing, and approval/return/rejection decisions are executed by the appointed Farmer Verification Authority.
              </p>
            </div>
            <div className="space-y-1 text-[11px] text-[#94A3B8] pt-2 border-t border-[#242E42]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Appointed & Authorized by State Authority</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Dedicated Scrutiny Workspace & Decision Controls</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="text-[#64748B]">Decisions restricted to appointed verification officers</span>
              </div>
            </div>
          </div>

          <Link
            href="/authority/personnel"
            className="w-full h-9 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Appoint Verification Officers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Portal B: Centre Personnel Roster */}
        <div className="rounded-xl p-5 border border-[#334155] bg-[#151C2F] shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition-all">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Departmental Officers & Roles</h2>
              <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                Assign and govern centre personnel access across departments (Food & Civil Supplies, Mandi Board, Warehousing). Toggle active status and enforce least-privilege RBAC.
              </p>
            </div>
            <div className="space-y-1 text-[11px] text-[#94A3B8] pt-2 border-t border-[#242E42]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Centre-level isolation & boundary checks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Role-based stage operations (Check-in, Quality, Payment)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Instant officer credential deactivation</span>
              </div>
            </div>
          </div>

          <Link
            href="/authority/personnel"
            className="w-full h-9 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] border border-[#334155] font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Manage Personnel Roster</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Portal C: Procurement Depots Directory */}
        <div className="rounded-xl p-5 border border-[#334155] bg-[#151C2F] shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Procurement Centres Directory</h2>
              <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                Review operational status of registered grain procurement centres, weighbridge IoT calibrations, daily quota allocations, and physical inspection reports.
              </p>
            </div>
            <div className="space-y-1 text-[11px] text-[#94A3B8] pt-2 border-t border-[#242E42]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live centre operational readiness</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>IoT weighbridge status</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Arrival window utilization rates</span>
              </div>
            </div>
          </div>

          <Link
            href="/authority/centres"
            className="w-full h-9 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] border border-[#334155] font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Monitor Centres Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Governance & Concurrency Advisory */}
      <div className="p-3.5 rounded-xl bg-[#151C2F] border border-[#334155] flex items-start gap-2.5 text-xs text-[#94A3B8]">
        <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-[#CBD5E1]">Production Governance & Concurrency Guarantee:</span>
          <p className="leading-relaxed text-[11px]">
            All administrative decisions (Approve, Reject, Return) are executed within atomic database transactions with concurrency checks. An application cannot be reviewed simultaneously by multiple officers. All approvals generate immutable audit logs with officer IDs and timestamps.
          </p>
        </div>
      </div>
    </main>
  );
}
