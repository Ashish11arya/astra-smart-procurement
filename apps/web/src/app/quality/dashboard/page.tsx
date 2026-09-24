'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Clock,
  User,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Droplets,
  Percent,
  Check,
  Scale,
  Calendar,
  Search,
  History,
  FileCheck2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StationGuard } from '@/components/operations/StationGuard';

interface QualityQueueItem {
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
  deviceCode?: string;
  checkInTime?: string;
  weighedAt?: string;
  status: string;
  quality?: {
    id: string;
    moisturePercent: number;
    foreignMatterPercent: number;
    damagedGrainPercent: number;
    grade: string;
    remarks?: string;
    assessedBy: string;
    assessedAt: string;
  } | null;
  procurement?: {
    decision: string;
    acceptedQuantityQuintals: number;
    decidedAt: string;
  } | null;
}

function QualityDashboardContent() {
  const router = useRouter();
  const { logoutPortal } = useAuth();
  const [centreInfo, setCentreInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [queue, setQueue] = useState<QualityQueueItem[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<QualityQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // History filtering
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Quality Assessment Parameters
  const [moistureContentPercent, setMoistureContentPercent] = useState('13.5');
  const [foreignMatterPercent, setForeignMatterPercent] = useState('1.2');
  const [damagedGrainPercent, setDamagedGrainPercent] = useState('1.8');
  const [qualityGrade, setQualityGrade] = useState<'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECTED'>(
    'GRADE_A',
  );
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = async (dateOverride?: string) => {
    setLoading(true);
    try {
      const dateToFetch = dateOverride !== undefined ? dateOverride : selectedDate;
      const url = dateToFetch ? `/quality/queue?date=${dateToFetch}` : '/quality/queue';
      const res: any = await apiRequest(url);
      setCentreInfo(res.centre);

      const normalizedQueue: QualityQueueItem[] = (res.queue || []).map((item: any, idx: number) => ({
        ...item,
        id: item.bookingId || item.id || `quality-lot-${idx}`,
        finalWeightQuintals: item.actualWeightQuintals ?? item.finalWeightQuintals ?? item.expectedQuantityQuintals,
        commodityName: item.commodityName || 'Wheat (गेहूं)',
      }));

      setQueue(normalizedQueue);

      // Auto-select first active item if none selected or previous item no longer pending
      const pendingItems = normalizedQueue.filter((i) => i.status === 'QUALITY_ASSESSMENT');
      if (pendingItems.length > 0) {
        if (!selectedBooking || !pendingItems.some((i) => i.id === selectedBooking.id)) {
          setSelectedBooking(pendingItems[0]);
        }
      } else {
        setSelectedBooking(null);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load quality queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue(selectedDate);
  }, [selectedDate]);

  // Active items awaiting quality assessment
  const activeQueue = useMemo(() => {
    return queue.filter((item) => item.status === 'QUALITY_ASSESSMENT');
  }, [queue]);

  // Completed quality assessments
  const processedHistory = useMemo(() => {
    return queue
      .filter((item) => item.status !== 'QUALITY_ASSESSMENT')
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

  const handleSubmitQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const moisture = parseFloat(moistureContentPercent);
    const foreign = parseFloat(foreignMatterPercent);
    const damaged = parseFloat(damagedGrainPercent);

    if (isNaN(moisture) || isNaN(foreign) || isNaN(damaged)) {
      alert('Please provide valid numerical percentages for quality parameters.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(`/quality/${selectedBooking.id}`, {
        method: 'POST',
        body: {
          moisturePercent: moisture,
          grade: qualityGrade,
          foreignMatterPercent: foreign,
          damagedGrainPercent: damaged,
          remarks: remarks.trim() || undefined,
        },
      });

      alert(
        `Quality Assessment recorded for #${selectedBooking.bookingNumber}. Grade: ${qualityGrade}. Transferred to Procurement Queue.`,
      );
      setSelectedBooking(null);
      setRemarks('');
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to record quality assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logoutPortal('operations');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Operations Action Header */}
      <div className="bg-[#151C2F] rounded-2xl border border-[#334155] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Quality Assessment
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 font-mono uppercase tracking-wider">
                FAQ GRADING STATION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {centreInfo?.name || 'Procurement Depot'} &bull; Moisture testing, purity inspection, and official MSP quality certification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => loadQueue()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-[#334155] bg-[#0B1020] hover:bg-[#1B2438] text-slate-200 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
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

      {/* Main Tabs: Active Queue vs Daily Processed History */}
      <div className="flex items-center gap-2 border-b border-[#334155] pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'queue'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2F]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>Active Quality Queue ({activeQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2F]'
          }`}
        >
          <History className="w-4 h-4 text-teal-400" />
          <span>Completed Assessments & Daily History ({processedHistory.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-200 text-xs flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: ACTIVE QUALITY QUEUE & TESTING DESK                            */}
      {/* ===================================================================== */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Farmers Awaiting Quality Certification */}
          <div className="lg:col-span-5 space-y-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-1 shrink-0">
              <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Awaiting Lab Testing Queue</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded bg-[#151C2F] text-teal-300 border border-[#334155] font-mono font-semibold">
                {activeQueue.length} awaiting testing
              </span>
            </div>

            {loading && activeQueue.length === 0 ? (
              <div className="p-8 text-center bg-[#151C2F] rounded-2xl border border-[#334155] text-slate-400 text-xs">
                Loading awaiting farmer lots...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="p-10 text-center bg-[#151C2F] rounded-2xl border border-[#334155] text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-200">Quality Testing Queue Clear</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  All weighed farmer arrivals have been tested. New lots appear automatically after weighbridge capture.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1 operations-queue-scroll max-h-[580px] min-h-0">
                {activeQueue.map((item) => {
                  const isSelected = selectedBooking?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBooking(item)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-teal-500/80 bg-teal-950/20 shadow-md ring-1 ring-teal-500/30'
                          : 'border-[#334155] bg-[#151C2F] hover:bg-[#1B2438] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-teal-400">
                            #{item.bookingNumber}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-0.5">{item.farmerName}</h3>
                          <p className="text-xs text-slate-400 font-mono">
                            ID: {item.farmerCode} &bull; {item.farmerMobile ? item.farmerMobile.slice(-4).padStart(10, 'X') : 'XXXX'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950/70 text-teal-300 border border-teal-700/60 uppercase tracking-wide font-mono">
                          WEIGHED
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#334155]/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">CROP: <strong className="text-slate-200">{item.commodityName}</strong></span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Confirmed Weight</span>
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

          {/* Right Column: Lab Testing & Certification Workspace */}
          <div className="lg:col-span-7">
            {selectedBooking ? (
              <form
                onSubmit={handleSubmitQuality}
                className="bg-[#151C2F] rounded-2xl border border-[#334155] p-5 sm:p-6 space-y-5 shadow-xl"
              >
                <div className="border-b border-[#334155] pb-4 flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">
                      Active Sample Lot #{selectedBooking.bookingNumber}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      {selectedBooking.farmerName}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedBooking.commodityName} &bull; Weighed Weight: <strong className="text-emerald-400 font-mono">{selectedBooking.finalWeightQuintals} Quintals</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Weighed At</span>
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      {selectedBooking.deviceCode || 'Scale-01'}
                    </span>
                  </div>
                </div>

                {/* Moisture & Foreign Matter Inputs */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-teal-400" />
                    <span>Lab Test Parameters (Mandatory)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Moisture % */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Moisture % *</span>
                        <span className="text-[10px] text-slate-400 font-mono">FAQ: &le; 14%</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="40"
                          required
                          value={moistureContentPercent}
                          onChange={(e) => setMoistureContentPercent(e.target.value)}
                          className="w-full bg-[#0B1020] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                        />
                        <Percent className="w-3 h-3 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    {/* Foreign Matter % */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Foreign Matter % *</span>
                        <span className="text-[10px] text-slate-400 font-mono">FAQ: &le; 2.0%</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="30"
                          required
                          value={foreignMatterPercent}
                          onChange={(e) => setForeignMatterPercent(e.target.value)}
                          className="w-full bg-[#0B1020] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                        />
                        <Percent className="w-3 h-3 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    {/* Damaged Grain % */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Damaged Grain % *</span>
                        <span className="text-[10px] text-slate-400 font-mono">FAQ: &le; 4.0%</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="40"
                          required
                          value={damagedGrainPercent}
                          onChange={(e) => setDamagedGrainPercent(e.target.value)}
                          className="w-full bg-[#0B1020] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                        />
                        <Percent className="w-3 h-3 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grade Selection */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Official Quality Grade *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'GRADE_A', label: 'Grade A', desc: 'Premium / Full MSP', border: 'border-teal-500', activeBg: 'bg-teal-950/40 text-teal-300' },
                      { key: 'GRADE_B', label: 'Grade B (FAQ)', desc: 'Standard Quality', border: 'border-emerald-500', activeBg: 'bg-emerald-950/40 text-emerald-300' },
                      { key: 'GRADE_C', label: 'Grade C', desc: 'Minor Deductions', border: 'border-amber-500', activeBg: 'bg-amber-950/40 text-amber-300' },
                      { key: 'REJECTED', label: 'Rejected', desc: 'Fails Specifications', border: 'border-rose-500', activeBg: 'bg-rose-950/40 text-rose-300' },
                    ].map((g) => {
                      const isSelected = qualityGrade === g.key;
                      return (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setQualityGrade(g.key as any)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? `${g.border} ${g.activeBg} ring-1 ring-teal-500/30 shadow-md`
                              : 'border-[#334155] bg-[#0B1020] hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{g.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{g.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inspector Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Inspector Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Record lab observation notes, moisture meter sample readings, or purity observations..."
                    className="w-full bg-[#0B1020] border border-[#334155] rounded-xl px-3.5 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Certifying Quality...'
                      : `Certify Quality as ${qualityGrade.replace(/_/g, ' ')}`}
                  </span>
                </button>
              </form>
            ) : (
              <div className="bg-[#151C2F] rounded-2xl border border-[#334155] p-12 text-center text-slate-400 space-y-2">
                <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-200">No Lot Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a weighed farmer arrival from the left queue to begin official lab inspection and quality certification.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: COMPLETED QUALITY ASSESSMENTS / DAILY HISTORY                  */}
      {/* ===================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-[#151C2F] rounded-xl border border-[#334155] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-semibold text-slate-300">Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-[#0B1020] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    selectedDate === todayStr ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-[#0B1020] text-slate-400 hover:text-white border border-[#334155]'
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
                className="w-full bg-[#0B1020] border border-[#334155] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Processed History Table */}
          <div className="bg-[#151C2F] rounded-2xl border border-[#334155] overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-[#334155] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Certified Lots ({processedHistory.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official lab test records for {selectedDate}
                </p>
              </div>
            </div>

            {processedHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No Quality Records Found</p>
                <p className="text-[11px] text-slate-500">No farmer lots were certified for {selectedDate}.</p>
              </div>
            ) : (
              <div className="max-h-[580px] overflow-y-auto operations-queue-scroll overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0F172A] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-[#334155]">
                    <tr>
                      <th className="py-3 px-4">Booking Number</th>
                      <th className="py-3 px-4">Farmer Details</th>
                      <th className="py-3 px-4">Weighed Qtl</th>
                      <th className="py-3 px-4">Moisture %</th>
                      <th className="py-3 px-4">Foreign Matter %</th>
                      <th className="py-3 px-4">Damaged Grain %</th>
                      <th className="py-3 px-4">Quality Grade</th>
                      <th className="py-3 px-4">Certified At</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60 font-sans">
                    {processedHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-[#1B2438] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-teal-400 whitespace-nowrap">
                          #{item.bookingNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-white">{item.farmerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.farmerCode}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {item.finalWeightQuintals} Qtl
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {item.quality?.moisturePercent !== undefined ? `${item.quality.moisturePercent}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {item.quality?.foreignMatterPercent !== undefined ? `${item.quality.foreignMatterPercent}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {item.quality?.damagedGrainPercent !== undefined ? `${item.quality.damagedGrainPercent}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono ${
                              item.quality?.grade === 'GRADE_A'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                : item.quality?.grade === 'GRADE_B'
                                ? 'bg-teal-950 text-teal-300 border border-teal-700/60'
                                : item.quality?.grade === 'GRADE_C'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                                : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                            }`}
                          >
                            {item.quality?.grade ? item.quality.grade.replace(/_/g, ' ') : 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {item.quality?.assessedAt
                            ? new Date(item.quality.assessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0B1020] text-slate-300 border border-[#334155] uppercase font-mono">
                            {item.status.replace(/_/g, ' ')}
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

export default function QualityDashboardPage() {
  return (
    <StationGuard allowedRoles={['QUALITY_OFFICER', 'QUALITY', 'GOVERNMENT_ADMIN']} stationName="Grain Quality & Lab Testing">
      <QualityDashboardContent />
    </StationGuard>
  );
}
