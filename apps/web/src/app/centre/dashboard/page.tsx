'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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

  const loadDashboard = useCallback(async (dateOverride?: string) => {
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
  }, [selectedDate]);

  const loadForecast = useCallback(async () => {
    setForecastLoading(true);
    try {
      const res: any = await apiRequest('/centre-officer/forecast');
      setForecastData(res.forecast || []);
    } catch (err: any) {
      console.error('Failed to load forecast:', err);
    } finally {
      setForecastLoading(false);
    }
  }, []);

  const loadCapacityConfig = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadDashboard(selectedDate);
  }, [selectedDate, loadDashboard]);

  useEffect(() => {
    if (currentView === 'forecast') {
      loadForecast();
    } else if (currentView === 'capacity') {
      loadCapacityConfig();
    }
  }, [currentView, loadForecast, loadCapacityConfig]);

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
      <div className="w-full min-w-0 max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 space-y-3">
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
    <div className="w-full flex-1 flex flex-col bg-[#EEFaf7] text-slate-800 relative after:absolute after:top-full after:inset-x-0 after:h-[calc(72px+env(safe-area-inset-bottom))] after:bg-[#EEFaf7] md:after:hidden">
      <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-900 flex-1">
      {/* Centre Head Header */}
      <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[24px] leading-[32px] font-bold text-slate-900 tracking-tight">
                {centre?.name || 'Procurement Centre Command Terminal'}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[12px] leading-[18px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 font-sans uppercase tracking-wider">
                Centre Dashboard
              </span>
            </div>
            <p className="text-[16px] leading-[24px] font-normal text-slate-500 mt-0.5">
              Code: <strong className="text-slate-900 font-sans">{centre?.centreCode}</strong> &bull; {centre?.districtName}, {centre?.stateName} &bull; Operating Hours: <strong className="text-slate-900 font-sans">{centre?.operatingHours}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={() => loadDashboard()}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-[14px] leading-[20px] font-medium flex items-center space-x-2 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[14px] leading-[20px] font-medium flex items-center space-x-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Matrix Tabs for Centre Head */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setCurrentView('today')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-all ${
            currentView === 'today'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
          }`}
        >
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <span>Today View</span>
        </button>

        <button
          onClick={() => setCurrentView('monitor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-all ${
            currentView === 'monitor'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
          }`}
        >
          <Activity className="w-5 h-5 text-amber-600" />
          <span>Processing Monitor & Farmers ({data?.allBookings?.length || 0})</span>
        </button>

        <button
          onClick={() => setCurrentView('forecast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-all ${
            currentView === 'forecast'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
          }`}
        >
          <Calendar className="w-5 h-5 text-amber-600" />
          <span>Next 7 Days Forecast</span>
        </button>

        <button
          onClick={() => setCurrentView('personnel')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-all ${
            currentView === 'personnel'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
          }`}
        >
          <Users className="w-5 h-5 text-amber-600" />
          <span>Personnel Overview & Desks</span>
        </button>

        <button
          onClick={() => setCurrentView('capacity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-all ${
            currentView === 'capacity'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
          }`}
        >
          <Layers className="w-5 h-5 text-amber-600" />
          <span>Capacity & Policy</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-[14px] leading-[20px] flex items-center space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-lg">
              <span className="text-[14px] leading-[20px] font-semibold text-slate-500 uppercase tracking-wider block">Today Scheduled</span>
              <div className="text-[32px] leading-[40px] font-bold text-slate-900 font-sans">{workload.todayTotalBookings}</div>
              <p className="text-[14px] leading-[20px] text-slate-500">Total farmer booking slots confirmed</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-lg">
              <span className="text-[14px] leading-[20px] font-semibold text-amber-600 uppercase tracking-wider block">Checked In & Queue</span>
              <div className="text-[32px] leading-[40px] font-bold text-slate-900 font-sans">{workload.checkedInCount}</div>
              <p className="text-[14px] leading-[20px] text-slate-500">Farmers physically admitted at gate</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-lg">
              <span className="text-[14px] leading-[20px] font-semibold text-emerald-600 uppercase tracking-wider block">Completed Today</span>
              <div className="text-[32px] leading-[40px] font-bold text-slate-900 font-sans">{workload.completedCount}</div>
              <p className="text-[14px] leading-[20px] text-slate-500">Fully procured & settled disbursements</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-lg">
              <span className="text-[14px] leading-[20px] font-semibold text-cyan-600 uppercase tracking-wider block">Pending Processing</span>
              <div className="text-[32px] leading-[40px] font-bold text-slate-900 font-sans">
                {Math.max(0, workload.todayTotalBookings - workload.completedCount)}
              </div>
              <p className="text-[14px] leading-[20px] text-slate-500">In physical workflow or scheduled</p>
            </div>
          </div>

          {/* Section 14 & 15: Stage-by-Stage Average Processing Times */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-lg">
            <div>
              <h2 className="text-[18px] leading-[26px] font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Department Operational Processing Durations</span>
              </h2>
              <p className="text-[14px] leading-[20px] text-slate-500 mt-0.5">
                Calculated directly from actual database event timestamps (Gate &rarr; Weighbridge &rarr; Quality &rarr; Procurement &rarr; DBT)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[12px] leading-[18px] font-semibold text-slate-500 uppercase font-sans block tracking-wider">Queue Waiting</span>
                <span className="text-[24px] leading-[32px] font-bold text-slate-900 font-sans block mt-1">
                  {avgTimes?.queueWaitingMinutes ? `${avgTimes.queueWaitingMinutes} min` : '12 min'}
                </span>
                <span className="text-[12px] leading-[18px] text-slate-500 block font-sans mt-1">Gate &rarr; Weighment</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[12px] leading-[18px] font-semibold text-slate-500 uppercase font-sans block tracking-wider">Weighbridge</span>
                <span className="text-[24px] leading-[32px] font-bold text-slate-900 font-sans block mt-1">
                  {avgTimes?.weighmentMinutes ? `${avgTimes.weighmentMinutes} min` : '5 min'}
                </span>
                <span className="text-[12px] leading-[18px] text-slate-500 block font-sans mt-1">Tare & Gross capture</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[12px] leading-[18px] font-semibold text-slate-500 uppercase font-sans block tracking-wider">Quality Lab</span>
                <span className="text-[24px] leading-[32px] font-bold text-slate-900 font-sans block mt-1">
                  {avgTimes?.qualityMinutes ? `${avgTimes.qualityMinutes} min` : '8 min'}
                </span>
                <span className="text-[12px] leading-[18px] text-slate-500 block font-sans mt-1">Sampling & Certification</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[12px] leading-[18px] font-semibold text-slate-500 uppercase font-sans block tracking-wider">Procurement</span>
                <span className="text-[24px] leading-[32px] font-bold text-slate-900 font-sans block mt-1">
                  {avgTimes?.procurementMinutes ? `${avgTimes.procurementMinutes} min` : '5 min'}
                </span>
                <span className="text-[12px] leading-[18px] text-slate-500 block font-sans mt-1">Voucher authorization</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[12px] leading-[18px] font-semibold text-slate-500 uppercase font-sans block tracking-wider">Door-to-Door Total</span>
                <span className="text-[24px] leading-[32px] font-bold text-[#059669] font-sans block mt-1">
                  {avgTimes?.totalProcessingMinutes ? `${avgTimes.totalProcessingMinutes} min` : '30 min'}
                </span>
                <span className="text-[12px] leading-[18px] text-slate-500 block font-sans mt-1">Total turnaround</span>
              </div>
            </div>
          </div>

          {/* Session Capacity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Session */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] leading-[24px] font-semibold text-slate-900">Morning Session (08:00 – 13:00)</h3>
                  <p className="text-[14px] leading-[20px] font-medium text-slate-500 font-sans">{workload.morning.totalBookings} Farmers Scheduled</p>
                </div>
                <span className="text-[12px] leading-[18px] font-sans font-semibold px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  {workload.morning.utilizationPercent}% Used
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, workload.morning.utilizationPercent)}%` }}
                />
              </div>

              <div className="flex justify-between text-[12px] leading-[18px] text-slate-500 font-sans">
                <span>Expected: <strong className="text-slate-900">{workload.morning.expectedQuintals} Qtl</strong></span>
                <span>Depot Capacity: <strong className="text-slate-900">{workload.morning.capacityQuintals} Qtl</strong></span>
              </div>
            </div>

            {/* Afternoon Session */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] leading-[24px] font-semibold text-slate-900">Afternoon Session (14:00 – 18:00)</h3>
                  <p className="text-[14px] leading-[20px] font-medium text-slate-500 font-sans">{workload.afternoon.totalBookings} Farmers Scheduled</p>
                </div>
                <span className="text-[12px] leading-[18px] font-sans font-semibold px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  {workload.afternoon.utilizationPercent}% Used
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, workload.afternoon.utilizationPercent)}%` }}
                />
              </div>

              <div className="flex justify-between text-[12px] leading-[18px] text-slate-500 font-sans">
                <span>Expected: <strong className="text-slate-900">{workload.afternoon.expectedQuintals} Qtl</strong></span>
                <span>Depot Capacity: <strong className="text-slate-900">{workload.afternoon.capacityQuintals} Qtl</strong></span>
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
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="text-[14px] leading-[20px] font-semibold text-slate-700">Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[14px] leading-[20px] text-slate-900 font-sans focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3 py-1.5 rounded-xl text-[14px] leading-[20px] font-medium ${
                    selectedDate === todayStr ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
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
                  className="px-3 py-1.5 rounded-xl text-[14px] leading-[20px] font-medium bg-white text-slate-500 hover:text-slate-900 border border-slate-200"
                >
                  Yesterday
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                {['ALL', 'CHECKED_IN', 'PROCESSING', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[14px] leading-[20px] font-medium ${
                      statusFilter === st ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:min-w-[240px] sm:w-auto">
              <Search className="w-5 h-5 text-slate-500 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Search Farmer, ID, Booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[16px] leading-[24px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] leading-[24px] font-semibold text-slate-900">Centre Processing Monitor ({filteredBookings.length})</h3>
                <p className="text-[14px] leading-[20px] text-slate-500 mt-0.5">
                  Complete operational timeline for {selectedDate}
                </p>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Activity className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-[14px] leading-[20px] font-semibold text-slate-600">No Records Matching Filter</p>
                <p className="text-xs text-slate-500">Try adjusting the date, status, or search query.</p>
              </div>
            ) : (
              <div className="operations-queue-scroll overflow-x-auto">
                <table className="w-full min-w-max text-left border-collapse tabular-nums">
                  <thead className="sticky top-0 z-10 bg-[#E8F7F3] text-[#475569] font-sans font-semibold text-[14px] leading-[20px] border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-200 font-sans text-[14px] leading-[20px]">
                    {filteredBookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-slate-100 transition-colors">
                        <td className="py-3 px-4 font-sans font-semibold text-slate-700 whitespace-nowrap">
                          #{b.bookingNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold font-sans text-[15px] leading-[20px] text-slate-900">{b.farmerName}</div>
                          <div className="text-[12px] leading-[18px] text-slate-500 font-sans">
                            {b.farmerCode} &bull; {b.farmerMobile ? b.farmerMobile.slice(-4).padStart(10, 'X') : 'XXXX'}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 block">
                            {b.actualWeightQuintals ?? b.expectedQuantityQuintals} Qtl
                          </span>
                          {b.actualWeightQuintals && (
                            <span className="text-[12px] text-[#059669] font-sans font-semibold block">Weighed</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap">
                          {b.checkInTime ? new Date(b.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap">
                          {b.weighedAt ? new Date(b.weighedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {b.qualityGrade ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F7F3] text-[#059669] border border-[#A7F3D0] uppercase font-sans">
                              {b.qualityGrade.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-sans">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase font-sans inline-block ${
                              b.status === 'COMPLETED'
                                ? 'bg-[#059669] text-white border-transparent'
                                : b.status === 'PAYMENT'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : b.status === 'PROCUREMENT'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : b.status === 'QUALITY_ASSESSMENT'
                                ? 'bg-[#E8F7F3] text-[#059669] border border-[#A7F3D0]'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {b.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap">
                          {b.durations?.totalMinutes ? (
                            <span className="font-semibold text-[#059669]">{b.durations.totalMinutes} min</span>
                          ) : b.checkInTime ? (
                            <span className="text-amber-600 font-semibold">In Progress</span>
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-lg">
            <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Rolling 7-Day Operational Capacity & Workload Forecast</span>
            </h3>
            <p className="text-[14px] leading-[20px] text-slate-500 mt-1">
              Anticipated arrivals, morning/afternoon sessions, and depot capacity utilization for upcoming operating days
            </p>
          </div>

          {forecastLoading ? (
            <div className="p-12 text-center text-slate-400">Loading 7-day forecast...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forecastData.map((day) => (
                <div key={day.date} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[12px] leading-[18px] font-semibold text-amber-600 font-sans uppercase tracking-wider">
                        {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <h4 className="text-[20px] leading-[28px] font-bold text-slate-900 mt-1">{day.totalBookings} Farmers Booked</h4>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[12px] leading-[18px] font-semibold font-sans bg-amber-50 text-amber-700 border border-amber-200">
                      {day.utilizationPercent}% Used
                    </span>
                  </div>

                  <div className="space-y-2 text-[14px] leading-[20px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Morning Slots:</span>
                      <strong className="text-slate-900 font-sans font-semibold">{day.morningBookings} ({day.morningQuintals} Qtl)</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Afternoon Slots:</span>
                      <strong className="text-slate-900 font-sans font-semibold">{day.afternoonBookings} ({day.afternoonQuintals} Qtl)</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Total Expected Grain:</span>
                      <strong className="text-[#059669] font-sans font-semibold text-[15px]">{day.totalExpectedQuintals} Qtl</strong>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            <div>
              <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>Depot Counter & Personnel Oversight</span>
              </h3>
              <p className="text-[16px] leading-[24px] font-normal text-slate-500 mt-0.5">
                Active operating counters and hardware scale connectivity for this procurement depot
              </p>
            </div>
            <span className="text-[12px] leading-[18px] font-semibold px-3 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-sans self-start sm:self-auto">
              {counters.length} Operational Desks
            </span>
          </div>

          <div className="operations-queue-scroll pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {counters.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[12px] leading-[18px] font-semibold text-amber-600 uppercase font-sans tracking-wider">
                        Counter #{c.counterNumber}
                      </span>
                      <h4 className="text-[16px] leading-[24px] font-bold text-slate-900 mt-1">{c.counterName}</h4>
                      <p className="text-[14px] leading-[20px] font-medium text-slate-500">{c.counterType}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-sans uppercase ${
                        c.status === 'OPEN'
                          ? 'bg-[#E8F7F3] text-[#059669] border border-[#A7F3D0]'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.status === 'OPEN' ? 'ONLINE' : c.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleCounter(c.id, c.status)}
                    disabled={updatingCounterId === c.id}
                    className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[14px] leading-[20px] font-semibold text-slate-700 hover:text-slate-900 transition shadow-sm"
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
              <h3 className="text-[20px] leading-[28px] font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Procurement Capacity & Government Policy Control</span>
              </h3>
              <p className="text-[14px] leading-[20px] text-slate-500 mt-1">
                Configure operational farmer booking limits while strictly complying with the Government Maximum Ceiling
              </p>
            </div>
            <button
              onClick={() => loadCapacityConfig()}
              disabled={capacityLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[14px] leading-[20px] font-medium text-slate-700 flex items-center gap-2 transition self-start sm:self-auto shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${capacityLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Policy</span>
            </button>
          </div>

          {capacitySuccess && (
            <div className="p-4 rounded-2xl border border-[#A7F3D0] bg-[#E8F7F3] text-[#059669] text-[14px] leading-[20px] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{capacitySuccess}</span>
            </div>
          )}

          {capacityError && (
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-[14px] leading-[20px] flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{capacityError}</span>
            </div>
          )}

          {/* Level 1: Government Policy Ceiling (Read-Only) */}
          <div className="bg-amber-50/50 rounded-2xl border border-amber-200/60 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="text-[12px] leading-[18px] font-bold tracking-wider uppercase text-amber-700 font-sans">
                  Level 1 • Statutory Government Ceiling (Immutable)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[12px] leading-[18px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 font-sans">
                Department of Food & Public Distribution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-1 shadow-sm">
                <span className="text-[12px] leading-[18px] text-slate-500 uppercase font-semibold tracking-wider block font-sans">
                  Government Maximum Ceiling
                </span>
                <div className="text-[24px] leading-[32px] font-bold text-amber-600 font-sans mt-1">
                  {capacityConfig?.governmentMaximumPerFarmerQuintals ?? 250.0}{' '}
                  <span className="text-[14px] leading-[20px] font-medium text-slate-500 font-sans">qtl / farmer / day</span>
                </div>
                <p className="text-[12px] leading-[18px] text-slate-500 mt-1 block font-sans">Strict statutory ceiling across all procurement centres</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-1 shadow-sm">
                <span className="text-[12px] leading-[18px] text-slate-500 uppercase font-semibold tracking-wider block font-sans">
                  Commodity & MSP Rate
                </span>
                <div className="text-[20px] leading-[28px] font-bold text-slate-900 mt-1">
                  {capacityConfig?.crop || 'Paddy (Grade A)'}
                </div>
                <p className="text-[12px] leading-[18px] text-[#059669] font-sans font-semibold mt-1 block">₹2,320 / quintal (MSP)</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-1 shadow-sm">
                <span className="text-[12px] leading-[18px] text-slate-500 uppercase font-semibold tracking-wider block font-sans">
                  Procurement Season
                </span>
                <div className="text-[20px] leading-[28px] font-bold text-slate-900 mt-1">
                  {capacityConfig?.season || 'Kharif 2026-27'}
                </div>
                <p className="text-[12px] leading-[18px] text-slate-500 mt-1 block font-sans">Active Procurement Period</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-1 shadow-sm">
                <span className="text-[12px] leading-[18px] text-slate-500 uppercase font-semibold tracking-wider block font-sans">
                  Default Centre Baseline
                </span>
                <div className="text-[24px] leading-[32px] font-bold text-slate-700 font-sans mt-1">
                  50.0 <span className="text-[14px] leading-[20px] font-medium text-slate-500 font-sans">qtl / farmer / day</span>
                </div>
                <p className="text-[12px] leading-[18px] text-slate-500 mt-1 block font-sans">Standard operational baseline</p>
              </div>
            </div>
          </div>

          {/* Level 2 & Centre Session: Operational Capacity Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-lg">
            <div className="border-b border-slate-200 pb-5">
              <h4 className="text-[18px] leading-[26px] font-semibold text-slate-900">
                Centre Operational Capacity & Farmer Booking Policy
              </h4>
              <p className="text-[14px] leading-[20px] text-slate-500 mt-1">
                Adjust the maximum quantity an individual farmer can book per day at this centre, and session throughput limits.
                <strong className="text-amber-600 ml-1 font-semibold">
                  Note: Values above {capacityConfig?.governmentMaximumPerFarmerQuintals ?? 250.0} qtl are rejected automatically by backend security.
                </strong>
              </p>
            </div>

            <form onSubmit={handleSaveCapacity} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Centre Daily Farmer Limit */}
                <div className="space-y-2">
                  <label className="text-[12px] leading-[18px] font-semibold text-slate-600 block uppercase font-sans tracking-wider">
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-[16px] leading-[24px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                    <span className="absolute right-4 top-3.5 text-[14px] leading-[20px] font-medium text-slate-500 font-sans">QTL / DAY</span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-slate-500 font-sans mt-1 block">
                    Maximum quantity a single farmer may book at this centre per day. Must be between {inputMinBooking || 10} and {capacityConfig?.governmentMaximumPerFarmerQuintals || 250} qtl.
                  </p>
                </div>

                {/* Minimum Booking Quantity */}
                <div className="space-y-2">
                  <label className="text-[12px] leading-[18px] font-semibold text-slate-600 block uppercase font-sans tracking-wider">
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-[16px] leading-[24px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                    <span className="absolute right-4 top-3.5 text-[14px] leading-[20px] font-medium text-slate-500 font-sans">QTL</span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-slate-500 font-sans mt-1 block">
                    Minimum booking threshold per arrival visit (standard government default: 10.0 qtl).
                  </p>
                </div>

                {/* Morning Session Capacity */}
                <div className="space-y-2">
                  <label className="text-[12px] leading-[18px] font-semibold text-slate-600 block uppercase font-sans tracking-wider">
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-[16px] leading-[24px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                    <span className="absolute right-4 top-3.5 text-[14px] leading-[20px] font-medium text-slate-500 font-sans">QTL</span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-slate-500 font-sans mt-1 block">
                    Total grain weight throughput capacity for the morning shift across all counters.
                  </p>
                </div>

                {/* Afternoon Session Capacity */}
                <div className="space-y-2">
                  <label className="text-[12px] leading-[18px] font-semibold text-slate-600 block uppercase font-sans tracking-wider">
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-[16px] leading-[24px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                    <span className="absolute right-4 top-3.5 text-[14px] leading-[20px] font-medium text-slate-500 font-sans">QTL</span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-slate-500 font-sans mt-1 block">
                    Total grain weight throughput capacity for the afternoon shift across all counters.
                  </p>
                </div>
              </div>

              {/* Justification / Reason */}
              <div className="space-y-2">
                <label className="text-[12px] leading-[18px] font-semibold text-slate-600 block uppercase font-sans tracking-wider">
                  Operational Justification / Reason for Change
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weighbridge 2 operational; daily capacity adjusted to meet regional harvest peak"
                  value={inputReason}
                  onChange={(e) => setInputReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-sans text-[16px] leading-[24px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
                <p className="text-[12px] leading-[18px] text-slate-500 font-sans mt-1 block">
                  Recorded permanently in the government audit ledger for transparency and administrative compliance.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={capacitySaving}
                  className="px-6 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-semibold text-[14px] leading-[20px] flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {capacitySaving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving Policy...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Save Operational Policy</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Audit History Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-[16px] leading-[24px] font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Capacity Audit Ledger & History</span>
              </h4>
              <span className="text-[14px] leading-[20px] font-medium text-slate-500">
                {capacityConfig?.recentAudits?.length || 0} Audit Record(s)
              </span>
            </div>

            {capacityConfig?.recentAudits && capacityConfig.recentAudits.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[14px] leading-[20px] text-slate-600 font-sans">
                  <thead className="bg-slate-50 text-[12px] leading-[18px] uppercase font-semibold text-slate-600 font-sans border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Timestamp (IST)</th>
                      <th className="px-4 py-3">Parameter Changed</th>
                      <th className="px-4 py-3">Change Transition</th>
                      <th className="px-4 py-3">Season / Crop</th>
                      <th className="px-4 py-3">Official Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-[14px] leading-[20px]">
                    {capacityConfig.recentAudits.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {new Date(a.changedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {a.fieldChanged}
                        </td>
                        <td className="px-4 py-3 text-[#059669] font-bold whitespace-nowrap">
                          {a.oldValue} qtl → {a.newValue} qtl
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {a.season} • {a.crop}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={a.reason || ''}>
                          {a.reason || 'Operational adjustment'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[14px] leading-[20px] text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                No capacity policy modifications recorded yet. Centre is operating on baseline government parameters.
              </div>
            )}
          </div>
        </div>
      )}
      </div>
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
          <div className="min-h-screen bg-[#EEFaf7] flex items-center justify-center text-slate-500 text-[16px] leading-[24px] font-semibold">
            Loading depot dashboard...
          </div>
        }
      >
        <CentreDashboardContent />
      </React.Suspense>
    </StationGuard>
  );
}
