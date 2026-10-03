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
  Users,
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
      console.error('Failed to load farmer dashboard summary:', err instanceof Error ? err.message : err);
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

  const isExpired = (b: any) => {
    if (b.status !== BookingStatus.BOOKED) return false;
    try {
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      if (b.bookingDate < todayStr) return true;
      if (b.bookingDate > todayStr) return false;
      const nowTime = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' }).format(new Date());
      return nowTime > b.windowEndTime;
    } catch {
      return false;
    }
  };

  const activeBookings = (summary?.activeBookings || []).filter(b => !isExpired(b));
  const todayCapacity = summary?.todayCapacity;
  const upcomingBookings = (summary?.upcomingBookings || []).filter(b => !isExpired(b));
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case BookingStatus.BOOKED:
      case BookingStatus.PENDING:
        return 'bg-[#E8F3EF] text-[#014532] border-[#014532]/20';
      case BookingStatus.CHECKED_IN:
      case BookingStatus.WEIGHMENT:
      case BookingStatus.QUALITY_ASSESSMENT:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case BookingStatus.PROCUREMENT:
      case BookingStatus.PAYMENT:
      case BookingStatus.COMPLETED:
        return 'bg-[#E8F3EF] text-[#014532] border-[#014532]/20';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case BookingStatus.BOOKED:
      case BookingStatus.PENDING:
        return 'bg-[#014532]';
      case BookingStatus.CHECKED_IN:
      case BookingStatus.WEIGHMENT:
      case BookingStatus.QUALITY_ASSESSMENT:
        return 'bg-blue-600';
      case BookingStatus.PROCUREMENT:
      case BookingStatus.PAYMENT:
      case BookingStatus.COMPLETED:
        return 'bg-[#014532]';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full relative">
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 pb-24 md:pb-12 font-sans">
        {/* ============================================================ */}
      {/* 1. TOP FARMER IDENTITY CARD                                  */}
      {/* ============================================================ */}
      <section
        aria-label="Farmer Identity"
        className="rounded-xl bg-white border border-[#014532]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#E8F3EF] text-[#014532] flex items-center justify-center font-bold text-2xl shrink-0">
            {farmerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#014532] tracking-tight mb-1">
              {getGreeting()}, <span className="capitalize">{farmerName}</span>
            </h1>
            <div className="flex items-center gap-2 text-[14px] text-gray-600 font-medium flex-wrap">
              {villageDistrict && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                  <span>{villageDistrict}</span>
                </span>
              )}
              {registration?.registrationNumber && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>
                    ID: {registration.registrationNumber}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Sync / Refresh Action */}
        <div className="flex items-center self-end sm:self-auto">
          <button
            onClick={() => fetchSummary(true)}
            disabled={loading || refreshing}
            className="px-4 py-2 rounded-lg text-[#014532] bg-white border border-[#014532]/20 hover:bg-[#F4F9F7] transition text-sm font-semibold flex items-center gap-2"
            title="Refresh Live Status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>
              {refreshing
                ? locale === 'hi' ? 'अपडेट हो रहा...' : 'Refreshing...'
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
      <section aria-label="Next Procurement Visit" className="rounded-xl bg-white border border-[#014532]/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#014532]/10 bg-white">
          <h2 className="text-[15px] font-bold uppercase tracking-wider text-[#014532] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#014532]" />
            <span>{locale === 'hi' ? 'अगली निर्धारित खरीद यात्रा' : 'Next Procurement Visit'}</span>
          </h2>
          {activeBookings.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-[#E8F3EF] text-[#014532] text-xs font-bold">
              {activeBookings.length} {locale === 'hi' ? 'सक्रिय बुकिंग' : 'Active Booking'}
            </span>
          )}
        </div>

        {loading ? (
          /* Clean Skeleton Loader */
          <div className="p-6 animate-pulse space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-16 bg-gray-100 rounded-xl"></div>
          </div>
        ) : activeBookings.length > 0 ? (
          <div className="p-4 sm:p-6 space-y-6 max-h-[500px] overflow-y-auto bg-gray-50/50 relative border-t border-[#014532]/5">
            {activeBookings.map((booking) => {
              const stageIdx = getStageIndex(booking.status);
              const hasQueue = booking.queuePosition !== null;

              return (
                <div key={booking.id} className="bg-white border border-[#014532]/15 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 space-y-5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#014532]/60 to-[#014532]/10"></div>
                  <div className="flex flex-col md:flex-row gap-6 md:items-center">
                    {/* Left: Time Window */}
                    <div className="md:w-1/2">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#014532] mb-1">
                        <Clock className="w-4 h-4" />
                        <span>{locale === 'hi' ? 'आपका आगमन समय' : 'YOUR ARRIVAL WINDOW'}</span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-[#014532] tracking-tight mb-2">
                        {booking.windowStartTime} – {booking.windowEndTime}
                      </div>
                      <p className="text-sm text-gray-600">
                        {locale === 'hi'
                          ? 'कृपया इस निर्धारित समय में खरीद केंद्र पर अवश्य पहुंचें।'
                          : 'Please reach the procurement centre during this window.'}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-24 bg-[#014532]/10"></div>

                    {/* Right: Date & Centre */}
                    <div className="md:w-1/2 space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#014532] mt-0.5 shrink-0" />
                        <span className="text-[15px] font-bold text-[#014532]">{formatDate(booking.bookingDate)}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Building className="w-5 h-5 text-[#014532] mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-[#014532] leading-tight">{booking.centreName}</span>
                          <span className="text-sm text-[#014532]/60 mt-1 font-medium">
                            Ref: {booking.bookingNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Physical Queue Status */}
                  {hasQueue && stageIdx >= 2 && stageIdx < 5 && (
                    <div className="p-4 bg-[#E8F3EF] rounded-xl border border-[#014532]/20 flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#014532] shrink-0">
                        <Users className="w-4 h-4" />
                        <span>{locale === 'hi' ? 'लाइव केंद्र कतार' : 'LIVE CENTRE QUEUE'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[#014532] flex-wrap">
                        <span className="text-[16px] sm:text-lg font-bold bg-white px-3 py-1 rounded-md shadow-sm border border-[#014532]/10">Position #{booking.queuePosition}</span>
                        <span className="text-[#014532]/30 hidden sm:inline">|</span>
                        <span className="font-semibold text-[15px]">
                          {booking.farmersAhead === 0
                            ? locale === 'hi' ? 'अगला नंबर आपका है' : 'Next in line'
                            : `${booking.farmersAhead} ${locale === 'hi' ? 'किसान आगे हैं' : 'farmers ahead'}`}
                        </span>
                        <span className="text-[#014532]/30 hidden sm:inline">|</span>
                        <span className="font-medium text-sm bg-white/60 px-2 py-0.5 rounded text-[#014532]">({booking.queueStatusLabel})</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Link
                      href={`/farmer/bookings/${booking.id}`}
                      className="py-3 px-4 rounded-lg bg-[#014532] hover:bg-[#002f2d] text-white font-bold text-[14px] flex items-center justify-center gap-2 transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{locale === 'hi' ? 'खरीद विवरण देखें' : 'VIEW PROCUREMENT DETAILS'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/farmer/bookings/${booking.id}`}
                      className="py-3 px-4 rounded-lg bg-[#F4F9F7] border border-[#014532]/20 hover:bg-[#E8F3EF] text-[#014532] font-bold text-[14px] flex items-center justify-center gap-2 transition"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{locale === 'hi' ? 'बुकिंग पास देखें' : 'VIEW BOOKING PASS'}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="p-8 text-center space-y-3">
            <h3 className="text-[16px] font-bold text-[#014532]">
              {locale === 'hi' ? 'कोई आगामी खरीद यात्रा नहीं है' : 'NO UPCOMING BOOKINGS'}
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {locale === 'hi'
                ? 'वर्तमान में आपकी कोई खरीद बुकिंग नहीं है। न्यूनतम समर्थन मूल्य (MSP) पर अनाज बेचने के लिए निकटतम अधिकृत खरीद केंद्र का स्लॉट बुक करें।'
                : "You don't have an upcoming procurement visit. Book an arrival slot at your nearest authorized procurement depot to sell produce at guaranteed MSP."}
            </p>
            {isVerified && (
              <div className="pt-4">
                <Link
                  href="/farmer/centres"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#014532] hover:bg-[#002f2d] text-white font-bold text-sm transition"
                >
                  <Building className="w-4 h-4" />
                  <span>{locale === 'hi' ? 'स्लॉट बुक करें' : 'BOOK PROCUREMENT VISIT'}</span>
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
          className="rounded-xl bg-white border border-[#014532]/10 p-5 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#014532]/10 pb-3">
            <h2 className="text-[15px] font-bold uppercase tracking-wider text-[#014532] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#014532]" />
              <span>{locale === 'hi' ? 'आज की बुकिंग क्षमता' : "TODAY'S BOOKING CAPACITY"}</span>
            </h2>
            <span className="text-[13px] font-medium text-gray-500">
              {formatDate(todayCapacity.date)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {/* Centre Daily Limit */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center transition-colors hover:bg-blue-100/50">
              <span className="text-[11px] text-blue-700/80 font-bold uppercase tracking-wider mb-1">
                {locale === 'hi' ? 'केंद्र दैनिक सीमा' : 'CENTRE DAILY LIMIT'}
              </span>
              <span className="text-2xl font-bold text-blue-900 flex items-baseline gap-1">
                {todayCapacity.centreDailyLimitQuintals ?? todayCapacity.dailyBookingCapacityQuintals ?? 50}
                <span className="text-[14px] font-semibold text-blue-700/70">qtl</span>
              </span>
              <span className="text-[11px] text-blue-600/70 mt-1 font-medium">Level 2 Limit</span>
            </div>

            {/* Booked Today */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 flex flex-col items-center justify-center transition-colors hover:bg-amber-100/50">
              <span className="text-[11px] text-amber-700/80 font-bold uppercase tracking-wider mb-1">
                {locale === 'hi' ? 'आज बुक किया' : 'BOOKED TODAY'}
              </span>
              <span className="text-2xl font-bold text-amber-900 flex items-baseline gap-1">
                {todayCapacity.bookedTodayQuintals}
                <span className="text-[14px] font-semibold text-amber-700/70">qtl</span>
              </span>
              <span className="text-[11px] text-amber-600/70 mt-1 font-medium">Current Usage</span>
            </div>

            {/* Remaining Capacity */}
            <div className="p-4 rounded-xl bg-[#E8F3EF] border border-[#014532]/20 flex flex-col items-center justify-center transition-colors hover:bg-[#DDF0E8]">
              <span className="text-[11px] text-[#014532]/80 font-bold uppercase tracking-wider mb-1">
                {locale === 'hi' ? 'शेष क्षमता' : 'REMAINING'}
              </span>
              <span className="text-2xl font-bold text-[#014532] flex items-baseline gap-1">
                {todayCapacity.remainingCapacityQuintals}
                <span className="text-[14px] font-semibold text-[#014532]/70">qtl</span>
              </span>
              <span className="text-[11px] text-[#014532]/70 mt-1 font-medium">Available Today</span>
            </div>

            {/* Minimum Booking */}
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 flex flex-col items-center justify-center transition-colors hover:bg-violet-100/50">
              <span className="text-[11px] text-violet-700/80 font-bold uppercase tracking-wider mb-1">
                {locale === 'hi' ? 'न्यूनतम बुकिंग' : 'MIN. BOOKING'}
              </span>
              <span className="text-2xl font-bold text-violet-900 flex items-baseline gap-1">
                {todayCapacity.minimumBookingQuantityQuintals}
                <span className="text-[14px] font-semibold text-violet-700/70">qtl</span>
              </span>
              <span className="text-[11px] text-violet-600/70 mt-1 font-medium">Threshold</span>
            </div>
          </div>

          {/* Capacity notice if applicable */}
          {todayCapacity.capacityMessage && (
            <div className="text-[13px] text-[#935200] bg-[#FFF8E6] border border-[#FFD98E] p-3 rounded-lg flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#E07900]" />
              <span>{todayCapacity.capacityMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          {isVerified && (
            <div className="flex items-center justify-between pt-1">
              <Link
                href={todayCapacity.canBookAnother ? '/farmer/centres' : '#'}
                aria-disabled={!todayCapacity.canBookAnother}
                className={`text-[14px] font-bold px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  todayCapacity.canBookAnother
                    ? 'bg-[#014532] hover:bg-[#002f2d] text-white'
                    : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>+ {locale === 'hi' ? 'दूसरी यात्रा बुक करें' : 'Book Another Visit'}</span>
                {todayCapacity.canBookAnother && <ArrowRight className="w-4 h-4" />}
              </Link>
              <Link
                href="/farmer/visits"
                className="text-[14px] text-[#014532] hover:underline font-bold flex items-center gap-1"
              >
                <span>{locale === 'hi' ? 'सभी बुकिंग देखें' : 'View All Bookings'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* 4. RECENT PROCUREMENT HISTORY (TABLE FORMAT)                 */}
      {/* ============================================================ */}
      {recentBookings.length > 0 && (
        <section aria-label="Recent Bookings" className="rounded-xl bg-white border border-[#014532]/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#014532]/10">
            <h2 className="text-[15px] font-bold uppercase tracking-wider text-[#014532] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#014532]" />
              <span>{locale === 'hi' ? 'हालिया बुकिंग' : 'RECENT BOOKINGS'}</span>
            </h2>
            <Link
              href="/farmer/visits"
              className="text-[14px] text-[#014532] hover:underline font-bold"
            >
              {locale === 'hi' ? 'सभी देखें' : 'View All'}
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-gray-100">
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">DATE</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">QUANTITY</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">CENTRE</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">STATUS</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F9FAFB] transition">
                    <td className="px-5 py-4 text-[13px] text-gray-700 whitespace-nowrap">
                      {formatDate(b.bookingDate)}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-bold text-[#014532] whitespace-nowrap">
                      {b.acceptedQuantityQuintals || b.expectedQuantityQuintals} qtl
                    </td>
                    <td className="px-5 py-4 text-[13px] text-gray-700">
                      {b.centreName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusStyles(b.status)}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(b.status)}`}></div>
                        {b.statusLabel || b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link
                        href={`/farmer/bookings/${b.id}`}
                        className="text-[13px] text-[#014532] hover:underline font-bold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Record</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 5. TOLL-FREE HELPLINE & SUPPORT STRIP                        */}
      {/* ============================================================ */}
      <section
        aria-label="Kisan Support"
        className="rounded-xl bg-white border border-[#014532]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#014532] text-white flex items-center justify-center shrink-0 font-bold">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#014532] text-[15px]">
              {locale === 'hi' ? 'खरीद सहायता व किसान हेल्पलाइन' : 'Need assistance with your procurement?'}
            </h3>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {locale === 'hi' ? 'टोल-फ्री किसान हेल्पलाइन:' : 'Toll-Free Kisan Helpline:'}{' '}
              <a href="tel:18001801551" className="text-[#014532] font-mono font-bold hover:underline">
                {summary?.helpline || '1800-180-1551'}
              </a>{' '}
              <span className="text-gray-400">• 8:00 AM – 8:00 PM (All Days)</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setHelpOpen(true)}
          type="button"
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-[#014532] font-bold text-sm transition shrink-0"
        >
          {locale === 'hi' ? 'सामान्य प्रश्न व उत्तर (FAQs)' : 'Help & FAQs'}
        </button>
      </section>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
    </div>
  );
}
