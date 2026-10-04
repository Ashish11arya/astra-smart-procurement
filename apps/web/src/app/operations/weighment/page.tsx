'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Scale,
  Clock,
  User,
  Truck,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Building2,
  Cpu,
  ShieldCheck,
  FileEdit,
  History,
  Calendar,
  Search,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { StationGuard } from '@/components/operations/StationGuard';
import { useAuth } from '@/context/AuthContext';

interface QueueItem {
  id: string;
  bookingNumber: string;
  farmerName: string;
  farmerCode: string;
  farmerMobile: string;
  commodityName: string;
  expectedQuantityQuintals: number;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  checkInTime: string;
  status: string;
  createdAt?: string;
  weighedAt?: string;
  weighmentRecord?: {
    id: string;
    deviceCode: string;
    originalHardwareWeight: number;
    finalWeightQuintals: number;
    correctionStatus?: string;
    requestedWeightQuintals?: number;
    correctionReason?: string;
  };
}

interface PendingCorrection {
  id: string;
  bookingNumber: string;
  farmerName: string;
  farmerCode: string;
  deviceCode: string;
  originalHardwareWeight: number;
  requestedWeightQuintals: number;
  correctionReason: string;
  officerRemarks?: string;
  requestedByOfficer: string;
  createdAt: string;
}

function WeighmentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logoutPortal, user } = useAuth();
  const isSupervisor = user?.role === 'WEIGHMENT_SUPERVISOR';

  const requestedTab = searchParams.get('tab');
  let initialTab: 'officer' | 'history' | 'supervisor' = 'officer';
  
  if (requestedTab === 'supervisor') {
    initialTab = isSupervisor ? 'supervisor' : 'officer';
  } else if (requestedTab === 'history') {
    initialTab = 'history';
  }

  const [activeTab, setActiveTab] = useState<'officer' | 'history' | 'supervisor'>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'supervisor') {
      if (isSupervisor) {
        setActiveTab('supervisor');
      } else {
        setActiveTab('officer');
        router.replace('/operations/weighment');
      }
    } else if (tab === 'history' || tab === 'officer') {
      setActiveTab(tab);
    }
  }, [searchParams, isSupervisor, router]);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [centreInfo, setCentreInfo] = useState<any>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<PendingCorrection[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardware scale state
  const [deviceCode] = useState('Scale-01');
  const [hardwareWeight, setHardwareWeight] = useState<number | null>(null);
  const [grossWeightKg, setGrossWeightKg] = useState<string>('');
  const [tareWeightKg, setTareWeightKg] = useState<string>('');

  const parsedGross = parseFloat(grossWeightKg) || 0;
  const parsedTare = parseFloat(tareWeightKg) || 0;
  const isGrossTareValid = parsedGross > parsedTare && parsedTare > 0;
  const computedNetKg = isGrossTareValid ? parsedGross - parsedTare : 0;
  const computedNetQuintals = isGrossTareValid ? +(computedNetKg / 100).toFixed(2) : 0;

  const handleGrossChange = (val: string) => {
    setGrossWeightKg(val);
    const g = parseFloat(val) || 0;
    const t = parseFloat(tareWeightKg) || 0;
    if (g > t && t > 0) {
      setHardwareWeight(+((g - t) / 100).toFixed(2));
    } else {
      setHardwareWeight(null);
    }
  };

  const handleTareChange = (val: string) => {
    setTareWeightKg(val);
    const g = parseFloat(grossWeightKg) || 0;
    const t = parseFloat(val) || 0;
    if (g > t && t > 0) {
      setHardwareWeight(+((g - t) / 100).toFixed(2));
    } else {
      setHardwareWeight(null);
    }
  };

  const activeWeight = hardwareWeight !== null 
    ? hardwareWeight 
    : (isGrossTareValid ? computedNetQuintals : null);

  const [isSimulating, setIsSimulating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionWeight, setCorrectionWeight] = useState('');
  const [correctionReason, setCorrectionReason] = useState('SCALE_TARE_ERROR');
  const [correctionRemarks, setCorrectionRemarks] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Supervisor Decision State
  const [selectedCorrection, setSelectedCorrection] = useState<PendingCorrection | null>(null);
  const [supervisorRemarks, setSupervisorRemarks] = useState('');
  const [deciding, setDeciding] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'supervisor') {
        const res: any = await apiRequest('/weighment/supervisor/pending-corrections');
        setCentreInfo(res.centre);
        const normalizedCorrections = (res.pendingCorrections || []).map((c: any, idx: number) => ({
          ...c,
          id: c.recordId || c.correctionRequestId || c.id || `corr-${idx}`,
        }));
        setPendingCorrections(normalizedCorrections);
      } else {
        const res: any = await apiRequest(`/weighment/queue?date=${selectedDate}`);
        setCentreInfo(res.centre);
        const normalizedQueue = (res.queue || []).map((item: any, idx: number) => {
          const finalWeight =
            item.weighment?.approvedFinalWeight ??
            item.weighment?.originalHardwareWeight ??
            item.weighmentRecord?.finalWeightQuintals ??
            item.expectedQuantityQuintals;
          return {
            ...item,
            id: item.bookingId || item.id || `weigh-lot-${idx}`,
            weighedAt:
              item.weighment?.approvedAt ||
              item.weighment?.createdAt ||
              item.weighedAt ||
              item.checkInTime,
            weighmentRecord: {
              id: item.weighment?.id || item.weighmentRecord?.id || `rec-${idx}`,
              finalWeightQuintals: finalWeight,
              deviceCode: item.weighment?.deviceCode || item.weighmentRecord?.deviceCode || 'Scale-01',
              originalHardwareWeight: item.weighment?.originalHardwareWeight ?? finalWeight,
              approvedFinalWeight: item.weighment?.approvedFinalWeight ?? finalWeight,
              status: item.weighment?.status || 'RECORDED',
            },
          };
        });
        setQueue(normalizedQueue);

        const active = normalizedQueue.filter(
          (b: any) => b.status === 'CHECKED_IN' || b.status === 'WEIGHMENT'
        );
        setSelectedBooking((prev) => {
          if (!prev) return active[0] || null;
          const stillActive = active.find((b: any) => b.id === prev.id);
          return stillActive || active[0] || null;
        });
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load weighment data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedDate]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (activeTab === 'officer') {
        loadData();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, loadData]);

  // Simulate hardware reading
  const handleSimulateHardware = async () => {
    if (!selectedBooking) return;
    setIsSimulating(true);
    try {
      const baseWeight = selectedBooking.expectedQuantityQuintals || 50;
      const simWeight = +(baseWeight * (0.98 + Math.random() * 0.04)).toFixed(2);
      const res: any = await apiRequest('/weighment/hardware-simulate', {
        method: 'POST',
        body: {
          bookingId: selectedBooking.id,
          deviceCode,
          hardwareWeightQuintals: simWeight,
        },
      });
      const netQtl = res.hardwareWeightQuintals ?? simWeight;
      const netKg = Math.round(netQtl * 100);
      const estTareKg = 3500;
      const estGrossKg = netKg + estTareKg;
      setGrossWeightKg(estGrossKg.toString());
      setTareWeightKg(estTareKg.toString());
      setHardwareWeight(netQtl);
    } catch (err: any) {
      alert(err.message || 'Scale simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Confirm direct hardware weight
  const handleConfirmWeight = async () => {
    const finalWeight = activeWeight;
    if (!selectedBooking || finalWeight === null || finalWeight <= 0) return;
    setConfirming(true);
    try {
      await apiRequest(`/weighment/${selectedBooking.id}/confirm`, {
        method: 'POST',
        body: {
          deviceCode,
          hardwareWeightQuintals: finalWeight,
        },
      });
      alert(`Hardware weight of ${finalWeight} Qtl confirmed for Booking #${selectedBooking.bookingNumber}. Successfully moved to Completed Weighments & Daily History and ready for Quality Assessment.`);
      setHardwareWeight(null);
      setGrossWeightKg('');
      setTareWeightKg('');
      setSelectedBooking(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm hardware weighment.');
    } finally {
      setConfirming(false);
    }
  };

  // Submit correction request
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalWeight = activeWeight;
    if (!selectedBooking || finalWeight === null) return;
    const requested = parseFloat(correctionWeight);
    if (isNaN(requested) || requested <= 0) {
      alert('Please enter a valid positive weight in Quintals.');
      return;
    }

    setSubmittingCorrection(true);
    try {
      await apiRequest(`/weighment/${selectedBooking.id}/correction-request`, {
        method: 'POST',
        body: {
          deviceCode,
          originalHardwareWeight: finalWeight,
          requestedFinalWeightQuintals: requested,
          requestedWeightQuintals: requested,
          reason: correctionReason,
          officerRemarks: correctionRemarks,
        },
      });
      alert('Correction request submitted. It now awaits Weighment Supervisor approval (Maker-Checker rule enforced).');
      setShowCorrectionModal(false);
      setCorrectionWeight('');
      setCorrectionRemarks('');
      setHardwareWeight(null);
      setGrossWeightKg('');
      setTareWeightKg('');
      setSelectedBooking(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit correction request.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Supervisor Decision (Maker-Checker approval)
  const handleSupervisorDecision = async (recordId: string, decision: 'APPROVED' | 'REJECTED') => {
    if (!supervisorRemarks.trim()) {
      alert('Please enter supervisor remarks before making a decision.');
      return;
    }

    setDeciding(true);
    try {
      const apiDecision = decision.startsWith('APPROV') ? 'APPROVE' : 'REJECT';
      await apiRequest(`/weighment/supervisor/${recordId}/decision`, {
        method: 'POST',
        body: {
          decision: apiDecision,
          supervisorRemarks,
        },
      });
      alert(`Correction request ${apiDecision.toLowerCase()}d successfully.`);
      setSelectedCorrection(null);
      setSupervisorRemarks('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Decision failed. Remember: Maker cannot approve their own correction.');
    } finally {
      setDeciding(false);
    }
  };

    const activeQueue = React.useMemo(() => {
    return queue.filter((b) => b.status === 'CHECKED_IN' || b.status === 'WEIGHMENT');
  }, [queue]);

  const processedHistory = React.useMemo(() => {
    return queue
      .filter((b) => b.status !== 'CHECKED_IN' && b.status !== 'WEIGHMENT')
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          b.farmerName.toLowerCase().includes(q) ||
          b.farmerCode.toLowerCase().includes(q) ||
          b.bookingNumber.toLowerCase().includes(q)
        );
      });
  }, [queue, searchQuery]);

  const handleLogout = () => {
    logoutPortal('operations');
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#EEFaf7] text-slate-800 relative after:absolute after:top-full after:inset-x-0 after:h-[calc(72px+env(safe-area-inset-bottom))] after:bg-[#EEFaf7] md:after:hidden">
      <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-900 flex-1">
      {/* Top Operations Action Header */}
      <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[24px] leading-[32px] font-bold text-slate-900 tracking-tight">
                Weighment
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[12px] leading-[18px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30 uppercase tracking-wider">
                HARDWARE SYNCED
              </span>
            </div>
            <div className="text-[16px] leading-[24px] font-semibold text-slate-900 mt-1">
              {centreInfo?.name || 'Muzaffarpur Central Grain Procurement Depot'}
            </div>
            <div className="text-[14px] leading-[20px] font-normal text-slate-500 mt-0.5">
              Real-time gross and tare weighbridge capture with maker-checker verification
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation (Desktop only) */}
      <div className="hidden md:flex md:static bg-transparent border-b border-slate-200 pb-0 justify-start space-x-4">
        <button
          onClick={() => setActiveTab('officer')}
          className={`pb-4 px-1 border-b-2 flex items-center space-x-2 transition-all flex-none text-[16px] leading-[24px] font-semibold ${
            activeTab === 'officer'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          aria-label="Weighment Desk"
        >
          <Scale className="w-5 h-5" />
          <span>Weighment Desk ({activeQueue.length} in queue)</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-1 border-b-2 flex items-center space-x-2 transition-all flex-none text-[16px] leading-[24px] font-semibold ${
            activeTab === 'history'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          aria-label="Completed Weighments and Daily History"
        >
          <History className="w-5 h-5" />
          <span>Completed Weighments & Daily History ({processedHistory.length})</span>
        </button>
        {isSupervisor && (
          <button
            onClick={() => setActiveTab('supervisor')}
            className={`pb-4 px-1 border-b-2 flex items-center space-x-2 transition-all flex-none text-[16px] leading-[24px] font-semibold ${
              activeTab === 'supervisor'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            aria-label="Supervisor Verification"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Supervisor Verification ({pendingCorrections.length} pending)</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-800/80 rounded-xl flex items-start space-x-3 text-rose-600 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-700">Notice</p>
            <p className="text-xs text-rose-600/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* OFFICER DESK VIEW */}
      {activeTab === 'officer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Col: Checked-in Farmers Queue */}
          <div className="lg:col-span-5 space-y-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-1 shrink-0">
              <h2 className="text-[18px] leading-[26px] font-semibold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Checked-In Arrivals Queue</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[12px] leading-[18px] font-semibold bg-white text-amber-600 border border-slate-200">
                {activeQueue.length} awaiting scale
              </span>
            </div>

            {activeQueue.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-[18px] leading-[26px] font-semibold text-slate-800">Weighment Queue Clear</h3>
                <p className="text-[16px] leading-[24px] font-normal text-slate-500 max-w-xs mx-auto">
                  No admitted farmers waiting at the weighbridge station. Arrivals will appear here after gate check-in.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-1 operations-queue-scroll min-h-0">
                {activeQueue.map((item, idx) => {
                  const isSelected = selectedBooking?.id === item.id;
                  return (
                    <div
                      key={item.id || `weigh-lot-${item.bookingNumber || idx}`}
                      onClick={() => {
                        setSelectedBooking(item);
                        setHardwareWeight(null);
                        setGrossWeightKg('');
                        setTareWeightKg('');
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500/80 bg-amber-950/20 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[12px] leading-[18px] font-medium text-amber-600">
                            #{item.bookingNumber}
                          </span>
                          <h3 className="text-[15px] leading-[20px] font-semibold text-slate-900 mt-0.5">
                            {item.farmerName}
                          </h3>
                          <p className="text-[12px] leading-[18px] font-medium text-slate-500">{item.farmerCode} &bull; {item.farmerMobile}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[12px] leading-[18px] font-semibold rounded uppercase tracking-wider">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[12px] leading-[18px] text-slate-500 font-medium block">Crop</span>
                          <p className="text-[14px] leading-[20px] font-semibold text-slate-900">{item.commodityName}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[12px] leading-[18px] text-slate-500 font-medium block">Estimated Weight</span>
                          <p className="text-[14px] leading-[20px] font-semibold text-amber-600">
                            {item.expectedQuantityQuintals} Qtl
                          </p>
                        </div>
                      </div>

                      {item.vehicleNumber && (
                        <div className="mt-2 pt-2 border-t border-slate-200/40 text-[12px] leading-[18px] text-slate-500 flex items-center space-x-1.5 font-medium">
                          <Truck className="w-4 h-4 text-slate-500" />
                          <span>
                            {item.vehicleType || 'Vehicle'}: <strong className="text-[14px] leading-[20px] text-slate-900 font-semibold">{item.vehicleNumber}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Col: Hardware Station & Weighbridge Controls */}
          <div className="lg:col-span-7">
            {selectedBooking ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden sticky top-20">
                {/* Station Banner */}
                <div className="bg-slate-50 border-b border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-mono font-bold tracking-wide uppercase text-slate-600">
                        INDICATOR PORT: {deviceCode}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-600 border border-emerald-200 text-[10px] font-mono rounded">
                      SERIAL LINK CONNECTED (9600 BAUD)
                    </span>
                  </div>

                  {/* Physical Weighbridge Gross & Tare Measurement Inputs */}
                  <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[18px] leading-[26px] font-semibold text-slate-900 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-amber-600" />
                        <span>Gross & Tare Weight Inputs (kg)</span>
                      </span>
                      {parsedGross > 0 && parsedTare > 0 && (
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isGrossTareValid ? 'bg-emerald-950 text-emerald-600 border border-emerald-200' : 'bg-rose-950 text-rose-600 border border-rose-800'
                        }`}>
                          {isGrossTareValid ? `NET: ${computedNetKg.toLocaleString()} KG (${computedNetQuintals} QTL)` : 'GROSS MUST EXCEED TARE'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Laden Vehicle Gross Weight (kg) *
                        </label>
                        <input
                          type="number"
                          value={grossWeightKg}
                          onChange={(e) => handleGrossChange(e.target.value)}
                          placeholder="e.g. 10250"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Unladen Vehicle Tare Weight (kg) *
                        </label>
                        <input
                          type="number"
                          value={tareWeightKg}
                          onChange={(e) => handleTareChange(e.target.value)}
                          placeholder="e.g. 3500"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {parsedGross > 0 && parsedTare > 0 && !isGrossTareValid && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        Validation Error: Gross weight must be strictly greater than Tare weight (Gross &gt; Tare &gt; 0).
                      </p>
                    )}
                  </div>

                  {/* High Tech Digital Weight LCD Display */}
                  <div className="mt-4 bg-[#050811] p-6 rounded-xl border border-emerald-900/50 text-center relative overflow-hidden shadow-inner">
                    <div className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest mb-1">
                      Digital Load Cell Readout &bull; Net Weight
                    </div>
                    <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-emerald-600 py-2">
                      {activeWeight !== null ? `${activeWeight.toFixed(2)}` : '00.00'}
                      <span className="text-2xl font-normal text-emerald-500 ml-3">Qtl</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {activeWeight !== null
                        ? `STABLE LOAD CELL SIGNAL &bull; ${(activeWeight * 100).toFixed(0)} KG NET`
                        : 'Waiting for weighbridge capture...'}
                    </div>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <span className="text-[12px] leading-[18px] text-slate-500 font-medium block">Farmer</span>
                      <p className="text-[15px] leading-[20px] font-semibold text-slate-900 mt-0.5 truncate">{selectedBooking.farmerName}</p>
                    </div>
                    <div>
                      <span className="text-[12px] leading-[18px] text-slate-500 font-medium block">Commodity</span>
                      <p className="text-[14px] leading-[20px] font-semibold text-slate-900 mt-0.5 truncate">{selectedBooking.commodityName}</p>
                    </div>
                    <div>
                      <span className="text-[12px] leading-[18px] text-slate-500 font-medium block">Booked Est.</span>
                      <p className="text-[14px] leading-[20px] font-semibold text-amber-600 mt-0.5">
                        {selectedBooking.expectedQuantityQuintals} Qtl
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleSimulateHardware}
                      disabled={isSimulating}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-amber-600' : ''}`} />
                      <span>
                        {activeWeight !== null
                          ? 'Re-Capture Scale Reading'
                          : 'Capture / Simulate Load Cell Reading'}
                      </span>
                    </button>

                    {activeWeight !== null && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={handleConfirmWeight}
                          disabled={confirming}
                          className="py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {confirming
                              ? 'Saving Weighment...'
                              : `Confirm Weight (${activeWeight} Qtl)`}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setCorrectionWeight(activeWeight.toString());
                            setShowCorrectionModal(true);
                          }}
                          className="py-3 bg-amber-950/40 hover:bg-amber-900/50 text-amber-600 border border-amber-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition"
                        >
                          <FileEdit className="w-4 h-4 text-amber-600" />
                          <span>Tare / Discrepancy Exception</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    <strong className="text-slate-600">Station Workflow:</strong> Confirmed weights automatically transfer lot to Quality Inspection. Tare adjustments require independent supervisor review.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mx-auto">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-[18px] leading-[26px] font-semibold text-slate-800">Select an Arrival from the Queue</h3>
                <p className="text-[16px] leading-[24px] font-normal text-slate-500 max-w-sm mx-auto">
                  Select a checked-in farmer from the queue on the left to capture and record the load cell weight.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLETED WEIGHMENTS & DAILY HISTORY TAB */}
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
                    className="bg-slate-50 border border-slate-300 rounded-xl pl-3 pr-10 py-2 text-base font-medium text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-20 relative"
                  />
                  <Calendar className="w-5 h-5 text-amber-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    selectedDate === todayStr ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40' : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
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
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Farmer, ID, Booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="min-w-0 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900">Daily Weighed Farmer Records ({processedHistory.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official digital weighbridge records for {selectedDate}
                </p>
              </div>
            </div>

            {processedHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Scale className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No Weighment Records Found</p>
                <p className="text-[11px] text-slate-500">No farmer produce was weighed at this depot for {selectedDate}.</p>
              </div>
            ) : (
              <div className="operations-queue-scroll overflow-x-auto">
                <table className="w-full min-w-max text-left border-collapse tabular-nums">
                  <thead className="sticky top-0 z-10 bg-[#E8F7F3] text-[#475569] font-sans font-semibold text-sm border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Booking Number</th>
                      <th className="py-3 px-4">Farmer Details</th>
                      <th className="py-3 px-4">Commodity</th>
                      <th className="py-3 px-4">Gross (kg)</th>
                      <th className="py-3 px-4">Tare (kg)</th>
                      <th className="py-3 px-4">Net Confirmed</th>
                      <th className="py-3 px-4">Scale Device</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-sm">
                    {processedHistory.map((item: any) => {
                      const finalQtl = item.weighmentRecord?.finalWeightQuintals ?? item.finalWeightQuintals ?? item.expectedQuantityQuintals;
                      const grossEst = Math.round(finalQtl * 100 + 4500);
                      const tareEst = 4500;
                      return (
                        <tr key={item.id} className="hover:bg-slate-100 transition-colors">
                          <td className="py-3 px-4 font-sans font-semibold text-sky-600 whitespace-nowrap text-sm">
                            #{item.bookingNumber}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold font-sans text-[15px] text-slate-900">{item.farmerName}</div>
                            <div className="text-[12px] leading-[18px] text-slate-500 font-sans">{item.farmerCode}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap text-sm">
                            {item.commodityName}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap text-sm">
                            {grossEst.toLocaleString()} kg
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-500 whitespace-nowrap text-sm">
                            {tareEst.toLocaleString()} kg
                          </td>
                          <td className="py-3 px-4 font-sans font-bold text-emerald-600 whitespace-nowrap text-sm">
                            {finalQtl} Qtl
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-500 whitespace-nowrap text-sm">
                            {item.weighmentRecord?.deviceCode || 'Scale-01'}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-500 whitespace-nowrap text-sm">
                            {item.weighedAt
                              ? new Date(item.weighedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '08:24 AM'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold font-sans uppercase">
                              {item.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPERVISOR VIEW */}
      {activeTab === 'supervisor' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start space-x-3.5">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-600 text-xs">Maker-Checker Policy</p>
              <p className="text-amber-700/80 leading-relaxed text-[11px]">
                Weight corrections require independent supervisor verification. As an anti-fraud measure, officers who initiated an adjustment request cannot approve their own submissions. Original hardware scale readings are preserved in the audit log.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-[18px] leading-[26px] font-semibold text-slate-900">
              Pending Weight Adjustments ({pendingCorrections.length})
            </h2>
          </div>

          {pendingCorrections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-900">No Pending Corrections</p>
              <p className="text-slate-500 text-[11px]">All weight adjustments have been reviewed and decided.</p>
            </div>
          ) : (
            <div className="operations-queue-scroll pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingCorrections.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-amber-600">
                          #{item.bookingNumber}
                        </span>
                        <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900 mt-0.5">
                          {item.farmerName}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">Farmer ID: {item.farmerCode}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-950/80 text-amber-600 border border-amber-200 text-[10px] font-bold rounded">
                        AWAITING REVIEW
                      </span>
                    </div>

                    {/* Weight Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Original Scale
                        </span>
                        <span className="text-base font-bold text-slate-500 line-through">
                          {item.originalHardwareWeight} Qtl
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-600 uppercase font-bold block">
                          Requested Final
                        </span>
                        <span className="text-base font-black text-amber-600 font-mono">
                          {item.requestedWeightQuintals} Qtl
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600">
                      <p>
                        <strong className="text-slate-500">Reason:</strong>{' '}
                        {item.correctionReason.replace(/_/g, ' ')}
                      </p>
                      {item.officerRemarks && (
                        <p>
                          <strong className="text-slate-500">Officer Notes:</strong>{' '}
                          {item.officerRemarks}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono pt-0.5">
                        Initiated by: {item.requestedByOfficer} &bull;{' '}
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setSelectedCorrection(item);
                          setSupervisorRemarks('');
                        }}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 font-semibold text-xs rounded-lg transition shadow-sm"
                      >
                        Review & Decide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CORRECTION REQUEST MODAL (Officer Desk) */}
      {showCorrectionModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900 flex items-center space-x-2">
                <FileEdit className="w-4 h-4 text-amber-600" />
                <span>Tare / Exception Request</span>
              </h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-500 hover:text-slate-900 text-base font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-slate-500">
                  Original Hardware Scale:{' '}
                  <strong className="text-slate-900 text-sm">{activeWeight} Qtl</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  The original reading will remain permanently recorded in the audit trail.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Requested Final Net Weight (Quintals) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={correctionWeight}
                  onChange={(e) => setCorrectionWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm font-mono font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Reason *</label>
                <select
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-semibold focus:border-amber-500 outline-none"
                >
                  <option value="SCALE_TARE_ERROR">Vehicle Tare Discrepancy (Dunnage / Fuel)</option>
                  <option value="CONTAINER_EXCLUSION">Gunny Bag / Container Weight Exclusion</option>
                  <option value="SENSOR_GLITCH">Hardware Calibration Sensor Glitch</option>
                  <option value="MOISTURE_PACK_DISCREPANCY">Excess Moisture Pack Adjustment</option>
                  <option value="OTHER">Other Operational Exception</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Officer Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionRemarks}
                  onChange={(e) => setCorrectionRemarks(e.target.value)}
                  placeholder="State the verified physical discrepancy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 rounded-xl text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-900 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 rounded-xl font-semibold text-xs shadow-md transition"
                >
                  {submittingCorrection ? 'Submitting...' : 'Submit to Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPERVISOR DECISION MODAL */}
      {selectedCorrection && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-[18px] leading-[26px] font-semibold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Supervisor Decision</span>
              </h3>
              <button
                onClick={() => setSelectedCorrection(null)}
                className="text-slate-500 hover:text-slate-900 text-base font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
                <p>
                  <strong className="text-slate-500">Farmer:</strong> {selectedCorrection.farmerName} ({selectedCorrection.farmerCode})
                </p>
                <p>
                  <strong className="text-slate-500">Booking:</strong> #{selectedCorrection.bookingNumber}
                </p>
                <p>
                  <strong className="text-slate-500">Original Hardware:</strong> {selectedCorrection.originalHardwareWeight} Qtl
                </p>
                <p className="text-amber-600 font-bold">
                  <strong>Requested Final:</strong> {selectedCorrection.requestedWeightQuintals} Qtl
                </p>
                <p>
                  <strong className="text-slate-500">Reason:</strong> {selectedCorrection.correctionReason}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Supervisor Decision Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={supervisorRemarks}
                  onChange={(e) => setSupervisorRemarks(e.target.value)}
                  placeholder="Document physical verification and decision basis..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 rounded-xl text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={deciding}
                  onClick={() => handleSupervisorDecision(selectedCorrection.id, 'REJECTED')}
                  className="py-2.5 bg-rose-50 hover:bg-rose-900/50 text-rose-600 border border-rose-200 rounded-xl font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  disabled={deciding}
                  onClick={() => handleSupervisorDecision(selectedCorrection.id, 'APPROVED')}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-xl font-semibold flex items-center justify-center space-x-1.5 shadow-md transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Final</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default function WeighmentDashboardPage() {
  return (
    <StationGuard
      allowedRoles={['WEIGHMENT_OFFICER', 'WEIGHMENT', 'WEIGHMENT_SUPERVISOR']}
      stationName="Digital Weighbridge Station"
      stationCode="WEIGH-SCALE-01"
    >
      <React.Suspense
        fallback={
          <div className="w-full min-w-0 max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
            Loading Weighment Desk...
          </div>
        }
      >
        <WeighmentDashboardContent />
      </React.Suspense>
    </StationGuard>
  );
}
