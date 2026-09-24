'use client';

import { BookingPassModal } from '@/components/booking/BookingPassModal';
import { ProcurementVoucherModal, ProcurementVoucherData } from '@/components/procurement/ProcurementVoucherModal';
import { QrCode, FileCheck2, Printer } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
    } catch (err) {
      console.error('Failed to load visits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
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
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40 text-sm font-bold font-mono">BOOKED</span>;
      case 'CHECKED_IN':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-bold font-mono">CHECKED IN</span>;
      case 'WEIGHMENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-bold font-mono">WEIGHMENT</span>;
      case 'QUALITY_ASSESSMENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 text-sm font-bold font-mono">QUALITY GRADING</span>;
      case 'PROCUREMENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 text-sm font-bold font-mono">PURCHASE CONFIRMED</span>;
      case 'PAYMENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-sm font-bold font-mono">PAYMENT PROCESSING</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-700 border border-emerald-600 text-sm font-bold font-mono">SETTLED &amp; COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-800/80 border border-emerald-100 text-sm font-bold font-mono">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-900/80 border border-emerald-100 text-sm font-bold font-mono">{status}</span>;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-[#014532]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#014532] tracking-tight">
            {lang === 'hi' ? 'मेरी खरीद यात्राएं' : 'My Procurement Visits'}
          </h1>
          <p className="text-emerald-800/80 text-base mt-1">
            {lang === 'hi'
              ? 'अपनी निर्धारित यात्रा, आगमन समय और वास्तविक समय की स्थिति देखें।'
              : 'Track your scheduled visits, assigned arrival windows, and real-time processing status.'}
          </p>
        </div>

        <Link
          href="/farmer/centres"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#014532] rounded-xl text-sm sm:text-base font-bold shadow-md transition active:scale-[0.99]"
        >
          <span>{lang === 'hi' ? 'नई यात्रा बुक करें' : 'Book New Visit'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm">
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
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === tab.key
                ? 'bg-emerald-600 text-[#014532] shadow-md'
                : 'text-emerald-800/80 hover:text-[#014532] bg-white/95 backdrop-blur-sm shadow-xl hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <span>{lang === 'hi' ? tab.labelHi : tab.labelEn}</span>
            <span
              className={`text-sm px-1.5 py-0.5 rounded-full font-bold ${
                filterTab === tab.key ? 'bg-emerald-800 text-[#014532]' : 'bg-[#F4F9F7] text-emerald-800/80 border border-emerald-100'
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
        <div className="rounded-xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl p-8 sm:p-10 text-center space-y-4 shadow-md">
          <Calendar className="w-12 h-12 text-emerald-700/80 mx-auto" />
          <div>
            <h3 className="font-bold text-[#014532] text-base">
              {lang === 'hi' ? 'इस श्रेणी में कोई यात्रा नहीं मिली' : 'No Visits in this Category'}
            </h3>
            <p className="text-sm text-emerald-800/80 mt-1 max-w-md mx-auto">
              {lang === 'hi'
                ? 'नजदीकी अधिकृत खरीद केंद्र का चयन करें और अपनी आगमन समय खिड़की बुक करें।'
                : 'Schedule a visit at an authorized government grain procurement centre.'}
            </p>
          </div>
          <Link
            href="/farmer/centres"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#014532] rounded-xl text-base font-semibold shadow-md transition"
          >
            <span>{lang === 'hi' ? 'सत्यापित खरीद केंद्र खोजें' : 'Find Procurement Centre'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4 pr-1 rounded-xl">
          {filteredVisits.map((visit) => {
            const isBooked = visit.status === 'BOOKED';
            return (
              <div
                key={visit.id}
                className="rounded-xl border border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl p-5 sm:p-6 shadow-md space-y-4 transition-all hover:border-slate-500 text-[#014532]"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-100">
                  <div className="space-y-0.5">
                    <span className="text-sm text-emerald-800/80 font-mono">
                      Ref: <strong className="text-emerald-700 font-bold">{visit.bookingNumber}</strong>
                    </span>
                    <h3 className="font-bold text-[#014532] text-base sm:text-lg">
                      {visit.centreName}
                    </h3>
                    <p className="text-sm text-emerald-800/80 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{visit.centreAddress}</span>
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(visit.status)}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="p-2.5 rounded-lg bg-[#F4F9F7] border border-emerald-100">
                    <span className="text-sm text-emerald-800/80 font-semibold block uppercase tracking-wider">
                      {lang === 'hi' ? 'निर्धारित तिथि' : 'Scheduled Date'}
                    </span>
                    <span className="font-bold text-[#014532] text-base">
                      {new Date(visit.bookingDate).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-sm text-emerald-700 font-semibold block uppercase tracking-wider">
                      {lang === 'hi' ? 'आगमन खिड़की' : 'Arrival Window'}
                    </span>
                    <span className="font-bold text-emerald-600 font-mono text-base">
                      {visit.windowStartTime} – {visit.windowEndTime}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F4F9F7] border border-emerald-100">
                    <span className="text-sm text-emerald-800/80 font-semibold block uppercase tracking-wider">
                      {lang === 'hi' ? 'अपेक्षित मात्रा' : 'Expected Quantity'}
                    </span>
                    <span className="font-bold text-[#014532] text-base font-mono">
                      {visit.expectedQuantityQuintals} qtl
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F4F9F7] border border-emerald-100">
                    <span className="text-sm text-emerald-800/80 font-semibold block uppercase tracking-wider">
                      {lang === 'hi' ? 'सत्र' : 'Session'}
                    </span>
                    <span className="font-bold text-emerald-900/80 text-base">
                      {visit.session}
                    </span>
                  </div>
                </div>

                {/* Processing Summary Highlights */}
                {(visit.weighment || visit.quality || visit.procurement || visit.payment) && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      {visit.weighment && (
                        <div className="flex items-center gap-1.5 text-emerald-900/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Weighed: <b className="text-[#014532] font-mono">{visit.weighment.approvedFinalWeight || visit.weighment.originalHardwareWeight} qtl</b></span>
                        </div>
                      )}
                      {visit.quality && (
                        <div className="flex items-center gap-1.5 text-emerald-900/80">
                          <Award className="w-3.5 h-3.5 text-purple-400" />
                          <span>Quality: <b className="text-[#014532]">{visit.quality.grade}</b> ({visit.quality.moisturePercent}% moisture)</span>
                        </div>
                      )}
                      {visit.procurement && (
                        <div className="flex items-center gap-1.5 text-emerald-900/80">
                          <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                          <span>Total Payout: <b className="text-emerald-700 font-mono font-bold">₹{visit.procurement.totalAmount.toLocaleString('en-IN')}</b></span>
                        </div>
                      )}
                      {visit.payment && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>DBT Status: <b className="text-[#014532]">{visit.payment.paymentStatus}</b></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100">
                  {/* Dedicated Link to full 7-stage Booking Transaction Journey */}
                  <Link
                    href={`/farmer/bookings/${visit.id}`}
                    className="text-sm text-[#014532] font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
                  >
                    <span>{lang === 'hi' ? 'खरीद विवरण व यात्रा देखें' : 'View Procurement Details'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex flex-wrap items-center gap-2">
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
                        className="text-sm text-emerald-700 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-[#232F48] transition shadow-xs"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
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
                        className="text-sm text-emerald-900/80 hover:text-[#014532] font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-100 bg-[#F4F9F7] hover:bg-emerald-50 transition shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-800/80" />
                        <span>{lang === 'hi' ? 'क्यूआर पास' : 'QR Pass'}</span>
                      </button>
                    )}

                    {isBooked && (
                      <button
                        onClick={() => handleCancelBooking(visit.id)}
                        disabled={cancellingId === visit.id}
                        className="text-sm text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{cancellingId === visit.id ? 'Cancelling...' : 'Cancel'}</span>
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
