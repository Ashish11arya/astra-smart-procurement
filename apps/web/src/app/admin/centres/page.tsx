'use client';
import { useAuth } from '@/context/AuthContext';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  PlusCircle,
  Users,
  History,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  MapPin,
  Clock,
  Layers,
  Check,
  Ban,
  Activity,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Centre {
  id: string;
  centreCode: string;
  name: string;
  stateId: string;
  districtId: string;
  state?: { name: string };
  district?: { name: string };
  block?: string;
  address: string;
  latitude: number;
  longitude: number;
  agency?: string;
  operatingDays?: string;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  morningCapacityQuintals: number;
  afternoonCapacityQuintals: number;
  maxHourlyCapacityQuintals: number;
  maxQuantityPerBooking: number;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  operationalStatus: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'SUSPENDED';
  counters?: any[];
  personnelAssignments?: any[];
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  user?: {
    mobile: string;
    role: string;
  };
  createdAt: string;
}

export default function AdminCentresPage() {
  const router = useRouter();
  const { logoutPortal } = useAuth();
  const [activeTab, setActiveTab] = useState<'network' | 'register' | 'personnel' | 'audit'>('network');
  const [centres, setCentres] = useState<Centre[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [states, setStates] = useState<Array<{ id: string; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');

  // New Centre Form State
  const [formCentreCode, setFormCentreCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStateId, setFormStateId] = useState('');
  const [formDistrictId, setFormDistrictId] = useState('');
  const [formBlock, setFormBlock] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLat, setFormLat] = useState('26.1209');
  const [formLng, setFormLng] = useState('85.3647');
  const [formAgency, setFormAgency] = useState('State Food & Civil Supplies Corporation');
  const [formMorningCap, setFormMorningCap] = useState('350');
  const [formAfternoonCap, setFormAfternoonCap] = useState('350');
  const [formMaxHourly, setFormMaxHourly] = useState('70');
  const [formMaxBooking, setFormMaxBooking] = useState('100');
  const [formCounters, setFormCounters] = useState('3');
  const [creatingCentre, setCreatingCentre] = useState(false);

  // Personnel Form State
  const [personnelMobile, setPersonnelMobile] = useState('');
  const [personnelCentreId, setPersonnelCentreId] = useState('');
  const [personnelRole, setPersonnelRole] = useState('PROCUREMENT_CENTRE_OFFICER');
  const [personnelDept, setPersonnelDept] = useState('Depot Management');
  const [assigning, setAssigning] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [centresRes, statesRes] = await Promise.all([
        apiRequest<Centre[]>('/admin/centres'),
        apiRequest<Array<{ id: string; name: string }>>('/centres/states'),
      ]);
      setCentres(centresRes || []);
      setStates(statesRes || []);
      if (statesRes && statesRes.length > 0 && !formStateId) {
        setFormStateId(statesRes[0].id);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to government authority services.');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await apiRequest<AuditLog[]>('/admin/audit-logs');
      setAuditLogs(logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!formStateId) return;
    apiRequest<Array<{ id: string; name: string }>>(`/centres/districts?stateId=${formStateId}`)
      .then((data) => {
        setDistricts(data || []);
        if (data && data.length > 0) {
          setFormDistrictId(data[0].id);
        }
      })
      .catch(console.error);
  }, [formStateId]);

  const handleVerifyCentre = async (centreId: string) => {
    try {
      await apiRequest(`/admin/centres/${centreId}/verify`, { method: 'PATCH' });
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Verification failed.');
    }
  };

  const handleActivateCentre = async (centreId: string) => {
    try {
      await apiRequest(`/admin/centres/${centreId}/activate`, { method: 'PATCH' });
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Activation failed.');
    }
  };

  const handleCreateCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCentre(true);
    try {
      await apiRequest('/admin/centres', {
        method: 'POST',
        body: {
          centreCode: formCentreCode.trim(),
          name: formName.trim(),
          stateId: formStateId,
          districtId: formDistrictId,
          block: formBlock.trim() || undefined,
          address: formAddress.trim(),
          latitude: parseFloat(formLat) || 26.1,
          longitude: parseFloat(formLng) || 85.3,
          agency: formAgency,
          morningCapacityQuintals: parseFloat(formMorningCap) || 350,
          afternoonCapacityQuintals: parseFloat(formAfternoonCap) || 350,
          maxHourlyCapacityQuintals: parseFloat(formMaxHourly) || 70,
          maxQuantityPerBooking: parseFloat(formMaxBooking) || 100,
          numCounters: parseInt(formCounters, 10) || 3,
        },
      });
      setFormCentreCode('');
      setFormName('');
      setFormAddress('');
      setActiveTab('network');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to register depot.');
    } finally {
      setCreatingCentre(false);
    }
  };

  const handleAssignPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnelCentreId) {
      alert('Please select a depot.');
      return;
    }
    setAssigning(true);
    try {
      await apiRequest('/admin/personnel', {
        method: 'POST',
        body: {
          userMobile: personnelMobile.trim(),
          centreId: personnelCentreId,
          role: personnelRole,
          department: personnelDept,
        },
      });
      setPersonnelMobile('');
      await loadAll();
      alert(`Staff member assigned successfully.`);
    } catch (err: any) {
      alert(err.message || 'Assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  const handleLogout = () => {
    logoutPortal('authority');
  };

  const totalCentres = centres.length;
  const verifiedCount = centres.filter((c) => c.verificationStatus === 'VERIFIED').length;
  const activeCount = centres.filter((c) => c.operationalStatus === 'ACTIVE').length;
  const pendingCount = centres.filter((c) => c.verificationStatus === 'PENDING_VERIFICATION').length;

  const filteredCentres = centres.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.centreCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.district?.name && c.district.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.block && c.block.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return c.operationalStatus === 'ACTIVE';
    if (statusFilter === 'PENDING') return c.verificationStatus === 'PENDING_VERIFICATION';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-100">
      {/* Top Directorate Command Header */}
      <div className="glass-card rounded-3xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-950/50 flex-shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                Procurement Authority Network
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">
                State Directorate
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              State & District Procurement Network &bull; Live operational administration and depot management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={loadAll}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-700/60 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('network')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'network'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Depot Directory ({totalCentres})</span>
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'register'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Depot</span>
        </button>
        <button
          onClick={() => setActiveTab('personnel')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'personnel'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Department Personnel</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Trail</span>
        </button>
      </div>

      <main className="space-y-6">
        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex items-start space-x-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="mt-0.5 text-rose-300/90">{error}</p>
            </div>
          </div>
        )}

        {/* 2026 HIGH-DENSITY METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl shadow-xl transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Total Network Depots</span>
              <Building2 className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-3xl font-black text-slate-100 mt-2 font-mono">{totalCentres}</div>
            <p className="text-[11px] text-slate-500 mt-1">Across all registered districts</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl shadow-xl transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Awaiting Review</span>
              </span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400 mt-2 font-mono">{pendingCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Needs inspection & approval</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl shadow-xl transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-teal-400 uppercase tracking-wider">
              <span>Verified Depots</span>
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-black text-teal-400 mt-2 font-mono">{verifiedCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Quality & weighment certified</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl shadow-xl transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Open for Farmers</span>
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">{activeCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Accepting active booking slots</p>
          </div>
        </div>

        {/* TAB 1: DEPOT DIRECTORY */}
        {activeTab === 'network' && (
          <div className="space-y-4">
            {/* Instant Filter & Search Bar */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by depot code, name, district, or block..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    statusFilter === 'ALL'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({totalCentres})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    statusFilter === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
              </div>
            </div>

            {/* Depot Cards Grid */}
            <div className="max-h-[600px] overflow-y-auto operations-queue-scroll pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCentres.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 hover:border-slate-700 p-5 shadow-xl space-y-4 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 rounded-lg inline-block">
                          {c.centreCode}
                        </span>
                        <h3 className="text-sm font-bold text-slate-100 mt-1.5 leading-snug">
                          {c.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{c.district?.name}, {c.state?.name}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end space-y-1 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider border ${
                            c.verificationStatus === 'VERIFIED'
                              ? 'bg-teal-950/80 text-teal-300 border-teal-800/60'
                              : c.verificationStatus === 'PENDING_VERIFICATION'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                              : 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                          }`}
                        >
                          {c.verificationStatus.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider border flex items-center gap-1 ${
                            c.operationalStatus === 'ACTIVE'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                              : 'bg-slate-800/80 text-slate-400 border-slate-700'
                          }`}
                        >
                          {c.operationalStatus === 'ACTIVE' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          )}
                          <span>{c.operationalStatus}</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/80">
                      <div className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Daily Capacity
                        </span>
                        <span className="font-bold text-slate-200 mt-0.5 block font-mono">
                          {c.morningCapacityQuintals + c.afternoonCapacityQuintals} Qtl
                        </span>
                      </div>
                      <div className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Weighing Speed
                        </span>
                        <span className="font-bold text-slate-200 mt-0.5 block font-mono">
                          {c.maxHourlyCapacityQuintals} Qtl/hr
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {c.address}
                    </p>
                  </div>

                  {/* Lifecycle Controls */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                    {c.verificationStatus === 'PENDING_VERIFICATION' && (
                      <button
                        onClick={() => handleVerifyCentre(c.id)}
                        className="flex-1 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-teal-950 active:scale-95"
                      >
                        Verify Depot
                      </button>
                    )}

                    {c.verificationStatus === 'VERIFIED' && c.operationalStatus !== 'ACTIVE' && (
                      <button
                        onClick={() => handleActivateCentre(c.id)}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950 active:scale-95"
                      >
                        Activate for Farmers
                      </button>
                    )}

                    {c.operationalStatus === 'ACTIVE' && (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1.5 py-1">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Live on Farmer Booking Network</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER NEW CENTRE */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white">Register New Procurement Depot</h2>
              <p className="text-xs text-slate-400 mt-1">
                New depots are created in pending verification status to ensure scales and standards are confirmed before public bookings open.
              </p>
            </div>

            <form onSubmit={handleCreateCentre} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Depot Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BHR-MUZ-004"
                    value={formCentreCode}
                    onChange={(e) => setFormCentreCode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Depot Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Motipur Central Hub"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">State *</label>
                  <select
                    value={formStateId}
                    onChange={(e) => setFormStateId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {states.map((st) => (
                      <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">District *</label>
                  <select
                    value={formDistrictId}
                    onChange={(e) => setFormDistrictId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Physical Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Complete postal location with landmarks..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Morning Cap (Qtl)</label>
                  <input
                    type="number"
                    value={formMorningCap}
                    onChange={(e) => setFormMorningCap(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Afternoon Cap (Qtl)</label>
                  <input
                    type="number"
                    value={formAfternoonCap}
                    onChange={(e) => setFormAfternoonCap(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Hourly Speed (Qtl/hr)</label>
                  <input
                    type="number"
                    value={formMaxHourly}
                    onChange={(e) => setFormMaxHourly(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={creatingCentre}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition active:scale-[0.99]"
                >
                  {creatingCentre ? 'Registering Depot...' : 'Submit Depot for Verification'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: DEPARTMENT PERSONNEL ASSIGNMENT */}
        {activeTab === 'personnel' && (
          <div className="max-w-xl mx-auto bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white">Assign Department Staff</h2>
              <p className="text-xs text-slate-400 mt-1">
                Authorise specific personnel with role-based operational permissions at procurement depots.
              </p>
            </div>

            <form onSubmit={handleAssignPersonnel} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Officer Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={personnelMobile}
                  onChange={(e) => setPersonnelMobile(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assigned Depot *</label>
                <select
                  value={personnelCentreId}
                  onChange={(e) => setPersonnelCentreId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select Depot...</option>
                  {centres.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.name} ({c.centreCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Departmental Stage Role *</label>
                <select
                  value={personnelRole}
                  onChange={(e) => setPersonnelRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PROCUREMENT_CENTRE_OFFICER" className="bg-slate-900 text-white">Procurement Depot Manager</option>
                  <option value="CHECK_IN_OFFICER" className="bg-slate-900 text-white">Gate Check-in Officer</option>
                  <option value="WEIGHMENT_OFFICER" className="bg-slate-900 text-white">Digital Weighment Officer</option>
                  <option value="WEIGHMENT_SUPERVISOR" className="bg-slate-900 text-white">Weighment Supervisor (Maker-Checker)</option>
                  <option value="QUALITY_OFFICER" className="bg-slate-900 text-white">Grain Quality Assessment Officer</option>
                  <option value="PROCUREMENT_OFFICER" className="bg-slate-900 text-white">Procurement Officer</option>
                  <option value="PAYMENT_OFFICER" className="bg-slate-900 text-white">Payment & Settlement Officer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Department Wing Name *</label>
                <input
                  type="text"
                  required
                  value={personnelDept}
                  onChange={(e) => setPersonnelDept(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={assigning}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition active:scale-[0.99]"
                >
                  {assigning ? 'Authorizing...' : 'Authorize Personnel Assignment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Immutable Security Audit Logs</h2>
              <span className="text-xs text-slate-400 font-mono">{auditLogs.length} events recorded</span>
            </div>

            <div className="max-h-[580px] overflow-y-auto operations-queue-scroll overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 shadow-sm">
                  <tr>
                    <th className="px-3.5 py-3">Timestamp</th>
                    <th className="px-3.5 py-3">Action</th>
                    <th className="px-3.5 py-3">Entity</th>
                    <th className="px-3.5 py-3">User Role</th>
                    <th className="px-3.5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-3.5 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString()}{' '}
                        <span className="text-[10px] block text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-emerald-400 border border-slate-700 rounded-md font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-300">
                        {log.entityType}
                        <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-200">
                        {log.user?.role || 'SYSTEM'}
                        <span className="text-[10px] text-slate-500 block">
                          {log.user?.mobile}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-400 font-sans text-[11px] max-w-xs truncate">
                        {JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
