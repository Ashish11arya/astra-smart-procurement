'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ArrowLeft,
  Search,
  Lock,
  Phone,
  Layers,
  AlertCircle,
  Power,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface PersonnelItem {
  id: string;
  userId: string;
  centreId: string;
  role: string;
  department: string;
  isActive: boolean;
  assignedAt: string;
  user: {
    id: string;
    mobile: string;
    role: string;
  };
  centre: {
    id: string;
    centreCode: string;
    name: string;
    districtId: string;
  };
}

interface CentreOption {
  id: string;
  centreCode: string;
  name: string;
}

export default function AuthorityPersonnelPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);
  const [centres, setCentres] = useState<CentreOption[]>([]);

  // Filter States
  const [selectedCentre, setSelectedCentre] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [mobile, setMobile] = useState('');
  const [formCentreId, setFormCentreId] = useState('');
  const [formRole, setFormRole] = useState('OPERATOR');
  const [formDept, setFormDept] = useState('FOOD_CIVIL_SUPPLIES');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        sessionStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_token');
      if (!token) {
        router.push('/authority/login');
        return;
      }

      // 1. Fetch personnel roster
      const pRes = await apiRequest<PersonnelItem[]>('/api/admin/personnel', {
        token,
      });
      setPersonnel(pRes || []);

      // 2. Fetch centres list for assignment options
      const cRes = await apiRequest<any[]>('/centres', { token });
      setCentres(
        (cRes || []).map((c: any) => ({
          id: c.id,
          centreCode: c.centreCode,
          name: c.name,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load personnel roster');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStatus = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const token =
        sessionStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_token');
      await apiRequest(`/api/admin/personnel/${assignmentId}/status`, {
        method: 'PUT',
        token: token || undefined,
        body: { isActive: !currentStatus },
      });

      // Optimistic update
      setPersonnel((prev) =>
        prev.map((item) =>
          item.id === assignmentId ? { ...item, isActive: !currentStatus } : item
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update personnel status');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || !formCentreId) {
      setAssignError('Officer mobile number and assigned centre are mandatory.');
      return;
    }

    setSubmittingAssign(true);
    setAssignError(null);

    try {
      const token =
        sessionStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_token');
      await apiRequest('/api/admin/personnel/assign', {
        method: 'POST',
        token: token || undefined,
        body: {
          userMobile: mobile.trim(),
          mobile: mobile.trim(),
          centreId: formCentreId,
          role: formRole,
          department: formDept,
        },
      });

      setAssignModalOpen(false);
      setMobile('');
      await fetchData();
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign officer');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Filtered List
  const filteredPersonnel = personnel.filter((p) => {
    if (selectedCentre && p.centreId !== selectedCentre) return false;
    if (selectedDepartment && p.department !== selectedDepartment) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mobileMatch = p.user?.mobile?.includes(q);
      const centreMatch = p.centre?.name?.toLowerCase().includes(q) || p.centre?.centreCode?.toLowerCase().includes(q);
      const roleMatch = p.role?.toLowerCase().includes(q);
      if (!mobileMatch && !centreMatch && !roleMatch) return false;
    }
    return true;
  });

  return (
    <main className="min-h-[85vh] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            href="/authority/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Authority Dashboard</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Centre Personnel & Departmental Roster</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Govern field procurement officers, role boundaries, and active terminal authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setAssignModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Appoint Officer</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. Filters Strip */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by officer mobile, role, centre..."
            className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedCentre}
            onChange={(e) => setSelectedCentre(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Procurement Centres</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.centreCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            <option value="FOOD_CIVIL_SUPPLIES">Food & Civil Supplies</option>
            <option value="MARKETING_BOARD">State Agriculture Marketing Board</option>
            <option value="WAREHOUSING">State Warehousing Corporation</option>
          </select>
        </div>
      </div>

      {/* 3. Personnel Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="max-h-[580px] overflow-y-auto operations-queue-scroll overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Officer Mobile</th>
                <th className="py-3.5 px-4">Role & Stage</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Assigned Centre</th>
                <th className="py-3.5 px-4">Appointed At</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    <span>Loading personnel roster...</span>
                  </td>
                </tr>
              ) : filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No personnel found</p>
                    <p className="text-[11px] text-slate-500">
                      Appoint an officer or clear filters to view active roster
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    {/* Mobile */}
                    <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                      +91 {item.user?.mobile}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
                        {item.role}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-slate-200">
                      {item.department === 'FOOD_CIVIL_SUPPLIES'
                        ? 'Food & Civil Supplies'
                        : item.department === 'MARKETING_BOARD'
                        ? 'Marketing Board'
                        : item.department === 'WAREHOUSING'
                        ? 'Warehousing Corp'
                        : item.department}
                    </td>

                    {/* Assigned Centre */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{item.centre?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Code: {item.centre?.centreCode}
                      </div>
                    </td>

                    {/* Appointed At */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(item.assignedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-700">
                          <XCircle className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Toggle Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item.id, item.isActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold transition ${
                          item.isActive
                            ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                            : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{item.isActive ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Appoint Officer Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card rounded-3xl border border-slate-700 p-6 space-y-4 shadow-2xl bg-slate-950">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Appoint Centre Officer</span>
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Officer Mobile Number (10 Digits):</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Assigned Procurement Centre:</label>
                <select
                  value={formCentreId}
                  onChange={(e) => setFormCentreId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Centre...</option>
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.centreCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Designated Operational Role:</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPERATOR">OPERATOR (Weighbridge & Check-in)</option>
                  <option value="INSPECTOR">INSPECTOR (Quality Sample Analysis)</option>
                  <option value="CENTRE_MANAGER">CENTRE MANAGER (Overall Oversight & Payment)</option>
                  <option value="FARMER_VERIFICATION_AUTHORITY">
                    FARMER VERIFICATION AUTHORITY (Independent Scrutiny & Approval)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Department Jurisdiction:</label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FOOD_CIVIL_SUPPLIES">Department of Food & Civil Supplies</option>
                  <option value="MARKETING_BOARD">State Agricultural Marketing Board (Mandi)</option>
                  <option value="WAREHOUSING">State Warehousing Corporation (SWC)</option>
                  <option value="FARMER_VERIFICATION_DIRECTORATE">Farmer Verification Directorate (Independent Authority)</option>
                  <option value="REVENUE_DEPARTMENT">Department of Revenue & Land Records</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition active:scale-95 flex items-center gap-2"
                >
                  {submittingAssign && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Appoint Officer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
