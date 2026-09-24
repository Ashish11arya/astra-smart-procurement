'use client';

import React from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  Landmark,
  Phone,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { FarmerState } from '@astra/shared';

export default function FarmerProfilePage() {
  const { t, locale } = useLanguage();
  const { user, farmer, registration, farmerState } = useAuth();

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 text-[#014532]">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/farmer/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800/80 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back}</span>
        </Link>
        <span className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-800/80">
          Astra Verified Citizen Identity
        </span>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-2xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-white/95 backdrop-blur-md p-5 sm:p-6 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xl font-bold shadow-md">
              {farmer?.fullName?.charAt(0) || 'K'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#014532] tracking-tight">{farmer?.fullName || 'Farmer Profile'}</h1>
              <p className="text-sm text-emerald-900/80 mt-0.5">
                {t.farmerId}: <strong className="text-emerald-700 font-mono font-bold">{farmer?.farmerCode || '—'}</strong>
              </p>
            </div>
          </div>

          <div>
            {farmerState === FarmerState.VERIFIED ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                {t.statusVerified}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {t.statusUnderVerification}
              </span>
            )}
          </div>
        </div>

        {/* Profile Details Sections */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-800/80 border-b border-emerald-100 pb-2">
              {t.personalTitle}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-emerald-800/80 block">{t.fullName}:</span>
                <strong className="text-[#014532] text-base font-semibold">{farmer?.fullName}</strong>
              </div>
              <div>
                <span className="text-emerald-800/80 block">{t.fatherSpouseName}:</span>
                <strong className="text-[#014532] text-base font-semibold">
                  {farmer?.fatherOrSpouseName || '—'}
                </strong>
              </div>
              <div>
                <span className="text-emerald-800/80 block">{t.gender}:</span>
                <strong className="text-[#014532]">{farmer?.gender || '—'}</strong>
              </div>
              <div>
                <span className="text-emerald-800/80 block">{t.category}:</span>
                <strong className="text-[#014532]">{farmer?.category || '—'}</strong>
              </div>
            </div>
          </div>

          {/* Contact & Jurisdiction */}
          <div className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-800/80 border-b border-emerald-100 pb-2">
              {t.addressTitle}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-emerald-800/80 block">{t.mobileLabel}:</span>
                <strong className="text-[#014532] font-mono text-base font-semibold">
                  +91 {farmer?.mobile || user?.mobile}
                </strong>
              </div>
              <div>
                <span className="text-emerald-800/80 block">{t.district}:</span>
                <strong className="text-[#014532]">{farmer?.district || '—'}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-emerald-800/80 block">{t.village}:</span>
                <strong className="text-[#014532]">{farmer?.village || '—'}</strong>
              </div>
            </div>
          </div>

          {/* Registered Land Parcels */}
          {registration?.landParcels && registration.landParcels.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-800/80 border-b border-emerald-100 pb-2">
                {t.landTitle} ({registration.landParcels.length})
              </h2>
              <div className="space-y-2">
                {registration.landParcels.map((parcel, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#F4F9F7] border border-emerald-100 flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-bold text-[#014532]">
                        {t.khasraNumber}: <span className="font-mono text-emerald-700 font-bold">{parcel.khasraNumber}</span>
                      </span>
                      <div className="text-emerald-800/80 text-sm mt-0.5">
                        {parcel.village}, {parcel.block}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-700">{parcel.areaAcres} {t.acres}</span>
                      <div className="text-emerald-800/80 text-sm uppercase mt-0.5">
                        {parcel.ownershipType}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Masked Bank Account for Procurement Disbursal */}
          {registration?.bank && (
            <div className="space-y-3">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-800/80 border-b border-emerald-100 pb-2">
                {t.bankTitle}
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-emerald-800/80 block">{t.bankName}:</span>
                  <strong className="text-[#014532] font-semibold">{registration.bank.bankName}</strong>
                </div>
                <div>
                  <span className="text-emerald-800/80 block">{t.accountNumber}:</span>
                  <strong className="text-emerald-700 font-mono font-bold text-base tracking-wider">
                    {registration.bank.accountNumberMasked || '••••••••'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              {locale === 'hi'
                ? 'राष्ट्रीय डेटा सुरक्षा मानकों के अनुसार पूर्ण बैंक खाता संख्या और पहचान संख्या सुरक्षित एवं छिपाई गई है।'
                : 'Sensitive details such as full bank account numbers and government IDs are protected and masked in accordance with national data privacy standards.'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <Link
              href="/farmer/registration-status"
              className="flex-1 py-3 rounded-xl bg-[#F4F9F7] hover:bg-emerald-50 border border-emerald-100 text-[#014532] font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>{t.viewStatus}</span>
            </Link>

            <Link
              href="/farmer/dashboard"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-[#014532] font-bold text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>{t.goToDashboard}</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
