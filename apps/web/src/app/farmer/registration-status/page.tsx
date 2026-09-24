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
    <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 text-[#014532]">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/farmer/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800/80 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHelpOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl hover:bg-emerald-50 text-sm font-semibold text-[#014532] shadow-sm transition"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Helpline</span>
          </button>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl hover:bg-emerald-50 text-sm font-semibold text-[#014532] shadow-sm transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? t.loading : locale === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl p-12 text-center border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl shadow-xl space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
          <p className="text-base font-semibold text-emerald-900/80">{t.loading}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl p-8 border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl shadow-xl text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="font-bold text-[#014532]">{error}</h3>
          <button
            onClick={() => router.push('/farmer/register')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-[#014532] font-bold text-sm shadow-md transition"
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
            className={`rounded-2xl border p-6 sm:p-8 shadow-xl transition relative overflow-hidden ${
              isVerified
                ? 'bg-white/95 backdrop-blur-sm shadow-xl border-emerald-200'
                : isReturned
                ? 'bg-white/95 backdrop-blur-sm shadow-xl border-amber-200'
                : isRejected
                ? 'bg-white/95 backdrop-blur-sm shadow-xl border-rose-500/50'
                : 'bg-white/95 backdrop-blur-sm shadow-xl border-blue-500/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
                    isVerified
                      ? 'bg-[#F4F9F7] border-emerald-200 text-emerald-700'
                      : isReturned
                      ? 'bg-[#F4F9F7] border-amber-200 text-amber-600'
                      : isRejected
                      ? 'bg-[#F4F9F7] border-rose-500/60 text-rose-400'
                      : 'bg-[#F4F9F7] border-blue-500/60 text-blue-400'
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
                      className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : isReturned
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : isRejected
                          ? 'bg-rose-950/70 text-rose-300 border-rose-500/50'
                          : 'bg-blue-950/70 text-blue-300 border-blue-500/50'
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
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-[#F4F9F7] border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-sm">
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>{locale === 'hi' ? 'मोबाइल सत्यापित' : 'Mobile Verified'}</span>
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-[#014532] pt-1">
                    {isVerified
                      ? (locale === 'hi' ? 'आपका किसान सत्यापन स्वीकृत हो गया है' : 'Authorised Verification Approved')
                      : isReturned
                      ? (locale === 'hi' ? 'आवेदन में सुधार की आवश्यकता है' : 'Action Required: Return for Correction')
                      : isRejected
                      ? (locale === 'hi' ? 'पंजीकरण आवेदन अस्वीकार किया गया' : 'Application Not Approved')
                      : (locale === 'hi' ? 'आपका आवेदन प्राधिकरण समीक्षाधीन है' : 'Application Queued for Authority Verification')}
                  </h1>

                  <p className="text-sm sm:text-base text-emerald-900/80 leading-relaxed max-w-2xl">
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
              <div className="shrink-0 bg-[#F4F9F7] border border-emerald-100 p-4 rounded-xl shadow-md text-right sm:text-left">
                <span className="text-sm uppercase font-bold text-emerald-800/80 tracking-wider block">
                  {t.regId}
                </span>
                <span className="font-mono text-base sm:text-base font-bold text-emerald-700 tracking-tight">
                  {regData.registrationNumber}
                </span>
                {regData.submittedAt && (
                  <span className="text-sm text-emerald-800/80 block mt-1">
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
              <div className="mt-5 p-4 rounded-xl bg-[#F4F9F7] border border-rose-500/50 space-y-1.5 shadow-md">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{locale === 'hi' ? 'प्राधिकरण अधिकारी की टिप्पणी:' : 'Authority Officer Remarks:'}</span>
                </div>
                <p className="text-sm sm:text-base text-[#014532] font-medium pl-6 leading-relaxed">
                  &quot;{regData.actionRequiredNotes || regData.rejectionReason}&quot;
                </p>
              </div>
            )}

            {/* ACTION BUTTONS STRIP */}
            <div className="mt-6 pt-5 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-3">
              {isVerified ? (
                <Link
                  href="/farmer/book"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-[#014532] font-bold text-sm sm:text-base shadow-md transition active:scale-[0.99]"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>{locale === 'hi' ? 'खरीद स्लॉट बुक करें' : 'Book Procurement Slot'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : isReturned ? (
                <Link
                  href="/farmer/register?action=update"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-[#014532] font-bold text-sm sm:text-base shadow-md transition active:scale-[0.99]"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{locale === 'hi' ? 'विवरण सुधारें व पुनः सबमिट करें' : 'Update Details & Resubmit'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    disabled
                    className="cursor-not-allowed inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#F4F9F7] border border-emerald-100 text-emerald-700/80 font-semibold text-sm sm:text-base"
                    title="Verification pending approval by authority"
                  >
                    <Lock className="w-4 h-4 text-emerald-700/80" />
                    <span>{locale === 'hi' ? 'स्लॉट बुकिंग लॉक है (सत्यापन प्रतीक्षित)' : 'Procurement Booking Locked'}</span>
                  </button>
                  <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    {locale === 'hi'
                      ? 'प्राधिकरण अनुमोदन के पश्चात बुकिंग स्वतः सक्रिय हो जाएगी।'
                      : 'Slot booking will automatically unlock once verified.'}
                  </span>
                </div>
              )}

              <Link
                href="/farmer/centres"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800/80 hover:text-emerald-700 transition"
              >
                <Building className="w-3.5 h-3.5 text-emerald-800/80" />
                <span>{locale === 'hi' ? 'खरीद केंद्र सूची देखें' : 'View Procurement Centres'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. FOUR-STEP VERIFICATION LIFECYCLE TRACKER                  */}
          {/* ============================================================ */}
          <div className="rounded-2xl p-6 sm:p-7 border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl shadow-xl space-y-4">
            <h2 className="text-base sm:text-base font-bold text-[#014532] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{locale === 'hi' ? 'सत्यापन प्रक्रिया एवं स्थिति' : 'Verification Lifecycle'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-[#F4F9F7] border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between text-sm font-bold text-emerald-700">
                  <span>1. Mobile OTP</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-sm text-emerald-900/80">
                  {user?.mobile ? `+91 ${user.mobile}` : 'Authenticated'}
                </p>
                <span className="text-sm text-emerald-700 font-semibold">Completed ✓</span>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-[#F4F9F7] border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between text-sm font-bold text-emerald-700">
                  <span>2. Registration</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-sm text-emerald-900/80">Land & bank records</p>
                <span className="text-sm text-emerald-700 font-semibold">Submitted ✓</span>
              </div>

              {/* Step 3 */}
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  isVerified
                    ? 'bg-[#F4F9F7] border-emerald-200'
                    : isReturned
                    ? 'bg-[#F4F9F7] border-amber-200'
                    : isRejected
                    ? 'bg-[#F4F9F7] border-rose-500/50'
                    : 'bg-[#F4F9F7] border-blue-500/40'
                }`}
              >
                <div className="flex items-center justify-between text-sm font-bold text-[#014532]">
                  <span>3. Authority Review</span>
                  {isVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : isReturned ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : isRejected ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-emerald-900/80">
                  {isVerified
                    ? 'Government Approved'
                    : isReturned
                    ? 'Action Required'
                    : isRejected
                    ? 'Rejected'
                    : 'Under Active Review'}
                </p>
                <span
                  className={`text-sm font-bold ${
                    isVerified
                      ? 'text-emerald-700'
                      : isReturned
                      ? 'text-amber-600'
                      : isRejected
                      ? 'text-rose-400'
                      : 'text-blue-400'
                  }`}
                >
                  {isVerified ? 'Approved ✓' : isReturned ? 'Returned' : isRejected ? 'Rejected' : 'In Progress...'}
                </span>
              </div>

              {/* Step 4 */}
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  isVerified
                    ? 'bg-[#F4F9F7] border-emerald-200'
                    : 'bg-[#F4F9F7] border-emerald-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-sm font-bold text-[#014532]">
                  <span>4. Booking Active</span>
                  {isVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Lock className="w-4 h-4 text-emerald-700/80" />
                  )}
                </div>
                <p className="text-sm text-emerald-800/80">
                  {isVerified ? 'Arrival Slot Scheduling' : 'Locked until verified'}
                </p>
                <span
                  className={`text-sm font-bold ${
                    isVerified ? 'text-emerald-700' : 'text-emerald-700/80'
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
          <div className="rounded-2xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-emerald-50 transition"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-base text-[#014532]">{t.personalTitle}</span>
              </div>
              {openSections.personal ? (
                <ChevronUp className="w-4 h-4 text-emerald-800/80" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-800/80" />
              )}
            </button>

            {openSections.personal && (
              <div className="p-4 sm:p-5 pt-0 border-t border-emerald-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.fullName}</span>
                  <span className="font-semibold text-[#014532]">{regData.personal?.fullName || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{locale === 'hi' ? 'पिता / पति का नाम' : 'Father / Spouse Name'}</span>
                  <span className="font-semibold text-[#014532]">{regData.personal?.fatherOrSpouseName || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.gender}</span>
                  <span className="font-semibold text-[#014532] capitalize">{regData.personal?.gender || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.category}</span>
                  <span className="font-semibold text-[#014532]">{regData.personal?.category || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{locale === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</span>
                  <span className="font-semibold text-[#014532] font-mono">{regData.personal?.mobile || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">Aadhaar (Masked)</span>
                  <span className="font-mono text-emerald-700 font-semibold">{regData.personal?.aadhaarNumberMasked || 'XXXX-XXXX-XXXX'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Address Details */}
          <div className="rounded-2xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('address')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-emerald-50 transition"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-base text-[#014532]">{t.addressTitle}</span>
              </div>
              {openSections.address ? (
                <ChevronUp className="w-4 h-4 text-emerald-800/80" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-800/80" />
              )}
            </button>

            {openSections.address && (
              <div className="p-4 sm:p-5 pt-0 border-t border-emerald-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.district}</span>
                  <span className="font-semibold text-[#014532]">{regData.address?.district || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.block}</span>
                  <span className="font-semibold text-[#014532]">{regData.address?.block || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.village}</span>
                  <span className="font-semibold text-[#014532]">{regData.address?.village || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.pincode}</span>
                  <span className="font-semibold text-[#014532] font-mono">{regData.address?.pincode || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-emerald-800/80 block text-sm">Address Line</span>
                  <span className="font-semibold text-[#014532]">{regData.address?.addressLine || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Land Holding & Crops */}
          <div className="rounded-2xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('land')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-emerald-50 transition"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-emerald-700" />
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-[#014532]">{t.landTitle}</span>
                  <span className="text-sm text-emerald-800/80">
                    ({regData.landParcels?.length || 0} parcels, {totalLandAcres.toFixed(1)} {t.acres})
                  </span>
                </div>
              </div>
              {openSections.land ? (
                <ChevronUp className="w-4 h-4 text-emerald-800/80" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-800/80" />
              )}
            </button>

            {openSections.land && (
              <div className="p-4 sm:p-5 pt-0 border-t border-emerald-100 space-y-3">
                {regData.landParcels?.map((parcel, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F4F9F7] rounded-xl border border-emerald-100 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#014532]">
                        {locale === 'hi' ? 'पार्सल' : 'Parcel'} #{idx + 1} — Survey / Khasra: <span className="font-mono text-emerald-700 font-bold">{parcel.surveyNumber || 'N/A'}</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {parcel.areaAcres} {t.acres}
                      </span>
                    </div>
                    <div className="text-emerald-800/80 text-sm flex gap-3">
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
          <div className="rounded-2xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('bank')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-emerald-50 transition"
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-base text-[#014532]">{t.bankTitle}</span>
              </div>
              {openSections.bank ? (
                <ChevronUp className="w-4 h-4 text-emerald-800/80" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-800/80" />
              )}
            </button>

            {openSections.bank && (
              <div className="p-4 sm:p-5 pt-0 border-t border-emerald-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-emerald-800/80 block text-sm">{locale === 'hi' ? 'खाता धारक का नाम' : 'Account Holder Name'}</span>
                  <span className="font-semibold text-[#014532]">{regData.bank?.accountHolderName || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.bankName}</span>
                  <span className="font-semibold text-[#014532]">{regData.bank?.bankName || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.ifscCode}</span>
                  <span className="font-mono font-semibold text-[#014532]">{regData.bank?.ifscCode || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">{t.accountNumber}</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {regData.bank?.accountNumberMasked || regData.bank?.accountNumber || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block text-sm">DBT Settlement</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
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
