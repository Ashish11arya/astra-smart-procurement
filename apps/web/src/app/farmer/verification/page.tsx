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
    <main className="flex-1 w-[94vw] max-w-[1380px] mx-auto pt-6 sm:pt-8 pb-12 font-sans">

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <RefreshCw className="w-8 h-8 text-[#00695C] animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">{t.loading}</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="font-bold text-gray-900">{error}</h3>
          <button
            onClick={() => router.push('/farmer/register')}
            className="px-6 py-2.5 rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white font-semibold text-sm shadow-md"
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
            className={`rounded-3xl border p-6 md:p-10 shadow-sm transition relative overflow-hidden ${
              isVerified
                ? 'bg-[#E8F8F3] border-[#A7E8D0]'
                : isReturned
                ? 'bg-amber-50 border-amber-200'
                : isRejected
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}
            style={{
              backgroundImage: isVerified ? 'linear-gradient(to right bottom, #E8F8F3, #F4FBF9)' : 'none'
            }}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div className="flex items-start gap-5">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-4 bg-white ${
                    isVerified
                      ? 'border-[#00695C] text-[#00695C]'
                      : isReturned
                      ? 'border-amber-500 text-amber-600'
                      : isRejected
                      ? 'border-red-500 text-red-600'
                      : 'border-blue-500 text-blue-600'
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

                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${
                        isVerified
                          ? 'bg-[#E0F2F1] text-[#00695C] border-[#80CBC4]'
                          : isReturned
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : isRejected
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      {isVerified
                        ? (locale === 'hi' ? 'सत्यापित किसान — खरीद हेतु अधिकृत' : 'VERIFIED FARMER — ELIGIBLE FOR BOOKING')
                        : isReturned
                        ? (locale === 'hi' ? 'संशोधन हेतु वापस भेजा गया' : 'RETURNED FOR CORRECTION')
                        : isRejected
                        ? (locale === 'hi' ? 'आवेदन अस्वीकृत' : 'APPLICATION REJECTED')
                        : (locale === 'hi' ? 'सत्यापन लंबित — प्राधिकरण समीक्षाधीन' : 'VERIFICATION PENDING — UNDER AUTHORITY REVIEW')}
                    </span>

                    {/* Mobile Verified Pill */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00695C] bg-white border border-[#A7E8D0] px-3 py-1 rounded-full shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                      <span>{locale === 'hi' ? 'मोबाइल सत्यापित' : 'Mobile Verified'}</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-[#123B3A]">
                    {isVerified
                      ? (locale === 'hi' ? 'आपका किसान सत्यापन स्वीकृत हो गया है' : 'Authorised Verification Approved')
                      : isReturned
                      ? (locale === 'hi' ? 'आवेदन में सुधार की आवश्यकता है' : 'Action Required: Return for Correction')
                      : isRejected
                      ? (locale === 'hi' ? 'पंजीकरण आवेदन अस्वीकार किया गया' : 'Application Not Approved')
                      : (locale === 'hi' ? 'आपका आवेदन प्राधिकरण समीक्षाधीन है' : 'Application Queued for Authority Verification')}
                  </h1>

                  <p className="text-sm sm:text-base text-[#3C5B5A] leading-relaxed max-w-3xl">
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
                  
                  {/* ACTION BUTTONS STRIP */}
                  <div className="pt-4 flex flex-wrap items-center gap-4 relative z-20">
                    {isVerified ? (
                      <Link
                        href="/farmer/book"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white font-bold text-sm shadow-md transition"
                      >
                        <CalendarDays className="w-4 h-4" />
                        <span>{locale === 'hi' ? 'खरीद स्लॉट बुक करें' : 'Book Procurement Slot'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : isReturned ? (
                      <Link
                        href="/farmer/register?action=update"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>{locale === 'hi' ? 'विवरण सुधारें व पुनः सबमिट करें' : 'Update Details & Resubmit'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          disabled
                          className="cursor-not-allowed inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 font-semibold text-sm"
                          title="Verification pending approval by authority"
                        >
                          <Lock className="w-4 h-4" />
                          <span>{locale === 'hi' ? 'स्लॉट बुकिंग लॉक है (सत्यापन प्रतीक्षित)' : 'Procurement Booking Locked'}</span>
                        </button>
                      </div>
                    )}

                    <Link
                      href="/farmer/centres"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#00695C] text-[#00695C] hover:bg-[#F3FBF8] font-bold text-sm transition"
                    >
                      <Building className="w-4 h-4" />
                      <span>{locale === 'hi' ? 'खरीद केंद्र सूची देखें' : 'View Procurement Centres'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Actions & Application Number Box */}
              <div className="shrink-0 flex flex-col items-end gap-4 z-10 md:w-80">
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#A7E8D0] bg-white hover:bg-[#F3FBF8] text-sm font-semibold text-[#00695C] shadow-sm transition active:scale-95 w-fit"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? t.loading : locale === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
                </button>
                <div className="bg-white border border-[#A7E8D0] shadow-sm p-6 rounded-2xl w-full flex flex-col items-start space-y-2">
                  <div className="flex items-center gap-2 text-[#00695C] mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#E8F8F3] flex items-center justify-center text-[#00695C]">
                     <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                    {t.regId}
                  </span>
                </div>
                <span className="text-xl font-bold text-[#123B3A] tracking-tight">
                  {regData.registrationNumber}
                </span>
                {regData.submittedAt && (
                  <div className="flex items-center gap-1.5 text-gray-500 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium">
                      {new Date(regData.submittedAt).toLocaleDateString(
                        locale === 'hi' ? 'hi-IN' : 'en-IN',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )}
                    </span>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* RETURN / REJECTION REASON CALLOUT BOX */}
            {(isReturned || isRejected) && (regData.rejectionReason || regData.actionRequiredNotes) && (
              <div className="mt-6 p-5 rounded-xl bg-red-50 border border-red-200 space-y-2 relative z-20">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>{locale === 'hi' ? 'प्राधिकरण अधिकारी की टिप्पणी:' : 'Authority Officer Remarks:'}</span>
                </div>
                <p className="text-sm text-gray-800 font-medium pl-7 leading-relaxed">
                  &quot;{regData.actionRequiredNotes || regData.rejectionReason}&quot;
                </p>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 2. FOUR-STEP VERIFICATION LIFECYCLE TRACKER                  */}
          {/* ============================================================ */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 md:p-10 space-y-8">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00695C]" />
                <span>{locale === 'hi' ? 'सत्यापन प्रक्रिया एवं स्थिति' : 'Verification Lifecycle'}</span>
              </h2>
              <ChevronUp className="w-5 h-5 text-gray-400" />
            </div>

            <div className="relative">
              {/* Connecting line (Desktop only) */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 xl:gap-8 relative z-10">
                {/* Step 1 */}
                <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-6 flex flex-col space-y-4 shadow-sm">
                   <div className="flex items-center justify-between">
                     <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] font-bold flex items-center justify-center text-sm">1</div>
                     <CheckCircle2 className="w-5 h-5 text-[#0284C7]" />
                   </div>
                   <div>
                     <h3 className="font-bold text-[#0369A1] text-sm mb-0.5">Mobile OTP</h3>
                     <p className="text-xs font-medium text-gray-600">
                       {user?.mobile ? `+91 ${user.mobile}` : 'Authenticated'}
                     </p>
                   </div>
                   <div className="inline-flex items-center gap-1 bg-[#E0F2FE] text-[#0369A1] px-2.5 py-1 rounded-full text-xs font-semibold w-fit">
                     <Check className="w-3 h-3" /> Completed
                   </div>
                </div>

                {/* Step 2 */}
                <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-6 flex flex-col space-y-4 shadow-sm">
                   <div className="flex items-center justify-between">
                     <div className="w-8 h-8 rounded-full bg-[#F3E8FF] text-[#9333EA] font-bold flex items-center justify-center text-sm">2</div>
                     <CheckCircle2 className="w-5 h-5 text-[#9333EA]" />
                   </div>
                   <div>
                     <h3 className="font-bold text-[#7E22CE] text-sm mb-0.5">Registration</h3>
                     <p className="text-xs font-medium text-gray-600">Land & bank records</p>
                   </div>
                   <div className="inline-flex items-center gap-1 bg-[#F3E8FF] text-[#7E22CE] px-2.5 py-1 rounded-full text-xs font-semibold w-fit">
                     <Check className="w-3 h-3" /> Submitted
                   </div>
                </div>

                {/* Step 3 */}
                <div className={`rounded-2xl p-6 flex flex-col space-y-4 shadow-sm border ${
                  isVerified ? 'bg-[#F0FDF4] border-[#BBF7D0]' :
                  isReturned ? 'bg-amber-50 border-amber-200' :
                  isRejected ? 'bg-red-50 border-red-200' :
                  'bg-white border-gray-200 shadow-sm'
                }`}>
                   <div className="flex items-center justify-between">
                     <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm ${
                        isVerified ? 'bg-[#DCFCE7] text-[#16A34A]' :
                        isReturned ? 'bg-amber-100 text-amber-600' :
                        isRejected ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-500'
                     }`}>3</div>
                     {isVerified ? (
                       <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                     ) : isReturned ? (
                       <AlertTriangle className="w-5 h-5 text-amber-500" />
                     ) : isRejected ? (
                       <XCircle className="w-5 h-5 text-red-500" />
                     ) : (
                       <Clock className="w-5 h-5 text-gray-400" />
                     )}
                   </div>
                   <div>
                     <h3 className={`font-bold text-sm mb-0.5 ${
                        isVerified ? 'text-[#15803D]' :
                        isReturned ? 'text-amber-700' :
                        isRejected ? 'text-red-700' :
                        'text-gray-900'
                     }`}>Authority Review</h3>
                     <p className="text-xs font-medium text-gray-600">
                       {isVerified ? 'Government Approved' :
                        isReturned ? 'Action Required' :
                        isRejected ? 'Rejected' : 'Under Active Review'}
                     </p>
                   </div>
                   <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                      isVerified ? 'bg-[#DCFCE7] text-[#15803D]' :
                      isReturned ? 'bg-amber-100 text-amber-700' :
                      isRejected ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                   }`}>
                     {isVerified ? <><Check className="w-3 h-3" /> Approved</> :
                      isReturned ? 'Returned' :
                      isRejected ? 'Rejected' : 'In Progress...'}
                   </div>
                </div>

                {/* Step 4 */}
                <div className={`rounded-2xl p-6 flex flex-col space-y-4 shadow-sm border ${
                  isVerified ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-gray-50 border-gray-100 opacity-75'
                }`}>
                   <div className="flex items-center justify-between">
                     <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm ${
                        isVerified ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-gray-200 text-gray-500'
                     }`}>4</div>
                     {isVerified ? (
                       <CheckCircle2 className="w-5 h-5 text-[#D97706]" />
                     ) : (
                       <Lock className="w-5 h-5 text-gray-400" />
                     )}
                   </div>
                   <div>
                     <h3 className={`font-bold text-sm mb-0.5 ${isVerified ? 'text-[#B45309]' : 'text-gray-500'}`}>
                       Booking Active
                     </h3>
                     <p className="text-xs font-medium text-gray-500">
                       {isVerified ? 'Arrival Slot Scheduling' : 'Locked until verified'}
                     </p>
                   </div>
                   <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                      isVerified ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-gray-200 text-gray-500'
                   }`}>
                     {isVerified ? <><Check className="w-3 h-3" /> Ready for Booking</> : 'Pending Step 3'}
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. APPLICATION DETAILS (COLLAPSIBLE SECTIONS)                */}
          {/* ============================================================ */}

          {/* Personal Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left bg-[#F3FBF8] hover:bg-[#E8F8F3] transition border-b border-[#A7E8D0]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#A7E8D0]">
                  <User className="w-4 h-4 text-[#00695C]" />
                </div>
                <span className="font-bold text-lg text-[#00695C]">{t.personalTitle}</span>
              </div>
              {openSections.personal ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {openSections.personal && (
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.fullName}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.personal?.fullName || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{locale === 'hi' ? 'पिता / पति का नाम' : 'Father / Spouse Name'}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.personal?.fatherOrSpouseName || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.gender}</span>
                  <span className="font-semibold text-gray-900 text-base capitalize">{regData.personal?.gender || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.category}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.personal?.category || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{locale === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.personal?.mobile || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">Aadhaar (Masked)</span>
                  <span className="font-mono font-semibold text-gray-900 text-base">{regData.personal?.aadhaarNumberMasked || 'XXXX-XXXX-XXXX'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Address Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('address')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left bg-[#F0F9FF] hover:bg-[#E0F2FE] transition border-b border-[#BAE6FD]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#BAE6FD]">
                  <MapPin className="w-4 h-4 text-[#0369A1]" />
                </div>
                <span className="font-bold text-lg text-[#0369A1]">{t.addressTitle}</span>
              </div>
              {openSections.address ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {openSections.address && (
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.district}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.address?.district || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.block}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.address?.block || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.village}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.address?.village || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.pincode}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.address?.pincode || '—'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500 block text-sm font-medium mb-1">Address Line</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.address?.addressLine || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Land Holding & Crops */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('land')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left bg-[#F0FDF4] hover:bg-[#DCFCE7] transition border-b border-[#BBF7D0]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#BBF7D0]">
                  <Layers className="w-4 h-4 text-[#15803D]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#15803D]">{t.landTitle}</span>
                  <span className="text-sm font-medium text-gray-500">
                    ({regData.landParcels?.length || 0} parcels, {totalLandAcres.toFixed(1)} {t.acres})
                  </span>
                </div>
              </div>
              {openSections.land ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {openSections.land && (
              <div className="p-5 sm:p-6 space-y-4">
                {regData.landParcels?.map((parcel, idx) => (
                  <div key={idx} className="p-4 bg-[#F3FBF8] rounded-xl border border-[#A7E8D0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-[#00695C] block mb-1 text-sm">
                        {locale === 'hi' ? 'पार्सल' : 'Parcel'} #{idx + 1} — Survey / Khasra: {parcel.surveyNumber || 'N/A'}
                      </span>
                      <div className="text-gray-600 text-sm font-medium flex flex-wrap gap-x-4 gap-y-1">
                        <span>Type: <span className="font-semibold text-gray-900">{parcel.landType}</span></span>
                        <span className="hidden md:inline">•</span>
                        <span>Crop: <span className="font-semibold text-gray-900">{parcel.cropSown || 'Wheat / Paddy'}</span></span>
                        <span className="hidden md:inline">•</span>
                        <span>Season: <span className="font-semibold text-gray-900">{parcel.season || 'Rabi 2026-27'}</span></span>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[#00695C] text-lg md:text-right">
                      {parcel.areaAcres} {t.acres}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bank & Payment Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('bank')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left bg-[#EFF6FF] hover:bg-[#DBEAFE] transition border-b border-[#BFDBFE]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#BFDBFE]">
                  <Landmark className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <span className="font-bold text-lg text-[#1E40AF]">{t.bankTitle}</span>
              </div>
              {openSections.bank ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {openSections.bank && (
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{locale === 'hi' ? 'खाता धारक का नाम' : 'Account Holder Name'}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.bank?.accountHolderName || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.bankName}</span>
                  <span className="font-semibold text-gray-900 text-base">{regData.bank?.bankName || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.ifscCode}</span>
                  <span className="font-mono font-semibold text-gray-900 text-base">{regData.bank?.ifscCode || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm font-medium mb-1">{t.accountNumber}</span>
                  <span className="font-mono font-semibold text-gray-900 text-base">
                    {regData.bank?.accountNumberMasked || regData.bank?.accountNumber || '—'}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500 block text-sm font-medium mb-1">DBT Settlement</span>
                  <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold text-sm">
                    <Check className="w-4 h-4" /> Aadhaar Linked
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
