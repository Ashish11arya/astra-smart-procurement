'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCheck2,
  Clock,
  User,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  IndianRupee,
  Scale,
  Award,
  Calendar,
  Search,
  History,
  Check,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Printer,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StationGuard } from '@/components/operations/StationGuard';
import { ProcurementVoucherModal, ProcurementVoucherData } from '@/components/procurement/ProcurementVoucherModal';

interface ProcurementQueueItem {
  id: string;
  bookingId: string;
  bookingNumber: string;
  farmerName: string;
  farmerCode: string;
  farmerMobile: string;
  commodityName: string;
  expectedQuantityQuintals: number;
  actualWeightQuintals: number;
  finalWeightQuintals: number;
  qualityGrade: string;
  moisturePercent?: number;
  status: string;
  createdAt: string;
  checkInTime?: string;
  weighment?: {
    actualWeightQuintals: number;
    deviceCode?: string;
    weighedAt?: string;
  } | null;
  quality?: {
    id: string;
    grade: string;
    moisturePercent: number;
    foreignMatterPercent: number;
    damagedGrainPercent: number;
    remarks?: string;
    assessedAt: string;
  } | null;
  procurement?: {
    id: string;
    decision: string;
    acceptedQuantityQuintals: number;
    ratePerQuintal: number;
    totalAmount: number;
    remarks?: string;
    decidedBy: string;
    decidedAt: string;
  } | null;
  payment?: {
    paymentStatus: string;
    amount: number;
    transactionRef?: string;
    settledAt?: string;
  } | null;
}

function ProcurementDashboardContent() {
  const router = useRouter();
  const { logoutPortal } = useAuth();
  const [centreInfo, setCentreInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [queue, setQueue] = useState<ProcurementQueueItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ProcurementQueueItem | null>(null);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<ProcurementVoucherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // History filtering
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [decision, setDecision] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [purchasedQuantity, setPurchasedQuantity] = useState('');
  const [ratePerQuintal, setRatePerQuintal] = useState('2325'); // Official MSP 2026
  const [deductionsAmount, setDeductionsAmount] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedBookingRef = useRef(selectedBooking);
  useEffect(() => {
    selectedBookingRef.current = selectedBooking;
  }, [selectedBooking]);

  const loadQueue = useCallback(async (dateOverride?: string) => {
    setLoading(true);
    try {
      const dateToFetch = dateOverride !== undefined ? dateOverride : selectedDate;
      const url = dateToFetch ? `/procurement/queue?date=${dateToFetch}` : '/procurement/queue';
      const res: any = await apiRequest(url);
      setCentreInfo(res.centre);

      const normalizedQueue: ProcurementQueueItem[] = (res.queue || []).map((item: any, idx: number) => ({
        ...item,
        id: item.bookingId || item.id || `proc-lot-${idx}`,
        finalWeightQuintals: item.actualWeightQuintals ?? item.finalWeightQuintals ?? item.expectedQuantityQuintals,
        commodityName: item.commodityName || 'Wheat (गेहूं)',
      }));

      setQueue(normalizedQueue);

      const pendingItems = normalizedQueue.filter((i) => i.status === 'PROCUREMENT');
      if (pendingItems.length > 0) {
        const currentSelected = selectedBookingRef.current;
        if (!currentSelected || !pendingItems.some((i) => i.id === currentSelected.id)) {
          setSelectedBooking(pendingItems[0]);
          setPurchasedQuantity((pendingItems[0].actualWeightQuintals ?? pendingItems[0].finalWeightQuintals)?.toString() || '0');
        }
      } else {
        setSelectedBooking(null);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load procurement queue.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadQueue(selectedDate);
  }, [selectedDate, loadQueue]);

  const activeQueue = useMemo(() => {
    return queue.filter((item) => item.status === 'PROCUREMENT');
  }, [queue]);

  const processedHistory = useMemo(() => {
    return queue
      .filter((item) => item.status !== 'PROCUREMENT')
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.farmerName.toLowerCase().includes(q) ||
          item.farmerCode.toLowerCase().includes(q) ||
          item.bookingNumber.toLowerCase().includes(q)
        );
      });
  }, [queue, searchQuery]);

  // Handle item selection and sync default quantity
  const handleSelectBooking = (item: ProcurementQueueItem) => {
    setSelectedBooking(item);
    setPurchasedQuantity((item.actualWeightQuintals ?? item.finalWeightQuintals)?.toString() || '0');
  };

  // Calculations
  const qty = parseFloat(purchasedQuantity) || 0;
  const rate = parseFloat(ratePerQuintal) || 0;
  const deductions = parseFloat(deductionsAmount) || 0;
  const grossTotal = qty * rate;
  const netPayable = Math.max(0, grossTotal - deductions);

  const handleSubmitProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (qty <= 0 && decision === 'ACCEPTED') {
      alert('Purchased quantity must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(`/procurement/${selectedBooking.id}`, {
        method: 'POST',
        body: {
          decision,
          acceptedQuantityQuintals: decision === 'ACCEPTED' ? qty : 0,
          ratePerQuintal: rate,
          totalAmount: decision === 'ACCEPTED' ? netPayable : 0,
          remarks: remarks.trim() || undefined,
        },
      });

      if (decision === 'ACCEPTED') {
        const voucherData: ProcurementVoucherData = {
          id: selectedBooking.id,
          bookingNumber: selectedBooking.bookingNumber,
          centreName: centreInfo?.name || 'Muzaffarpur Central Grain Procurement Depot',
          centreCode: centreInfo?.code || 'DEP-BIH-04',
          centreAddress: centreInfo?.address || 'Industrial Area, Phase 2, Muzaffarpur, Bihar - 842001',
          bookingDate: selectedDate,
          farmerName: selectedBooking.farmerName,
          farmerCode: selectedBooking.farmerCode,
          farmerMobile: selectedBooking.farmerMobile,
          commodityName: selectedBooking.commodityName,
          qualityGrade: selectedBooking.qualityGrade || selectedBooking.quality?.grade || 'Grade A',
          moisturePercent: selectedBooking.moisturePercent ?? selectedBooking.quality?.moisturePercent ?? 11.8,
          actualWeightQuintals: selectedBooking.actualWeightQuintals ?? selectedBooking.finalWeightQuintals,
          acceptedQuantityQuintals: qty,
          ratePerQuintal: rate,
          totalAmount: netPayable,
          deductions: deductions,
          decidedAt: new Date().toISOString(),
          decidedBy: 'Procurement Officer (ASTRA Authorized)',
          paymentStatus: 'DBT_PENDING',
          transactionRef: `ASTRA-DBT-${Date.now().toString().slice(-8)}`,
        };
        setSelectedVoucherForPrint(voucherData);
      }

      alert(
        decision === 'ACCEPTED'
          ? `Purchase Voucher issued for #${selectedBooking.bookingNumber}. Net Payout: ₹${netPayable.toLocaleString('en-IN')}. Voucher is generated and ready to print.`
          : `Lot #${selectedBooking.bookingNumber} marked as REJECTED.`,
      );

      setSelectedBooking(null);
      setRemarks('');
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to record procurement decision.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logoutPortal('operations');
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#EEFaf7] text-slate-800 relative after:absolute after:top-full after:inset-x-0 after:h-[calc(72px+env(safe-area-inset-bottom))] after:bg-[#EEFaf7] md:after:hidden">
      <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-900 flex-1">
      {/* Top Header */}
      <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Procurement
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 font-mono uppercase tracking-wider">
                MSP ACQUISITION
              </span>
            </div>
            <div className="text-base font-semibold text-slate-900 mt-1">
              {centreInfo?.name || 'Muzaffarpur Central Grain Procurement Depot'}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              Official grain acquisition, Minimum Support Price (MSP) calculation, and voucher issuance
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => loadQueue()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-semibold flex items-center space-x-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-all ${
            activeTab === 'queue'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white'
          }`}
        >
          <FileCheck2 className="w-5 h-5 text-emerald-600" />
          <span>Procurement Queue ({activeQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white'
          }`}
        >
          <History className="w-5 h-5 text-emerald-600" />
          <span>Issued Vouchers & Daily History ({processedHistory.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-50 text-rose-700 text-xs flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: ACTIVE PROCUREMENT QUEUE & VOUCHER ISSUANCE                    */}
      {/* ===================================================================== */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Quality-Certified Lots Awaiting Procurement Order */}
          <div className="lg:col-span-5 space-y-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-1 shrink-0">
              <div className="flex items-center space-x-2 text-[18px] leading-[26px] font-semibold text-slate-900 font-sans">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Ready for Purchase Voucher</span>
              </div>
              <span className="text-[12px] leading-[18px] font-semibold px-2.5 py-0.5 rounded bg-white text-emerald-600 border border-slate-200 font-mono">
                {activeQueue.length} certified
              </span>
            </div>

            {loading && activeQueue.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Loading certified farmer lots...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-[18px] leading-[26px] font-semibold font-sans text-slate-900">Procurement Queue Clear</p>
                <p className="text-[16px] leading-[24px] font-normal font-sans text-slate-500 max-w-xs mx-auto">All quality-tested grain lots have been procured and vouchers issued.</p>
              </div>
            ) : (
              <div className="space-y-3 pr-1 operations-queue-scroll min-h-0">
                {activeQueue.map((item) => {
                  const isSelected = selectedBooking?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectBooking(item)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-emerald-500/80 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/30'
                          : 'border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-emerald-600">
                            #{item.bookingNumber}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-0.5">{item.farmerName}</h3>
                          <p className="text-xs text-slate-500 font-mono">
                            ID: {item.farmerCode} &bull; {item.farmerMobile ? item.farmerMobile.slice(-4).padStart(10, 'X') : 'XXXX'}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white font-sans inline-block">
                          {item.qualityGrade ? item.qualityGrade.replace(/_/g, ' ') : (item.quality?.grade ? item.quality.grade.replace(/_/g, ' ') : 'Grade A')}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Moisture: <strong className="text-slate-700 font-mono">{item.moisturePercent || '13.5'}%</strong></span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">Accepted Weight</span>
                          <span className="font-mono font-bold text-emerald-600 text-xs">
                            {item.finalWeightQuintals} Qtl
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Farmer Procurement Detail & Voucher Workspace */}
          <div className="lg:col-span-7">
            {selectedBooking ? (
              <form
                onSubmit={handleSubmitProcurement}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xl"
              >
                {/* Farmer & Lot Overview */}
                <div className="border-b border-slate-200 pb-4">
                  <span className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-wider">
                    Official Procurement File #{selectedBooking.bookingNumber}
                  </span>
                  <div className="flex items-start justify-between flex-wrap gap-2 mt-1">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedBooking.farmerName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        Farmer ID: <strong className="text-slate-700">{selectedBooking.farmerCode}</strong> &bull; Commodity: <strong className="text-slate-700">{selectedBooking.commodityName}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Certified Quality</span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white font-sans inline-block">
                        {selectedBooking.qualityGrade ? selectedBooking.qualityGrade.replace(/_/g, ' ') : (selectedBooking.quality?.grade ? selectedBooking.quality.grade.replace(/_/g, ' ') : 'Grade A')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 9: Complete Multi-Stage Processing Timeline */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Verified Multi-Stage Audit Trail
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">1. Check-in</span>
                      <span className="font-mono text-slate-700 font-semibold text-xs">
                        {selectedBooking.checkInTime
                          ? new Date(selectedBooking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '08:12 AM'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">2. Weighment</span>
                      <span className="font-mono text-slate-700 font-semibold text-xs">
                        {selectedBooking.weighment?.weighedAt
                          ? new Date(selectedBooking.weighment.weighedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '08:24 AM'}{' '}
                        <strong className="text-emerald-600 font-normal">({selectedBooking.finalWeightQuintals} Qtl)</strong>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">3. Quality Test</span>
                      <span className="font-mono text-slate-700 font-semibold text-xs">
                        {selectedBooking.quality?.assessedAt
                          ? new Date(selectedBooking.quality.assessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '08:34 AM'}{' '}
                        <strong className="text-teal-600 font-normal">({selectedBooking.qualityGrade ? selectedBooking.qualityGrade.slice(0, 7) : 'A'})</strong>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">4. Decision</span>
                      <span className="font-mono text-amber-600 font-bold text-xs">
                        Pending Voucher
                      </span>
                    </div>
                  </div>
                </div>

                {/* Procurement Inputs */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Accepted Quantity */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">
                        Accepted Quantity (Quintals) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={purchasedQuantity}
                        onChange={(e) => setPurchasedQuantity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>

                    {/* MSP Rate */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                        <span>MSP Rate (₹/Qtl) *</span>
                        <span className="text-[10px] text-emerald-600 font-mono">GOVT MSP</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={ratePerQuintal}
                        onChange={(e) => setRatePerQuintal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>

                    {/* Deductions */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">
                        Quality Deductions (₹)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={deductionsAmount}
                        onChange={(e) => setDeductionsAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Financial Summary Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-mono">Total Verified Payout</span>
                      <span className="text-xs text-slate-600 font-mono">
                        {qty} Qtl &times; ₹{rate}/Qtl {deductions > 0 ? `- ₹${deductions}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl sm:text-4xl font-bold text-emerald-600 tabular-nums tracking-tight">
                        ₹{netPayable.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-600 block font-semibold uppercase">Direct DBT Transfer</span>
                    </div>
                  </div>

                  {/* Procurement Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Procurement Order Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter purchase voucher reference, storage stack allocation, or bagging notes..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    onClick={() => setDecision('ACCEPTED')}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold text-sm shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'Issuing Purchase Voucher...'
                        : `Issue Purchase Voucher (₹${netPayable.toLocaleString('en-IN')})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      if (confirm(`Are you sure you want to reject lot #${selectedBooking.bookingNumber}?`)) {
                        setDecision('REJECTED');
                        handleSubmitProcurement({ preventDefault: () => {} } as any);
                      }
                    }}
                    className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm transition"
                  >
                    Reject Lot
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
                <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-[18px] leading-[26px] font-semibold font-sans text-slate-900">No Lot Selected</h3>
                <p className="text-[16px] leading-[24px] font-normal font-sans text-slate-500 max-w-sm mx-auto">
                  Select a certified grain lot from the left queue to compute MSP totals and issue the purchase voucher.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ISSUED VOUCHERS & DAILY HISTORY                                */}
      {/* ===================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-base font-medium text-slate-600">Select Date:</span>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl pl-3 pr-10 py-2 text-base font-medium text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50 focus:border-[#0F766E] transition-all [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-20 relative"
                  />
                  <Calendar className="w-5 h-5 text-[#0F766E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    selectedDate === todayStr ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40' : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    setSelectedDate(y.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200"
                >
                  Yesterday
                </button>
              </div>
            </div>

            <div className="relative w-full sm:min-w-[240px] sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Farmer, ID, Booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900">Daily Issued Purchase Vouchers ({processedHistory.length})</h3>
                <p className="text-base font-medium text-slate-500 mt-0.5">
                  Official procurement records and payments for {selectedDate}
                </p>
              </div>
            </div>

            {processedHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No Vouchers Found</p>
                <p className="text-[11px] text-slate-500">No purchase vouchers were issued for {selectedDate}.</p>
              </div>
            ) : (
              <div className="operations-queue-scroll overflow-x-auto overflow-y-auto max-h-[60vh] md:max-h-[500px]">
                <table className="w-full min-w-max text-left border-collapse tabular-nums">
                  <thead className="sticky top-0 z-10 bg-[#E8F7F3] text-[#475569] font-sans font-semibold text-sm border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Booking Number</th>
                      <th className="py-3 px-4">Farmer Details</th>
                      <th className="py-3 px-4">Commodity</th>
                      <th className="py-3 px-4">Quality Grade</th>
                      <th className="py-3 px-4">Accepted Qtl</th>
                      <th className="py-3 px-4">Rate (₹/Qtl)</th>
                      <th className="py-3 px-4">Total Amount (₹)</th>
                      <th className="py-3 px-4">Voucher Time</th>
                      <th className="py-3 px-4">DBT Status</th>
                      <th className="py-3 px-4 text-right">Official Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-sm">
                    {processedHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-100 transition-colors">
                        <td className="py-3 px-4 font-sans font-semibold text-[#059669] whitespace-nowrap text-sm">
                          #{item.bookingNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold font-sans text-[15px] text-slate-900">{item.farmerName}</div>
                          <div className="text-[12px] leading-[18px] text-slate-500 font-sans">{item.farmerCode}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap text-sm">
                          {item.commodityName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white font-sans inline-block">
                            {item.qualityGrade ? item.qualityGrade.replace(/_/g, ' ') : (item.quality?.grade ? item.quality.grade.replace(/_/g, ' ') : 'Grade A')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-[#059669] whitespace-nowrap text-sm">
                          {item.procurement?.acceptedQuantityQuintals ?? item.finalWeightQuintals} Qtl
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap text-sm">
                          ₹{item.procurement?.ratePerQuintal ?? 2325}
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-[#059669] whitespace-nowrap text-sm">
                          ₹{(item.procurement?.totalAmount ?? (item.finalWeightQuintals * 2325)).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-500 whitespace-nowrap text-sm">
                          {item.procurement?.decidedAt
                            ? new Date(item.procurement.decidedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '08:47 AM'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold font-sans ${
                              item.status === 'COMPLETED'
                                ? 'bg-[#059669] text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status === 'COMPLETED' ? 'SETTLED (DBT)' : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVoucherForPrint({
                                id: item.id,
                                bookingNumber: item.bookingNumber,
                                centreName: centreInfo?.name || 'Muzaffarpur Central Grain Procurement Depot',
                                centreCode: centreInfo?.code || 'DEP-BIH-04',
                                centreAddress: centreInfo?.address || 'Industrial Area, Phase 2, Muzaffarpur, Bihar - 842001',
                                bookingDate: selectedDate,
                                farmerName: item.farmerName,
                                farmerCode: item.farmerCode,
                                farmerMobile: item.farmerMobile,
                                commodityName: item.commodityName,
                                qualityGrade: item.qualityGrade || item.quality?.grade || 'Grade A',
                                moisturePercent: item.moisturePercent ?? item.quality?.moisturePercent ?? 11.8,
                                actualWeightQuintals: item.actualWeightQuintals ?? item.finalWeightQuintals,
                                acceptedQuantityQuintals: item.procurement?.acceptedQuantityQuintals ?? item.finalWeightQuintals,
                                ratePerQuintal: item.procurement?.ratePerQuintal ?? 2325,
                                totalAmount: item.procurement?.totalAmount ?? (item.finalWeightQuintals * 2325),
                                deductions: 0,
                                decidedAt: item.procurement?.decidedAt || new Date().toISOString(),
                                decidedBy: item.procurement?.decidedBy || 'Procurement Officer (ASTRA Authorized)',
                                paymentStatus: item.status === 'COMPLETED' ? 'SETTLED' : 'PENDING',
                                transactionRef: item.payment?.transactionRef || `ASTRA-DBT-${item.bookingNumber.slice(-6)}`,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-500/20 text-emerald-600 font-semibold text-sm transition shadow-sm"
                            title="Print Official Purchase Voucher"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Print Voucher</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Voucher Printable Modal */}
      <ProcurementVoucherModal
        isOpen={!!selectedVoucherForPrint}
        onClose={() => setSelectedVoucherForPrint(null)}
        voucher={selectedVoucherForPrint}
      />
    </div>
    </div>
  );
}

export default function ProcurementDashboardPage() {
  return (
    <StationGuard allowedRoles={['PROCUREMENT_OFFICER', 'PROCUREMENT', 'GOVERNMENT_ADMIN']} stationName="Procurement Order Desk">
      <ProcurementDashboardContent />
    </StationGuard>
  );
}
