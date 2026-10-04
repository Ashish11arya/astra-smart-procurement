'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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

  const selectedBookingRef = useRef(selectedBooking);
  useEffect(() => {
    selectedBookingRef.current = selectedBooking;
  }, [selectedBooking]);

  const loadQueue = useCallback(async (dateOverride?: string) => {
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
        const currentSelected = selectedBookingRef.current;
        if (!currentSelected || !pendingItems.some((i) => i.id === currentSelected.id)) {
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
  }, [selectedDate]);

  useEffect(() => {
    loadQueue(selectedDate);
  }, [selectedDate, loadQueue]);

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
    <div className="w-full flex-1 flex flex-col bg-[#EEFaf7] text-slate-800 relative after:absolute after:top-full after:inset-x-0 after:h-[calc(72px+env(safe-area-inset-bottom))] after:bg-[#EEFaf7] md:after:hidden">
      <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-900 flex-1">
      {/* Top Operations Action Header */}
      <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Quality Assessment
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-600 border border-teal-200 font-mono uppercase tracking-wider">
                FAQ GRADING STATION
              </span>
            </div>
            <div className="text-base font-semibold text-slate-900 mt-1">
              {centreInfo?.name || 'Muzaffarpur Central Grain Procurement Depot'}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              Moisture testing, purity inspection, and official MSP quality certification
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => loadQueue()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Tabs: Active Queue vs Daily Processed History */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base leading-6 font-semibold transition-all ${
            activeTab === 'queue'
              ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white'
          }`}
        >
          <Sparkles className="w-5 h-5 text-teal-600" />
          <span>Active Quality Queue ({activeQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base leading-6 font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white'
          }`}
        >
          <History className="w-4 h-4 text-teal-600" />
          <span>Completed Assessments & Daily History ({processedHistory.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-50 text-rose-700 text-xs flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
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
              <div className="flex items-center space-x-2 text-[18px] leading-[26px] font-semibold font-sans text-slate-900">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Awaiting Lab Testing Queue</span>
              </div>
              <span className="text-[12px] leading-[18px] font-semibold font-sans px-2.5 py-1 rounded bg-white text-teal-700 border border-slate-200">
                {activeQueue.length} awaiting testing
              </span>
            </div>

            {loading && activeQueue.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-[18px] leading-[26px] font-semibold font-sans text-slate-500">
                Loading awaiting farmer lots...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
                <p className="text-[18px] leading-[26px] font-semibold font-sans text-slate-700">Quality Testing Queue Clear</p>
                <p className="text-base leading-6 font-normal font-sans text-slate-500 max-w-sm mx-auto">
                  All weighed farmer arrivals have been tested. New lots appear automatically after weighbridge capture.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-1 operations-queue-scroll min-h-0">
                {activeQueue.map((item) => {
                  const isSelected = selectedBooking?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBooking(item)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-teal-500/80 bg-teal-950/20 shadow-md ring-1 ring-teal-500/30'
                          : 'border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm leading-5 font-semibold font-sans text-teal-600">
                            #{item.bookingNumber}
                          </span>
                          <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900 mt-0.5">{item.farmerName}</h3>
                          <p className="text-[12px] leading-[18px] font-normal font-sans text-slate-500">
                            ID: {item.farmerCode} &bull; {item.farmerMobile ? item.farmerMobile.slice(-4).padStart(10, 'X') : 'XXXX'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[12px] leading-[18px] font-semibold font-sans bg-teal-950/70 text-teal-700 border border-teal-700/60">
                          WEIGHED
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[16px] leading-[24px]">
                        <span className="text-base leading-6 font-normal font-sans text-slate-500">CROP: <strong className="text-slate-700">{item.commodityName}</strong></span>
                        <div className="text-right">
                          <span className="text-[12px] leading-[18px] font-normal font-sans text-slate-500 block">Confirmed Weight</span>
                          <span className="text-base leading-6 font-semibold font-sans text-emerald-600">
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
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xl"
              >
                <div className="border-b border-slate-200 pb-4 flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-sm leading-5 font-semibold font-sans text-teal-600">
                      Active Sample Lot #{selectedBooking.bookingNumber}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                      {selectedBooking.farmerName}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedBooking.commodityName} &bull; Weighed Weight: <strong className="text-emerald-600 font-mono">{selectedBooking.finalWeightQuintals} Quintals</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Weighed At</span>
                    <span className="text-xs font-semibold text-slate-600 font-mono">
                      {selectedBooking.deviceCode || 'Scale-01'}
                    </span>
                  </div>
                </div>

                {/* Moisture & Foreign Matter Inputs */}
                <div className="space-y-3">
                  <h3 className="text-[18px] leading-[26px] font-semibold font-sans text-slate-900 flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-teal-600" />
                    <span>Lab Test Parameters (Mandatory)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Moisture % */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                        <span>Moisture % *</span>
                        <span className="text-[10px] text-slate-500 font-mono">FAQ: &le; 14%</span>
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base leading-6 font-normal font-sans text-slate-900 focus:outline-none focus:border-teal-500"
                        />
                        <Percent className="w-3 h-3 text-slate-500 absolute right-3 top-3" />
                      </div>
                    </div>

                    {/* Foreign Matter % */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                        <span>Foreign Matter % *</span>
                        <span className="text-[10px] text-slate-500 font-mono">FAQ: &le; 2.0%</span>
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base leading-6 font-normal font-sans text-slate-900 focus:outline-none focus:border-teal-500"
                        />
                        <Percent className="w-3 h-3 text-slate-500 absolute right-3 top-3" />
                      </div>
                    </div>

                    {/* Damaged Grain % */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                        <span>Damaged Grain % *</span>
                        <span className="text-[10px] text-slate-500 font-mono">FAQ: &le; 4.0%</span>
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base leading-6 font-normal font-sans text-slate-900 focus:outline-none focus:border-teal-500"
                        />
                        <Percent className="w-3 h-3 text-slate-500 absolute right-3 top-3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grade Selection */}
                <div className="space-y-2.5">
                  <label className="text-[18px] leading-[26px] font-semibold font-sans text-slate-900 block">
                    Official Quality Grade *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'GRADE_A', label: 'Grade A', desc: 'Premium / Full MSP', border: 'border-teal-500', activeBg: 'bg-teal-50 text-teal-700' },
                      { key: 'GRADE_B', label: 'Grade B (FAQ)', desc: 'Standard Quality', border: 'border-emerald-500', activeBg: 'bg-emerald-950/40 text-emerald-600' },
                      { key: 'GRADE_C', label: 'Grade C', desc: 'Minor Deductions', border: 'border-amber-500', activeBg: 'bg-amber-950/40 text-amber-600' },
                      { key: 'REJECTED', label: 'Rejected', desc: 'Fails Specifications', border: 'border-rose-500', activeBg: 'bg-rose-50 text-rose-600' },
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
                              : 'border-slate-200 bg-slate-50 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{g.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{g.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inspector Notes */}
                <div className="space-y-1.5">
                  <label className="text-[18px] leading-[26px] font-semibold font-sans text-slate-900">
                    Inspector Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Record lab observation notes, moisture meter sample readings, or purity observations..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-900 font-semibold text-xs shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
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
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
                <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-[18px] leading-[26px] font-semibold font-sans text-slate-900">No Lot Selected</h3>
                <p className="text-base leading-6 font-normal font-sans text-slate-500 max-w-sm mx-auto">
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
                    selectedDate === todayStr ? 'bg-teal-500/20 text-teal-600 border border-teal-500/40' : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Processed History Table */}
          <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900">Daily Certified Lots ({processedHistory.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official lab test records for {selectedDate}
                </p>
              </div>
            </div>

            {processedHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-[18px] leading-[26px] font-semibold font-sans text-slate-600">No Quality Records Found</p>
                <p className="text-base leading-6 font-normal font-sans text-slate-500">No farmer lots were certified for {selectedDate}.</p>
              </div>
            ) : (
              <div className="operations-queue-scroll overflow-x-auto">
                <table className="w-full text-sm leading-5 font-normal font-sans text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#E8F7F3] text-[#475569] font-sans text-sm leading-5 font-semibold border-b border-slate-200">
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
                      <tr key={item.id} className="hover:bg-slate-100 transition-colors">
                        <td className="py-3 px-4 font-semibold font-sans text-teal-600 whitespace-nowrap">
                          #{item.bookingNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-[15px] leading-5 font-semibold font-sans text-slate-900">{item.farmerName}</div>
                          <div className="text-[12px] leading-[18px] font-normal font-sans text-slate-500">{item.farmerCode}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold font-sans text-emerald-600 whitespace-nowrap">
                          {item.finalWeightQuintals} Qtl
                        </td>
                        <td className="py-3 px-4 font-normal font-sans text-slate-600 whitespace-nowrap">
                          {item.quality?.moisturePercent !== undefined ? `${item.quality.moisturePercent}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-normal font-sans text-slate-600 whitespace-nowrap">
                          {item.quality?.foreignMatterPercent !== undefined ? `${item.quality.foreignMatterPercent}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-normal font-sans text-slate-600 whitespace-nowrap">
                          {item.quality?.damagedGrainPercent !== undefined ? `${item.quality.damagedGrainPercent}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-[12px] leading-[18px] font-semibold font-sans ${
                              item.quality?.grade === 'GRADE_A'
                                ? 'bg-[#059669]/80 text-white'
                                : item.quality?.grade === 'GRADE_B'
                                ? 'bg-[#059669]/60 text-white'
                                : item.quality?.grade === 'GRADE_C'
                                ? 'bg-[#059669]/40 text-white'
                                : 'bg-rose-500/80 text-white'
                            }`}
                          >
                            {item.quality?.grade ? item.quality.grade.replace(/_/g, ' ') : 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-normal font-sans text-slate-500 whitespace-nowrap">
                          {item.quality?.assessedAt
                            ? new Date(item.quality.assessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-[12px] leading-[18px] font-semibold font-sans bg-slate-50 text-slate-600 border border-slate-200">
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
