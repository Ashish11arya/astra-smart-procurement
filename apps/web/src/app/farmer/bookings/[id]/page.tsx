'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  QrCode,
  ShieldCheck,
  Package,
  Layers,
  FileText,
  IndianRupee,
  RefreshCw,
  Info,
  Scale,
  FlaskConical,
  Award,
  CreditCard,
  History,
} from 'lucide-react';
import { useLanguage } from '../../../../i18n/LanguageContext';
import { useAuth } from '../../../../context/AuthContext';
import { apiRequest } from '../../../../lib/api';
import { BookingPassModal } from '../../../../components/booking/BookingPassModal';
import {
  FarmerBookingDetailDto,
  BookingJourneyStageDto,
  JourneyStageStatus,
  BookingStatus,
} from '@astra/shared';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FarmerBookingDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;

  const router = useRouter();
  const { locale } = useLanguage();
  const { user, token } = useAuth();

  const [detail, setDetail] = useState<FarmerBookingDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passModalOpen, setPassModalOpen] = useState(false);

  const fetchBookingDetail = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const res = await apiRequest<FarmerBookingDetailDto>(`/farmer/bookings/${bookingId}`);
        if (res) {
          setDetail(res);
        }
      } catch (err: any) {
        console.error('Failed to load booking detail:', err);
        setError(err.message || 'Unable to retrieve booking record.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bookingId]
  );

  useEffect(() => {
    fetchBookingDetail();
  }, [fetchBookingDetail]);

  // Safe polling: only poll every 15s if booking is active/processing
  useEffect(() => {
    const status = detail?.booking?.status;
    const isProcessing =
      status === BookingStatus.CHECKED_IN ||
      status === BookingStatus.WEIGHMENT ||
      status === BookingStatus.QUALITY_ASSESSMENT ||
      status === BookingStatus.PROCUREMENT ||
      status === BookingStatus.PAYMENT;

    if (!isProcessing) return;

    const interval = setInterval(() => {
      fetchBookingDetail(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [detail?.booking?.status, fetchBookingDetail]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
        <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-100 p-12 text-center space-y-3 shadow-md">
          <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
          <p className="text-base text-emerald-900/80 font-medium">
            {locale === 'hi' ? 'खरीद विवरण लोड हो रहा है...' : 'Loading procurement booking records...'}
          </p>
        </div>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
        <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-rose-500/40 bg-rose-950/20 p-8 sm:p-10 text-center space-y-4 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[#014532]">
              {locale === 'hi' ? 'अनधिकृत अथवा अनुपलब्ध रिकॉर्ड' : 'Unauthorized or Unavailable Record'}
            </h1>
            <p className="text-sm text-rose-300 max-w-md mx-auto">
              {error || 'You are only authorized to view your own procurement bookings.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/farmer/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#014532] text-sm font-bold transition shadow-sm border border-emerald-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{locale === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { booking, cropName, currentStatus, queueInfo, journey, departmentRecords, activityAuditTrail } = detail;

  // Prepare booking pass data for existing modal
  const bookingPassData = {
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
    farmerName: booking.farmerName || 'Akash',
    farmerCode: booking.farmerCode || 'ASTRA-FARMER',
    farmerMobileMasked: booking.farmerMobile
      ? `${booking.farmerMobile.slice(0, 2)}******${booking.farmerMobile.slice(-2)}`
      : undefined,
    centreId: booking.centreId,
    centreName: booking.centreName || 'Procurement Centre',
    centreCode: booking.centreCode || '',
    centreAddress: booking.centreAddress || '',
    bookingDate: booking.bookingDate,
    session: booking.session,
    arrivalWindow: `${booking.windowStartTime} – ${booking.windowEndTime}`,
    windowStartTime: booking.windowStartTime,
    windowEndTime: booking.windowEndTime,
    expectedQuantityQuintals: booking.expectedQuantityQuintals,
    transport: booking.vehicleType || 'Standard Transport',
    vehicleNumber: booking.vehicleNumber || undefined,
    status: booking.status,
    verificationStatus: 'VERIFIED',
  };

  const getStageIcon = (state: JourneyStageStatus) => {
    switch (state) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />;
      case 'IN_PROGRESS':
        return <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />;
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-rose-400 stroke-[2.5]" />;
      case 'ACTION_REQUIRED':
        return <AlertTriangle className="w-4 h-4 text-amber-600 stroke-[2.5]" />;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />;
    }
  };

  const getStagePill = (state: JourneyStageStatus) => {
    switch (state) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded text-sm font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
            ✓ COMPLETED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded text-sm font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            ● IN PROGRESS
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 rounded text-sm font-extrabold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/40">
            ✕ REJECTED
          </span>
        );
      case 'ACTION_REQUIRED':
        return (
          <span className="px-2 py-0.5 rounded text-sm font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            ! ACTION REQUIRED
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2 py-0.5 rounded text-sm font-semibold uppercase tracking-wider bg-slate-900 text-emerald-800/80 border border-emerald-100">
            ○ WAITING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-sm font-semibold uppercase tracking-wider bg-slate-900 text-emerald-700/80 border border-emerald-100">
            NOT STARTED
          </span>
        );
    }
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6 pb-20 text-[#014532]">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/farmer/dashboard"
          className="inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-emerald-800/80 hover:text-[#014532] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'hi' ? 'डैशबोर्ड पर वापस' : 'Back to Dashboard'}</span>
        </Link>

        <button
          onClick={() => fetchBookingDetail(true)}
          disabled={loading || refreshing}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-emerald-900/80 hover:text-[#014532] hover:bg-emerald-50 bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 text-sm flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-700' : ''}`} />
          <span className="hidden sm:inline">
            {refreshing ? (locale === 'hi' ? 'अपडेट हो रहा...' : 'Syncing...') : (locale === 'hi' ? 'रिफ्रेश' : 'Refresh')}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. BOOKING DETAIL HEADER CARD                                */}
      {/* ============================================================ */}
      <section
        aria-label="Procurement Booking Summary"
        className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-100 p-5 sm:p-7 shadow-lg space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-emerald-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider uppercase text-emerald-700">
                {locale === 'hi' ? 'खरीद बुकिंग' : 'PROCUREMENT BOOKING'}
              </span>
              <span className="text-emerald-700/80">•</span>
              <span className="font-mono text-sm font-bold text-emerald-900/80">
                {booking.bookingNumber}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#014532] tracking-tight">
              {booking.centreName}
            </h1>

            <p className="text-sm text-emerald-800/80 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{booking.centreAddress}</span>
            </p>
          </div>

          {/* Current Status Badge & QR Pass Trigger */}
          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{currentStatus.label}</span>
              </span>
            </div>

            <button
              onClick={() => setPassModalOpen(true)}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#014532] font-bold text-sm shadow-sm transition active:scale-[0.99]"
            >
              <QrCode className="w-4 h-4" />
              <span>{locale === 'hi' ? 'डिजिटल क्यूआर पास' : 'QR BOOKING PASS'}</span>
            </button>
          </div>
        </div>

        {/* Essential Booking Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-0.5">
            <span className="text-sm text-emerald-800/80 font-semibold uppercase tracking-wider block">
              {locale === 'hi' ? 'निर्धारित तिथि' : 'Scheduled Date'}
            </span>
            <span className="font-bold text-[#014532] text-sm sm:text-base">
              {formatDate(booking.bookingDate)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-0.5">
            <span className="text-sm text-emerald-800/80 font-semibold uppercase tracking-wider block">
              {locale === 'hi' ? 'आगमन समय विंडो' : 'Arrival Window'}
            </span>
            <span className="font-bold font-mono text-emerald-700 text-sm sm:text-base">
              {booking.windowStartTime} – {booking.windowEndTime}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-0.5">
            <span className="text-sm text-emerald-800/80 font-semibold uppercase tracking-wider block">
              {locale === 'hi' ? 'फसल जींस' : 'Crop / Commodity'}
            </span>
            <span className="font-bold text-[#014532] text-sm sm:text-base">
              {cropName}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-0.5">
            <span className="text-sm text-emerald-800/80 font-semibold uppercase tracking-wider block">
              {locale === 'hi' ? 'बुक की गई मात्रा' : 'Booked Quantity'}
            </span>
            <span className="font-extrabold font-mono text-[#014532] text-sm sm:text-base">
              {booking.expectedQuantityQuintals}{' '}
              <span className="text-sm font-sans font-medium text-emerald-800/80">qtl</span>
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. TWO-COLUMN WORKFLOW LAYOUT (MAIN TIMELINE + SIDE STATUS)  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RIGHT COLUMN ON DESKTOP: PROMINENT STATUS & PHYSICAL QUEUE CARD */}
        <div className="lg:col-span-1 space-y-4 lg:order-2">
          {/* Current Status Summary */}
          <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-100 p-5 shadow-lg space-y-3.5">
            <span className="text-sm uppercase font-extrabold tracking-wider text-emerald-800/80 block">
              {locale === 'hi' ? 'ताज़ा प्रसंस्करण स्थिति' : 'Current Status'}
            </span>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#014532] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{currentStatus.label}</span>
              </h3>
              <p className="text-sm text-emerald-900/80 leading-relaxed">
                {currentStatus.description}
              </p>
            </div>

            {/* Real-time Physical Queue metrics */}
            <div className="pt-3 border-t border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-900/80">
                  {locale === 'hi' ? 'भौतिक कतार स्थिति' : 'Physical Queue'}
                </span>
                {queueInfo.isQueued ? (
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    #{queueInfo.queuePosition}
                  </span>
                ) : (
                  <span className="text-sm text-emerald-800/80">
                    {locale === 'hi' ? 'लंबित' : 'Pending Check-in'}
                  </span>
                )}
              </div>

              {queueInfo.isQueued ? (
                <div className="space-y-1 text-sm text-emerald-900/80">
                  {queueInfo.farmersAhead !== null && (
                    <div className="flex justify-between">
                      <span className="text-emerald-800/80">{locale === 'hi' ? 'आगे कतार में किसान:' : 'Farmers ahead:'}</span>
                      <strong className="text-[#014532]">
                        {queueInfo.farmersAhead === 0
                          ? locale === 'hi'
                            ? '0 (अगला नंबर)'
                            : '0 (Next)'
                          : queueInfo.farmersAhead}
                      </strong>
                    </div>
                  )}
                  {queueInfo.checkedInTime && (
                    <div className="flex justify-between">
                      <span className="text-emerald-800/80">{locale === 'hi' ? 'चेक-इन समय:' : 'Checked in:'}</span>
                      <span className="font-mono text-[#014532]">
                        {formatTime(queueInfo.checkedInTime)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-emerald-800/80 leading-snug">
                  {locale === 'hi'
                    ? 'केंद्र पर भौतिक आगमन और क्यूआर सत्यापन के बाद कतार क्रमांक जारी होगा।'
                    : 'Your queue position will appear after you arrive at the centre and scan your booking QR pass.'}
                </p>
              )}
            </div>
          </div>

          {/* Quick QR Card */}
          <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-100 p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-700" />
              <h4 className="text-sm font-bold text-[#014532] uppercase tracking-wider">
                {locale === 'hi' ? 'गेट सत्यापन पास' : 'Gate Clearance Pass'}
              </h4>
            </div>
            <p className="text-sm text-emerald-900/80 leading-relaxed">
              {locale === 'hi'
                ? 'केंद्र के प्रवेश द्वार पर सुरक्षा कर्मी को यह कोड दिखाएं अथवा प्रिंट ले जाएं।'
                : 'Present this digital pass at the entrance security gate for fast-track arrival acknowledgment.'}
            </p>
            <button
              onClick={() => setPassModalOpen(true)}
              type="button"
              className="w-full py-2.5 rounded-xl bg-[#F4F9F7] hover:bg-emerald-50 text-[#014532] border border-emerald-100 text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>{locale === 'hi' ? 'पास देखें व प्रिंट करें' : 'Open Pass & Print'}</span>
            </button>
          </div>

          {/* Transport Information if available */}
          {booking.vehicleNumber && (
            <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-100 p-4 space-y-2 text-sm shadow-lg">
              <div className="flex items-center gap-2 text-emerald-800/80 font-bold uppercase tracking-wider text-sm">
                <Truck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{locale === 'hi' ? 'वाहन विवरण' : 'Transport Details'}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-900/80">
                <span>{booking.vehicleType || 'Standard Vehicle'}</span>
                <span className="font-mono font-bold text-[#014532]">{booking.vehicleNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* LEFT COLUMN: THE 7-STAGE TRANSACTION JOURNEY & DEPARTMENT RECORDS */}
        <div className="lg:col-span-2 space-y-6 lg:order-1">
          {/* SECTION: 7-STAGE TRANSACTION JOURNEY */}
          <section
            aria-label="Procurement Journey"
            className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-100 p-5 sm:p-6 shadow-lg space-y-5"
          >
            <div className="border-b border-emerald-100 pb-3">
              <h2 className="text-base sm:text-base font-bold text-[#014532] flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>{locale === 'hi' ? 'खरीद लेनदेन यात्रा (7 चरण)' : 'Procurement Journey (7 Stages)'}</span>
              </h2>
              <p className="text-sm text-emerald-800/80 mt-0.5">
                {locale === 'hi'
                  ? 'बुकिंग से लेकर सीधे बैंक खाते (DBT) में भुगतान तक का रीयल-टाइम रिकॉर्ड।'
                  : 'Real-time stage-by-stage transaction audit from reservation to DBT payment disbursal.'}
              </p>
            </div>

            {/* Vertical 7-Stage Timeline */}
            <div className="space-y-4 pt-1">
              {journey.map((stage, idx) => {
                const isLast = idx === journey.length - 1;
                const isCompleted = stage.state === 'COMPLETED';
                const isInProgress = stage.state === 'IN_PROGRESS';

                return (
                  <div key={stage.stageId} className="flex items-start gap-3.5 relative">
                    {/* Vertical connecting line */}
                    {!isLast && (
                      <span
                        className={`absolute top-7 left-4 w-0.5 h-[calc(100%+0.5rem)] -ml-[1px] transition-colors ${
                          isCompleted ? 'bg-emerald-500' : 'bg-[#334155]'
                        }`}
                      />
                    )}

                    {/* Step Icon Bubble */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                        isCompleted
                          ? 'bg-emerald-50 border border-emerald-200 shadow-xs'
                          : isInProgress
                          ? 'bg-amber-50 border border-amber-200 shadow-xs ring-4 ring-amber-500/20'
                          : 'bg-[#F4F9F7] border border-emerald-100'
                      }`}
                    >
                      {getStageIcon(stage.state)}
                    </div>

                    {/* Stage Details */}
                    <div className="flex-1 pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-emerald-700/80">
                            0{stage.stepNumber}
                          </span>
                          <h4
                            className={`text-sm sm:text-base font-bold ${
                              isInProgress
                                ? 'text-amber-600'
                                : isCompleted
                                ? 'text-[#014532]'
                                : 'text-emerald-800/80'
                            }`}
                          >
                            {stage.title}
                          </h4>
                        </div>
                        <div>{getStagePill(stage.state)}</div>
                      </div>

                      <p className="text-sm text-emerald-900/80 mt-1 leading-relaxed">
                        {stage.summary}
                      </p>

                      {/* Department and Timestamp Metadata */}
                      <div className="flex items-center gap-2 text-sm text-emerald-800/80 mt-1.5 flex-wrap">
                        <span className="font-semibold text-emerald-900/80">
                          {stage.department}
                        </span>
                        {stage.timestamp && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-800/80">
                              {formatDate(stage.timestamp)} {formatTime(stage.timestamp)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION: TRANSPARENT DEPARTMENT RECORDS */}
          <section
            aria-label="Department Records"
            className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-100 p-5 sm:p-6 shadow-lg space-y-4"
          >
            <div className="border-b border-emerald-100 pb-3">
              <h2 className="text-base sm:text-base font-bold text-[#014532] flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>{locale === 'hi' ? 'विभागीय अभिलेख एवं मापदंड' : 'Departmental Records & Telemetry'}</span>
              </h2>
              <p className="text-sm text-emerald-800/80 mt-0.5">
                {locale === 'hi'
                  ? 'प्रत्येक विभाग द्वारा दर्ज की गई आधिकारिक जानकारी (केवल पढ़ने हेतु)।'
                  : 'Official inspection, weighing scale, and decision telemetry recorded by authorized personnel.'}
              </p>
            </div>

            <div className="space-y-3 pt-1 text-sm">
              {/* 1. Check-in Record */}
              <div className="p-3.5 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-[#014532] uppercase text-sm tracking-wider">
                      {locale === 'hi' ? 'प्रवेश द्वार चेक-इन' : 'Gate Check-In'}
                    </span>
                  </div>
                  <span className="text-sm text-emerald-800/80 font-mono">
                    {departmentRecords.checkin.timestamp ? formatTime(departmentRecords.checkin.timestamp) : 'Pending'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-emerald-900/80">
                  <div>
                    <span className="text-emerald-700/80 block text-sm">Action:</span>
                    <span>{departmentRecords.checkin.action}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700/80 block text-sm">Department:</span>
                    <span>{departmentRecords.checkin.department}</span>
                  </div>
                </div>
              </div>

              {/* 2. Weighment Record */}
              <div className="p-3.5 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-[#014532] uppercase text-sm tracking-wider">
                      {locale === 'hi' ? 'इलेक्ट्रॉनिक धर्मकांटा तौल' : 'Weighment Record'}
                    </span>
                  </div>
                  <span className="text-sm text-emerald-800/80 font-mono">
                    {departmentRecords.weighment.timestamp ? formatTime(departmentRecords.weighment.timestamp) : 'Waiting'}
                  </span>
                </div>

                {departmentRecords.weighment.status === 'COMPLETED' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-emerald-900/80 pt-1">
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Gross Weight:</span>
                      <strong className="text-[#014532] font-mono">{departmentRecords.weighment.grossWeightKg?.toLocaleString('en-IN') || '—'} kg</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Tare Weight:</span>
                      <strong className="text-emerald-900/80 font-mono">{departmentRecords.weighment.tareWeightKg?.toLocaleString('en-IN') || '—'} kg</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Net Grain:</span>
                      <strong className="text-emerald-700 font-mono">{departmentRecords.weighment.netWeightKg?.toLocaleString('en-IN') || '—'} kg</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Equivalent:</span>
                      <strong className="text-[#014532] font-mono">{departmentRecords.weighment.netWeightQuintals} qtl</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-emerald-800/80 text-sm">
                    {locale === 'hi' ? 'धर्मकांटा आवंटन की प्रतीक्षा की जा रही है।' : 'Waiting for weighbridge allocation and hardware scale reading.'}
                  </p>
                )}
              </div>

              {/* 3. Quality Assessment Record */}
              <div className="p-3.5 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-[#014532] uppercase text-sm tracking-wider">
                      {locale === 'hi' ? 'गुणवत्ता एवं प्रयोगशाला रिपोर्ट' : 'Quality Assessment'}
                    </span>
                  </div>
                  <span className="text-sm text-emerald-800/80 font-mono">
                    {departmentRecords.quality.timestamp ? formatTime(departmentRecords.quality.timestamp) : 'Waiting'}
                  </span>
                </div>

                {departmentRecords.quality.status === 'COMPLETED' || departmentRecords.quality.status === 'REJECTED' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-emerald-900/80 pt-1">
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Grade:</span>
                      <strong className="text-emerald-700">{departmentRecords.quality.grade || 'GRADE_A'}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Moisture:</span>
                      <strong className="text-[#014532] font-mono">{departmentRecords.quality.moisturePercent}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Foreign Matter:</span>
                      <strong className="text-[#014532] font-mono">{departmentRecords.quality.foreignMatterPercent}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Damaged Grains:</span>
                      <strong className="text-[#014532] font-mono">{departmentRecords.quality.damagedGrainPercent}%</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-emerald-800/80 text-sm">
                    {locale === 'hi' ? 'प्रयोगशाला नमूना जांच प्रक्रियाधीन है।' : 'Commodity sample inspection pending in laboratory.'}
                  </p>
                )}
              </div>

              {/* 4. Procurement Purchase Record */}
              <div className="p-3.5 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-[#014532] uppercase text-sm tracking-wider">
                      {locale === 'hi' ? 'खरीद एवं मूल्य निर्धारण' : 'Procurement Decision'}
                    </span>
                  </div>
                  <span className="text-sm text-emerald-800/80 font-mono">
                    {departmentRecords.procurement.timestamp ? formatTime(departmentRecords.procurement.timestamp) : 'Waiting'}
                  </span>
                </div>

                {departmentRecords.procurement.status === 'COMPLETED' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-emerald-900/80 pt-1">
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Accepted Qty:</span>
                      <strong className="text-emerald-700 font-mono">{departmentRecords.procurement.acceptedQuantityQuintals} qtl</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">MSP Rate:</span>
                      <strong className="text-[#014532] font-mono">₹{departmentRecords.procurement.ratePerQuintal}/q</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Deductions:</span>
                      <strong className="text-emerald-800/80 font-mono">₹0.00</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Net Payable:</span>
                      <strong className="text-emerald-700 font-mono">₹{departmentRecords.procurement.netPayable?.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-emerald-800/80 text-sm">
                    {locale === 'hi' ? 'खरीद निर्णय एवं वाउचर जारी होने की प्रतीक्षा है।' : 'Purchase voucher pending completion of weighment and lab grading.'}
                  </p>
                )}
              </div>

              {/* 5. DBT Payment Record */}
              <div className="p-3.5 rounded-xl bg-[#F4F9F7] border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-[#014532] uppercase text-sm tracking-wider">
                      {locale === 'hi' ? 'डीबीटी बैंक अंतरण' : 'Direct Benefit Transfer (DBT)'}
                    </span>
                  </div>
                  <span className="text-sm text-emerald-800/80 font-mono">
                    {departmentRecords.payment.timestamp ? formatTime(departmentRecords.payment.timestamp) : 'Pending'}
                  </span>
                </div>

                {departmentRecords.payment.status === 'COMPLETED' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-emerald-900/80 pt-1">
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Disbursed Amount:</span>
                      <strong className="text-emerald-700 font-mono text-base">
                        ₹{departmentRecords.payment.amount?.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">PFMS Transaction Ref:</span>
                      <strong className="text-[#014532] font-mono text-sm truncate block">
                        {departmentRecords.payment.transactionRef || 'DBT-PFMS-SETTLED'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-emerald-100 shadow-xs">
                      <span className="text-emerald-800/80 block text-sm">Bank Account:</span>
                      <strong className="text-emerald-900/80 font-mono">
                        {departmentRecords.payment.bankAccountMasked || '••••••••1234'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-emerald-800/80 text-sm">
                    {locale === 'hi' ? 'खरीद पूर्ण होने के उपरांत पीएफएमएस प्रणाली द्वारा सीधा अंतरण होगा।' : 'Awaiting procurement completion for direct credit into your Aadhaar-seeded bank account.'}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* SECTION: ACTIVITY & AUDIT TIMELINE */}
          {activityAuditTrail.length > 0 && (
            <section
              aria-label="Activity Audit Trail"
              className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-100 p-5 sm:p-6 shadow-lg space-y-4"
            >
              <div className="border-b border-emerald-100 pb-3">
                <h2 className="text-base sm:text-base font-bold text-[#014532] flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-700" />
                  <span>{locale === 'hi' ? 'गतिविधि एवं ऑडिट ट्रेल' : 'Activity & Records Audit Trail'}</span>
                </h2>
                <p className="text-sm text-emerald-800/80 mt-0.5">
                  {locale === 'hi'
                    ? 'सभी अधिकृत कार्यों का कालानुक्रमिक डिजिटल प्रमाण।'
                    : 'Immutable chronological record of events entered into the central grain procurement ledger.'}
                </p>
              </div>

              <div className="space-y-3 pt-1 text-sm">
                {activityAuditTrail.map((log, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#F4F9F7] border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#014532]">{log.stage}</span>
                        <span className="text-emerald-700/80">•</span>
                        <span className="text-emerald-900/80 font-medium">{log.department}</span>
                      </div>
                      <p className="text-emerald-800/80 text-sm">{log.description}</p>
                    </div>
                    <span className="text-sm text-emerald-700/80 font-mono shrink-0">
                      {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Existing Digital QR Booking Pass Modal (Unchanged & Preserved) */}
      <BookingPassModal
        isOpen={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        booking={bookingPassData}
        lang={locale === 'hi' ? 'hi' : 'en'}
      />
    </main>
  );
}
