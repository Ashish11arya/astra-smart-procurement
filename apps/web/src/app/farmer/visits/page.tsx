'use client';

import { BookingPassModal } from '@/components/booking/BookingPassModal';
import { ProcurementVoucherModal, ProcurementVoucherData } from '@/components/procurement/ProcurementVoucherModal';
import { QrCode, FileCheck2, Printer } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  XCircle,
  IndianRupee,
  Award,
  Layers,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface VisitBooking {
  id: string;
  bookingNumber: string;
  centreName: string;
  centreCode: string;
  centreAddress: string;
  bookingDate: string;
  session: 'MORNING' | 'AFTERNOON';
  windowStartTime: string;
  windowEndTime: string;
  expectedQuantityQuintals: number;
  expectedDurationMinutes: number;
  vehicleNumber?: string;
  vehicleType?: string;
  status: string;
  checkInTime?: string;
  queuePosition?: number | null;
  queueToken?: string | null;
  weighment?: {
    originalHardwareWeight: number;
    approvedFinalWeight?: number;
    deviceCode: string;
    status: string;
  };
  quality?: {
    grade: string;
    moisturePercent: number;
  };
  procurement?: {
    id?: string;
    decision?: string;
    acceptedQuantityQuintals: number;
    ratePerQuintal: number;
    totalAmount: number;
    remarks?: string;
    decidedBy?: string;
    decidedAt?: string;
  };
  payment?: {
    paymentStatus: string;
    transactionRef?: string;
    amount: number;
    bankAccountMasked?: string;
  };
}

export default function FarmerVisitsPage() {
  const { locale, t } = useLanguage();
  const lang = locale;
  const { user, farmer } = useAuth();
  const router = useRouter();

  const [visits, setVisits] = useState<VisitBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<any | null>(null);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<ProcurementVoucherData | null>(null);

  const loadVisits = async () => {
    try {
      const res = await apiRequest<VisitBooking[]>('/bookings/my-visits');
      setVisits(res || []);
    } catch (err: any) {
      if (err?.status === 403 && err?.message?.includes('Farmer profile required')) {
        router.push('/farmer/profile');
        return;
      }
      console.error('Failed to load visits:', err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this procurement visit?')) return;
    setCancellingId(bookingId);
    try {
      await apiRequest(`/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        body: { reason: 'Cancelled by farmer' },
      });
      await loadVisits();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[13px] font-bold tracking-wide uppercase">BOOKED</span>;
      case 'CHECKED_IN':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[13px] font-bold tracking-wide uppercase">CHECKED IN</span>;
      case 'WEIGHMENT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[13px] font-bold tracking-wide uppercase">WEIGHMENT</span>;
      case 'QUALITY_ASSESSMENT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[13px] font-bold tracking-wide uppercase">QUALITY GRADING</span>;
      case 'PROCUREMENT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[13px] font-bold tracking-wide uppercase">PURCHASE CONFIRMED</span>;
      case 'PAYMENT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[13px] font-bold tracking-wide uppercase">PAYMENT PROCESSING</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F0F8F6] text-[#014532] border border-[#014532]/20 text-[13px] font-bold tracking-wide uppercase">SETTLED &amp; COMPLETED</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[13px] font-bold tracking-wide uppercase">CANCELLED</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-[13px] font-bold tracking-wide uppercase">{status}</span>;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredVisits = visits.filter((v) => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'ACTIVE') {
      return (
        v.status === 'CHECKED_IN' ||
        v.status === 'WEIGHMENT' ||
        v.status === 'QUALITY_ASSESSMENT' ||
        v.status === 'PROCUREMENT' ||
        v.status === 'PAYMENT' ||
        (v.status === 'BOOKED' && v.bookingDate.startsWith(todayStr))
      );
    }
    if (filterTab === 'UPCOMING') {
      return v.status === 'BOOKED' && v.bookingDate >= todayStr;
    }
    if (filterTab === 'COMPLETED') {
      return v.status === 'COMPLETED';
    }
    if (filterTab === 'CANCELLED') {
      return v.status === 'CANCELLED' || v.status === 'NO_SHOW';
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 lg:pt-6 lg:pb-10 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="bg-gradient-to-br from-white via-emerald-50/50 to-emerald-100/60 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm border border-emerald-100/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#014532] tracking-tight">
            {lang === 'hi' ? 'मेरी खरीद यात्राएं' : 'My Procurement Visits'}
          </h1>
          <p className="text-emerald-800/90 text-base sm:text-lg mt-2 max-w-2xl font-medium">
            {lang === 'hi'
              ? 'अपनी निर्धारित यात्रा, आगमन समय और वास्तविक समय की स्थिति देखें।'
              : 'Track your scheduled visits, assigned arrival windows, and real-time processing status.'}
          </p>
        </div>

        <Link
          href="/farmer/centres"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#014532] text-white hover:bg-[#025a42] rounded-xl text-base font-bold shadow-sm transition-all active:scale-[0.98] border border-transparent"
        >
          <span>{lang === 'hi' ? 'नई यात्रा बुक करें' : 'Book New Visit'}</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 text-sm scrollbar-hide">
        {[
          { key: 'ALL', labelEn: 'All Visits', labelHi: 'सभी यात्राएं', count: visits.length },
          {
            key: 'ACTIVE',
            labelEn: 'Active',
            labelHi: 'सक्रिय',
            count: visits.filter(
              (v) =>
                v.status === 'CHECKED_IN' ||
                v.status === 'WEIGHMENT' ||
                v.status === 'QUALITY_ASSESSMENT' ||
                v.status === 'PROCUREMENT' ||
                v.status === 'PAYMENT' ||
                (v.status === 'BOOKED' && v.bookingDate.startsWith(todayStr))
            ).length,
          },
          {
            key: 'UPCOMING',
            labelEn: 'Upcoming',
            labelHi: 'आगामी',
            count: visits.filter((v) => v.status === 'BOOKED' && v.bookingDate >= todayStr).length,
          },
          {
            key: 'COMPLETED',
            labelEn: 'Completed',
            labelHi: 'पूर्ण',
            count: visits.filter((v) => v.status === 'COMPLETED').length,
          },
          {
            key: 'CANCELLED',
            labelEn: 'Cancelled',
            labelHi: 'रद्द',
            count: visits.filter((v) => v.status === 'CANCELLED' || v.status === 'NO_SHOW').length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key as any)}
            className={`px-5 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-2.5 border ${
              filterTab === tab.key
                ? 'bg-[#014532] text-white border-[#014532] shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#014532]/30 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <span className="text-[15px]">{lang === 'hi' ? tab.labelHi : tab.labelEn}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                filterTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-emerald-800/80 text-base space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p>{lang === 'hi' ? 'खरीद यात्रा इतिहास लोड हो रहा है...' : 'Loading your procurement visit history...'}</p>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 sm:p-14 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {lang === 'hi' ? 'इस श्रेणी में कोई यात्रा नहीं मिली' : 'No Visits in this Category'}
            </h3>
            <p className="text-base text-gray-500 mt-2 max-w-md mx-auto">
              {lang === 'hi'
                ? 'नजदीकी अधिकृत खरीद केंद्र का चयन करें और अपनी आगमन समय खिड़की बुक करें।'
                : 'Schedule a visit at an authorized government grain procurement centre.'}
            </p>
          </div>
          <Link
            href="/farmer/centres"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#014532] hover:bg-[#025a42] text-white rounded-xl text-base font-semibold shadow-sm transition-all"
          >
            <span>{lang === 'hi' ? 'सत्यापित खरीद केंद्र खोजें' : 'Find Procurement Centre'}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4 pr-1 rounded-xl farmer-queue-scroll">
          {filteredVisits.map((visit) => {
            const isBooked = visit.status === 'BOOKED';
            return (
              <div
                key={visit.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8 space-y-6 transition-all hover:border-[#014532]/30 hover:shadow-md text-[#014532]"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                        <Layers className="w-3.5 h-3.5" />
                        Ref: <strong className="text-gray-900 font-bold tracking-wide">{visit.bookingNumber}</strong>
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#014532]" />
                      {visit.centreName}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5 font-medium mt-1">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{visit.centreAddress}</span>
                    </p>
                  </div>
                  <div className="shrink-0 pt-1">
                    {getStatusBadge(visit.status)}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'निर्धारित तिथि' : 'Scheduled Date'}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg block">
                      {new Date(visit.bookingDate).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F0F8F6] border border-[#014532]/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-[#014532] mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'आगमन खिड़की' : 'Arrival Window'}
                      </span>
                    </div>
                    <span className="font-bold text-[#014532] text-lg block tracking-wide">
                      {visit.windowStartTime} – {visit.windowEndTime}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                      <Truck className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'अपेक्षित मात्रा' : 'Expected Quantity'}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg block">
                      {visit.expectedQuantityQuintals} <span className="text-sm font-medium text-gray-500">qtl</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                      <Layers className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'hi' ? 'सत्र' : 'Session'}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg block capitalize">
                      {visit.session.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Processing Summary Highlights */}
                {(visit.weighment || visit.quality || visit.procurement || visit.payment) && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      {visit.weighment && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">Weighed: <b className="text-gray-900">{visit.weighment.approvedFinalWeight || visit.weighment.originalHardwareWeight} qtl</b></span>
                        </div>
                      )}
                      {visit.quality && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">Quality: <b className="text-gray-900">{visit.quality.grade}</b> ({visit.quality.moisturePercent}%)</span>
                        </div>
                      )}
                      {visit.procurement && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">Payout: <b className="text-[#014532] font-bold">₹{visit.procurement.totalAmount.toLocaleString('en-IN')}</b></span>
                        </div>
                      )}
                      {visit.payment && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">DBT Status: <b className="text-gray-900">{visit.payment.paymentStatus}</b></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                  {/* Dedicated Link to full 7-stage Booking Transaction Journey */}
                  <Link
                    href={`/farmer/bookings/${visit.id}`}
                    className="w-full sm:w-auto text-base text-white font-bold inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#014532] hover:bg-[#025a42] transition shadow-sm"
                  >
                    <span>{lang === 'hi' ? 'खरीद विवरण व यात्रा देखें' : 'View Procurement Details'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="w-full sm:w-auto flex flex-wrap items-center justify-center sm:justify-end gap-3">
                    {visit.procurement && (
                      <button
                        onClick={() => {
                          const p = visit.procurement!;
                          const w = visit.weighment;
                          const q = visit.quality;
                          const pay = visit.payment;
                          const voucherData: ProcurementVoucherData = {
                            id: p.id || visit.id,
                            bookingNumber: visit.bookingNumber,
                            centreName: visit.centreName || 'Muzaffarpur Central Grain Procurement Depot',
                            centreCode: visit.centreCode || 'DEP-BIH-04',
                            centreAddress: visit.centreAddress || 'Industrial Area, Phase 2, Muzaffarpur, Bihar - 842001',
                            bookingDate: visit.bookingDate,
                            session: visit.session,
                            farmerName: (visit as any).farmerName || farmer?.fullName || (user as any)?.name || (user as any)?.fullName || 'Farmer',
                            farmerCode: (visit as any).farmerCode || farmer?.farmerCode || 'ASTRA-FARMER',
                            farmerMobile: (visit as any).farmerMobile || farmer?.mobile || user?.mobile || '',
                            commodityName: 'Wheat (गेहूं)',
                            qualityGrade: q?.grade || 'Grade A',
                            moisturePercent: q?.moisturePercent ?? 11.8,
                            actualWeightQuintals: w?.approvedFinalWeight || w?.originalHardwareWeight || visit.expectedQuantityQuintals,
                            acceptedQuantityQuintals: p.acceptedQuantityQuintals,
                            ratePerQuintal: p.ratePerQuintal,
                            totalAmount: p.totalAmount,
                            deductions: 0,
                            decidedAt: p.decidedAt || visit.bookingDate,
                            decidedBy: p.decidedBy || 'Procurement Officer (ASTRA Authorized)',
                            paymentStatus: pay?.paymentStatus || (visit.status === 'COMPLETED' ? 'SETTLED' : 'PENDING'),
                            transactionRef: pay?.transactionRef || `ASTRA-DBT-${visit.bookingNumber.slice(-6)}`,
                            bankAccountMasked: pay ? (pay as any).bankAccountMasked : undefined,
                          };
                          setSelectedVoucherForPrint(voucherData);
                        }}
                        className="text-sm text-gray-700 font-bold inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 transition shadow-sm"
                      >
                        <FileCheck2 className="w-4 h-4 text-gray-500" />
                        <span>{lang === 'hi' ? 'वाउचर' : 'Voucher'}</span>
                      </button>
                    )}

                    {visit.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setSelectedBookingForPass({
                          id: visit.id,
                          bookingNumber: visit.bookingNumber,
                          centreName: visit.centreName,
                          centreAddress: visit.centreAddress,
                          centreCode: visit.centreCode,
                          bookingDate: visit.bookingDate,
                          session: visit.session,
                          windowStartTime: visit.windowStartTime,
                          windowEndTime: visit.windowEndTime,
                          expectedQuantityQuintals: visit.expectedQuantityQuintals,
                          vehicleNumber: visit.vehicleNumber,
                          vehicleType: visit.vehicleType,
                          farmerName: (visit as any).farmerName || farmer?.fullName || 'Farmer',
                          farmerCode: (visit as any).farmerCode || farmer?.farmerCode || null,
                          status: visit.status,
                        })}
                        className="text-sm text-gray-700 font-bold inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 transition shadow-sm"
                      >
                        <QrCode className="w-4 h-4 text-gray-500" />
                        <span>{lang === 'hi' ? 'क्यूआर पास' : 'QR Pass'}</span>
                      </button>
                    )}

                    {isBooked && (
                      <button
                        onClick={() => handleCancelBooking(visit.id)}
                        disabled={cancellingId === visit.id}
                        className="text-sm text-red-700 hover:text-red-800 font-bold inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{cancellingId === visit.id ? 'Cancelling...' : 'Cancel Visit'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Pass Modal */}
      <BookingPassModal
        isOpen={Boolean(selectedBookingForPass)}
        onClose={() => setSelectedBookingForPass(null)}
        booking={selectedBookingForPass}
        lang={lang === 'hi' ? 'hi' : 'en'}
      />

      {/* Procurement Voucher Modal */}
      <ProcurementVoucherModal
        isOpen={Boolean(selectedVoucherForPrint)}
        onClose={() => setSelectedVoucherForPrint(null)}
        voucher={selectedVoucherForPrint}
        lang={lang === 'hi' ? 'hi' : 'en'}
      />
    </div>
  );
}
