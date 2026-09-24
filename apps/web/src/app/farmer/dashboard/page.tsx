'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ArrowRight,
  PhoneCall,
  Calendar,
  Building,
  MapPin,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Truck,
  QrCode,
  Scale,
  FlaskConical,
  CreditCard,
  Receipt,
  Navigation,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { HelpModal } from '../../../components/common/HelpModal';
import { apiRequest } from '../../../lib/api';
import {
  FarmerDashboardSummaryDto,
  FarmerActiveBookingDto,
  FarmerDailyCapacityDto,
  BookingStatus,
} from '@astra/shared';

export default function FarmerDashboardPage() {
  const { t, locale } = useLanguage();
  const { user, farmer, registration, farmerState } = useAuth();
  const [summary, setSummary] = useState<FarmerDashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetingMorning || 'Good morning';
    if (hour < 17) return t.greetingAfternoon || 'Good afternoon';
    return t.greetingEvening || 'Good evening';
  };

  const fetchSummary = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await apiRequest<FarmerDashboardSummaryDto>('/farmer/dashboard');
      if (data) {
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load farmer dashboard summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Safe polling: Only poll every 15s if there is an active booking in progress
  useEffect(() => {
    const hasActiveProcessing = summary?.activeBookings?.some(
      (b) =>
        b.status === BookingStatus.CHECKED_IN ||
        b.status === BookingStatus.WEIGHMENT ||
        b.status === BookingStatus.QUALITY_ASSESSMENT ||
        b.status === BookingStatus.PROCUREMENT ||
        b.status === BookingStatus.PAYMENT
    );

    if (!hasActiveProcessing) return;

    const interval = setInterval(() => {
      fetchSummary(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [summary?.activeBookings, fetchSummary]);

  const resolvedFarmer = summary?.farmer || farmer;
  const farmerName = resolvedFarmer?.fullName || (user as any)?.fullName || (locale === 'hi' ? 'किसान' : 'Farmer');
  const isVerified = resolvedFarmer?.isVerified || farmerState === 'VERIFIED';
  const villageDistrict =
    resolvedFarmer?.village && resolvedFarmer?.district
      ? `${resolvedFarmer.village}, ${resolvedFarmer.district}`
      : resolvedFarmer?.district || resolvedFarmer?.village || null;

  const activeBookings = summary?.activeBookings || [];
  const todayCapacity = summary?.todayCapacity;
  const upcomingBookings = summary?.upcomingBookings || [];
  const recentBookings = summary?.recentBookings || [];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to determine the active step index (0-5) in the 6-stage procurement process
  const getStageIndex = (status: string) => {
    switch (status) {
      case BookingStatus.BOOKED:
      case BookingStatus.PENDING:
        return 1; // Waiting for check-in
      case BookingStatus.CHECKED_IN:
        return 2; // Waiting for weighment
      case BookingStatus.WEIGHMENT:
        return 3; // Waiting for quality assessment
      case BookingStatus.QUALITY_ASSESSMENT:
        return 4; // Waiting for procurement voucher
      case BookingStatus.PROCUREMENT:
        return 5; // Waiting for payment
      case BookingStatus.PAYMENT:
      case BookingStatus.COMPLETED:
        return 6; // Fully completed
      default:
        return 1;
    }
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5 pb-24 md:pb-12 text-[#014532]">
      {/* ============================================================ */}
      {/* 1. TOP FARMER IDENTITY CARD                                  */}
      {/* ============================================================ */}
      <section
        aria-label="Farmer Identity"
        className="rounded-xl bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 p-4 sm:p-5 border border-emerald-100 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
            {farmerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-[#014532] tracking-tight">
                {getGreeting()},{' '}
                <span className="text-emerald-700 capitalize">{farmerName}</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 text-sm text-emerald-800/80 font-medium mt-1">
              {villageDistrict && (
                <span className="flex items-center gap-1 text-emerald-900/80">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{villageDistrict}</span>
                </span>
              )}
              {registration?.registrationNumber && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-emerald-800/80 text-sm">
                    ID: {registration.registrationNumber}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Sync / Refresh Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => fetchSummary(true)}
            disabled={loading || refreshing}
            className="px-3 py-1.5 rounded-lg text-emerald-900/80 hover:text-[#014532] bg-[#F4F9F7] hover:bg-emerald-50 border border-emerald-100 transition text-sm font-semibold flex items-center gap-1.5 shadow-sm"
            title="Refresh Live Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-800/80 ${refreshing ? 'animate-spin text-emerald-700' : ''}`} />
            <span>
              {refreshing
                ? locale === 'hi' ? 'अपडेट हो रहा...' : 'Syncing...'
                : locale === 'hi' ? 'रिफ्रेश' : 'Refresh'}
            </span>
          </button>
        </div>
      </section>

      {/* Verification Action Required Notice */}
      {!isVerified && (
        <section
          aria-label="Verification Alert"
          className="rounded-xl p-4 bg-amber-50 border border-amber-200 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm sm:text-base">
            <h2 className="font-bold text-amber-700">
              {locale === 'hi' ? 'किसान पंजीकरण सत्यापन प्रक्रियाधीन है' : 'Farmer Registration Under Review'}
            </h2>
            <p className="text-amber-800/90 text-sm mt-0.5 leading-relaxed">
              {locale === 'hi'
                ? 'आपका किसान आवेदन संबंधित तहसील प्राधिकारी द्वारा जांचा जा रहा है। सत्यापन पूर्ण होते ही स्लॉट बुकिंग उपलब्ध हो जाएगी।'
                : 'Your farmer registration and land records are currently being checked by the designated verification authority. Procurement slot booking opens upon approval.'}
            </p>
            <div className="mt-2">
              <Link
                href="/farmer/registration-status"
                className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 hover:text-amber-800 underline"
              >
                <span>{locale === 'hi' ? 'सत्यापन स्थिति देखें' : 'View Registration Status'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 2. HERO SECTION: NEXT PROCUREMENT VISIT                       */}
      {/* ============================================================ */}
      <section aria-label="Next Procurement Visit" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wider uppercase text-emerald-700">
              {locale === 'hi' ? 'अगली निर्धारित खरीद यात्रा' : 'Next Procurement Visit'}
            </h2>
          </div>
          {activeBookings.length > 0 && (
            <span className="text-sm font-semibold text-emerald-800/80">
              {activeBookings.length} {locale === 'hi' ? 'सक्रिय बुकिंग' : 'Active Booking'}
            </span>
          )}
        </div>

        {loading ? (
          /* Clean Skeleton Loader */
          <div className="rounded-xl bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 p-6 border border-emerald-100 animate-pulse space-y-4">
            <div className="h-5 bg-slate-700 rounded w-1/3"></div>
            <div className="h-16 bg-slate-800 rounded-xl"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-slate-800 rounded-lg"></div>
              <div className="h-10 bg-slate-800 rounded-lg"></div>
            </div>
            <div className="h-10 bg-slate-700 rounded-xl"></div>
          </div>
        ) : activeBookings.length > 0 ? (
          <div className="space-y-4">
            {activeBookings.map((booking) => {
              const stageIdx = getStageIndex(booking.status);
              const isCheckedIn = booking.checkInTime !== null;
              const hasQueue = booking.queuePosition !== null;

              const stages = [
                {
                  id: 1,
                  labelEn: 'Booking Confirmed',
                  labelHi: 'बुकिंग पुष्ट',
                  noteEn: 'Slot confirmed in portal',
                  noteHi: 'पोर्टल पर स्लॉट सुरक्षित',
                },
                {
                  id: 2,
                  labelEn: 'Check-in',
                  labelHi: 'गेट चेक-इन',
                  noteEn: 'Your QR will be verified at the centre entrance',
                  noteHi: 'केंद्र गेट पर क्यूआर कोड का सत्यापन किया जाएगा',
                },
                {
                  id: 3,
                  labelEn: 'Weighment',
                  labelHi: 'कांटा तौल',
                  noteEn: 'Gross & tare weight recording on digital scale',
                  noteHi: 'डिजिटल कांटे पर इलेक्ट्रॉनिक वजन दर्ज होगा',
                },
                {
                  id: 4,
                  labelEn: 'Quality Assessment',
                  labelHi: 'गुणवत्ता जांच',
                  noteEn: 'Moisture and grain purity inspection',
                  noteHi: 'प्रयोगशाला द्वारा नमी व दाने की गुणवत्ता परीक्षण',
                },
                {
                  id: 5,
                  labelEn: 'Procurement',
                  labelHi: 'खरीद आदेश',
                  noteEn: 'Electronic procurement slip generated',
                  noteHi: 'इलेक्ट्रॉनिक खरीद पर्ची एवं स्वीकृत रसीद जारी',
                },
                {
                  id: 6,
                  labelEn: 'Payment',
                  labelHi: 'बैंक भुगतान',
                  noteEn: 'Direct DBT payment transferred to bank account',
                  noteHi: 'आधार से जुड़े बैंक खाते में सीधा भुगतान अंतरण',
                },
              ];

              return (
                <div
                  key={booking.id}
                  className="rounded-xl bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-emerald-200 p-5 sm:p-6 shadow-xl space-y-5"
                >
                  {/* Top Arrival Window Callout Box */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wider text-emerald-700">
                        <Clock className="w-4 h-4 text-emerald-700" />
                        <span>{locale === 'hi' ? 'आपका आगमन समय (स्लॉट)' : 'YOUR ARRIVAL WINDOW'}</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
                        {booking.windowStartTime} – {booking.windowEndTime}
                      </div>
                      <p className="text-sm text-emerald-900/80 font-medium">
                        {locale === 'hi'
                          ? 'कृपया इस निर्धारित समय में खरीद केंद्र पर अवश्य पहुंचें।'
                          : 'Please reach the procurement centre during this window.'}
                      </p>
                    </div>

                    {/* Centre & Date Badge */}
                    <div className="sm:text-right border-t sm:border-t-0 border-emerald-100 pt-3 sm:pt-0 space-y-1">
                      <div className="text-sm font-bold text-emerald-900/80 flex sm:justify-end items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{formatDate(booking.bookingDate)}</span>
                      </div>
                      <div className="text-sm font-bold text-[#014532] flex sm:justify-end items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{booking.centreName}</span>
                      </div>
                      <div className="text-sm text-emerald-800/80 font-mono">
                        Ref: {booking.bookingNumber}
                      </div>
                    </div>
                  </div>

                  {/* Physical Queue Status (if available from backend) */}
                  {hasQueue && stageIdx >= 2 && stageIdx < 5 && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                      <span className="text-sm font-extrabold uppercase tracking-wider text-emerald-700 block">
                        {locale === 'hi' ? 'केंद्र लाइव कतार स्थिति' : 'Live Centre Queue'}
                      </span>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-xl font-black font-mono text-emerald-600">
                          Position #{booking.queuePosition}
                        </span>
                        {booking.farmersAhead !== null && (
                          <span className="text-sm font-bold text-emerald-700">
                            {booking.farmersAhead === 0
                              ? locale === 'hi' ? 'अगला नंबर आपका है' : 'Next in line'
                              : `${booking.farmersAhead} ${locale === 'hi' ? 'किसान आगे हैं' : 'farmers ahead'}`}
                          </span>
                        )}
                        {booking.queueStatusLabel && (
                          <span className="text-sm text-emerald-800/80">
                            ({booking.queueStatusLabel})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Primary & Secondary Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <Link
                      href={`/farmer/bookings/${booking.id}`}
                      className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#014532] font-bold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99]"
                    >
                      <span>{locale === 'hi' ? 'खरीद विवरण एवं यात्रा ट्रैक करें' : 'VIEW PROCUREMENT DETAILS'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/farmer/bookings/${booking.id}`}
                      className="w-full sm:w-auto py-3 px-5 rounded-xl bg-emerald-50 hover:bg-[#232F48] border border-emerald-100 text-[#014532] font-bold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition"
                    >
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span>{locale === 'hi' ? 'डिजिटल पास / क्यूआर' : 'VIEW BOOKING PASS'}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="rounded-xl bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 p-8 sm:p-10 border border-emerald-100 text-center space-y-4 shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-[#F4F9F7] border border-emerald-100 text-emerald-800/80 flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-[#014532] tracking-tight">
                {locale === 'hi' ? 'कोई आगामी खरीद यात्रा नहीं है' : 'NO UPCOMING BOOKINGS'}
              </h3>
              <p className="text-sm sm:text-base text-emerald-800/80 leading-relaxed">
                {locale === 'hi'
                  ? 'वर्तमान में आपकी कोई खरीद बुकिंग नहीं है। न्यूनतम समर्थन मूल्य (MSP) पर अनाज बेचने के लिए निकटतम अधिकृत खरीद केंद्र का स्लॉट बुक करें।'
                  : "You don't have an upcoming procurement visit. Book an arrival slot at your nearest authorized procurement depot to sell produce at guaranteed MSP."}
              </p>
            </div>
            {isVerified && (
              <div className="pt-2">
                <Link
                  href="/farmer/centres"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#014532] font-bold text-sm sm:text-base shadow-md transition"
                >
                  <Building className="w-4 h-4" />
                  <span>{locale === 'hi' ? 'खरीद केंद्र चुनें व स्लॉट बुक करें' : 'BOOK PROCUREMENT VISIT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 3. TODAY'S BOOKING CAPACITY (GOVERNMENT OPERATIONAL LIMITS)  */}
      {/* ============================================================ */}
      {todayCapacity && (
        <section
          aria-label="Today's Booking Capacity"
          className="rounded-xl bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 p-4 sm:p-5 border border-emerald-100 space-y-3.5 shadow-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-100 pb-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#014532] flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>{locale === 'hi' ? 'आज की उपार्जन क्षमता (दैनिक कोटा)' : "Today's Booking Capacity"}</span>
              </h2>
              <span className="text-sm text-emerald-800/80 font-medium">
                {todayCapacity.crop} • {todayCapacity.season} • {todayCapacity.farmerCategory}
              </span>
            </div>
            <span className="text-sm text-emerald-800/80 font-mono">
              {formatDate(todayCapacity.date)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            {/* Centre Daily Limit */}
            <div className="p-3 rounded-xl bg-[#F4F9F7] border border-emerald-100">
              <span className="text-sm text-emerald-800/80 block font-semibold uppercase tracking-wider">
                {locale === 'hi' ? 'केंद्र दैनिक सीमा' : 'Centre Daily Limit'}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-[#014532] block mt-0.5">
                {todayCapacity.centreDailyLimitQuintals ?? todayCapacity.dailyBookingCapacityQuintals ?? 50}{' '}
                <span className="text-sm font-sans font-normal text-emerald-800/80">qtl</span>
              </span>
              <span className="text-[9px] text-emerald-700/80 block mt-0.5">Level 2 Limit</span>
            </div>

            {/* Booked Today */}
            <div className="p-3 rounded-xl bg-[#F4F9F7] border border-emerald-100">
              <span className="text-sm text-emerald-800/80 block font-semibold uppercase tracking-wider">
                {locale === 'hi' ? 'आज बुक किया' : 'Booked Today'}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-700 block mt-0.5">
                {todayCapacity.bookedTodayQuintals}{' '}
                <span className="text-sm font-sans font-normal text-emerald-800/80">qtl</span>
              </span>
              <span className="text-[9px] text-emerald-700/80 block mt-0.5">Current Usage</span>
            </div>

            {/* Remaining Capacity */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-sm text-emerald-600 block font-semibold uppercase tracking-wider">
                {locale === 'hi' ? 'शेष क्षमता' : 'Remaining'}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-600 block mt-0.5">
                {todayCapacity.remainingCapacityQuintals}{' '}
                <span className="text-sm font-sans font-normal text-emerald-700">qtl</span>
              </span>
              <span className="text-[9px] text-emerald-700 block mt-0.5">Available Today</span>
            </div>

            {/* Minimum Booking */}
            <div className="p-3 rounded-xl bg-[#F4F9F7] border border-emerald-100">
              <span className="text-sm text-emerald-800/80 block font-semibold uppercase tracking-wider">
                {locale === 'hi' ? 'न्यूनतम बुकिंग' : 'Min. Booking'}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-[#014532] block mt-0.5">
                {todayCapacity.minimumBookingQuantityQuintals}{' '}
                <span className="text-sm font-sans font-normal text-emerald-800/80">qtl</span>
              </span>
              <span className="text-[9px] text-emerald-700/80 block mt-0.5">Threshold</span>
            </div>
          </div>

          {/* Capacity notice if applicable */}
          {todayCapacity.capacityMessage && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{todayCapacity.capacityMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          {isVerified && (
            <div className="pt-1 flex items-center justify-between gap-3">
              <Link
                href={todayCapacity.canBookAnother ? '/farmer/centres' : '#'}
                aria-disabled={!todayCapacity.canBookAnother}
                className={`text-sm font-bold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5 ${
                  todayCapacity.canBookAnother
                    ? 'bg-[#014532] hover:bg-[#002f2d] text-white shadow-sm'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{locale === 'hi' ? '+ दूसरी यात्रा बुक करें' : '+ Book Another Visit'}</span>
                {todayCapacity.canBookAnother && <ChevronRight className="w-3.5 h-3.5 text-white" />}
              </Link>

              <Link
                href="/farmer/visits"
                className="text-sm text-emerald-700 hover:text-emerald-600 font-bold transition"
              >
                {locale === 'hi' ? 'सभी बुकिंग देखें →' : 'View All Bookings →'}
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* 4. UPCOMING BOOKINGS LIST                                    */}
      {/* ============================================================ */}
      {upcomingBookings.length > 0 && (
        <section aria-label="Upcoming Bookings" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-emerald-900/80 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>{locale === 'hi' ? 'आगामी निर्धारित यात्राएं' : 'Upcoming Bookings'}</span>
            </h2>
            <Link
              href="/farmer/visits"
              className="text-sm text-emerald-700 hover:text-emerald-600 font-bold"
            >
              {locale === 'hi' ? 'सभी देखें' : 'View All'}
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-emerald-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-500 transition shadow-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#014532]">
                      {formatDate(b.bookingDate)}
                    </span>
                    <span className="text-sm text-emerald-700 font-mono font-semibold">
                      {b.windowStartTime} – {b.windowEndTime}
                    </span>
                  </div>
                  <div className="text-sm text-emerald-800/80 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-700/80" />
                    <span>{b.centreName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-100">
                  <span className="text-sm font-bold font-mono text-emerald-700">
                    {b.expectedQuantityQuintals} qtl
                  </span>
                  <Link
                    href={`/farmer/bookings/${b.id}`}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[#014532] hover:bg-[#232F48] transition"
                  >
                    {locale === 'hi' ? 'विवरण देखें' : 'View Booking'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 5. RECENT PROCUREMENT HISTORY                                */}
      {/* ============================================================ */}
      {recentBookings.length > 0 && (
        <section aria-label="Recent History" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-emerald-900/80 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{locale === 'hi' ? 'हालिया खरीद इतिहास' : 'Recent Bookings'}</span>
            </h2>
            <Link
              href="/farmer/visits"
              className="text-sm text-emerald-700 hover:text-emerald-600 font-bold"
            >
              {locale === 'hi' ? 'पूरी सूची' : 'View All'}
            </Link>
          </div>

          <div className="space-y-2">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-emerald-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#014532]">
                      {formatDate(b.bookingDate)}
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-900/80">
                      {b.acceptedQuantityQuintals || b.expectedQuantityQuintals} qtl
                    </span>
                  </div>
                  <span className="text-sm text-emerald-800/80 block">
                    {b.centreName}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-1 sm:pt-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold bg-emerald-50 border border-emerald-200 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>{b.statusLabel}</span>
                  </span>
                  <Link
                    href={`/farmer/bookings/${b.id}`}
                    className="text-sm text-emerald-700 hover:underline font-semibold"
                  >
                    {locale === 'hi' ? 'रिकॉर्ड →' : 'View Record →'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 6. TOLL-FREE HELPLINE & SUPPORT STRIP                        */}
      {/* ============================================================ */}
      <section
        aria-label="Kisan Support"
        className="rounded-xl bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-emerald-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-[#014532] flex items-center justify-center shrink-0 shadow font-bold">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#014532] text-sm sm:text-base">
              {locale === 'hi' ? 'खरीद सहायता व किसान हेल्पलाइन' : 'Need assistance with your procurement?'}
            </h3>
            <p className="text-sm text-emerald-800/80">
              {locale === 'hi' ? 'टोल-फ्री किसान हेल्पलाइन:' : 'Toll-Free Kisan Helpline:'}{' '}
              <a href="tel:18001801551" className="text-emerald-700 font-mono font-bold hover:underline">
                {summary?.helpline || '1800-180-1551'}
              </a>{' '}
              <span className="text-emerald-700/80">• 8:00 AM – 8:00 PM (All Days)</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setHelpOpen(true)}
          type="button"
          className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-[#232F48] text-[#014532] font-bold text-sm transition shrink-0 shadow-sm"
        >
          {locale === 'hi' ? 'सामान्य प्रश्न व उत्तर (FAQs)' : 'Help & FAQs'}
        </button>
      </section>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}
