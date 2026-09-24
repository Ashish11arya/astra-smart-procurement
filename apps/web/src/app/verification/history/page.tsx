'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface VerificationHistoryItem {
  id: string;
  eventType: string;
  createdAt: string;
  remarks: string | null;
  actorId: string | null;
  actorMobile?: string;
  farmerId: string | null;
  registrationNumber?: string;
  farmerName?: string;
  farmerMobile?: string;
}

export default function VerificationHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<VerificationHistoryItem[]>([]);

  const fetchHistory = useCallback(async () => {
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

      const res = await apiRequest<VerificationHistoryItem[]>(
        '/verification/history',
        { token },
      );
      setItems(Array.isArray(res) ? res : (res as any)?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load verification decision audit logs');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getEventBadge = (eventType: string) => {
    if (eventType.includes('APPROV') || eventType === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (eventType.includes('RETURN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-950 text-orange-400 border border-orange-800">
          <AlertTriangle className="w-3 h-3" />
          <span>Returned</span>
        </span>
      );
    }
    if (eventType.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-400 border border-purple-800">
        <Clock className="w-3 h-3" />
        <span>{eventType}</span>
      </span>
    );
  };

  return (
    <main className="min-h-[85vh] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]">
        <div>
          <Link
            href="/verification/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-purple-300 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scrutiny Workspace</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-purple-400" />
            <span>Verification Audit History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Immutable log of all scrutiny decisions executed by Farmer Verification Authority officers.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151C2F] border border-[#334155] hover:bg-[#1B2438] text-xs font-semibold text-slate-300 transition self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. Audit Table with Bounded Internal Scroll */}
      <div className="rounded-xl border border-[#334155] bg-[#151C2F] overflow-hidden shadow-xl">
        <div className="max-h-[580px] overflow-y-auto operations-queue-scroll overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0F172A] text-slate-400 font-semibold border-b border-[#334155] uppercase tracking-wider text-[10px] shadow-sm font-mono">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Application / Reg ID</th>
                <th className="py-3.5 px-4">Farmer Details</th>
                <th className="py-3.5 px-4">Decision</th>
                <th className="py-3.5 px-4">Official Remarks</th>
                <th className="py-3.5 px-4 text-right">Verifying Officer ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-1">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No verification decision audit logs found</p>
                    <p className="text-[11px] text-slate-500">
                      Decisions recorded by verification officers will appear here with non-repudiation stamps.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#1B2438] transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Reg ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300 whitespace-nowrap">
                      {entry.registrationNumber || entry.farmerId?.slice(0, 8) || '—'}
                    </td>

                    {/* Farmer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{entry.farmerName || 'Farmer'}</div>
                      {entry.farmerMobile && (
                        <div className="text-[11px] text-slate-400 font-mono">+91 {entry.farmerMobile}</div>
                      )}
                    </td>

                    {/* Decision */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getEventBadge(entry.eventType)}
                    </td>

                    {/* Remarks */}
                    <td className="py-3.5 px-4 max-w-xs text-[11px] text-slate-300 truncate">
                      {entry.remarks ? `"${entry.remarks}"` : '—'}
                    </td>

                    {/* Officer ID */}
                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-purple-300 whitespace-nowrap">
                      {entry.actorId ? `OFFICER #${entry.actorId.slice(-6).toUpperCase()}` : 'SYSTEM'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
