'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Clock,
  User,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  IndianRupee,
  Building,
  Check,
  Send,
  Calendar,
  Search,
  History,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StationGuard } from '@/components/operations/StationGuard';

interface PaymentQueueItem {
  id: string;
  bookingId: string;
  bookingNumber: string;
  farmerName: string;
  farmerCode: string;
  farmerMobile: string;
  commodityName: string;
  payableAmount: number;
  acceptedQuantityQuintals: number;
  status: string;
  createdAt: string;
  checkInTime?: string;
  weighedAt?: string;
  procuredAt?: string;
  payment?: {
    id: string;
    paymentStatus: string;
    transactionRef?: string;
    bankAccountMasked?: string;
    amount: number;
    settledBy?: string;
    settledAt?: string;
  } | null;
}

function PaymentDashboardContent() {
  const router = useRouter();
  const { logoutPortal } = useAuth();
  const [centreInfo, setCentreInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [queue, setQueue] = useState<PaymentQueueItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<PaymentQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // History filtering
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Settlement Form State
  const [transactionRef, setTransactionRef] = useState('');
  const [bankAccountMasked, setBankAccountMasked] = useState('XXXX-XXXX-4819');
  const [submitting, setSubmitting] = useState(false);

  const selectedBookingRef = useRef(selectedBooking);
  useEffect(() => {
    selectedBookingRef.current = selectedBooking;
  }, [selectedBooking]);

  const loadQueue = useCallback(async (dateOverride?: string) => {
    setLoading(true);
    try {
      const dateToFetch = dateOverride !== undefined ? dateOverride : selectedDate;
      const url = dateToFetch ? `/payment/queue?date=${dateToFetch}` : '/payment/queue';
      const res: any = await apiRequest(url);
      setCentreInfo(res.centre);

      const normalizedQueue: PaymentQueueItem[] = (res.queue || []).map((item: any, idx: number) => ({
        ...item,
        id: item.bookingId || item.id || `pay-lot-${idx}`,
        commodityName: item.commodityName || 'Wheat (गेहूं)',
      }));

      setQueue(normalizedQueue);

      const pendingItems = normalizedQueue.filter((i) => i.status === 'PAYMENT');
      if (pendingItems.length > 0) {
        const currentSelected = selectedBookingRef.current;
        if (!currentSelected || !pendingItems.some((i) => i.id === currentSelected.id)) {
          setSelectedBooking(pendingItems[0]);
          setTransactionRef(`DBT-${Date.now().toString().slice(-8)}`);
        }
      } else {
        setSelectedBooking(null);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment queue.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadQueue(selectedDate);
  }, [selectedDate, loadQueue]);

  const activeQueue = useMemo(() => {
    return queue.filter((item) => item.status === 'PAYMENT');
  }, [queue]);

  const processedHistory = useMemo(() => {
    return queue
      .filter((item) => item.status === 'COMPLETED')
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.farmerName.toLowerCase().includes(q) ||
          item.farmerCode.toLowerCase().includes(q) ||
          item.bookingNumber.toLowerCase().includes(q) ||
          (item.payment?.transactionRef && item.payment.transactionRef.toLowerCase().includes(q))
        );
      });
  }, [queue, searchQuery]);

  const handleSelectBooking = (item: PaymentQueueItem) => {
    setSelectedBooking(item);
    setTransactionRef(`DBT-${Date.now().toString().slice(-8)}`);
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSubmitting(true);
    try {
      await apiRequest(`/payment/${selectedBooking.id}`, {
        method: 'POST',
        body: {
          transactionRef: transactionRef.trim() || `DBT-${Date.now().toString().slice(-8)}`,
          bankAccountMasked: bankAccountMasked.trim() || 'XXXX-XXXX-4819',
          amount: selectedBooking.payableAmount,
        },
      });

      alert(
        `DBT Settlement successful for #${selectedBooking.bookingNumber}. Amount: ₹${selectedBooking.payableAmount.toLocaleString('en-IN')}. Farmer visit completed.`,
      );

      setSelectedBooking(null);
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment settlement.');
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
      {/* Top Header - Compact & Operational */}
      <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[24px] leading-[32px] font-bold text-slate-900 tracking-tight">
                Payments
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[12px] leading-[18px] font-semibold bg-cyan-50 text-cyan-600 border border-cyan-200 font-sans uppercase tracking-wider">
                Aadhaar PFMS Gateway
              </span>
            </div>
            <div className="text-[16px] leading-[24px] font-semibold text-slate-900 mt-1">
              {centreInfo?.name || 'Muzaffarpur Central Grain Procurement Depot'}
            </div>
            <div className="text-[16px] leading-[24px] font-normal text-slate-500 mt-0.5">
              Direct-to-bank subsidy and MSP disbursement processing
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => loadQueue()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[14px] leading-[20px] font-semibold flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[14px] leading-[20px] font-semibold flex items-center space-x-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[16px] leading-[24px] font-semibold transition-all ${
            activeTab === 'queue'
              ? 'bg-cyan-50 text-cyan-600 border border-cyan-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Payment Queue ({activeQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[16px] leading-[24px] font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-cyan-50 text-cyan-600 border border-cyan-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white'
          }`}
        >
          <History className="w-5 h-5" />
          <span>Settled Payments & Daily History ({processedHistory.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-50 text-rose-700 text-[14px] leading-[20px] flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: ACTIVE PAYMENT QUEUE                                           */}
      {/* ===================================================================== */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Approved Vouchers Awaiting Settlement */}
          <div className="lg:col-span-5 space-y-3.5 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-1 shrink-0">
              <div className="flex items-center space-x-2 text-[18px] leading-[26px] font-semibold text-slate-900 font-sans">
                <Clock className="w-5 h-5 text-cyan-600" />
                <span>Ready for DBT Settlement</span>
              </div>
              <span className="text-[12px] leading-[18px] font-semibold px-2.5 py-0.5 rounded bg-white text-cyan-600 border border-slate-200 font-sans">
                {activeQueue.length} vouchers
              </span>
            </div>

            {loading && activeQueue.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-[14px] leading-[20px]">
                Loading payable vouchers from database...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-[18px] leading-[26px] font-semibold font-sans text-slate-900">Payment Queue Clear</p>
                <p className="text-[16px] leading-[24px] font-normal font-sans text-slate-500 max-w-xs mx-auto">All certified procurement vouchers for today have been processed.</p>
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
                          ? 'border-cyan-500/80 bg-cyan-50 shadow-md ring-1 ring-cyan-500/30'
                          : 'border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[12px] leading-[18px] font-mono font-bold text-cyan-600">
                            #{item.bookingNumber}
                          </span>
                          <h3 className="text-[15px] leading-[20px] font-semibold text-slate-900 mt-0.5">{item.farmerName}</h3>
                          <p className="text-[12px] leading-[18px] text-slate-500 font-sans">
                            ID: {item.farmerCode} &bull; {item.farmerMobile ? item.farmerMobile.slice(-4).padStart(10, 'X') : 'XXXX'}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[12px] leading-[18px] font-semibold bg-cyan-100 text-cyan-800 font-sans inline-block">
                          VOUCHER READY
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[14px] leading-[20px]">
                        <span className="text-slate-500">Weight: <strong className="text-slate-700 font-mono">{item.acceptedQuantityQuintals} Qtl</strong></span>
                        <div className="text-right">
                          <span className="text-[12px] leading-[18px] text-slate-500 block font-sans">Payable</span>
                          <span className="font-sans font-bold text-emerald-600 text-[14px] leading-[20px]">
                            ₹{item.payableAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: DBT Disbursement Form */}
          <div className="lg:col-span-7">
            {selectedBooking ? (
              <form
                onSubmit={handleSettlePayment}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xl"
              >
                <div className="border-b border-slate-200 pb-4">
                  <span className="text-[12px] leading-[18px] font-sans text-cyan-600 font-bold uppercase tracking-wider">
                    DBT Settlement Authorization &bull; Lot #{selectedBooking.bookingNumber}
                  </span>
                  <div className="flex items-start justify-between flex-wrap gap-2 mt-1">
                    <div>
                      <h2 className="text-[18px] leading-[26px] font-bold text-slate-900">
                        {selectedBooking.farmerName}
                      </h2>
                      <p className="text-[12px] leading-[18px] text-slate-500 mt-0.5 font-sans">
                        Farmer ID: <strong className="text-slate-700">{selectedBooking.farmerCode}</strong> &bull; Accepted Lot: <strong className="text-slate-700 font-mono">{selectedBooking.acceptedQuantityQuintals} qtl</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] leading-[18px] text-slate-500 uppercase font-sans block">Approved Payable Amount</span>
                      <span className="text-[24px] leading-[32px] font-bold text-emerald-600 font-sans">
                        ₹{selectedBooking.payableAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank / PFMS Details */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-5 h-5 text-cyan-600" />
                    <span>Aadhaar-Linked Bank Details (PFMS Direct Benefit Transfer)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Masked Bank Account *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankAccountMasked}
                        onChange={(e) => setBankAccountMasked(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-sans text-[14px] leading-[20px] focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Transaction Reference / UTR *
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-sans text-[14px] leading-[20px] focus:outline-none focus:border-cyan-500 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Compliance Notice */}
                <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-[14px] leading-[20px] text-cyan-800 space-y-1">
                  <p className="font-bold text-cyan-900">PFMS Statutory Compliance</p>
                  <p className="text-[11px] text-slate-700">
                    Submitting this form initiates an electronic payment order to the farmer&apos;s verified bank account and permanently records lot settlement on the central audit trail.
                  </p>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold text-[14px] leading-[20px] shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Disbursing Payment...'
                      : `Authorize DBT Settlement (₹${selectedBooking.payableAmount.toLocaleString('en-IN')})`}
                  </span>
                </button>
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
                <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No Voucher Selected</h3>
                <p className="text-[16px] leading-[24px] font-normal font-sans text-slate-500 max-w-sm mx-auto">
                  Select an approved purchase voucher from the left queue to verify farmer bank details and execute the DBT payment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SETTLED PAYMENTS & DAILY HISTORY                               */}
      {/* ===================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap">
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
                  className={`px-3 py-1.5 rounded text-[14px] leading-[20px] font-medium ${
                    selectedDate === todayStr ? 'bg-sky-500/20 text-sky-700 border border-sky-500/40' : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
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
                  className="px-3 py-1.5 rounded text-[14px] leading-[20px] font-medium bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200"
                >
                  Yesterday
                </button>
              </div>
            </div>

            <div className="relative w-full sm:min-w-[240px] sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Farmer, ID, UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900">Settled DBT Disbursements ({processedHistory.length})</h3>
                <p className="text-[16px] leading-[24px] font-medium text-slate-500 mt-0.5">
                  Direct electronic transfer records for {selectedDate}
                </p>
              </div>
            </div>

            {processedHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-[14px] leading-[20px] font-semibold text-slate-600">No Disbursements Found</p>
                <p className="text-[14px] leading-[20px] text-slate-500">No DBT payments were recorded for {selectedDate}.</p>
              </div>
            ) : (
              <div className="operations-queue-scroll overflow-x-auto overflow-y-auto max-h-[60vh] md:max-h-[500px]">
                <table className="w-full min-w-max text-left border-collapse tabular-nums">
                  <thead className="sticky top-0 z-10 bg-[#E8F7F3] text-[#475569] font-sans font-semibold text-[14px] leading-[20px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Farmer</th>
                      <th className="py-3 px-4">Disbursed Amount</th>
                      <th className="py-3 px-4">Transaction UTR</th>
                      <th className="py-3 px-4">Masked Account</th>
                      <th className="py-3 px-4">Settlement Time</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-[14px] leading-[20px]">
                    {processedHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-100 transition-colors">
                        <td className="py-3 px-4 font-sans font-semibold text-slate-700 whitespace-nowrap">
                          #{item.bookingNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold font-sans text-[15px] leading-[20px] text-slate-900">{item.farmerName}</div>
                          <div className="text-[12px] leading-[18px] text-slate-500 font-sans">{item.farmerCode}</div>
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-[#059669] whitespace-nowrap">
                          ₹{(item.payment?.amount ?? item.payableAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-slate-700 whitespace-nowrap">
                          {item.payment?.transactionRef || 'DBT-PFMS-SUCCESS'}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap">
                          {item.payment?.bankAccountMasked || 'XXXX-XXXX-4819'}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap">
                          {item.payment?.settledAt
                            ? new Date(item.payment.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '08:52 AM'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-3 py-1.5 rounded-full text-[12px] leading-[18px] font-semibold bg-[#059669] text-white font-sans inline-block">
                            SETTLED (DBT)
                          </span>
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
    </div>
    </div>
  );
}

export default function PaymentDashboardPage() {
  return (
    <StationGuard allowedRoles={['PAYMENT_OFFICER', 'PAYMENT', 'GOVERNMENT_ADMIN']} stationName="DBT Settlement Desk">
      <PaymentDashboardContent />
    </StationGuard>
  );
}
