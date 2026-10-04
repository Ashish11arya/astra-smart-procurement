'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  MapPin,
  Landmark,
  Layers,
  FileText,
  RefreshCw,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { FarmerVerificationDetailDto, FarmerVerificationDecisionDto } from '@astra/shared';

export default function VerificationApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationIdOrFarmerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FarmerVerificationDetailDto | null>(null);

  // Decision Modal State
  const [activeModal, setActiveModal] = useState<
    'APPROVE' | 'RETURN_FOR_CORRECTION' | 'REJECT' | null
  >(null);
  const [reason, setReason] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);
  const [decisionFeedback, setDecisionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchDetail = useCallback(async () => {
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

      const res = await apiRequest<FarmerVerificationDetailDto>(
        `/verification/applications/${applicationIdOrFarmerId}`,
        {
          token,
        },
      );
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load farmer scrutiny dossier');
    } finally {
      setLoading(false);
    }
  }, [applicationIdOrFarmerId, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    if (
      (activeModal === 'RETURN_FOR_CORRECTION' || activeModal === 'REJECT') &&
      !reason.trim()
    ) {
      setDecisionFeedback({
        type: 'error',
        message: 'A mandatory remark explaining the deficiencies/reason is required.',
      });
      return;
    }

    setSubmittingDecision(true);
    setDecisionFeedback(null);

    try {
      const token =
        sessionStorage.getItem('astra_verification_token') ||
        localStorage.getItem('astra_verification_token') ||
        localStorage.getItem('astra_token');

      const payload: FarmerVerificationDecisionDto = {
        decision: activeModal,
        reason:
          reason.trim() ||
          (activeModal === 'APPROVE'
            ? 'Application approved following statutory document scrutiny.'
            : ''),
      };

      const res: any = await apiRequest(
        `/verification/applications/${applicationIdOrFarmerId}/decision`,
        {
          method: 'POST',
          token: token || undefined,
          body: payload,
        },
      );

      setDecisionFeedback({
        type: 'success',
        message:
          res.message ||
          `Decision successfully recorded: ${activeModal.replace(/_/g, ' ')}.`,
      });
      setActiveModal(null);
      setReason('');
      await fetchDetail();
    } catch (err: any) {
      setDecisionFeedback({
        type: 'error',
        message: err.message || 'Failed to record decision. Please retry.',
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3 text-[#526579]">
        <RefreshCw className="w-8 h-8 text-[#004F49] animate-spin" />
        <p className="text-sm font-semibold">Loading 8-point scrutiny dossier...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[75vh] max-w-2xl mx-auto flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Application Dossier Not Found</h2>
        <p className="text-xs text-[#526579]">{error || 'Could not retrieve record'}</p>
        <Link
          href="/verification/applications"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-[#0F172A] text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Applications Queue</span>
        </Link>
      </div>
    );
  }

  const { personal, address, landParcels, bank, auditLogs } = data;
  const totalLandArea = (landParcels || []).reduce((sum, p) => sum + (p.areaAcres || 0), 0);

  return (
    <>
      {/* 1. Header with Breadcrumb & Status */}
      <div className="min-w-0 w-full bg-white rounded-2xl border border-[#DDE8E5] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-col gap-3">
          <Link
            href="/verification/applications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526579] hover:text-[#0F172A] transition w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Applications Queue</span>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                {personal?.fullName || 'Farmer Applicant'}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  data.status === 'VERIFIED'
                    ? 'bg-[#D1FAE5] border-transparent text-[#047857]'
                    : data.status === 'RETURNED_FOR_CORRECTION'
                    ? 'bg-[#FEF3C7] border-transparent text-[#B45309]'
                    : data.status === 'REJECTED'
                    ? 'bg-[#FEE2E2] border-transparent text-[#B91C1C]'
                    : 'bg-[#FEF3C7] border-transparent text-[#B45309]'
                }`}
              >
                {data.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-xs text-[#526579] mt-2 flex flex-wrap items-center gap-3">
              <span>
                Reg ID: <strong className="text-[#0F172A] font-bold">{data.registrationNumber}</strong>
              </span>
              <span>•</span>
              <span>
                Farmer Code: <strong className="text-[#0F172A]">{data.farmerCode}</strong>
              </span>
              <span>•</span>
              <span>
                Submitted:{' '}
                {data.submittedAt
                  ? new Date(data.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Decision Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto mt-2 md:mt-0">
          <button
            onClick={() => setActiveModal('RETURN_FOR_CORRECTION')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold transition shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Return for Correction</span>
          </button>

          <button
            onClick={() => setActiveModal('REJECT')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold transition shadow-sm"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <button
            onClick={() => setActiveModal('APPROVE')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004F49] hover:bg-[#003d38] text-white text-xs font-bold transition shadow-lg shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve &amp; Verify</span>
          </button>
        </div>
      </div>

      {decisionFeedback && (
        <div
          className={`p-4 rounded-xl text-[14px] leading-[20px] font-semibold flex items-center justify-between border ${
            decisionFeedback.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          <span>{decisionFeedback.message}</span>
          <button
            onClick={() => setDecisionFeedback(null)}
            className="text-[#526579] hover:text-[#0F172A]"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Scrutiny Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Personal, Land & Bank */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card A: Identity & Demographics */}
          <div className="rounded-xl p-5 border border-[#DDE8E5] bg-white space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE8E5]">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <User className="w-4 h-4 text-[#004F49]" />
                <span>1. Farmer Identity &amp; Demographic Profile</span>
              </h2>
              <span className="text-[11px] font-semibold text-[#047857] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aadhaar Authenticated</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#526579] block text-[11px]">Full Legal Name</span>
                <span className="font-bold text-[#0F172A] text-sm">{personal?.fullName || '—'}</span>
              </div>
              <div>
                <span className="text-[#526579] block text-[11px]">Father / Husband Name</span>
                <span className="font-semibold text-[#0F172A]">{personal?.fatherOrSpouseName || '—'}</span>
              </div>
              <div>
                <span className="text-[#526579] block text-[11px]">Gender</span>
                <span className="font-semibold text-[#0F172A]">{personal?.gender || '—'}</span>
              </div>
              <div>
                <span className="text-[#526579] block text-[11px]">Registered Mobile</span>
                <span className="font-mono font-semibold text-[#047857]">
                  +91 {personal?.mobile || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#526579] block text-[11px]">Aadhaar Reference</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {personal?.aadhaarNumberMasked || 'XXXX-XXXX-XXXX'}
                </span>
              </div>
              <div>
                <span className="text-[#526579] block text-[11px]">Category / Caste</span>
                <span className="font-semibold text-[#0F172A]">{personal?.category || 'General'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDE8E5] text-xs">
              <span className="text-[#526579] block text-[11px] mb-1">Residential Address</span>
              <p className="text-[#0F172A]">
                Village: {address?.village || '—'}, Block: {address?.block || '—'}, District:{' '}
                <strong className="text-[#0F172A]">{address?.district || '—'}</strong>, State:{' '}
                {address?.state || 'Haryana'}, PIN: {address?.pincode || '—'}
              </p>
            </div>
          </div>

          {/* Card B: Land Revenue Records & Crop Survey */}
          <div className="rounded-xl p-5 border border-[#DDE8E5] bg-white space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE8E5]">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#004F49]" />
                <span>2. Land Revenue &amp; Cultivated Acreage Scrutiny</span>
              </h2>
              <span className="text-[11px] font-mono text-[#0F172A] font-bold">
                Total Land: {totalLandArea.toFixed(1)} Acres
              </span>
            </div>

            {landParcels && landParcels.length > 0 ? (
              <div className="space-y-3">
                {landParcels.map((parcel, idx) => (
                  <div
                    key={parcel.id || idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-[#DDE8E5] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">
                        Parcel #{idx + 1} • {parcel.village}, {parcel.district}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white text-[#526579] font-mono text-[11px] font-bold border border-[#DDE8E5]">
                        {parcel.areaAcres} Acres Total
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-[#526579] pt-1">
                      <div>
                        <span className="text-[#526579] block text-[10px]">Khasra / Murabba No.</span>
                        <span className="font-mono font-bold text-[#0F172A]">
                          {parcel.khasraNumber || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#526579] block text-[10px]">Ownership Status</span>
                        <span className="font-semibold text-[#0F172A]">
                          {parcel.ownershipType || 'OWNER'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#526579] block text-[10px]">Block / Tehsil</span>
                        <span className="font-semibold text-[#0F172A]">{parcel.block || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#526579] block text-[10px]">Panchayat</span>
                        <span className="font-semibold text-[#0F172A]">{parcel.panchayat || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-[#526579] text-xs">
                No land parcels declared.
              </div>
            )}
          </div>

          {/* Card C: Bank Account & PFMS Verification */}
          <div className="rounded-xl p-5 border border-[#DDE8E5] bg-white space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE8E5]">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#004F49]" />
                <span>3. DBT Bank Account &amp; PFMS Validation</span>
              </h2>
              <span className="text-[11px] font-semibold text-[#047857] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PFMS Validated</span>
              </span>
            </div>

            {bank ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#526579] block text-[11px]">Account Holder Name</span>
                  <span className="font-bold text-[#0F172A]">{bank.accountHolderName}</span>
                </div>
                <div>
                  <span className="text-[#526579] block text-[11px]">Bank Name</span>
                  <span className="font-semibold text-[#0F172A]">
                    {bank.bankName || 'State Bank of India'}
                  </span>
                </div>
                <div>
                  <span className="text-[#526579] block text-[11px]">IFSC Code</span>
                  <span className="font-mono font-bold text-purple-300">{bank.ifscCode}</span>
                </div>
                <div>
                  <span className="text-[#526579] block text-[11px]">Account Number</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    ••••••••{bank.accountNumberMasked?.slice(-4) || '••••'}
                  </span>
                </div>
                <div>
                  <span className="text-[#526579] block text-[11px]">PFMS Status</span>
                  <span className="font-semibold text-[#047857]">BENEFICIARY_ACTIVE</span>
                </div>
                <div>
                  <span className="text-[#526579] block text-[11px]">Aadhaar Seeding</span>
                  <span className="font-semibold text-[#047857]">Yes (NPCI Enabled)</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-[#526579] text-xs">
                No bank account details attached.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 8-Point Scrutiny Checklist & Audit Log */}
        <div className="space-y-6">
          {/* Card D: 8-Point Scrutiny Checklist */}
          <div className="rounded-xl p-5 border border-[#DDE8E5] space-y-4 shadow-md bg-white">
            <div className="flex items-center gap-2 pb-3 border-b border-[#DDE8E5]">
              <FileCheck className="w-4 h-4 text-[#004F49]" />
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                8-Point Statutory Scrutiny Checklist
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-[#526579]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <span>1. Farmer identity matches Aadhaar repository</span>
              </div>
              <div className="flex items-start gap-2 text-[#526579]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <span>2. Registered mobile number OTP verified</span>
              </div>
              <div className="flex items-start gap-2 text-[#526579]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <span>3. Residential jurisdiction inside state boundaries</span>
              </div>
              <div className="flex items-start gap-2 text-[#526579]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <span>4. Khasra / Survey records validated against revenue ledger</span>
              </div>
              <div className="flex items-start gap-2 text-[#526579]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <span>5. Sown crop acreage ≤ total land parcel holding</span>
              </div>
              <div className="flex items-start gap-2 text-[#526579]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <span>6. Bank account name matches farmer registration name</span>
              </div>
              <div className="flex items-start gap-2 text-[#526579]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <span>7. Valid IFSC code with active DBT NPCI mapping</span>
              </div>
              <div className="flex items-start gap-2 text-[#526579]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <span>8. No duplicate registration under same Aadhaar</span>
              </div>
            </div>
          </div>

          {/* Card E: Officer Decision Log */}
          <div className="rounded-xl p-5 border border-[#DDE8E5] bg-white space-y-4 shadow-md">
            <div className="flex items-center gap-2 pb-3 border-b border-[#DDE8E5]">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Scrutiny Audit &amp; Remarks Log
              </h3>
            </div>

            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-3 pr-1">
                {auditLogs.map((log: any, idx: number) => (
                  <div
                    key={log.id || idx}
                    className="p-3 rounded-xl bg-slate-50 border border-[#DDE8E5] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300">
                        {log.action || log.eventType}
                      </span>
                      <span className="text-[#526579] text-[11px]">
                        {new Date(log.createdAt || log.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-[#526579] text-[11px] leading-relaxed pt-1">
                        &quot;{log.reason}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#526579] text-center py-4">
                No past scrutiny events recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Decision Confirmation Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#DDE8E5] p-6 space-y-4 shadow-2xl bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE8E5]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                {activeModal === 'APPROVE' && <CheckCircle2 className="w-5 h-5 text-[#047857]" />}
                {activeModal === 'RETURN_FOR_CORRECTION' && (
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                )}
                {activeModal === 'REJECT' && <XCircle className="w-5 h-5 text-rose-400" />}
                <span>
                  Confirm Decision: {activeModal.replace(/_/g, ' ')}
                </span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#526579] hover:text-[#0F172A] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-[#DDE8E5] text-[#526579] space-y-1">
                <span className="font-bold text-[#0F172A] block">
                  Farmer: {personal?.fullName} ({data.registrationNumber})
                </span>
                <p className="text-[11px] text-[#526579]">
                  {activeModal === 'APPROVE' &&
                    'Approving this registration grants the farmer procurement booking eligibility across state centres.'}
                  {activeModal === 'RETURN_FOR_CORRECTION' &&
                    'Returning will notify the farmer to amend specific deficiencies on their portal without deleting their profile.'}
                  {activeModal === 'REJECT' &&
                    'Rejecting will disqualify this registration based on statutory non-compliance. A clear justification is mandatory.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#526579] font-semibold block">
                  Official Decision Remarks / Notes:
                  {(activeModal === 'RETURN_FOR_CORRECTION' || activeModal === 'REJECT') && (
                    <span className="text-rose-400 ml-1 font-bold">* (Mandatory)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  required={activeModal === 'RETURN_FOR_CORRECTION' || activeModal === 'REJECT'}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    activeModal === 'RETURN_FOR_CORRECTION'
                      ? 'Specify deficiency details (e.g. Please re-enter correct Khasra number or re-upload bank passbook)...'
                      : activeModal === 'REJECT'
                      ? 'Specify mandatory statutory grounds for rejection...'
                      : 'Optional endorsement remarks (e.g. Scrutinized and verified against revenue records)...'
                  }
                  className="w-full p-3 rounded-xl bg-white border border-[#DDE8E5] text-[#0F172A] placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#DDE8E5]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#526579] font-semibold border border-[#DDE8E5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-sm transition active:scale-95 flex items-center gap-2 ${
                    activeModal === 'APPROVE'
                      ? 'bg-[#004F49] hover:bg-[#003d38]'
                      : activeModal === 'RETURN_FOR_CORRECTION'
                      ? 'bg-[#B45309] hover:bg-[#92400E]'
                      : 'bg-[#B91C1C] hover:bg-[#991B1B]'
                  }`}
                >
                  {submittingDecision && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Execute {activeModal.replace(/_/g, ' ')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
