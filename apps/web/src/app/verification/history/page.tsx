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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#D1FAE5] text-[#047857] border-transparent">
          <CheckCircle2 className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (eventType.includes('RETURN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF3C7] text-[#B45309] border-transparent">
          <AlertTriangle className="w-3 h-3" />
          <span>Returned</span>
        </span>
      );
    }
    if (eventType.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border-transparent">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF3C7] text-[#B45309] border-transparent">
        <Clock className="w-3 h-3" />
        <span>{eventType}</span>
      </span>
    );
  };

  return (
    <>
      {/* 1. Header Navigation */}
      <div className="min-w-0 w-full bg-white rounded-2xl border border-[#DDE8E5] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-col gap-3">
          <Link
            href="/verification/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526579] hover:text-[#0F172A] transition w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scrutiny Workspace</span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Verification Audit History
              </h1>
              <p className="text-xs sm:text-sm text-[#526579] mt-0.5">
                Immutable log of all scrutiny decisions executed by Farmer Verification Authority officers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto mt-2 md:mt-0">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DDE8E5] hover:bg-slate-50 text-xs font-semibold text-[#526579] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Log</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. Audit Table with Bounded Internal Scroll */}
      <div className="rounded-xl border border-[#DDE8E5] bg-white overflow-hidden shadow-md">
        <div className="operations-queue-scroll overflow-x-auto">
          <table className="w-full text-left text-sm text-[#0F172A] border-collapse">
            <thead className="sticky top-0 z-10 bg-[#E8F7F3] text-[#475569] font-semibold border-b border-[#DDE8E5] text-[14px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Application / Reg ID</th>
                <th className="py-3.5 px-4">Farmer Details</th>
                <th className="py-3.5 px-4">Decision</th>
                <th className="py-3.5 px-4">Official Remarks</th>
                <th className="py-3.5 px-4 text-right">Verifying Officer ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#526579]">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#526579] space-y-1">
                    <FileText className="w-8 h-8 text-[#526579] mx-auto" />
                    <p className="font-semibold text-[#0F172A]">No verification decision audit logs found</p>
                    <p className="text-[14px] text-[#526579]">
                      Decisions recorded by verification officers will appear here with non-repudiation stamps.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[13px] text-[#526579]">
                      {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Reg ID */}
                    <td className="py-3.5 px-4 font-medium text-[#0F172A] whitespace-nowrap">
                      {entry.registrationNumber || entry.farmerId?.slice(0, 8) || '—'}
                    </td>

                    {/* Farmer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F172A] text-[15px]">{entry.farmerName || 'Farmer'}</div>
                      {entry.farmerMobile && (
                        <div className="text-[12px] text-[#526579] ">+91 {entry.farmerMobile}</div>
                      )}
                    </td>

                    {/* Decision */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getEventBadge(entry.eventType)}
                    </td>

                    {/* Remarks */}
                    <td className="py-3.5 px-4 max-w-xs text-[14px] text-[#0F172A] truncate">
                      {entry.remarks ? `"${entry.remarks}"` : '—'}
                    </td>

                    {/* Officer ID */}
                    <td className="py-3.5 px-4 text-right  text-[14px] text-[#0F172A] whitespace-nowrap">
                      {entry.actorId ? `OFFICER #${entry.actorId.slice(-6).toUpperCase()}` : 'SYSTEM'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
