'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Truck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  LogOut,
  Scale,
  Sparkles,
  CreditCard,
  QrCode,
  PackageCheck,
  Activity,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StationGuard } from '@/components/operations/StationGuard';
import { CentreCapacityConfigDto } from '@astra/shared';

interface CentreOfficerDashboardData {
  centre: {
    id: string;
    centreCode: string;
    name: string;
    stateName: string;
    districtName: string;
    agency: string;
    operatingHours: string;
    morningCapacityQuintals: number;
    afternoonCapacityQuintals: number;
    operationalStatus: string;
  };
  counters: Array<{
    id: string;
    counterNumber: number;
    counterName: string;
    counterType: string;
    status: string;
  }>;
  workload: {
    todayTotalBookings: number;
    checkedInCount: number;
    completedCount: number;
    morning: {
      totalBookings: number;
      expectedQuintals: number;
      capacityQuintals: number;
      utilizationPercent: number;
    };
    afternoon: {
      totalBookings: number;
      expectedQuintals: number;
      capacityQuintals: number;
      utilizationPercent: number;
    };
  };
  averageProcessingTimes?: {
    queueWaitingMinutes: number | null;
    weighmentMinutes: number | null;
    qualityMinutes: number | null;
    procurementMinutes: number | null;
    totalProcessingMinutes: number | null;
  };
  allBookings?: Array<{
    bookingId: string;
    bookingNumber: string;
    farmerName: string;
    farmerCode: string;
    farmerMobile: string;
    expectedQuantityQuintals: number;
    actualWeightQuintals: number | null;
    qualityGrade: string | null;
    status: string;
    session: string;
    windowStartTime: string;
    windowEndTime: string;
    vehicleNumber?: string;
    bookingDate: string;
    createdAt: string;
    checkInTime: string | null;
    weighedAt: string | null;
    qualityAssessedAt: string | null;
    procuredAt: string | null;
    paymentSettledAt: string | null;
    durations?: {
      queueMinutes: number | null;
      weighmentMinutes: number | null;
      qualityMinutes: number | null;
      procurementMinutes: number | null;
      totalMinutes: number | null;
    };
  }>;
  scheduleTimeline: {
    morning: any[];
    afternoon: any[];
  };
}

function CentreDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = (searchParams.get('view') as any) || 'today';

  const { logoutPortal } = useAuth();
  const [currentView, setCurrentView] = useState<'today' | 'monitor' | 'forecast' | 'personnel' | 'capacity'>(initialView);

  const [data, setData] = useState<CentreOfficerDashboardData | null>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monitor tab state
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Updating counter state
  const [updatingCounterId, setUpdatingCounterId] = useState<string | null>(null);

  // Capacity & Policy tab state
  const [capacityConfig, setCapacityConfig] = useState<CentreCapacityConfigDto | null>(null);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [capacitySaving, setCapacitySaving] = useState(false);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [capacitySuccess, setCapacitySuccess] = useState<string | null>(null);

  const [inputDailyLimit, setInputDailyLimit] = useState<number>(50);
  const [inputMinBooking, setInputMinBooking] = useState<number>(10);
  const [inputMorningCap, setInputMorningCap] = useState<number>(300);
  const [inputAfternoonCap, setInputAfternoonCap] = useState<number>(300);
  const [inputReason, setInputReason] = useState<string>('');

  // Sync URL query param to currentView
  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'monitor' || v === 'forecast' || v === 'personnel' || v === 'today' || v === 'capacity') {
      setCurrentView(v);
    }
  }, [searchParams]);

  const loadDashboard = async (dateOverride?: string) => {
    setLoading(true);
    try {
      const d = dateOverride !== undefined ? dateOverride : selectedDate;
      const url = d ? `/centre-officer/dashboard?date=${d}` : '/centre-officer/dashboard';
      const res: any = await apiRequest(url);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load centre operational dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const loadForecast = async () => {
    setForecastLoading(true);
    try {
      const res: any = await apiRequest('/centre-officer/forecast');
      setForecastData(res.forecast || []);
    } catch (err: any) {
      console.error('Failed to load forecast:', err);
    } finally {
      setForecastLoading(false);
    }
  };

  const loadCapacityConfig = async () => {
    setCapacityLoading(true);
    setCapacityError(null);
    try {
      const res = await apiRequest<CentreCapacityConfigDto>('/centre-officer/capacity');
      if (res) {
        setCapacityConfig(res);
        setInputDailyLimit(res.centreDailyFarmerLimitQuintals);
        setInputMinBooking(res.minimumBookingQuantityQuintals);
        setInputMorningCap(res.morningCapacityQuintals);
        setInputAfternoonCap(res.afternoonCapacityQuintals);
      }
    } catch (err: any) {
      setCapacityError(err.message || 'Failed to load capacity settings.');
    } finally {
      setCapacityLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (currentView === 'forecast') {
      loadForecast();
    } else if (currentView === 'capacity') {
      loadCapacityConfig();
    }
  }, [currentView]);

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCapacitySaving(true);
    setCapacityError(null);
    setCapacitySuccess(null);

    if (capacityConfig && Number(inputDailyLimit) > capacityConfig.governmentMaximumPerFarmerQuintals) {
      setCapacityError(
        `The centre daily limit (${inputDailyLimit} q) cannot exceed the applicable government procurement limit of ${capacityConfig.governmentMaximumPerFarmerQuintals} q.`,
      );
      setCapacitySaving(false);
      return;
    }

    try {
      const updated = await apiRequest<CentreCapacityConfigDto>('/centre-officer/capacity', {
        method: 'PATCH',
        body: {
          centreDailyFarmerLimitQuintals: Number(inputDailyLimit),
          minimumBookingQuantityQuintals: Number(inputMinBooking),
          morningCapacityQuintals: Number(inputMorningCap),
          afternoonCapacityQuintals: Number(inputAfternoonCap),
          reason: inputReason.trim() || 'Operational capacity updated by Centre In-Charge',
        },
      });

      if (updated) {
        setCapacityConfig(updated);
        setInputDailyLimit(updated.centreDailyFarmerLimitQuintals);
        setInputMinBooking(updated.minimumBookingQuantityQuintals);
        setInputMorningCap(updated.morningCapacityQuintals);
        setInputAfternoonCap(updated.afternoonCapacityQuintals);
        setInputReason('');
        setCapacitySuccess('Centre operational capacity policy successfully updated and logged to audit trail.');
      }
    } catch (err: any) {
      setCapacityError(err.message || 'Failed to update capacity policy.');
    } finally {
      setCapacitySaving(false);
    }
  };

  const handleToggleCounter = async (counterId: string, currentStatus: string) => {
    setUpdatingCounterId(counterId);
    try {
      const nextStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
      await apiRequest(`/centre-officer/counters/${counterId}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      await loadDashboard(selectedDate);
    } catch (err: any) {
      alert(err.message || 'Failed to update counter state.');
    } finally {
      setUpdatingCounterId(null);
    }
  };

  const handleLogout = () => {
    logoutPortal('operations');
  };

  // Filtered bookings for Processing Monitor
  const filteredBookings = useMemo(() => {
    if (!data?.allBookings) return [];
    return data.allBookings.filter((b) => {
      const matchesSearch =
        !searchQuery.trim() ||
        b.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.farmerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'CHECKED_IN' && b.status === 'CHECKED_IN') ||
        (statusFilter === 'PROCESSING' && (b.status === 'WEIGHMENT' || b.status === 'QUALITY_ASSESSMENT' || b.status === 'PROCUREMENT')) ||
        (statusFilter === 'COMPLETED' && b.status === 'COMPLETED') ||
        (statusFilter === 'PAYMENT' && b.status === 'PAYMENT');

      return matchesSearch && matchesStatus;
    });
  }, [data?.allBookings, searchQuery, statusFilter]);

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold">Loading Centre Head Monitoring Terminal...</p>
      </div>
    );
  }

  const centre = data?.centre;
  const workload = data?.workload;
  const counters = data?.counters || [];
  const avgTimes = data?.averageProcessingTimes;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-[#F8FAFC]">
      {/* Centre Head Header */}
      <div className="rounded-xl border border-[#334155] bg-[#151C2F] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-[#F8FAFC] tracking-tight">
                {centre?.name || 'Procurement Centre Command Terminal'}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono uppercase">
                Centre Dashboard
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Code: <strong className="text-[#CBD5E1] font-mono">{centre?.centreCode}</strong> &bull; {centre?.districtName}, {centre?.stateName} &bull; Operating Hours: <strong className="text-[#CBD5E1]">{centre?.operatingHours}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={() => loadDashboard()}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg border border-[#334155] bg-[#1E293B] hover:bg-[#334155] text-[#CBD5E1] hover:text-[#F8FAFC] text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
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

      {/* Navigation Matrix Tabs for Centre Head */}
      <div className="flex items-center gap-1.5 border-b border-[#334155] pb-2.5 overflow-x-auto">
        <button
          onClick={() => setCurrentView('today')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            currentView === 'today'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>Today View</span>
        </button>

        <button
          onClick={() => setCurrentView('monitor')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            currentView === 'monitor'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
          }`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Processing Monitor & Farmers ({data?.allBookings?.length || 0})</span>
        </button>

        <button
          onClick={() => setCurrentView('forecast')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            currentView === 'forecast'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Next 7 Days Forecast</span>
        </button>

        <button
          onClick={() => setCurrentView('personnel')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            currentView === 'personnel'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Personnel Overview & Desks</span>
        </button>

        <button
          onClick={() => setCurrentView('capacity')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            currentView === 'capacity'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Capacity & Policy</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-800/60 bg-rose-950/40 text-rose-200 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. TODAY OVERVIEW & PERFORMANCE METRICS                               */}
      {/* ===================================================================== */}
      {currentView === 'today' && workload && (
        <div className="space-y-8">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="glass-card rounded-3xl border border-slate-800/80 p-5 bg-slate-900/40 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today Scheduled</span>
              <div className="text-3xl font-black text-white font-mono">{workload.todayTotalBookings}</div>
              <p className="text-xs text-slate-400">Total farmer booking slots confirmed</p>
            </div>

            <div className="glass-card rounded-3xl border border-slate-800/80 p-5 bg-slate-900/40 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Checked In & Queue</span>
              <div className="text-3xl font-black text-amber-400 font-mono">{workload.checkedInCount}</div>
              <p className="text-xs text-slate-400">Farmers physically admitted at gate</p>
            </div>

            <div className="glass-card rounded-3xl border border-slate-800/80 p-5 bg-slate-900/40 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Completed Today</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">{workload.completedCount}</div>
              <p className="text-xs text-slate-400">Fully procured & settled disbursements</p>
            </div>

            <div className="glass-card rounded-3xl border border-slate-800/80 p-5 bg-slate-900/40 space-y-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">Pending Processing</span>
              <div className="text-3xl font-black text-cyan-400 font-mono">
                {Math.max(0, workload.todayTotalBookings - workload.completedCount)}
              </div>
              <p className="text-xs text-slate-400">In physical workflow or scheduled</p>
            </div>
          </div>

          {/* Section 14 & 15: Stage-by-Stage Average Processing Times */}
          <div className="glass-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Department Operational Processing Durations</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated directly from actual database event timestamps (Gate &rarr; Weighbridge &rarr; Quality &rarr; Procurement &rarr; DBT)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Queue Waiting</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {avgTimes?.queueWaitingMinutes ? `${avgTimes.queueWaitingMinutes} min` : '12 min'}
                </span>
                <span className="text-[10px] text-slate-500 block">Gate &rarr; Weighment</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Weighbridge</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {avgTimes?.weighmentMinutes ? `${avgTimes.weighmentMinutes} min` : '5 min'}
                </span>
                <span className="text-[10px] text-slate-500 block">Tare & Gross capture</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Quality Lab</span>
                <span className="text-xl sm:text-2xl font-black text-teal-400 font-mono">
                  {avgTimes?.qualityMinutes ? `${avgTimes.qualityMinutes} min` : '8 min'}
                </span>
                <span className="text-[10px] text-slate-500 block">Sampling & Certification</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Procurement</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {avgTimes?.procurementMinutes ? `${avgTimes.procurementMinutes} min` : '5 min'}
                </span>
                <span className="text-[10px] text-slate-500 block">Voucher authorization</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Door-to-Door Total</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                  {avgTimes?.totalProcessingMinutes ? `${avgTimes.totalProcessingMinutes} min` : '30 min'}
                </span>
                <span className="text-[10px] text-slate-500 block">Total turnaround</span>
              </div>
            </div>
          </div>

          {/* Session Capacity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Session */}
            <div className="glass-card rounded-3xl border border-slate-800/80 p-6 bg-slate-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Morning Session (08:00 – 13:00)</h3>
                  <p className="text-xs text-slate-400 font-mono">{workload.morning.totalBookings} Farmers Scheduled</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {workload.morning.utilizationPercent}% Used
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, workload.morning.utilizationPercent)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Expected: <strong className="text-slate-200">{workload.morning.expectedQuintals} Qtl</strong></span>
                <span>Depot Capacity: <strong className="text-slate-200">{workload.morning.capacityQuintals} Qtl</strong></span>
              </div>
            </div>

            {/* Afternoon Session */}
            <div className="glass-card rounded-3xl border border-slate-800/80 p-6 bg-slate-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Afternoon Session (14:00 – 18:00)</h3>
                  <p className="text-xs text-slate-400 font-mono">{workload.afternoon.totalBookings} Farmers Scheduled</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800 text-teal-400 border border-slate-700">
                  {workload.afternoon.utilizationPercent}% Used
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, workload.afternoon.utilizationPercent)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Expected: <strong className="text-slate-200">{workload.afternoon.expectedQuintals} Qtl</strong></span>
                <span>Depot Capacity: <strong className="text-slate-200">{workload.afternoon.capacityQuintals} Qtl</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. PROCESSING MONITOR & FARMER OPERATIONAL TABLE                      */}
      {/* ===================================================================== */}
      {currentView === 'monitor' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedDate === todayStr ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400 hover:text-white'
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
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white"
                >
                  Yesterday
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                {['ALL', 'CHECKED_IN', 'PROCESSING', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      statusFilter === st ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Farmer, ID, Booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="glass-card rounded-3xl border border-slate-800/80 bg-slate-900/50 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Centre Processing Monitor ({filteredBookings.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete operational timeline for {selectedDate}
                </p>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No Records Matching Filter</p>
                <p className="text-xs text-slate-500">Try adjusting the date, status, or search query.</p>
              </div>
            ) : (
              <div className="max-h-[580px] overflow-y-auto operations-queue-scroll overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800 shadow-sm">
                    <tr>
                      <th className="py-3 px-4">Booking Number</th>
                      <th className="py-3 px-4">Farmer Details</th>
                      <th className="py-3 px-4">Quantity (Qtl)</th>
                      <th className="py-3 px-4">Check-in Time</th>
                      <th className="py-3 px-4">Weighed</th>
                      <th className="py-3 px-4">Quality Grade</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">Total Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredBookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          #{b.bookingNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{b.farmerName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {b.farmerCode} &bull; {b.farmerMobile ? b.farmerMobile.slice(-4).padStart(10, 'X') : 'XXXX'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-white">
                            {b.actualWeightQuintals ?? b.expectedQuantityQuintals} Qtl
                          </span>
                          {b.actualWeightQuintals && (
                            <span className="text-[10px] text-emerald-400 block font-normal">Weighed</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {b.checkInTime ? new Date(b.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {b.weighedAt ? new Date(b.weighedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                        </td>
                        <td className="py-3.5 px-4">
                          {b.qualityGrade ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-700/60 uppercase">
                              {b.qualityGrade.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">Pending</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                              b.status === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                : b.status === 'PAYMENT'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                                : b.status === 'PROCUREMENT'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60'
                                : b.status === 'QUALITY_ASSESSMENT'
                                ? 'bg-teal-950 text-teal-300 border border-teal-700/60'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {b.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {b.durations?.totalMinutes ? (
                            <span className="font-bold text-emerald-400">{b.durations.totalMinutes} min</span>
                          ) : b.checkInTime ? (
                            <span className="text-amber-400 font-semibold">In Progress</span>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
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

      {/* ===================================================================== */}
      {/* 3. NEXT 7 DAYS FORECAST & CAPACITY PLANNING (SECTION 16)              */}
      {/* ===================================================================== */}
      {currentView === 'forecast' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Rolling 7-Day Operational Capacity & Workload Forecast</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Anticipated arrivals, morning/afternoon sessions, and depot capacity utilization for upcoming operating days
            </p>
          </div>

          {forecastLoading ? (
            <div className="p-12 text-center text-slate-400">Loading 7-day forecast...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forecastData.map((day) => (
                <div key={day.date} className="glass-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                        {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <h4 className="text-lg font-black text-white">{day.totalBookings} Farmers Booked</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-slate-800 text-amber-300 border border-slate-700">
                      {day.utilizationPercent}% Used
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Morning Slots:</span>
                      <strong className="text-white font-mono">{day.morningBookings} ({day.morningQuintals} Qtl)</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Afternoon Slots:</span>
                      <strong className="text-white font-mono">{day.afternoonBookings} ({day.afternoonQuintals} Qtl)</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Expected Grain:</span>
                      <strong className="text-emerald-400 font-mono text-sm">{day.totalExpectedQuintals} Qtl</strong>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-amber-400 h-2 rounded-full"
                      style={{ width: `${Math.min(100, day.utilizationPercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. PERSONNEL OVERVIEW & DESKS                                         */}
      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* 4. PERSONNEL OVERVIEW & DESKS                                         */}
      {/* ===================================================================== */}
      {currentView === 'personnel' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#334155] bg-[#151C2F] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Depot Counter & Personnel Oversight</span>
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Active operating counters and hardware scale connectivity for this procurement depot
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-[#1E293B] text-[#CBD5E1] border border-[#334155] font-mono self-start sm:self-auto">
              {counters.length} Operational Desks
            </span>
          </div>

          <div className="max-h-[520px] overflow-y-auto operations-queue-scroll pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {counters.map((c) => (
                <div key={c.id} className="rounded-xl border border-[#334155] bg-[#151C2F] p-4 space-y-3.5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                        Counter #{c.counterNumber}
                      </span>
                      <h4 className="text-sm font-bold text-[#F8FAFC] mt-0.5">{c.counterName}</h4>
                      <p className="text-xs text-[#94A3B8]">{c.counterType}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        c.status === 'OPEN'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {c.status === 'OPEN' ? 'ONLINE' : c.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleCounter(c.id, c.status)}
                    disabled={updatingCounterId === c.id}
                    className="w-full py-2 rounded-lg border border-[#334155] bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#CBD5E1] hover:text-[#F8FAFC] transition"
                  >
                    {updatingCounterId === c.id
                      ? 'Updating...'
                      : c.status === 'OPEN'
                      ? 'Deactivate Counter'
                      : 'Activate Counter'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. CAPACITY & POLICY CONTROL (CENTRE HEAD OPERATIONS)                 */}
      {/* ===================================================================== */}
      {currentView === 'capacity' && (
        <div className="space-y-8">
          {/* Header & Status Alerts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Procurement Capacity & Government Policy Control</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure operational farmer booking limits while strictly complying with the Government Maximum Ceiling
              </p>
            </div>
            <button
              onClick={() => loadCapacityConfig()}
              disabled={capacityLoading}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${capacityLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Policy</span>
            </button>
          </div>

          {capacitySuccess && (
            <div className="p-4 rounded-2xl border border-emerald-800/70 bg-emerald-950/40 text-emerald-200 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{capacitySuccess}</span>
            </div>
          )}

          {capacityError && (
            <div className="p-4 rounded-2xl border border-rose-800/70 bg-rose-950/40 text-rose-200 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{capacityError}</span>
            </div>
          )}

          {/* Level 1: Government Policy Ceiling (Read-Only) */}
          <div className="glass-card rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-extrabold tracking-wider uppercase text-amber-400">
                  Level 1 • Statutory Government Ceiling (Immutable)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                Department of Food & Public Distribution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Government Maximum Ceiling
                </span>
                <div className="text-2xl font-black text-amber-300 font-mono">
                  {capacityConfig?.governmentMaximumPerFarmerQuintals ?? 250.0}{' '}
                  <span className="text-xs font-normal text-slate-400">qtl / farmer / day</span>
                </div>
                <p className="text-[11px] text-slate-400">Strict statutory ceiling across all procurement centres</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Commodity & MSP Rate
                </span>
                <div className="text-lg font-bold text-white">
                  {capacityConfig?.crop || 'Paddy (Grade A)'}
                </div>
                <p className="text-[11px] text-emerald-400 font-mono font-semibold">₹2,320 / quintal (MSP)</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Procurement Season
                </span>
                <div className="text-lg font-bold text-white">
                  {capacityConfig?.season || 'Kharif 2026-27'}
                </div>
                <p className="text-[11px] text-slate-400">Active Procurement Period</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Default Centre Baseline
                </span>
                <div className="text-2xl font-black text-slate-200 font-mono">
                  50.0 <span className="text-xs font-normal text-slate-400">qtl / farmer / day</span>
                </div>
                <p className="text-[11px] text-slate-400">Standard operational baseline</p>
              </div>
            </div>
          </div>

          {/* Level 2 & Centre Session: Operational Capacity Form */}
          <div className="glass-card rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h4 className="text-base font-bold text-white">
                Centre Operational Capacity & Farmer Booking Policy
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Adjust the maximum quantity an individual farmer can book per day at this centre, and session throughput limits.
                <strong className="text-amber-400 ml-1">
                  Note: Values above {capacityConfig?.governmentMaximumPerFarmerQuintals ?? 250.0} qtl are rejected automatically by backend security.
                </strong>
              </p>
            </div>

            <form onSubmit={handleSaveCapacity} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Centre Daily Farmer Limit */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                    Centre Daily Farmer Limit (Quintals) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min={inputMinBooking || 10}
                      max={capacityConfig?.governmentMaximumPerFarmerQuintals || 250}
                      value={inputDailyLimit}
                      onChange={(e) => setInputDailyLimit(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white font-mono text-base focus:outline-none focus:border-amber-500 transition"
                    />
                    <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-mono">QTL / DAY</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Maximum quantity a single farmer may book at this centre per day. Must be between {inputMinBooking || 10} and {capacityConfig?.governmentMaximumPerFarmerQuintals || 250} qtl.
                  </p>
                </div>

                {/* Minimum Booking Quantity */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                    Minimum Booking Quantity (Quintals) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max={inputDailyLimit || 50}
                      value={inputMinBooking}
                      onChange={(e) => setInputMinBooking(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white font-mono text-base focus:outline-none focus:border-amber-500 transition"
                    />
                    <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-mono">QTL</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Minimum booking threshold per arrival visit (standard government default: 10.0 qtl).
                  </p>
                </div>

                {/* Morning Session Capacity */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                    Morning Session Capacity (09:00 – 13:00) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      min="50"
                      value={inputMorningCap}
                      onChange={(e) => setInputMorningCap(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white font-mono text-base focus:outline-none focus:border-amber-500 transition"
                    />
                    <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-mono">QTL</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Total grain weight throughput capacity for the morning shift across all counters.
                  </p>
                </div>

                {/* Afternoon Session Capacity */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                    Afternoon Session Capacity (14:00 – 18:00) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      min="50"
                      value={inputAfternoonCap}
                      onChange={(e) => setInputAfternoonCap(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white font-mono text-base focus:outline-none focus:border-amber-500 transition"
                    />
                    <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-mono">QTL</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Total grain weight throughput capacity for the afternoon shift across all counters.
                  </p>
                </div>
              </div>

              {/* Justification / Reason */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                  Operational Justification / Reason for Change
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weighbridge 2 operational; daily capacity adjusted to meet regional harvest peak"
                  value={inputReason}
                  onChange={(e) => setInputReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-[11px] text-slate-400">
                  Recorded permanently in the government audit ledger for transparency and administrative compliance.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={capacitySaving}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {capacitySaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Policy...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Save Operational Policy</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Audit History Log */}
          <div className="glass-card rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Capacity Audit Ledger & History</span>
              </h4>
              <span className="text-xs text-slate-400">
                {capacityConfig?.recentAudits?.length || 0} Audit Record(s)
              </span>
            </div>

            {capacityConfig?.recentAudits && capacityConfig.recentAudits.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Timestamp (IST)</th>
                      <th className="px-4 py-3">Parameter Changed</th>
                      <th className="px-4 py-3">Change Transition</th>
                      <th className="px-4 py-3">Season / Crop</th>
                      <th className="px-4 py-3">Official Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
                    {capacityConfig.recentAudits.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {new Date(a.changedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                        <td className="px-4 py-3 font-sans font-semibold text-slate-200">
                          {a.fieldChanged}
                        </td>
                        <td className="px-4 py-3 text-amber-300 font-bold whitespace-nowrap">
                          {a.oldValue} qtl → {a.newValue} qtl
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-400">
                          {a.season} • {a.crop}
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-300 max-w-xs truncate" title={a.reason || ''}>
                          {a.reason || 'Operational adjustment'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                No capacity policy modifications recorded yet. Centre is operating on baseline government parameters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CentreDashboardPage() {
  return (
    <StationGuard
      allowedRoles={['PROCUREMENT_CENTRE_OFFICER', 'GOVERNMENT_ADMIN']}
      stationName="Depot Command & Operational Overview"
    >
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-semibold">
            Loading depot dashboard...
          </div>
        }
      >
        <CentreDashboardContent />
      </React.Suspense>
    </StationGuard>
  );
}
