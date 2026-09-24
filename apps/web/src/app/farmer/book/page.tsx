'use client';

import { DigitalBookingPass } from '@/components/booking/DigitalBookingPass';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Truck,
  Sun,
  Sunset,
  Building2,
  ShieldCheck,
  Download,
  Info,
  Phone,
  Mail,
  Check,
  Package,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Lock,
  FileText,
  CalendarDays,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface BookingEstimate {
  isFeasible: boolean;
  assignedWindowStart: string;
  assignedWindowEnd: string;
  expectedDurationMinutes: number;
  remainingSessionCapacityQuintals: number;
  rejectionReason?: string;
}

interface ConfirmedBooking {
  id: string;
  bookingNumber: string;
  centreId: string;
  centreName: string;
  centreAddress: string;
  bookingDate: string;
  session: 'MORNING' | 'AFTERNOON';
  windowStartTime: string;
  windowEndTime: string;
  expectedQuantityQuintals: number;
  status: string;
}

interface DayAvailability {
  date: string;
  dayOfWeek: string;
  isOperatingDay: boolean;
  morning: {
    available: boolean;
    remainingCapacityQuintals: number;
    totalCapacityQuintals: number;
  };
  afternoon: {
    available: boolean;
    remainingCapacityQuintals: number;
    totalCapacityQuintals: number;
  };
}

interface CongestionInfo {
  level: 'low' | 'moderate' | 'high';
  labelEn: string;
  labelHi: string;
  badgeClass: string;
  dotColor: string;
  textClass: string;
}

function getCongestionInfo(remaining: number, total: number): CongestionInfo {
  if (total <= 0 || remaining <= 0) {
    return {
      level: 'high',
      labelEn: 'Full',
      labelHi: 'पूर्ण',
      badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-700/60',
      dotColor: 'bg-rose-500',
      textClass: 'text-rose-400',
    };
  }
  const ratio = remaining / total;
  if (ratio > 0.6) {
    return {
      level: 'low',
      labelEn: 'Low Traffic',
      labelHi: 'कम भीड़',
      badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
      dotColor: 'bg-emerald-500',
      textClass: 'text-emerald-400',
    };
  } else if (ratio >= 0.2) {
    return {
      level: 'moderate',
      labelEn: 'Moderate',
      labelHi: 'मध्यम',
      badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
      dotColor: 'bg-amber-500',
      textClass: 'text-amber-400',
    };
  } else {
    return {
      level: 'high',
      labelEn: 'High Traffic',
      labelHi: 'अधिक भीड़',
      badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-700/60',
      dotColor: 'bg-rose-500',
      textClass: 'text-rose-400',
    };
  }
}

function formatDayCard(dateStr: string, lang: string) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);

    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesHi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

    const fullDayEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const fullDayHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

    const dayIndex = d.getDay();
    const monthIndex = d.getMonth();

    return {
      dayNum: day,
      dayShort: lang === 'hi' ? dayNamesHi[dayIndex] : dayNamesEn[dayIndex],
      dayFull: lang === 'hi' ? fullDayHi[dayIndex] : fullDayEn[dayIndex],
      monthShort: lang === 'hi' ? monthNamesHi[monthIndex].slice(0, 4) : monthNamesEn[monthIndex],
      monthFull: lang === 'hi' ? monthNamesHi[monthIndex] : monthNamesEn[monthIndex],
      year,
    };
  } catch {
    return {
      dayNum: dateStr,
      dayShort: '',
      dayFull: '',
      monthShort: '',
      monthFull: '',
      year: '',
    };
  }
}

function getTodayIstString(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

function generate7DaysStartingToday(
  rawAvailability: DayAvailability[] = [],
  centre: any,
): DayAvailability[] {
  const todayStr = getTodayIstString();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const baseDate = new Date(ty, tm - 1, td);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const operatingDaysStr = (centre?.operatingDays || 'Monday - Saturday').toLowerCase();

  const isOperatingDay = (d: Date) => {
    const day = dayNames[d.getDay()];
    if (operatingDaysStr.includes('monday - saturday')) {
      return day !== 'Sunday';
    }
    if (operatingDaysStr.includes('all days') || operatingDaysStr.includes('monday - sunday')) {
      return true;
    }
    return operatingDaysStr.includes(day.toLowerCase());
  };

  const results: DayAvailability[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');

    // Match raw availability from backend if available
    const existing = rawAvailability.find((a) => a.date === dateStr);

    if (existing) {
      results.push(existing);
    } else {
      const isOperating = isOperatingDay(d);
      const mCap = centre?.morningCapacityQuintals || 300;
      const aCap = centre?.afternoonCapacityQuintals || 250;

      results.push({
        date: dateStr,
        dayOfWeek: dayNames[d.getDay()],
        isOperatingDay: isOperating,
        morning: {
          available: isOperating,
          remainingCapacityQuintals: isOperating ? mCap : 0,
          totalCapacityQuintals: mCap,
        },
        afternoon: {
          available: isOperating,
          remainingCapacityQuintals: isOperating ? aCap : 0,
          totalCapacityQuintals: aCap,
        },
      });
    }
  }

  return results;
}

function calculateRealisticWindow(
  session: 'MORNING' | 'AFTERNOON',
  bookedRatio: number = 0,
): { start: string; end: string } {
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (session === 'MORNING') {
    // 08:00 to 13:00 (5 hours = 20 fifteen-minute slots)
    const totalSlots = 20;
    const slotIndex = Math.min(totalSlots - 1, Math.max(0, Math.floor(bookedRatio * totalSlots)));
    const startMin = 8 * 60 + slotIndex * 15;
    const endMin = startMin + 15;
    return {
      start: `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`,
      end: `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`,
    };
  } else {
    // 13:00 to 17:00 (4 hours = 16 fifteen-minute slots)
    const totalSlots = 16;
    const slotIndex = Math.min(totalSlots - 1, Math.max(0, Math.floor(bookedRatio * totalSlots)));
    const startMin = 13 * 60 + slotIndex * 15;
    const endMin = startMin + 15;
    return {
      start: `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`,
      end: `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`,
    };
  }
}

function calculateRealisticDuration(quantityQuintals: number): number {
  const qty = Math.max(1, quantityQuintals);
  const baseMinutes = 15;
  const variableMinutes = Math.ceil((qty / 20) * 5);
  const buffer = 4;
  return Math.min(60, Math.max(20, baseMinutes + variableMinutes + buffer));
}

function FarmerBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCentreId = searchParams.get('centreId') || '';

  const { locale, t } = useLanguage();
  const lang = locale;
  const { user, farmer, farmerState, registration } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);

  // Centre & Calendar State
  const [centreId, setCentreId] = useState<string>(initialCentreId);
  const [centreDetails, setCentreDetails] = useState<any>(null);
  const [loadingCentre, setLoadingCentre] = useState<boolean>(false);

  // Centre Head Operational Daily Capacity & Quota Info
  const [capacityInfo, setCapacityInfo] = useState<any>(null);
  const [loadingCapacity, setLoadingCapacity] = useState<boolean>(false);

  // Selected Booking Slot State
  const [bookingDate, setBookingDate] = useState<string>('');
  const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [slotSelected, setSlotSelected] = useState<boolean>(false);

  // Produce & Transport Form State
  const [quantity, setQuantity] = useState<string>('50');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('Tractor Trolley');
  const [driverName, setDriverName] = useState<string>('');

  // Arrival Window Real-Time Estimation State
  const [estimate, setEstimate] = useState<BookingEstimate | null>(null);
  const [estimating, setEstimating] = useState<boolean>(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load Centre Details & 7-Day Capacity Calendar (Guaranteed strictly starting Today in IST)
  useEffect(() => {
    if (!centreId) return;
    setLoadingCentre(true);
    apiRequest<any>(`/centres/${centreId}`)
      .then((res) => {
        setCentreDetails(res);
        // Process rolling 7 days strictly starting from today
        const valid7Days = generate7DaysStartingToday(res.availability7Days, res.centre);
        const firstOp = valid7Days.find((d: DayAvailability) => d.isOperatingDay);
        if (firstOp) {
          setBookingDate(firstOp.date);
          setSession(firstOp.morning.available ? 'MORNING' : 'AFTERNOON');
          setSlotSelected(true);
        }
        setLoadingCentre(false);
      })
      .catch((err) => {
        console.error('Failed to load centre:', err);
        setLoadingCentre(false);
      });
  }, [centreId]);

  // Load Centre Head Operational Daily Capacity & Quota for Selected Date
  useEffect(() => {
    if (!centreId) return;
    const targetDate = bookingDate || getTodayIstString();
    setLoadingCapacity(true);
    apiRequest<any>(`/bookings/capacity?centreId=${centreId}&date=${targetDate}`)
      .then((cap) => {
        setCapacityInfo(cap);
      })
      .catch((err) => {
        console.warn('Could not load date-specific capacity info:', err);
      })
      .finally(() => {
        setLoadingCapacity(false);
      });
  }, [centreId, bookingDate]);

  // Handle Slot Selection from Calendar
  const handleSelectSlot = (date: string, selectedSession: 'MORNING' | 'AFTERNOON') => {
    setBookingDate(date);
    setSession(selectedSession);
    setSlotSelected(true);
    setSubmitError(null);

    // Smooth scroll to form section
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  // Trigger Estimate when Date, Session, or Quantity changes (Debounced)
  useEffect(() => {
    if (!centreId || !bookingDate || !quantity || parseFloat(quantity) <= 0) {
      setEstimate(null);
      return;
    }

    const timer = setTimeout(async () => {
      setEstimating(true);
      setEstimateError(null);
      try {
        const est = await apiRequest<BookingEstimate>('/bookings/estimate', {
          method: 'POST',
          body: {
            centreId,
            bookingDate,
            session,
            expectedQuantityQuintals: parseFloat(quantity),
          },
        });
        setEstimate(est);
      } catch (err: any) {
        setEstimate(null);
        setEstimateError(err.message || 'Unable to calculate arrival window.');
      } finally {
        setEstimating(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [centreId, bookingDate, session, quantity]);

  // Handle Booking Confirmation with Idempotency
  const handleConfirmBooking = async () => {
    if (!estimate || !estimate.isFeasible) return;
    setSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = `ASTRA-IDEMP-${centreId}-${bookingDate}-${session}-${Date.now()}`;

    try {
      const res = await apiRequest<ConfirmedBooking>('/bookings', {
        method: 'POST',
        body: {
          centreId,
          bookingDate,
          session,
          expectedQuantityQuintals: parseFloat(quantity),
          vehicleNumber: vehicleNumber || undefined,
          vehicleType: vehicleType || undefined,
          driverName: driverName || undefined,
          idempotencyKey,
        },
      });

      setConfirmedBooking(res);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(err.message || 'Booking confirmation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. TICKET CONFIRMATION VIEW
  if (confirmedBooking) {
    const formattedDate = formatDayCard(confirmedBooking.bookingDate, lang);
    const passData = {
      id: confirmedBooking.id,
      bookingNumber: confirmedBooking.bookingNumber,
      centreName: confirmedBooking.centreName,
      centreAddress: confirmedBooking.centreAddress,
      bookingDate: `${formattedDate.dayFull}, ${formattedDate.dayNum} ${formattedDate.monthFull} ${formattedDate.year}`,
      session: confirmedBooking.session,
      windowStartTime: confirmedBooking.windowStartTime,
      windowEndTime: confirmedBooking.windowEndTime,
      expectedQuantityQuintals: confirmedBooking.expectedQuantityQuintals,
      vehicleType: 'Standard Transport',
      farmerName: farmer?.fullName || 'Farmer',
      farmerCode: farmer?.farmerCode || (registration as any)?.applicationNumber || 'ASTRA-FR-VERIFIED',
      status: confirmedBooking.status,
    };

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <DigitalBookingPass booking={passData} lang={lang} />
      </div>
    );
  }

  // 2. NO CENTRE SELECTED FALLBACK
  if (!centreId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-[#151C2F] rounded-2xl border border-[#334155] p-8 space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">
            {lang === 'hi' ? 'कृपया पहले खरीद केंद्र चुनें' : 'Please Select a Procurement Centre'}
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto">
            {lang === 'hi'
              ? 'तारीख और सत्र चुनने के लिए पहले अपने नजदीकी सत्यापित खरीद केंद्र का चयन करें।'
              : 'Choose your nearby government-verified depot to view real-time capacities and book a slot.'}
          </p>
          <div className="pt-2">
            <Link
              href="/farmer/centres"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-[0.99]"
            >
              <span>{lang === 'hi' ? 'सत्यापित खरीद केंद्र खोजें' : 'Find Procurement Centre'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isFarmerVerified =
    Boolean(farmer?.isVerified) ||
    (farmerState as any) === 'VERIFIED' ||
    (registration?.status as any) === 'VERIFIED';

  if (!isFarmerVerified) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-[#151C2F] rounded-2xl border border-amber-500/40 p-6 sm:p-8 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-950/60 border border-amber-700/60 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-sm">
            <Lock className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-300 tracking-wider uppercase bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-700/60 inline-block">
              {lang === 'hi' ? 'सत्यापन आवश्यक — बुकिंग लॉक है' : 'Procurement Booking Locked'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] pt-2">
              {lang === 'hi' ? 'प्राधिकरण सत्यापन प्रतीक्षित' : 'Authorised Verification Required'}
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto leading-relaxed">
              {lang === 'hi'
                ? 'सरकारी खरीद नियमों के अनुसार, अनाज डिलीवरी स्लॉट बुक करने से पूर्व आपके किसान विवरण, भूमि घोषणा और बैंक खाते का अधिकृत खरीद अधिकारी द्वारा सत्यापन अनिवार्य है।'
                : 'Government grain procurement regulations mandate that your farmer profile, land holding declarations, and bank details must be verified and approved by the Authorised Procurement Authority before delivery appointments can be scheduled.'}
            </p>
          </div>

          <div className="bg-[#0B1020] rounded-2xl p-5 border border-[#334155] text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
              <span className="text-[#94A3B8] font-medium">Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/60 font-bold uppercase tracking-wider text-[11px]">
                {registration?.status || 'VERIFICATION_PENDING'}
              </span>
            </div>
            {registration?.registrationNumber && (
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] font-medium">Application ID</span>
                <span className="font-mono font-bold text-emerald-400">
                  {registration.registrationNumber}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8] font-medium">Farmer ID / Code</span>
              <span className="font-mono font-semibold text-[#CBD5E1]">
                {farmer?.farmerCode || 'ASTRA-PENDING'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/farmer/verification"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition active:scale-[0.99]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'hi' ? 'सत्यापन स्थिति देखें' : 'Check Verification Status'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/farmer/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-[#CBD5E1] rounded-xl text-xs sm:text-sm font-semibold border border-[#334155] transition"
            >
              <span>{lang === 'hi' ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading Skeleton
  if (loadingCentre) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#94A3B8] text-sm space-y-3">
        <div className="inline-block w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-[#CBD5E1]">
          {lang === 'hi' ? 'केंद्र विवरण और 7-दिवसीय क्षमता लोड हो रही है...' : 'Loading centre details and real-time 7-day capacity...'}
        </p>
      </div>
    );
  }

  const centre = centreDetails?.centre;
  const availability7Days: DayAvailability[] = generate7DaysStartingToday(
    centreDetails?.availability7Days || [],
    centre,
  );

  // Authoritative Centre Head Operational Daily Farmer Limit for that Centre & Day
  const centreHeadDailyLimit =
    Number(capacityInfo?.centreDailyLimitQuintals) ||
    Number(capacityInfo?.applicableDailyLimitQuintals) ||
    Number(centre?.centreDailyFarmerLimit) ||
    Number(centre?.maxQuantityPerBooking) ||
    50;

  // Selected Day Details
  const selectedDayObj = availability7Days.find((d) => d.date === bookingDate);
  const selectedDayFormatted = selectedDayObj ? formatDayCard(selectedDayObj.date, lang) : null;
  const selectedSessionData = selectedDayObj
    ? session === 'MORNING'
      ? selectedDayObj.morning
      : selectedDayObj.afternoon
    : null;
  const selectedCongestion = selectedSessionData
    ? getCongestionInfo(
        selectedSessionData.remainingCapacityQuintals,
        selectedSessionData.totalCapacityQuintals,
      )
    : null;

  const isProfileMissing =
    estimateError &&
    (estimateError.toLowerCase().includes('farmer profile') ||
      estimateError.toLowerCase().includes('profile not found'));

  const parsedQty = parseFloat(quantity) || 0;
  const qtyPercentage = Math.min(100, Math.round((parsedQty / centreHeadDailyLimit) * 100));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between">
        <Link
          href="/farmer/centres"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-emerald-400 transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'खरीद केंद्र सूची पर वापस जाएं' : 'Back to Verified Depots'}</span>
        </Link>
        <span className="text-xs text-[#64748B] font-mono hidden sm:inline">
          Astra Procurement • Kharif & Rabi 2026-27
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. CENTRE HERO CARD (CLEAN OFFICIAL GOV CARD)                             */}
      {/* ========================================================================= */}
      {centre && (
        <div className="bg-[#151C2F] rounded-2xl border border-[#334155] overflow-hidden shadow-xl">
          {/* Top Emerald Accent Bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          <div className="p-5 sm:p-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-emerald-950/60 text-emerald-300 rounded-full text-xs font-bold tracking-wide border border-emerald-700/60 flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'hi' ? 'सरकारी अधिकृत खरीद केंद्र' : 'Government Authorised Depot'}</span>
                </span>
                <span className="text-xs font-semibold text-[#94A3B8] bg-[#0B1020] border border-[#334155] px-2.5 py-0.5 rounded-full">
                  {lang === 'hi' ? 'कोड' : 'Code'}: <b className="text-[#F8FAFC] font-mono">{centre.centreCode}</b>
                </span>
              </div>

              {centre.agency && (
                <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-700/60 px-2.5 py-0.5 rounded-lg">
                  {centre.agency}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                {centre.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#94A3B8] mt-1.5 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {centre.address}, {centre.districtName}, {centre.stateName}
                </span>
              </p>
            </div>

            {/* Quick Metadata Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#334155] text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0B1020] border border-[#334155]">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[#94A3B8] text-[10px] block uppercase font-bold tracking-wider">
                    {lang === 'hi' ? 'कार्य दिवस व समय' : 'Depot Timings'}
                  </span>
                  <span className="font-semibold text-[#F8FAFC]">
                    {centre.operatingHoursStart || '08:00'} – {centre.operatingHoursEnd || '18:00'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0B1020] border border-[#334155]">
                <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[#94A3B8] text-[10px] block uppercase font-bold tracking-wider">
                    {lang === 'hi' ? 'केंद्र प्रमुख दैनिक सीमा' : 'Centre Head Daily Limit'}
                  </span>
                  <span className="font-semibold text-[#F8FAFC]">
                    {centreHeadDailyLimit} {lang === 'hi' ? 'क्विंटल' : 'Quintals'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0B1020] border border-[#334155]">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[#94A3B8] text-[10px] block uppercase font-bold tracking-wider">
                    {lang === 'hi' ? 'सहायता केंद्र' : 'Depot Desk'}
                  </span>
                  <span className="font-semibold text-[#F8FAFC] font-mono">
                    {centre.contactPhone || '1800-180-1551'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. UPCOMING 7-DAY CAPACITY CALENDAR WITH ENHANCED CARDS                   */}
      {/* ========================================================================= */}
      <div className="bg-[#151C2F] rounded-2xl border border-[#334155] p-5 sm:p-7 space-y-5 shadow-xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#334155] pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'hi' ? '7-दिवसीय रीयल-टाइम क्षमता कैलेंडर' : 'Live 7-Day Capacity Calendar'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
              {lang === 'hi' ? '1. खरीद तिथि और सत्र चुनें' : '1. Select Procurement Date & Session'}
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {lang === 'hi'
                ? 'खुले प्रातः या दोपहर स्लॉट पर क्लिक करके चुनें। कम भीड़ वाले स्लॉट में सीधी तौल सुनिश्चित होती है।'
                : 'Choose an open Morning or Afternoon slot. Low-traffic slots minimize waiting time at weighbridges.'}
            </p>
          </div>

          {/* Clean Integrated Congestion Legend */}
          <div className="inline-flex items-center flex-wrap gap-2.5 p-2 rounded-xl bg-[#0B1020] border border-[#334155] text-[11px] self-start md:self-auto">
            <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px] pl-1">
              {lang === 'hi' ? 'भीड़ स्तर' : 'Traffic'}:
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {lang === 'hi' ? 'कम भीड़' : 'Low Traffic'}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-700/60">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {lang === 'hi' ? 'मध्यम' : 'Moderate'}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-700/60">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {lang === 'hi' ? 'अधिक भीड़' : 'High'}
            </span>
          </div>
        </div>

        {/* 7-Day Calendar Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {availability7Days.map((day) => {
            const isOperating = day.isOperatingDay;
            const isMorningSelected = bookingDate === day.date && session === 'MORNING';
            const isAfternoonSelected = bookingDate === day.date && session === 'AFTERNOON';
            const hasSelectionInDay = isMorningSelected || isAfternoonSelected;

            const dateInfo = formatDayCard(day.date, lang);

            const morningCongestion = getCongestionInfo(
              day.morning.remainingCapacityQuintals,
              day.morning.totalCapacityQuintals,
            );
            const afternoonCongestion = getCongestionInfo(
              day.afternoon.remainingCapacityQuintals,
              day.afternoon.totalCapacityQuintals,
            );

            return (
              <div
                key={day.date}
                className={`rounded-2xl border transition-all duration-150 flex flex-col overflow-hidden ${
                  !isOperating
                    ? 'bg-[#0B1020]/60 border-[#334155]/60 opacity-60'
                    : hasSelectionInDay
                    ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                    : 'bg-[#0B1020] border-[#334155] hover:border-slate-500'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-3.5 py-2.5 flex items-center justify-between border-b ${
                    hasSelectionInDay
                      ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200'
                      : !isOperating
                      ? 'bg-[#0F172A] border-[#334155] text-[#64748B]'
                      : 'bg-[#0F172A] border-[#334155] text-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold font-mono text-[#F8FAFC]">
                      {dateInfo.dayNum}
                    </span>
                    <span className="text-xs font-bold uppercase text-[#CBD5E1]">
                      {dateInfo.monthShort}
                    </span>
                    <span className="text-xs text-[#94A3B8] font-medium">
                      ({dateInfo.dayShort})
                    </span>
                  </div>

                  {!isOperating ? (
                    <span className="px-2 py-0.5 bg-[#1E293B] text-[#94A3B8] text-[10px] font-bold rounded-md flex items-center gap-1 border border-[#334155]">
                      <Lock className="w-2.5 h-2.5" />
                      {lang === 'hi' ? 'अवकाश' : 'CLOSED'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {lang === 'hi' ? 'खुला है' : 'Open'}
                    </span>
                  )}
                </div>

                {/* Day Body & Slots */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  {!isOperating ? (
                    <div className="py-7 text-center space-y-1">
                      <Lock className="w-5 h-5 text-[#64748B] mx-auto" />
                      <div className="text-xs font-semibold text-[#94A3B8]">
                        {lang === 'hi' ? 'साप्ताहिक अवकाश' : 'Depot Closed'}
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        {lang === 'hi' ? 'इस दिन खरीद कार्य बंद रहता है' : 'No procurement scheduled'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Morning Slot Button */}
                      <button
                        type="button"
                        disabled={!day.morning.available || day.morning.remainingCapacityQuintals <= 0}
                        onClick={() => handleSelectSlot(day.date, 'MORNING')}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                          isMorningSelected
                            ? 'bg-emerald-700 border-emerald-600 text-white shadow-md'
                            : day.morning.available
                            ? 'bg-[#151C2F] hover:bg-[#1E293B] border-[#334155] text-[#F8FAFC]'
                            : 'bg-[#0B1020] border-[#334155]/60 text-[#64748B] cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Sun className={`w-3.5 h-3.5 ${isMorningSelected ? 'text-amber-200' : 'text-amber-400'}`} />
                            <span>{lang === 'hi' ? 'प्रातः' : 'Morning'}</span>
                          </div>
                          {isMorningSelected ? (
                            <span className="px-2 py-0.5 bg-emerald-800 text-emerald-100 text-[10px] font-bold rounded-md flex items-center gap-1 border border-emerald-600">
                              <Check className="w-3 h-3 stroke-[3]" />
                              {lang === 'hi' ? 'चयनित' : 'Selected'}
                            </span>
                          ) : (
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${morningCongestion.badgeClass}`}>
                              {lang === 'hi' ? morningCongestion.labelHi : morningCongestion.labelEn}
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t ${isMorningSelected ? 'border-emerald-600 text-emerald-100' : 'border-[#334155] text-[#94A3B8]'}`}>
                          <span>08:00 – 13:00</span>
                          <span className={`font-bold font-mono ${isMorningSelected ? 'text-white' : 'text-[#F8FAFC]'}`}>
                            {day.morning.remainingCapacityQuintals} q {lang === 'hi' ? 'शेष' : 'left'}
                          </span>
                        </div>
                      </button>

                      {/* Afternoon Slot Button */}
                      <button
                        type="button"
                        disabled={!day.afternoon.available || day.afternoon.remainingCapacityQuintals <= 0}
                        onClick={() => handleSelectSlot(day.date, 'AFTERNOON')}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                          isAfternoonSelected
                            ? 'bg-emerald-700 border-emerald-600 text-white shadow-md'
                            : day.afternoon.available
                            ? 'bg-[#151C2F] hover:bg-[#1E293B] border-[#334155] text-[#F8FAFC]'
                            : 'bg-[#0B1020] border-[#334155]/60 text-[#64748B] cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Sunset className={`w-3.5 h-3.5 ${isAfternoonSelected ? 'text-amber-200' : 'text-amber-400'}`} />
                            <span>{lang === 'hi' ? 'दोपहर' : 'Afternoon'}</span>
                          </div>
                          {isAfternoonSelected ? (
                            <span className="px-2 py-0.5 bg-emerald-800 text-emerald-100 text-[10px] font-bold rounded-md flex items-center gap-1 border border-emerald-600">
                              <Check className="w-3 h-3 stroke-[3]" />
                              {lang === 'hi' ? 'चयनित' : 'Selected'}
                            </span>
                          ) : (
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${afternoonCongestion.badgeClass}`}>
                              {lang === 'hi' ? afternoonCongestion.labelHi : afternoonCongestion.labelEn}
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t ${isAfternoonSelected ? 'border-emerald-600 text-emerald-100' : 'border-[#334155] text-[#94A3B8]'}`}>
                          <span>13:00 – 17:00</span>
                          <span className={`font-bold font-mono ${isAfternoonSelected ? 'text-white' : 'text-[#F8FAFC]'}`}>
                            {day.afternoon.remainingCapacityQuintals} q {lang === 'hi' ? 'शेष' : 'left'}
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE INLINE BOOKING FORM REVEAL                                  */}
      {/* ========================================================================= */}
      <div ref={formRef} className="bg-[#151C2F] rounded-2xl border border-[#334155] p-5 sm:p-7 space-y-6 shadow-xl">
        {submitError && (
          <div className="p-4 bg-rose-950/60 border border-rose-800/60 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-medium">{submitError}</span>
          </div>
        )}

        {/* Selected Slot Prominent Badge */}
        {slotSelected && selectedDayObj && selectedDayFormatted && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-700/60 text-[#F8FAFC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1020] border border-emerald-700/60 flex items-center justify-center font-bold text-amber-400 shrink-0 shadow-sm">
                {session === 'MORNING' ? <Sun className="w-6 h-6" /> : <Sunset className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">
                  {lang === 'hi' ? 'वर्तमान में चयनित खरीद स्लॉट' : 'SELECTED ARRIVAL SLOT'}
                </span>
                <div className="text-base sm:text-lg font-extrabold text-[#F8FAFC] mt-0.5">
                  {selectedDayFormatted.dayFull}, {selectedDayFormatted.dayNum} {selectedDayFormatted.monthFull} {selectedDayFormatted.year}
                </div>
                <div className="text-xs text-[#CBD5E1] font-medium">
                  {session === 'MORNING'
                    ? lang === 'hi'
                      ? 'प्रातः सत्र (08:00 AM – 01:00 PM)'
                      : 'Morning Session (08:00 AM – 01:00 PM)'
                    : lang === 'hi'
                      ? 'दोपहर सत्र (01:00 PM – 05:00 PM)'
                      : 'Afternoon Session (01:00 PM – 05:00 PM)'}
                </div>
              </div>
            </div>

            {selectedCongestion && (
              <div className="flex sm:flex-col sm:items-end gap-1.5 self-start sm:self-center">
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#0B1020] border border-[#334155] text-[#CBD5E1] flex items-center gap-1.5 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${selectedCongestion.dotColor}`}></span>
                  {lang === 'hi' ? selectedCongestion.labelHi : selectedCongestion.labelEn}
                </span>
                <span className="text-[10px] text-emerald-400 hidden sm:inline font-medium">
                  {lang === 'hi' ? 'त्वरित गेट क्लीयरेंस' : 'Fast Gate Clearance'}
                </span>
              </div>
            )}
          </div>
        )}

        {!slotSelected && (
          <div className="p-8 rounded-2xl bg-[#0B1020] border border-[#334155] text-center space-y-2">
            <Calendar className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-[#F8FAFC]">
              {lang === 'hi'
                ? '👆 कृपया ऊपर कैलेंडर में से एक उपलब्ध सत्र स्लॉट चुनें'
                : '👆 Please select an available slot from the calendar above'}
            </p>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              {lang === 'hi'
                ? 'स्लॉट चुनते ही मात्रा और वाहन विवरण प्रविष्ट करने का फॉर्म यहाँ खुल जाएगा।'
                : 'Selecting a slot reveals the produce quantity and vehicle details directly below.'}
            </p>
          </div>
        )}

        {/* Form Fields: Only active when slot is selected */}
        {slotSelected && (
          <div className="space-y-6 pt-1">
            {/* Step 2: Quantity Input with Presets & Quota Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <label className="block text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider">
                    {lang === 'hi' ? '2. अपेक्षित फसल मात्रा' : '2. Expected Produce Quantity'}
                  </label>
                  <span className="text-[11px] text-[#94A3B8]">
                    {lang === 'hi'
                      ? 'तौल और गेट आगमन विंडो आवंटित करने के लिए मात्रा दर्ज करें'
                      : 'Specify produce quantity to calculate unload duration and pacing'}
                  </span>
                </div>
                <span className="text-xs text-[#94A3B8] bg-[#0B1020] border border-[#334155] px-2.5 py-1 rounded-lg self-start sm:self-auto font-medium">
                  {lang === 'hi' ? 'केंद्र प्रमुख दैनिक सीमा' : 'Max Limit'}:{' '}
                  <b className="text-[#F8FAFC] font-bold">{centreHeadDailyLimit} {lang === 'hi' ? 'क्विंटल' : 'quintals'}</b>
                </span>
              </div>

              {/* Quick Preset Buttons (Intelligently fit Centre Head Limit) */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mr-1">
                  {lang === 'hi' ? 'त्वरित चयन:' : 'Quick Select:'}
                </span>
                {(centreHeadDailyLimit <= 50
                  ? [10, 20, 35, centreHeadDailyLimit]
                  : centreHeadDailyLimit <= 100
                  ? [20, 40, 70, centreHeadDailyLimit]
                  : [20, 50, 100, centreHeadDailyLimit]
                )
                  .filter((val, idx, arr) => val > 0 && arr.indexOf(val) === idx)
                  .map((presetVal) => (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => setQuantity(presetVal.toString())}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        quantity === presetVal.toString()
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-[#0B1020] hover:bg-[#1E293B] border-[#334155] text-[#CBD5E1]'
                      }`}
                    >
                      {presetVal} {lang === 'hi' ? 'क्विंटल' : 'Qtl'}
                    </button>
                  ))}
              </div>

              {/* Input Box */}
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={centreHeadDailyLimit}
                  step="0.5"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full text-lg font-bold rounded-xl border border-[#334155] bg-[#0B1020] py-3.5 pl-4 pr-36 text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono shadow-inner"
                />
                <div className="absolute right-3 top-2.5 px-2.5 py-1 rounded-lg bg-[#151C2F] border border-[#334155] text-xs font-extrabold text-[#CBD5E1] uppercase tracking-wider">
                  QUINTAL (क्विंटल)
                </div>
              </div>

              {/* Warning if input exceeds Centre Head limit */}
              {parsedQty > centreHeadDailyLimit && (
                <div className="text-[11px] text-rose-200 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    {lang === 'hi'
                      ? `दर्ज की गई मात्रा (${parsedQty} q) केंद्र प्रमुख द्वारा निर्धारित दैनिक सीमा (${centreHeadDailyLimit} q) से अधिक है।`
                      : `Entered quantity (${parsedQty} q) exceeds the Centre Head daily operational limit (${centreHeadDailyLimit} q) for this centre.`}
                  </span>
                </div>
              )}

              {/* Notice if farmer already booked quantity on this date */}
              {capacityInfo?.bookedTodayQuintals > 0 && (
                <div className="text-[11px] text-amber-200 bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {lang === 'hi'
                      ? `आप इस तारीख पर पहले ही ${capacityInfo.bookedTodayQuintals} क्विंटल बुक कर चुके हैं (शेष स्वीकार्य: ${capacityInfo.remainingCapacityQuintals} q)।`
                      : `You have already booked ${capacityInfo.bookedTodayQuintals} q on this date (Remaining permissible: ${capacityInfo.remainingCapacityQuintals} q).`}
                  </span>
                </div>
              )}

              {/* Visual Quota Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-medium">
                  <span>
                    {lang === 'hi' ? 'दैनिक कोटा उपयोग' : 'Booking Quota Usage'}:{' '}
                    <b className="text-[#F8FAFC]">{parsedQty} / {centreHeadDailyLimit} Qtl</b>
                  </span>
                  <span className={parsedQty > centreHeadDailyLimit ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {qtyPercentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#0B1020] rounded-full overflow-hidden border border-[#334155]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      parsedQty > centreHeadDailyLimit ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, qtyPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Transport & Vehicle Details (Optional) */}
            <div className="space-y-3 pt-3 border-t border-[#334155]">
              <div>
                <label className="block text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider">
                  {lang === 'hi' ? '3. परिवहन एवं वाहन विवरण (वैकल्पिक)' : '3. Transport & Vehicle Details (Optional)'}
                </label>
                <span className="text-[11px] text-[#94A3B8]">
                  {lang === 'hi'
                    ? 'गेट और यार्ड में वाहन पार्किंग तथा प्रवेश व्यवस्था के लिए'
                    : 'Helps the depot team coordinate gate entry and yard unloading'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    {lang === 'hi' ? 'वाहन का प्रकार' : 'Vehicle Type'}
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#334155] py-2.5 px-3 bg-[#0B1020] text-[#F8FAFC] focus:outline-none focus:border-emerald-500 font-medium shadow-inner"
                  >
                    <option value="Tractor Trolley" className="bg-[#0F172A] text-[#F8FAFC]">Tractor Trolley (ट्रैक्टर ट्रॉली)</option>
                    <option value="Mini Truck / Pick-up" className="bg-[#0F172A] text-[#F8FAFC]">Mini Truck / Pick-up (छोटा हाथी/पिकअप)</option>
                    <option value="Commercial Lorry" className="bg-[#0F172A] text-[#F8FAFC]">Commercial Lorry (ट्रक/लॉरी)</option>
                    <option value="Animal Cart / Traditional" className="bg-[#0F172A] text-[#F8FAFC]">Animal Cart / Traditional (बैलगाड़ी/अन्य)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    {lang === 'hi' ? 'वाहन संख्या' : 'Vehicle Registration No.'}
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. BR-06-GA-1234"
                    className="w-full text-xs rounded-xl border border-[#334155] bg-[#0B1020] py-2.5 px-3 text-[#F8FAFC] placeholder-[#64748B] uppercase font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    {lang === 'hi' ? 'चालक / सहयोगी का नाम' : 'Driver / Transporter'}
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Driver Name"
                    className="w-full text-xs rounded-xl border border-[#334155] bg-[#0B1020] py-2.5 px-3 text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Real-Time Arrival Window & Prediction Card */}
            {(() => {
              const bookedRatio =
                selectedSessionData && selectedSessionData.totalCapacityQuintals > 0
                  ? Math.max(
                      0,
                      (selectedSessionData.totalCapacityQuintals - selectedSessionData.remainingCapacityQuintals) /
                        selectedSessionData.totalCapacityQuintals,
                    )
                  : 0;

              const realisticWindow = calculateRealisticWindow(session, bookedRatio);

              const assignedWindowStart =
                estimate?.assignedWindowStart && estimate.assignedWindowStart !== '00:00'
                  ? estimate.assignedWindowStart
                  : realisticWindow.start;

              const assignedWindowEnd =
                estimate?.assignedWindowEnd && estimate.assignedWindowEnd !== '00:00'
                  ? estimate.assignedWindowEnd
                  : realisticWindow.end;

              const expectedDurationMinutes =
                estimate?.expectedDurationMinutes && estimate.expectedDurationMinutes > 0
                  ? estimate.expectedDurationMinutes
                  : calculateRealisticDuration(parsedQty);

              const isSessionFull = selectedSessionData && selectedSessionData.remainingCapacityQuintals <= 0;
              const isExceedingCapacity =
                selectedSessionData && parsedQty > selectedSessionData.remainingCapacityQuintals;
              const isExceedingDailyLimit = parsedQty > centreHeadDailyLimit;

              return (
                <div className="p-5 rounded-2xl border border-[#334155] bg-[#0B1020] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'hi' ? 'Astra स्वचालित आगमन विंडो एवं समय अनुमान' : 'Astra Smart Arrival Window'}</span>
                    </span>
                    {estimating && (
                      <span className="text-[11px] text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        {lang === 'hi' ? 'सत्र क्षमता गणना जारी...' : 'Evaluating capacity...'}
                      </span>
                    )}
                  </div>

                  {/* Helpful Farmer Profile Prompt if missing */}
                  {isProfileMissing ? (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-left space-y-3">
                      <div className="flex items-start gap-3">
                        <UserCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-amber-300">
                            {lang === 'hi' ? 'किसान प्रोफ़ाइल पंजीकरण आवश्यक है' : 'Farmer Registration Required'}
                          </div>
                          <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                            {lang === 'hi'
                              ? 'सरकारी खरीद आगमन टोकन सुरक्षित करने के लिए आपके खाते में किसान प्रोफ़ाइल और भूमि रिकॉर्ड का सत्यापन आवश्यक है।'
                              : 'To reserve an official procurement arrival window and generate your gate token, your farmer profile must be linked to this account.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-3">
                        <Link
                          href="/farmer/register"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                        >
                          <span>{lang === 'hi' ? 'किसान पंजीकरण पूर्ण करें' : 'Complete Farmer Registration'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-[11px] text-amber-300 font-medium">
                          {lang === 'hi' ? 'MSP पात्रता और प्रत्यक्ष बैंक हस्तांतरण (DBT) सुरक्षित करता है' : 'Ensures direct DBT bank payment and MSP entitlement'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isSessionFull ? (
                        <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            {lang === 'hi'
                              ? 'इस सत्र की कुल क्षमता पूर्ण हो चुकी है। कृपया दोपहर सत्र या अन्य तारीख चुनें।'
                              : 'This physical session is fully booked. Please select an alternate session or date.'}
                          </span>
                        </div>
                      ) : isExceedingCapacity ? (
                        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            {lang === 'hi'
                              ? `अपेक्षित मात्रा (${parsedQty} q) सत्र में उपलब्ध शेष क्षमता (${selectedSessionData?.remainingCapacityQuintals} q) से अधिक है।`
                              : `Requested quantity (${parsedQty} q) exceeds remaining session capacity (${selectedSessionData?.remainingCapacityQuintals} q).`}
                          </span>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#151C2F] rounded-xl border border-[#334155] shadow-sm">
                        <div>
                          <div className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">
                            {lang === 'hi' ? 'आवंटित 15-मिनट आगमन विंडो' : 'Allocated 15-Min Gate Window'}
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-0.5">
                            {assignedWindowStart} – {assignedWindowEnd}
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">
                            {lang === 'hi' ? 'इस समय पर गेट पर रिपोर्ट करें' : 'Report at procurement gate within this window'}
                          </div>
                        </div>

                        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#334155]">
                          <div className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">
                            {lang === 'hi' ? 'अनुमानित प्रक्रिया अवधि' : 'Estimated Depot Duration'}
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-[#F8FAFC] mt-0.5">
                            ~{expectedDurationMinutes} {lang === 'hi' ? 'मिनट' : 'Minutes'}
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">
                            {lang === 'hi' ? 'गेट इन → तौल → नमूना जांच → गेट आउट' : 'Gate In → Weighbridge → Quality → Gate Out'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#94A3B8] px-1 pt-1">
                        <span>
                          {lang === 'hi' ? 'सत्र में शेष क्षमता' : 'Remaining Session Capacity'}:{' '}
                          <b className="text-[#F8FAFC] font-bold">
                            {estimate?.remainingSessionCapacityQuintals !== undefined &&
                            estimate.remainingSessionCapacityQuintals !== null &&
                            estimate.isFeasible
                              ? estimate.remainingSessionCapacityQuintals
                              : selectedSessionData
                              ? Math.max(0, selectedSessionData.remainingCapacityQuintals)
                              : 0}{' '}
                            q
                          </b>
                        </span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {lang === 'hi' ? 'काउण्टर पेसिंग द्वारा सत्यापित' : 'Pacing constraints verified'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Step 5: Final Confirmation Action */}
            <div className="pt-3 border-t border-[#334155] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-[#94A3B8] max-w-sm">
                {lang === 'hi'
                  ? 'पुष्टि करने पर आपका आगमन समय सीधे खरीद केंद्र के गेट डेस्क के साथ सुरक्षित हो जाएगा और डिजिटल पास जारी होगा।'
                  : 'By confirming, you reserve this physical arrival window under government procurement rules. Instant digital pass will be issued.'}
              </div>

              <button
                type="button"
                disabled={
                  parsedQty <= 0 ||
                  parsedQty > centreHeadDailyLimit ||
                  (selectedSessionData && parsedQty > selectedSessionData.remainingCapacityQuintals) ||
                  submitting
                }
                onClick={handleConfirmBooking}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 disabled:from-[#1E293B] disabled:to-[#1E293B] disabled:text-[#64748B] disabled:border disabled:border-[#334155] disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {submitting
                    ? lang === 'hi'
                      ? 'टोकन सुरक्षित हो रहा है...'
                      : 'Reserving Slot...'
                    : lang === 'hi'
                      ? 'खरीद यात्रा स्लॉट सुरक्षित करें'
                      : 'Confirm Procurement Visit'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FarmerBookingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#94A3B8] font-semibold text-sm">
          Loading Booking Window...
        </div>
      }
    >
      <FarmerBookingContent />
    </React.Suspense>
  );
}
