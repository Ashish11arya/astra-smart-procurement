'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

  const loadQueue = async (dateOverride?: string) => {
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
        if (!selectedBooking || !pendingItems.some((i) => i.id === selectedBooking.id)) {
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
  };

  useEffect(() => {
    loadQueue(selectedDate);
  }, [selectedDate]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-[#F8FAFC]">
      {/* Top Header - Compact & Operational */}
      <div className="rounded-xl border border-[#334155] bg-[#151C2F] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-[#F8FAFC] tracking-tight">
                Payments
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono uppercase">
                Aadhaar PFMS Gateway
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              <strong className="text-[#CBD5E1]">{centreInfo?.name || 'Muzaffarpur Central Grain Procurement Depot'}</strong> &bull; Direct-to-bank subsidy and MSP disbursement processing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={() => loadQueue()}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg border border-[#334155] bg-[#1E293B] hover:bg-[#334155] text-[#CBD5E1] hover:text-[#F8FAFC] text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-lg border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#334155] pb-2.5">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'queue'
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
          }`}
        >
          <CreditCard className="w-4 h-4 text-cyan-400" />
          <span>Payment Queue ({activeQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
          }`}
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span>Settled Payments & Daily History ({processedHistory.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-rose-800 bg-rose-950/50 text-rose-200 text-xs flex items-center space-x-2.5">
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
              <div className="flex items-center space-x-2 text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ready for DBT Settlement</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#1E293B] text-[#94A3B8] border border-[#334155] font-mono">
                {activeQueue.length} vouchers
              </span>
            </div>

            {loading && activeQueue.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-[#334155] bg-[#151C2F] text-[#94A3B8] text-xs">
                Loading payable vouchers from database...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-[#334155] bg-[#151C2F] text-[#94A3B8] space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-[#F8FAFC]">Payment Queue Clear</p>
                <p className="text-xs text-[#94A3B8]">All certified procurement vouchers for today have been processed.</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto pr-1 pb-1 operations-queue-scroll max-h-[580px]">
                {activeQueue.map((item) => {
                  const isSelected = selectedBooking?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectBooking(item)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/40 shadow-xs'
                          : 'border-[#334155] bg-[#151C2F] hover:bg-[#1B2438] hover:border-[#475569]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-cyan-400">
                            #{item.bookingNumber}
                          </span>
                          <h3 className="text-sm font-bold text-[#F8FAFC] mt-0.5">{item.farmerName}</h3>
                          <p className="text-[11px] text-[#94A3B8] font-mono">
                            ID: {item.farmerCode} &bull; {item.farmerMobile ? item.farmerMobile.slice(-4).padStart(10, 'X') : 'XXXX'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wide">
                          VOUCHER READY
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-[#242E42] flex items-center justify-between text-xs">
                        <span className="text-[#94A3B8]">Weight: <strong className="text-[#CBD5E1] font-mono">{item.acceptedQuantityQuintals} qtl</strong></span>
                        <div className="text-right">
                          <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Payable</span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
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
                className="rounded-xl border border-[#334155] bg-[#151C2F] p-5 sm:p-6 space-y-5 shadow-sm"
              >
                <div className="border-b border-[#334155] pb-4">
                  <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    DBT Settlement Authorization &bull; Lot #{selectedBooking.bookingNumber}
                  </span>
                  <div className="flex items-start justify-between flex-wrap gap-2 mt-1">
                    <div>
                      <h2 className="text-xl font-black text-[#F8FAFC]">
                        {selectedBooking.farmerName}
                      </h2>
                      <p className="text-xs text-[#94A3B8] mt-0.5 font-mono">
                        Farmer ID: <strong className="text-[#CBD5E1]">{selectedBooking.farmerCode}</strong> &bull; Accepted Lot: <strong className="text-[#CBD5E1] font-mono">{selectedBooking.acceptedQuantityQuintals} qtl</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Approved Payable Amount</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        ₹{selectedBooking.payableAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank / PFMS Details */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Aadhaar-Linked Bank Details (PFMS Direct Benefit Transfer)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#CBD5E1]">
                        Masked Bank Account *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankAccountMasked}
                        onChange={(e) => setBankAccountMasked(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-[#F8FAFC] font-mono text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#CBD5E1]">
                        Transaction Reference / UTR *
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-[#F8FAFC] font-mono text-sm focus:outline-none focus:border-cyan-500 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Compliance Notice */}
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/60 text-xs text-cyan-200 space-y-0.5 leading-relaxed">
                  <p className="font-bold text-cyan-300">PFMS Statutory Compliance</p>
                  <p className="text-[11px] text-[#CBD5E1]">
                    Submitting this form initiates an electronic payment order to the farmer&apos;s verified bank account and permanently records lot settlement on the central audit trail.
                  </p>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
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
              <div className="rounded-xl border border-[#334155] bg-[#151C2F] p-8 text-center text-[#94A3B8] space-y-2">
                <CreditCard className="w-8 h-8 text-[#64748B] mx-auto" />
                <h3 className="text-sm font-bold text-[#CBD5E1]">No Voucher Selected</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
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
          <div className="rounded-xl border border-[#334155] bg-[#151C2F] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-[#CBD5E1]">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-[#0F172A] border border-[#334155] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    selectedDate === todayStr ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
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
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-[#1E293B] text-[#94A3B8] hover:text-white"
                >
                  Yesterday
                </button>
              </div>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search Farmer, ID, UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-[#334155] bg-[#151C2F] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#334155] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">Settled DBT Disbursements ({processedHistory.length})</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Direct electronic transfer records for {selectedDate}
                </p>
              </div>
            </div>

            {processedHistory.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] space-y-1.5">
                <CreditCard className="w-6 h-6 text-[#64748B] mx-auto" />
                <p className="text-sm font-semibold text-[#CBD5E1]">No Disbursements Found</p>
                <p className="text-xs text-[#94A3B8]">No DBT payments were recorded for {selectedDate}.</p>
              </div>
            ) : (
              <div className="max-h-[580px] overflow-y-auto operations-queue-scroll overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0F172A] text-[#94A3B8] font-mono uppercase tracking-wider border-b border-[#334155]">
                    <tr>
                      <th className="py-2.5 px-3.5">Booking Ref</th>
                      <th className="py-2.5 px-3.5">Farmer</th>
                      <th className="py-2.5 px-3.5">Disbursed Amount</th>
                      <th className="py-2.5 px-3.5">Transaction UTR</th>
                      <th className="py-2.5 px-3.5">Masked Account</th>
                      <th className="py-2.5 px-3.5">Settlement Time</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242E42] font-sans">
                    {processedHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-[#1E293B]/60 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-cyan-400">
                          #{item.bookingNumber}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-[#F8FAFC]">{item.farmerName}</div>
                          <div className="text-[11px] text-[#94A3B8] font-mono">{item.farmerCode}</div>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-black text-emerald-400 text-sm">
                          ₹{(item.payment?.amount ?? item.payableAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-[#CBD5E1]">
                          {item.payment?.transactionRef || 'DBT-PFMS-SUCCESS'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[#94A3B8]">
                          {item.payment?.bankAccountMasked || 'XXXX-XXXX-4819'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[#94A3B8]">
                          {item.payment?.settledAt
                            ? new Date(item.payment.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '08:52 AM'}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-mono">
                            COMPLETED
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
  );
}

export default function PaymentDashboardPage() {
  return (
    <StationGuard allowedRoles={['PAYMENT_OFFICER', 'PAYMENT', 'GOVERNMENT_ADMIN']} stationName="DBT Settlement Desk">
      <PaymentDashboardContent />
    </StationGuard>
  );
}
