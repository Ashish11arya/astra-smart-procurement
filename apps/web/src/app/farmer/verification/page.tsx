'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle,
  FileText,
  ArrowLeft,
  ArrowRight,
  Edit3,
  Calendar,
  Building,
  User,
  MapPin,
  Landmark,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Layers,
  FileCheck,
  Lock,
  PhoneCall,
  Check,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { RegistrationSummaryDto, RegistrationStatus } from '@astra/shared';
import { HelpModal } from '../../../components/common/HelpModal';

export default function FarmerVerificationPage() {
  const { t, locale } = useLanguage();
  const { user, token, refreshStatus: refreshAuthStatus } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regData, setRegData] = useState<RegistrationSummaryDto | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Collapsible section toggles
  const [openSections, setOpenSections] = useState({
    personal: true,
    address: true,
    land: true,
    bank: true,
    documents: false,
    timeline: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<RegistrationSummaryDto>('/api/farmer/registration-status', {
        token,
      });
      setRegData(data);
      await refreshAuthStatus();
    } catch (err: any) {
      setError(err.message || t.serverError);
    } finally {
      setLoading(false);
    }
  }, [token, t.serverError, refreshAuthStatus]);

  useEffect(() => {
    if (token) {
      fetchStatus();
    }
  }, [token, fetchStatus]);

  // Compute total land area in acres
  const totalLandAcres =
    regData?.landParcels?.reduce((sum, p) => sum + (Number(p.areaAcres) || 0), 0) || 0;

  const isVerified =
    regData?.status === RegistrationStatus.VERIFIED ||
    (regData?.status as string) === 'VERIFIED';

  const isReturned =
    regData?.status === RegistrationStatus.RETURNED_FOR_CORRECTION ||
    regData?.status === RegistrationStatus.ACTION_REQUIRED ||
    (regData?.status as string) === 'RETURNED_FOR_CORRECTION' ||
    (regData?.status as string) === 'ACTION_REQUIRED';

  const isRejected =
    regData?.status === RegistrationStatus.REJECTED ||
    (regData?.status as string) === 'REJECTED';

  const isPending =
    !isVerified && !isReturned && !isRejected;

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/farmer/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHelpOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Helpline</span>
          </button>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 shadow-sm transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? t.loading : locale === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800/80 bg-slate-900/50 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">{t.loading}</p>
        </div>
      ) : error ? (
        <div className="glass-card rounded-3xl p-8 border border-slate-800/80 bg-slate-900/50 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-white">{error}</h3>
          <button
            onClick={() => router.push('/farmer/register')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-900/30"
          >
            {t.startRegistration}
          </button>
        </div>
      ) : regData ? (
        <div className="space-y-6">
          {/* ============================================================ */}
          {/* 1. PRIMARY STATUS BANNER CARD                                */}
          {/* ============================================================ */}
          <div
            className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-xl transition relative overflow-hidden ${
              isVerified
                ? 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-950/20'
                : isReturned
                ? 'bg-amber-950/30 border-amber-500/40 shadow-amber-950/20'
                : isRejected
                ? 'bg-rose-950/30 border-rose-500/40 shadow-rose-950/20'
                : 'bg-indigo-950/30 border-indigo-500/30 shadow-indigo-950/20'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isVerified
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : isReturned
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                      : isRejected
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                      : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  {isVerified ? (
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  ) : isReturned ? (
                    <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
                  ) : isRejected ? (
                    <XCircle className="w-8 h-8 stroke-[2.5]" />
                  ) : (
                    <Clock className="w-8 h-8 stroke-[2.5] animate-pulse" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        isVerified
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : isReturned
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : isRejected
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                      }`}
                    >
                      {isVerified
                        ? (locale === 'hi' ? 'सत्यापित किसान — खरीद हेतु अधिकृत' : 'Verified Farmer — Eligible for Booking')
                        : isReturned
                        ? (locale === 'hi' ? 'संशोधन हेतु वापस भेजा गया' : 'Returned for Correction')
                        : isRejected
                        ? (locale === 'hi' ? 'आवेदन अस्वीकृत' : 'Application Rejected')
                        : (locale === 'hi' ? 'सत्यापन लंबित — प्राधिकरण समीक्षाधीन' : 'Verification Pending — Under Authority Review')}
                    </span>

                    {/* Mobile Verified Pill */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      <span>{locale === 'hi' ? 'मोबाइल सत्यापित' : 'Mobile Verified'}</span>
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-white pt-1">
                    {isVerified
                      ? (locale === 'hi' ? 'आपका किसान सत्यापन स्वीकृत हो गया है' : 'Authorised Verification Approved')
                      : isReturned
                      ? (locale === 'hi' ? 'आवेदन में सुधार की आवश्यकता है' : 'Action Required: Return for Correction')
                      : isRejected
                      ? (locale === 'hi' ? 'पंजीकरण आवेदन अस्वीकार किया गया' : 'Application Not Approved')
                      : (locale === 'hi' ? 'आपका आवेदन प्राधिकरण समीक्षाधीन है' : 'Application Queued for Authority Verification')}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                    {isVerified
                      ? (locale === 'hi'
                          ? 'बधाई! आपके भूमि विवरण और बैंक खाते का अधिकृत खरीद अधिकारी द्वारा सत्यापन पूर्ण हो गया है। आप न्यूनतम समर्थन मूल्य (MSP) पर अनाज बेचने हेतु स्लॉट बुक कर सकते हैं।'
                          : 'Your personal credentials, land declarations, and bank account have been officially verified by the Authorised Procurement Authority. You are now eligible to book delivery slots.')
                      : isReturned
                      ? (locale === 'hi'
                          ? 'प्राधिकरण अधिकारी ने आपके आवेदन में कुछ कमियां पाई हैं। कृपया नीचे दिए गए कारण को पढ़कर आवश्यक सुधार करें और पुनः सबमिट करें।'
                          : 'The Authorised Officer requested modifications to your application. Please review the deficiency notes below and resubmit.')
                      : isRejected
                      ? (locale === 'hi'
                          ? 'आपका पंजीकरण वर्तमान विवरणों के आधार पर स्वीकृत नहीं किया जा सका। अधिक जानकारी के लिए हेल्पलाइन 1800-180-1551 पर संपर्क करें।'
                          : 'Your application could not be verified with the provided documents. Please refer to the formal reason below or contact the Kisan helpline.')
                      : (locale === 'hi'
                          ? 'आपका पंजीकरण आवेदन प्राप्त हो चुका है और क्षेत्रीय खरीद प्राधिकरण के समीक्षा रोस्टर में है। सरकारी नियमों के अनुसार स्लॉट बुकिंग सत्यापन के उपरांत ही सक्षम होगी।'
                          : 'Your application has been registered and is queued for verification by the designated procurement authority. Concurrency locks prevent duplicate processing. Slot booking will unlock once approved.')}
                  </p>
                </div>
              </div>

              {/* Application Number Box */}
              <div className="shrink-0 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-right sm:text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  {t.regId}
                </span>
                <span className="font-mono text-sm sm:text-base font-black text-emerald-400 tracking-tight">
                  {regData.registrationNumber}
                </span>
                {regData.submittedAt && (
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {new Date(regData.submittedAt).toLocaleDateString(
                      locale === 'hi' ? 'hi-IN' : 'en-IN',
                      { day: 'numeric', month: 'short', year: 'numeric' }
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* RETURN / REJECTION REASON CALLOUT BOX */}
            {(isReturned || isRejected) && (regData.rejectionReason || regData.actionRequiredNotes) && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{locale === 'hi' ? 'प्राधिकरण अधिकारी की टिप्पणी:' : 'Authority Officer Remarks:'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-medium pl-6 leading-relaxed">
                  &quot;{regData.actionRequiredNotes || regData.rejectionReason}&quot;
                </p>
              </div>
            )}

            {/* ACTION BUTTONS STRIP */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              {isVerified ? (
                <Link
                  href="/farmer/book"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition active:scale-[0.99]"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>{locale === 'hi' ? 'खरीद स्लॉट बुक करें' : 'Book Procurement Slot'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : isReturned ? (
                <Link
                  href="/farmer/register?action=update"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/40 transition active:scale-[0.99]"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{locale === 'hi' ? 'विवरण सुधारें व पुनः सबमिट करें' : 'Update Details & Resubmit'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    disabled
                    className="cursor-not-allowed inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-400 font-semibold text-xs sm:text-sm opacity-60"
                    title="Verification pending approval by authority"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>{locale === 'hi' ? 'स्लॉट बुकिंग लॉक है (सत्यापन प्रतीक्षित)' : 'Procurement Booking Locked'}</span>
                  </button>
                  <span className="text-[11px] text-amber-300/80 bg-amber-950/40 border border-amber-900/50 px-3 py-1.5 rounded-xl">
                    {locale === 'hi'
                      ? 'प्राधिकरण अनुमोदन के पश्चात बुकिंग स्वतः सक्रिय हो जाएगी।'
                      : 'Slot booking will automatically unlock once verified.'}
                  </span>
                </div>
              )}

              <Link
                href="/farmer/centres"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition"
              >
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{locale === 'hi' ? 'खरीद केंद्र सूची देखें' : 'View Procurement Centres'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. FOUR-STEP VERIFICATION LIFECYCLE TRACKER                  */}
          {/* ============================================================ */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800/80 space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{locale === 'hi' ? 'सत्यापन प्रक्रिया एवं स्थिति' : 'Verification Lifecycle'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>1. Mobile OTP</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-300">
                  {user?.mobile ? `+91 ${user.mobile}` : 'Authenticated'}
                </p>
                <span className="text-[10px] text-emerald-400/90 font-medium">Completed ✓</span>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>2. Registration</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-300">Land & bank records</p>
                <span className="text-[10px] text-emerald-400/90 font-medium">Submitted ✓</span>
              </div>

              {/* Step 3 */}
              <div
                className={`p-3.5 rounded-2xl border space-y-1 ${
                  isVerified
                    ? 'bg-slate-900/70 border-emerald-500/30'
                    : isReturned
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : isRejected
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-indigo-950/30 border-indigo-500/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>3. Authority Review</span>
                  {isVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isReturned ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : isRejected ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300">
                  {isVerified
                    ? 'Government Approved'
                    : isReturned
                    ? 'Action Required'
                    : isRejected
                    ? 'Rejected'
                    : 'Under Active Review'}
                </p>
                <span
                  className={`text-[10px] font-medium ${
                    isVerified
                      ? 'text-emerald-400'
                      : isReturned
                      ? 'text-amber-400'
                      : isRejected
                      ? 'text-rose-400'
                      : 'text-indigo-300'
                  }`}
                >
                  {isVerified ? 'Approved ✓' : isReturned ? 'Returned' : isRejected ? 'Rejected' : 'In Progress...'}
                </span>
              </div>

              {/* Step 4 */}
              <div
                className={`p-3.5 rounded-2xl border space-y-1 ${
                  isVerified
                    ? 'bg-slate-900/70 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>4. Booking Active</span>
                  {isVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {isVerified ? 'Arrival Slot Scheduling' : 'Locked until verified'}
                </p>
                <span
                  className={`text-[10px] font-medium ${
                    isVerified ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {isVerified ? 'Ready for Booking' : 'Pending Step 3'}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. APPLICATION DETAILS (COLLAPSIBLE SECTIONS)                */}
          {/* ============================================================ */}

          {/* Personal Details */}
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">{t.personalTitle}</span>
              </div>
              {openSections.personal ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.personal && (
              <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.fullName}</span>
                  <span className="font-semibold text-white">{regData.personal?.fullName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{locale === 'hi' ? 'पिता / पति का नाम' : 'Father / Spouse Name'}</span>
                  <span className="font-semibold text-white">{regData.personal?.fatherOrSpouseName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.gender}</span>
                  <span className="font-semibold text-white capitalize">{regData.personal?.gender || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.category}</span>
                  <span className="font-semibold text-white">{regData.personal?.category || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{locale === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</span>
                  <span className="font-semibold text-white">{regData.personal?.mobile || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Aadhaar (Masked)</span>
                  <span className="font-mono text-white">{regData.personal?.aadhaarNumberMasked || 'XXXX-XXXX-XXXX'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Address Details */}
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => toggleSection('address')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm text-white">{t.addressTitle}</span>
              </div>
              {openSections.address ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.address && (
              <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.district}</span>
                  <span className="font-semibold text-white">{regData.address?.district || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.block}</span>
                  <span className="font-semibold text-white">{regData.address?.block || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.village}</span>
                  <span className="font-semibold text-white">{regData.address?.village || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.pincode}</span>
                  <span className="font-semibold text-white">{regData.address?.pincode || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Address Line</span>
                  <span className="font-semibold text-white">{regData.address?.addressLine || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Land Holding & Crops */}
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => toggleSection('land')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-emerald-400" />
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{t.landTitle}</span>
                  <span className="text-xs text-slate-400">
                    ({regData.landParcels?.length || 0} parcels, {totalLandAcres.toFixed(1)} {t.acres})
                  </span>
                </div>
              </div>
              {openSections.land ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.land && (
              <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 space-y-3">
                {regData.landParcels?.map((parcel, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">
                        {locale === 'hi' ? 'पार्सल' : 'Parcel'} #{idx + 1} — Survey / Khasra: {parcel.surveyNumber || 'N/A'}
                      </span>
                      <span className="font-mono font-bold text-white">
                        {parcel.areaAcres} {t.acres}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex gap-3">
                      <span>Type: {parcel.landType}</span>
                      <span>•</span>
                      <span>Crop: {parcel.cropSown || 'Wheat / Paddy'}</span>
                      <span>•</span>
                      <span>Season: {parcel.season || 'Rabi 2026-27'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bank & Payment Details */}
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => toggleSection('bank')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">{t.bankTitle}</span>
              </div>
              {openSections.bank ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.bank && (
              <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">{locale === 'hi' ? 'खाता धारक का नाम' : 'Account Holder Name'}</span>
                  <span className="font-semibold text-white">{regData.bank?.accountHolderName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.bankName}</span>
                  <span className="font-semibold text-white">{regData.bank?.bankName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.ifscCode}</span>
                  <span className="font-mono font-semibold text-white">{regData.bank?.ifscCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.accountNumber}</span>
                  <span className="font-mono text-white">
                    {regData.bank?.accountNumberMasked || regData.bank?.accountNumber || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">DBT Settlement</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <Check className="w-3 h-3" /> Aadhaar Linked
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}
