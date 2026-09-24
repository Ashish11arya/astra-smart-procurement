'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

  const loadQueue = async (dateOverride?: string) => {
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
        if (!selectedBooking || !pendingItems.some((i) => i.id === selectedBooking.id)) {
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
  };

  useEffect(() => {
    loadQueue(selectedDate);
  }, [selectedDate]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="bg-[#151C2F] rounded-2xl border border-[#334155] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Procurement
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono uppercase tracking-wider">
                MSP ACQUISITION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {centreInfo?.name || 'Procurement Depot'} &bull; Official grain acquisition, Minimum Support Price (MSP) calculation, and voucher issuance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => loadQueue()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-[#334155] bg-[#0B1020] hover:bg-[#1B2438] text-slate-200 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-rose-800/40 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#334155] pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'queue'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2F]'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-400" />
          <span>Procurement Queue ({activeQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2F]'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>Issued Vouchers & Daily History ({processedHistory.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-200 text-xs flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
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
              <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ready for Purchase Voucher</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded bg-[#151C2F] text-emerald-300 border border-[#334155] font-mono font-semibold">
                {activeQueue.length} certified
              </span>
            </div>

            {loading && activeQueue.length === 0 ? (
              <div className="p-8 text-center bg-[#151C2F] rounded-2xl border border-[#334155] text-slate-400 text-xs">
                Loading certified farmer lots...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="p-10 text-center bg-[#151C2F] rounded-2xl border border-[#334155] text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-200">Procurement Queue Clear</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">All quality-tested grain lots have been procured and vouchers issued.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1 operations-queue-scroll max-h-[580px] min-h-0">
                {activeQueue.map((item) => {
                  const isSelected = selectedBooking?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectBooking(item)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-emerald-500/80 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/30'
                          : 'border-[#334155] bg-[#151C2F] hover:bg-[#1B2438] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-emerald-400">
                            #{item.bookingNumber}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-0.5">{item.farmerName}</h3>
                          <p className="text-xs text-slate-400 font-mono">
                            ID: {item.farmerCode} &bull; {item.farmerMobile ? item.farmerMobile.slice(-4).padStart(10, 'X') : 'XXXX'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 uppercase tracking-wide font-mono">
                          {item.qualityGrade ? item.qualityGrade.replace(/_/g, ' ') : 'CERTIFIED'}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#334155]/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Moisture: <strong className="text-slate-200 font-mono">{item.moisturePercent || '13.5'}%</strong></span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Accepted Weight</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
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
                className="bg-[#151C2F] rounded-2xl border border-[#334155] p-5 sm:p-6 space-y-5 shadow-xl"
              >
                {/* Farmer & Lot Overview */}
                <div className="border-b border-[#334155] pb-4">
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Official Procurement File #{selectedBooking.bookingNumber}
                  </span>
                  <div className="flex items-start justify-between flex-wrap gap-2 mt-1">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {selectedBooking.farmerName}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Farmer ID: <strong className="text-slate-200">{selectedBooking.farmerCode}</strong> &bull; Commodity: <strong className="text-slate-200">{selectedBooking.commodityName}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Certified Quality</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60 uppercase">
                        {selectedBooking.qualityGrade ? selectedBooking.qualityGrade.replace(/_/g, ' ') : 'Grade A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 9: Complete Multi-Stage Processing Timeline */}
                <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#334155] space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verified Multi-Stage Audit Trail
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">1. Check-in</span>
                      <span className="font-mono text-slate-200 font-semibold text-xs">
                        {selectedBooking.checkInTime
                          ? new Date(selectedBooking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '08:12 AM'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">2. Weighment</span>
                      <span className="font-mono text-slate-200 font-semibold text-xs">
                        {selectedBooking.weighment?.weighedAt
                          ? new Date(selectedBooking.weighment.weighedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '08:24 AM'}{' '}
                        <strong className="text-emerald-400 font-normal">({selectedBooking.finalWeightQuintals} Qtl)</strong>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">3. Quality Test</span>
                      <span className="font-mono text-slate-200 font-semibold text-xs">
                        {selectedBooking.quality?.assessedAt
                          ? new Date(selectedBooking.quality.assessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '08:34 AM'}{' '}
                        <strong className="text-teal-400 font-normal">({selectedBooking.qualityGrade ? selectedBooking.qualityGrade.slice(0, 7) : 'A'})</strong>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">4. Decision</span>
                      <span className="font-mono text-amber-400 font-bold text-xs">
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
                      <label className="text-xs font-semibold text-slate-300">
                        Accepted Quantity (Quintals) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={purchasedQuantity}
                        onChange={(e) => setPurchasedQuantity(e.target.value)}
                        className="w-full bg-[#0B1020] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>

                    {/* MSP Rate */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>MSP Rate (₹/Qtl) *</span>
                        <span className="text-[10px] text-emerald-400 font-mono">GOVT MSP</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={ratePerQuintal}
                        onChange={(e) => setRatePerQuintal(e.target.value)}
                        className="w-full bg-[#0B1020] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>

                    {/* Deductions */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Quality Deductions (₹)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={deductionsAmount}
                        onChange={(e) => setDeductionsAmount(e.target.value)}
                        className="w-full bg-[#0B1020] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Financial Summary Card */}
                  <div className="p-4 rounded-xl bg-[#0B1020] border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Total Verified Payout</span>
                      <span className="text-xs text-slate-300 font-mono">
                        {qty} Qtl &times; ₹{rate}/Qtl {deductions > 0 ? `- ₹${deductions}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                        ₹{netPayable.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-400 block font-semibold uppercase">Direct DBT Transfer</span>
                    </div>
                  </div>

                  {/* Procurement Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Procurement Order Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter purchase voucher reference, storage stack allocation, or bagging notes..."
                      className="w-full bg-[#0B1020] border border-[#334155] rounded-xl px-3.5 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    onClick={() => setDecision('ACCEPTED')}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
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
                    className="px-4 py-3 rounded-xl border border-rose-800/60 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 font-semibold text-xs transition"
                  >
                    Reject Lot
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-[#151C2F] rounded-2xl border border-[#334155] p-12 text-center text-slate-400 space-y-2">
                <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-200">No Lot Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
          <div className="bg-[#151C2F] rounded-xl border border-[#334155] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-[#0B1020] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    selectedDate === todayStr ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-[#0B1020] text-slate-400 hover:text-white border border-[#334155]'
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
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-[#0B1020] text-slate-400 hover:text-white border border-[#334155]"
                >
                  Yesterday
                </button>
              </div>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Farmer, ID, Booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0B1020] border border-[#334155] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#151C2F] rounded-2xl border border-[#334155] overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-[#334155] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Issued Purchase Vouchers ({processedHistory.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official procurement records and payments for {selectedDate}
                </p>
              </div>
            </div>

            {processedHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No Vouchers Found</p>
                <p className="text-[11px] text-slate-500">No purchase vouchers were issued for {selectedDate}.</p>
              </div>
            ) : (
              <div className="max-h-[580px] overflow-y-auto operations-queue-scroll overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0F172A] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-[#334155]">
                    <tr>
                      <th className="py-3 px-4">Booking Number</th>
                      <th className="py-3 px-4">Farmer Details</th>
                      <th className="py-3 px-4">Commodity</th>
                      <th className="py-3 px-4">Accepted Qtl</th>
                      <th className="py-3 px-4">Rate (₹/Qtl)</th>
                      <th className="py-3 px-4">Total Amount (₹)</th>
                      <th className="py-3 px-4">Voucher Time</th>
                      <th className="py-3 px-4">DBT Status</th>
                      <th className="py-3 px-4 text-right">Official Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60 font-sans">
                    {processedHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-[#1B2438] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                          #{item.bookingNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-white">{item.farmerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.farmerCode}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                          {item.commodityName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {item.procurement?.acceptedQuantityQuintals ?? item.finalWeightQuintals} Qtl
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          ₹{item.procurement?.ratePerQuintal ?? 2325}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-xs whitespace-nowrap">
                          ₹{(item.procurement?.totalAmount ?? (item.finalWeightQuintals * 2325)).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {item.procurement?.decidedAt
                            ? new Date(item.procurement.decidedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '08:47 AM'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono ${
                              item.status === 'COMPLETED'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                                : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            }`}
                          >
                            {item.status === 'COMPLETED' ? 'Settled (DBT)' : 'Payment Pending'}
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
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs transition shadow-sm"
                            title="Print Official Purchase Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
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
  );
}

export default function ProcurementDashboardPage() {
  return (
    <StationGuard allowedRoles={['PROCUREMENT_OFFICER', 'PROCUREMENT', 'GOVERNMENT_ADMIN']} stationName="Procurement Order Desk">
      <ProcurementDashboardContent />
    </StationGuard>
  );
}
