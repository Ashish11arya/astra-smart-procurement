'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { FarmerVerificationListItemDto } from '@astra/shared';

function VerificationApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get('status') || '';
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FarmerVerificationListItemDto[]>([]);
  const [total, setTotal] = useState<number>(0);

  const fetchApplications = useCallback(async () => {
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

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (selectedStatus) params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedDistrict) params.set('district', selectedDistrict);

      const res = await apiRequest<{
        items: FarmerVerificationListItemDto[];
        total: number;
        page: number;
        limit: number;
      }>(`/verification/applications?${params.toString()}`, {
        token,
      });

      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load farmer applications list');
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedStatus, searchQuery, selectedDistrict, router]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const districtList = [
    'Karnal',
    'Kurukshetra',
    'Ambala',
    'Kaithal',
    'Panipat',
    'Sonipat',
    'Yamunanagar',
    'Rohtak',
    'Hisar',
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified</span>
          </span>
        );
      case 'RETURNED_FOR_CORRECTION':
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-950 text-orange-400 border border-orange-800">
            <AlertTriangle className="w-3 h-3" />
            <span>Returned</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      case 'VERIFICATION_PENDING':
      case 'SUBMITTED':
      case 'UNDER_VERIFICATION':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>Pending Review</span>
          </span>
        );
    }
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
            <FileCheck className="w-7 h-7 text-purple-400" />
            <span>Farmer Applications Queue</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Operational review, scrutiny, approval, return, or rejection of farmer procurement registrations.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151C2F] border border-[#334155] hover:bg-[#1B2438] text-xs font-semibold text-slate-300 transition self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="rounded-xl p-4 border border-[#334155] bg-[#151C2F] space-y-3 shadow-md">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => {
              setSelectedStatus('');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
              selectedStatus === ''
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#0B1020] text-slate-400 hover:text-white border border-[#334155]'
            }`}
          >
            All Applications
          </button>

          <button
            onClick={() => {
              setSelectedStatus('VERIFICATION_PENDING');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'VERIFICATION_PENDING'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#0B1020] text-amber-400/80 hover:text-amber-300 border border-[#334155]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Scrutiny</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('RETURNED_FOR_CORRECTION');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'RETURNED_FOR_CORRECTION'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-[#0B1020] text-orange-400/80 hover:text-orange-300 border border-[#334155]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Returned</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('VERIFIED');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'VERIFIED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#0B1020] text-emerald-400/80 hover:text-emerald-300 border border-[#334155]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('REJECTED');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-[#0B1020] text-rose-400/80 hover:text-rose-300 border border-[#334155]'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </button>
        </div>

        {/* Search and District Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#334155]">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by farmer name, application ID (ASTRA-FR-...), code, or mobile..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0B1020] border border-[#334155] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl bg-[#0B1020] border border-[#334155] text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Districts</option>
              {districtList.map((d) => (
                <option key={d} value={d}>
                  District: {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 3. Applications Table with Bounded Internal Scroll */}
      <div className="rounded-xl border border-[#334155] bg-[#151C2F] overflow-hidden shadow-xl">
        <div className="max-h-[580px] overflow-y-auto operations-queue-scroll overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0F172A] text-slate-400 font-semibold border-b border-[#334155] uppercase tracking-wider text-[10px] shadow-sm font-mono">
              <tr>
                <th className="py-3.5 px-4">Application ID</th>
                <th className="py-3.5 px-4">Farmer Details</th>
                <th className="py-3.5 px-4">District &amp; Village</th>
                <th className="py-3.5 px-4">Land Area</th>
                <th className="py-3.5 px-4">Submission Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <span>Loading applications queue...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-1">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No farmer applications found</p>
                    <p className="text-[11px] text-slate-500">
                      Try clearing or changing your search filters
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((app) => (
                  <tr
                    key={app.registrationNumber || app.farmerId}
                    className="hover:bg-[#1B2438] transition-colors"
                  >
                    {/* Application ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300 whitespace-nowrap">
                      {app.registrationNumber}
                    </td>

                    {/* Farmer Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{app.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {app.farmerCode} • +91 {app.mobile}
                      </div>
                    </td>

                    {/* District & Village */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{app.district || '—'}</div>
                      <div className="text-[11px] text-slate-400">{app.village || '—'}</div>
                    </td>

                    {/* Land Area */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-white">
                        {app.landAreaAcres ? `${app.landAreaAcres.toFixed(1)} Acres` : '—'}
                      </span>
                    </td>

                    {/* Submission Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(app.submittedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(app.status)}
                    </td>

                    {/* Action Link */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/verification/applications/${app.farmerId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] transition active:scale-95 shadow-sm"
                      >
                        <span>Scrutinize &amp; Decide</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Bar */}
        <div className="p-4 bg-[#0F172A] border-t border-[#334155] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {items.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(total, page * limit)} of {total} applications
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#334155] bg-[#151C2F] hover:bg-[#1B2438] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono font-bold text-white">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#334155] bg-[#151C2F] hover:bg-[#1B2438] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerificationApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
          <span>Loading applications queue...</span>
        </div>
      }
    >
      <VerificationApplicationsContent />
    </Suspense>
  );
}
