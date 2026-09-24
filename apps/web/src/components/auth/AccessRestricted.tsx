'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Home, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AccessRestrictedProps {
  requiredRole?: string | string[];
  customMessage?: string;
}

export function AccessRestricted({ requiredRole, customMessage }: AccessRestrictedProps) {
  const { user, logout } = useAuth();

  const getDashboardHref = () => {
    if (!user) return '/';
    if (user.role === 'GOVERNMENT_ADMIN') return '/authority/dashboard';
    if (user.role === 'FARMER') return '/farmer/dashboard';
    switch (user.role) {
      case 'CHECK_IN_OFFICER':
      case 'CHECK_IN':
        return '/operations/checkin';
      case 'WEIGHMENT_OFFICER':
      case 'WEIGHMENT_SUPERVISOR':
      case 'WEIGHMENT':
        return '/operations/weighment';
      case 'QUALITY_OFFICER':
      case 'QUALITY':
        return '/operations/quality';
      case 'PROCUREMENT_OFFICER':
      case 'PROCUREMENT':
        return '/operations/procurement';
      case 'PAYMENT_OFFICER':
      case 'PAYMENT':
        return '/operations/payment';
      case 'PROCUREMENT_CENTRE_OFFICER':
        return '/operations/centre';
      default:
        return '/';
    }
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return 'Unauthenticated';
    switch (role) {
      case 'GOVERNMENT_ADMIN':
        return 'State Authority Admin';
      case 'FARMER':
        return 'Registered Farmer';
      case 'CHECK_IN_OFFICER':
      case 'CHECK_IN':
        return 'Gate Check-in Officer';
      case 'WEIGHMENT_OFFICER':
      case 'WEIGHMENT_SUPERVISOR':
      case 'WEIGHMENT':
        return 'Weighbridge Officer';
      case 'QUALITY_OFFICER':
      case 'QUALITY':
        return 'Grain Quality & Lab Testing Officer';
      case 'PROCUREMENT_OFFICER':
      case 'PROCUREMENT':
        return 'Procurement Officer';
      case 'PAYMENT_OFFICER':
      case 'PAYMENT':
        return 'DBT Settlement Officer';
      case 'PROCUREMENT_CENTRE_OFFICER':
        return 'Centre Operations Officer';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg glass-card p-8 sm:p-10 rounded-3xl border border-rose-900/60 bg-rose-950/20 backdrop-blur-xl text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-600/50 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-950/90 text-rose-400 border border-rose-800/80 inline-block">
            Access Restricted
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
            Access Restricted
          </h1>
          <p className="text-sm text-slate-300 max-w-sm mx-auto">
            {customMessage || 'This workspace is not available for your account.'}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Your current role does not have permission to access this section.
          </p>
        </div>

        {user && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs text-left space-y-1.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Authenticated Role:</span>
              <span className="font-bold text-white font-mono">{getRoleLabel(user.role)}</span>
            </div>
            {user.mobile && (
              <div className="flex justify-between items-center text-slate-400">
                <span>Account Mobile:</span>
                <span className="font-mono text-slate-300">+91 {user.mobile}</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={getDashboardHref()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
          >
            <span>Go to My Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition"
          >
            <Home className="w-4 h-4" />
            <span>Go to ASTRA Home</span>
          </Link>
        </div>

        {user && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign in with a different account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
