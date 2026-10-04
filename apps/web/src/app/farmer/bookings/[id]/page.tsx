'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
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

  const getStageIcon = (state: any) => {
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
          <span className="px-2 py-0.5 rounded text-sm font-semibold uppercase tracking-wider bg-amber-500 text-white">
            ○ WAITING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-sm font-semibold uppercase tracking-wider bg-white text-slate-500 border border-slate-200">
            NOT STARTED
          </span>
        );
    }
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-24 font-inter text-slate-800">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'hi' ? 'वापस' : 'Back'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Summary & Stages */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Booking Summary Section */}
          <section
            aria-label="Booking Summary"
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
              <Calendar className="w-5 h-5 text-slate-500" />
              {locale === 'hi' ? 'बुकिंग सारांश' : 'Booking Summary'}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'hi' ? 'किसान' : 'Farmer'}
                </p>
                <p className="text-base font-semibold text-slate-900">{booking.farmerName || 'Akash'}</p>
                <p className="text-sm text-slate-600">ASTRA-FARMER</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'hi' ? 'दिनांक और सत्र' : 'Date & Session'}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {new Date(booking.bookingDate).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-slate-600">{booking.session} Session ({booking.windowStartTime} – {booking.windowEndTime})</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'hi' ? 'केंद्र' : 'Centre'}
                </p>
                <p className="text-base font-semibold text-slate-900">{booking.centreName || 'Procurement Centre'}</p>
                <p className="text-sm text-slate-600 truncate">{booking.centreAddress || 'Center Address'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {locale === 'hi' ? 'मात्रा' : 'Quantity'}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {booking.expectedQuantityQuintals} {locale === 'hi' ? 'क्विंटल' : 'Quintals'}
                </p>
                <p className="text-sm text-slate-600">{cropName}</p>
              </div>
            </div>
          </section>

          {/* Procurement Journey Section */}
          <section
            aria-label="Procurement Journey"
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold mb-8 flex items-center gap-2 text-slate-900">
              <ClipboardCheck className="w-5 h-5 text-slate-500" />
              {locale === 'hi' ? 'खरीद प्रक्रिया' : 'Procurement Journey'}
            </h2>

            <div className="relative ml-4 sm:ml-6">
              {journey.map((stage, idx) => {
                const isLast = idx === journey.length - 1;
                const isCompleted = stage.state === 'COMPLETED';
                const isInProgress = stage.state === 'IN_PROGRESS';
                const isWaiting = stage.state === 'WAITING';
                const isRejected = stage.state === 'REJECTED';

                return (
                  <div key={stage.stageId} className="relative pb-10 sm:pb-12 last:pb-0 flex items-start group">
                    {/* Vertical Line Connector */}
                    {!isLast && (
                      <div className={`absolute top-8 left-3 sm:left-4 w-px h-full -ml-[0.5px] transition-colors duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                      }`} />
                    )}

                    {/* Status Node Icon */}
                    <div className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      isCompleted ? 'bg-emerald-500 text-white shadow-sm' : 
                      isInProgress ? 'bg-amber-400 text-white shadow-sm ring-4 ring-amber-50' : 
                      isRejected ? 'bg-rose-500 text-white shadow-sm' :
                      'bg-white border-2 border-slate-300'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : 
                       isInProgress ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> :
                       isRejected ? <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : null}
                    </div>

                    {/* Stage Details */}
                    <div className="ml-4 sm:ml-6 flex-1 pt-0.5 sm:pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-1.5">
                        <h3 className={`text-base font-semibold ${
                          isCompleted || isInProgress ? 'text-slate-900' : 'text-slate-500'
                        }`}>
                          {stage.title}
                        </h3>
                        {getStagePill(stage.state)}
                      </div>
                      
                      <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                        {stage.summary}
                      </p>

                      {stage.timestamp && (
                        <p className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(stage.timestamp).toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Status & Gate Pass */}
        <div className="space-y-6">
          {/* Current Status Card */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              {locale === 'hi' ? 'वर्तमान स्थिति' : 'Current Status'}
            </h3>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                {getStageIcon(currentStatus.code)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg mb-1">
                  {currentStatus.label}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentStatus.description}
                </p>
              </div>
            </div>
          </section>

          {/* Gate Pass Access Card */}
          <section className="bg-gradient-to-br from-[#014532] to-emerald-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">
                {locale === 'hi' ? 'डिजिटल गेट पास' : 'Digital Gate Pass'}
              </h3>
              <p className="text-emerald-100/90 text-sm mb-6 max-w-[200px] leading-relaxed">
                {locale === 'hi' 
                  ? 'प्रवेश और तीव्र चेक-इन के लिए अपना पास दिखाएं।' 
                  : 'Present your pass for entry and fast-track check-in.'}
              </p>
              
              <button
                onClick={() => setPassModalOpen(true)}
                className="w-full bg-white text-[#014532] hover:bg-emerald-50 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <QrCode className="w-5 h-5" />
                {locale === 'hi' ? 'पास दिखाएं' : 'Show Pass'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Existing Digital QR Booking Pass Modal (Unchanged & Preserved) */}
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
