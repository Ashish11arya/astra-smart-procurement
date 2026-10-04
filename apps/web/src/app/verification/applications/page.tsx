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
  Layers,
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#D1FAE5] text-[#047857] border-transparent">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified</span>
          </span>
        );
      case 'RETURNED_FOR_CORRECTION':
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF3C7] text-[#B45309] border-transparent">
            <AlertTriangle className="w-3 h-3" />
            <span>Returned</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border-transparent">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      case 'VERIFICATION_PENDING':
      case 'SUBMITTED':
      case 'UNDER_VERIFICATION':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF3C7] text-[#B45309] border-transparent">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>Pending Review</span>
          </span>
        );
    }
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
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Farmer Applications Queue
              </h1>
              <p className="text-xs sm:text-sm text-[#526579] mt-0.5">
                Operational review, scrutiny, approval, return, or rejection of farmer procurement registrations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto mt-2 md:mt-0">
          <button
            onClick={fetchApplications}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DDE8E5] hover:bg-slate-50 text-xs font-semibold text-[#526579] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="rounded-xl p-4 border border-[#DDE8E5] bg-white space-y-3 shadow-md">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => {
              setSelectedStatus('');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === ''
                ? 'bg-[#004F49] text-white shadow-md'
                : 'bg-white text-[#526579] hover:text-[#0F172A] border border-[#DDE8E5]'
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-md border" style={{ backgroundColor: '#ECFDF5', borderColor: '#99F6E4', color: '#0F766E' }}>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span>All Applications</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('VERIFICATION_PENDING');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'VERIFICATION_PENDING'
                ? 'bg-[#004F49] text-white shadow-md'
                : 'bg-white text-[#526579] hover:text-[#0F172A] border border-[#DDE8E5]'
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-md border" style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D', color: '#D97706' }}>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span>Pending Scrutiny</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('RETURNED_FOR_CORRECTION');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'RETURNED_FOR_CORRECTION'
                ? 'bg-[#004F49] text-white shadow-md'
                : 'bg-white text-[#526579] hover:text-[#0F172A] border border-[#DDE8E5]'
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-md border" style={{ backgroundColor: '#FFF7ED', borderColor: '#FDBA74', color: '#EA580C' }}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <span>Returned</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('VERIFIED');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'VERIFIED'
                ? 'bg-[#004F49] text-white shadow-md'
                : 'bg-white text-[#526579] hover:text-[#0F172A] border border-[#DDE8E5]'
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-md border" style={{ backgroundColor: '#ECFDF5', borderColor: '#6EE7B7', color: '#059669' }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>Verified</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('REJECTED');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'REJECTED'
                ? 'bg-[#004F49] text-white shadow-md'
                : 'bg-white text-[#526579] hover:text-[#0F172A] border border-[#DDE8E5]'
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-md border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', color: '#DC2626' }}>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <span>Rejected</span>
          </button>
        </div>

        {/* Search and District Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2E8F0]">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-[#0F766E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by farmer name, application ID (ASTRA-FR-...), code, or mobile..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-[#DDE8E5] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl bg-white border border-[#DDE8E5] text-xs text-[#475569] focus:outline-none focus:border-[#0F766E]"
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 3. Applications Table with Bounded Internal Scroll */}
      <div className="rounded-xl border border-[#DDE8E5] bg-white overflow-hidden shadow-xl">
        <div className="operations-queue-scroll overflow-x-auto">
          <table className="w-full text-left text-sm text-[#0F172A] border-collapse">
            <thead className="sticky top-0 z-10 bg-[#E8F7F3] text-[#475569] font-semibold border-b border-[#DDE8E5] text-[14px]">
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
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#526579]">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <span>Loading applications queue...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#526579] space-y-1">
                    <FileText className="w-8 h-8 text-[#526579] mx-auto" />
                    <p className="font-semibold text-[#0F172A]">No farmer applications found</p>
                    <p className="text-[14px] text-[#526579]">
                      Try clearing or changing your search filters
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((app) => (
                  <tr
                    key={app.registrationNumber || app.farmerId}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Application ID */}
                    <td className="py-3.5 px-4 font-medium text-[#0F172A] whitespace-nowrap">
                      {app.registrationNumber}
                    </td>

                    {/* Farmer Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F172A] text-[15px]">{app.fullName}</div>
                      <div className="text-[12px] text-[#526579]">
                        {app.farmerCode} • +91 {app.mobile}
                      </div>
                    </td>

                    {/* District & Village */}
                    <td className="py-3.5 px-4">
                      <div className="text-[#0F172A]">{app.district || '—'}</div>
                      <div className="text-[14px] text-[#526579]">{app.village || '—'}</div>
                    </td>

                    {/* Land Area */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#0F172A]">
                        {app.landAreaAcres ? `${app.landAreaAcres.toFixed(1)} Acres` : '—'}
                      </span>
                    </td>

                    {/* Submission Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[#526579] text-[14px]">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] border border-[#7C3AED] text-white font-semibold text-[14px] leading-[20px] transition active:scale-95 shadow-sm"
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
        <div className="p-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-[14px] text-[#526579]">
          <span>
            Showing {items.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(total, page * limit)} of {total} applications
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#DDE8E5] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-semibold text-[#0F172A]">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#DDE8E5] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VerificationApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-[#526579]">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
          <span>Loading applications queue...</span>
        </div>
      }
    >
      <VerificationApplicationsContent />
    </Suspense>
  );
}
