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
  
  // Create a Date object safely locked to noon to avoid boundary shifts when doing date math
  const baseDate = new Date(ty, tm - 1, td, 12, 0, 0);

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
  const isSubmittingRef = useRef<boolean>(false);
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
        console.error('Failed to load centre:', err instanceof Error ? err.message : err);
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
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    setSubmitting(true);
    setSubmitError(null);

    // Date.now() ensures unique key; isSubmittingRef prevents double-clicks from firing twice
    const idempotencyKey = `ASTRA-IDEMP-${user?.id}-${centreId}-${bookingDate}-${session}-${Date.now()}`;

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
      isSubmittingRef.current = false;
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
      <div className="w-full min-w-0 max-w-2xl mx-auto px-4 py-8 space-y-6">
        <DigitalBookingPass booking={passData} lang={lang} />
      </div>
    );
  }

  // 2. NO CENTRE SELECTED FALLBACK
  if (!centreId) {
    return (
      <div className="w-full min-w-0 max-w-xl mx-auto px-4 py-16 text-center space-y-4">
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
      <div className="w-full min-w-0 max-w-2xl mx-auto px-4 py-12 space-y-6">
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
      <div className="w-full min-w-0 max-w-4xl mx-auto px-4 py-16 text-center text-[#94A3B8] text-sm space-y-3">
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
    <div className="min-h-screen bg-transparent font-sans pb-12">
      <div className="w-full mx-auto max-w-[1200px] px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* ========================================================================= */}
      {/* 1. CENTRE HERO CARD (CLEAN OFFICIAL GOV CARD)                             */}
      {/* ========================================================================= */}
      {centre && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-[11px] sm:text-xs font-bold tracking-wide border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'hi' ? 'सरकारी अधिकृत खरीद केंद्र' : 'Government Authorised Depot'}</span>
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                  {lang === 'hi' ? 'कोड' : 'Code'}: <b className="text-slate-900 font-mono ml-0.5">{centre.centreCode}</b>
                </span>
              </div>

              {centre.agency && (
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {centre.agency}
                </span>
              )}
            </div>

            <div className="pt-1 pb-2">
              <h1 className="text-3xl sm:text-[36px] lg:text-[40px] leading-tight font-extrabold text-slate-900 tracking-tight">
                {centre.name}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-medium mt-3 flex items-start gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {centre.address}, {centre.districtName}, {centre.stateName}
                </span>
              </p>
            </div>

            {/* Quick Metadata Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-sm transition-colors hover:bg-slate-50">
                <Clock className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-bold tracking-wider mb-1">
                    {lang === 'hi' ? 'कार्य दिवस व समय' : 'Depot Timings'}
                  </span>
                  <span className="font-bold text-slate-900 text-base">
                    {centre.operatingHoursStart || '08:00'} – {centre.operatingHoursEnd || '18:00'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-sm transition-colors hover:bg-slate-50">
                <Package className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-bold tracking-wider mb-1">
                    {lang === 'hi' ? 'केंद्र प्रमुख दैनिक सीमा' : 'Daily Limit'}
                  </span>
                  <span className="font-bold text-slate-900 text-base">
                    {centreHeadDailyLimit} {lang === 'hi' ? 'क्विंटल' : 'Quintals'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-sm transition-colors hover:bg-slate-50">
                <Phone className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-bold tracking-wider mb-1">
                    {lang === 'hi' ? 'सहायता केंद्र' : 'Depot Desk'}
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-base">
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1.5">
              <CalendarDays className="w-4 h-4" />
              <span>{lang === 'hi' ? '7-दिवसीय रीयल-टाइम क्षमता कैलेंडर' : 'Live 7-Day Capacity Calendar'}</span>
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-bold text-slate-900">
              {lang === 'hi' ? '1. खरीद तिथि और सत्र चुनें' : '1. Select Procurement Date & Session'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {lang === 'hi'
                ? 'खुले प्रातः या दोपहर स्लॉट पर क्लिक करके चुनें। कम भीड़ वाले स्लॉट में सीधी तौल सुनिश्चित होती है।'
                : 'Choose an open Morning or Afternoon slot. Low-traffic slots minimize waiting time at weighbridges.'}
            </p>
          </div>

          {/* Clean Integrated Congestion Legend */}
          <div className="inline-flex items-center flex-wrap gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] self-start md:self-auto">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] pl-1">
              {lang === 'hi' ? 'भीड़ स्तर' : 'Traffic'}:
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {lang === 'hi' ? 'कम भीड़' : 'Low Traffic'}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-full border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {lang === 'hi' ? 'मध्यम' : 'Moderate'}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-100/50 px-2.5 py-1 rounded-full border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {lang === 'hi' ? 'अधिक भीड़' : 'High'}
            </span>
          </div>
        </div>

        {/* 7-Day Calendar Deck */}
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100">
          {availability7Days.map((day) => {
            const isOperating = day.isOperatingDay;
            const isMorningSelected = bookingDate === day.date && session === 'MORNING';
            const isAfternoonSelected = bookingDate === day.date && session === 'AFTERNOON';
            const hasSelectionInDay = isMorningSelected || isAfternoonSelected;

            const dateInfo = formatDayCard(day.date, lang);

            const getLightCongestionClass = (level: string) => {
              if (level === 'low') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (level === 'moderate') return 'bg-amber-50 text-amber-700 border-amber-200';
              return 'bg-rose-50 text-rose-700 border-rose-200';
            };

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
                className={`flex-none w-[85%] min-w-[260px] sm:w-[270px] lg:w-[285px] shrink-0 snap-start rounded-xl border transition-all duration-150 flex flex-col overflow-hidden ${
                  !isOperating
                    ? 'bg-slate-50/50 border-slate-200 opacity-70'
                    : hasSelectionInDay
                    ? 'bg-white border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-4 py-3 flex items-center justify-between border-b ${
                    hasSelectionInDay
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : !isOperating
                      ? 'bg-slate-100/50 border-slate-200 text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono">
                      {dateInfo.dayNum}
                    </span>
                    <span className="text-sm font-bold uppercase">
                      {dateInfo.monthShort}
                    </span>
                    <span className="text-xs font-medium opacity-80">
                      ({dateInfo.dayShort})
                    </span>
                  </div>

                  {!isOperating ? (
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {lang === 'hi' ? 'अवकाश' : 'CLOSED'}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {lang === 'hi' ? 'खुला है' : 'Open'}
                    </span>
                  )}
                </div>

                {/* Day Body & Slots */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  {!isOperating ? (
                    <div className="py-8 text-center space-y-2">
                      <Lock className="w-6 h-6 text-slate-300 mx-auto" />
                      <div className="text-sm font-semibold text-slate-500">
                        {lang === 'hi' ? 'साप्ताहिक अवकाश' : 'Depot Closed'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Morning Slot Button */}
                      <button
                        type="button"
                        disabled={!day.morning.available || day.morning.remainingCapacityQuintals <= 0}
                        onClick={() => handleSelectSlot(day.date, 'MORNING')}
                        className={`w-full p-3.5 rounded-lg border text-left transition-all ${
                          isMorningSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : day.morning.available
                            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <Sun className={`w-4 h-4 ${isMorningSelected ? 'text-amber-300' : 'text-amber-500'}`} />
                            <span>{lang === 'hi' ? 'प्रातः' : 'Morning'}</span>
                          </div>
                          {isMorningSelected ? (
                            <span className="px-2 py-1 bg-emerald-700 text-white text-[10px] font-bold rounded flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                              {lang === 'hi' ? 'चयनित' : 'Selected'}
                            </span>
                          ) : (
                            <span className={`px-2 py-1 text-[10px] font-bold rounded border ${getLightCongestionClass(morningCongestion.level)}`}>
                              {lang === 'hi' ? morningCongestion.labelHi : morningCongestion.labelEn}
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center justify-between text-xs pt-2 mt-1.5 border-t ${isMorningSelected ? 'border-emerald-500/50 text-emerald-100' : 'border-slate-100 text-slate-500'}`}>
                          <span className="font-medium">08:00 – 13:00</span>
                          <span className={`font-semibold font-mono ${isMorningSelected ? 'text-white' : 'text-slate-800'}`}>
                            {day.morning.remainingCapacityQuintals} q {lang === 'hi' ? 'शेष' : 'left'}
                          </span>
                        </div>
                      </button>

                      {/* Afternoon Slot Button */}
                      <button
                        type="button"
                        disabled={!day.afternoon.available || day.afternoon.remainingCapacityQuintals <= 0}
                        onClick={() => handleSelectSlot(day.date, 'AFTERNOON')}
                        className={`w-full p-3.5 rounded-lg border text-left transition-all ${
                          isAfternoonSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : day.afternoon.available
                            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <Sunset className={`w-4 h-4 ${isAfternoonSelected ? 'text-amber-300' : 'text-amber-500'}`} />
                            <span>{lang === 'hi' ? 'दोपहर' : 'Afternoon'}</span>
                          </div>
                          {isAfternoonSelected ? (
                            <span className="px-2 py-1 bg-emerald-700 text-white text-[10px] font-bold rounded flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                              {lang === 'hi' ? 'चयनित' : 'Selected'}
                            </span>
                          ) : (
                            <span className={`px-2 py-1 text-[10px] font-bold rounded border ${getLightCongestionClass(afternoonCongestion.level)}`}>
                              {lang === 'hi' ? afternoonCongestion.labelHi : afternoonCongestion.labelEn}
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center justify-between text-xs pt-2 mt-1.5 border-t ${isAfternoonSelected ? 'border-emerald-500/50 text-emerald-100' : 'border-slate-100 text-slate-500'}`}>
                          <span className="font-medium">13:00 – 17:00</span>
                          <span className={`font-semibold font-mono ${isAfternoonSelected ? 'text-white' : 'text-slate-800'}`}>
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
      <div ref={formRef} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-sm">
        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <span className="font-medium">{submitError}</span>
          </div>
        )}

        {/* Selected Slot Prominent Badge */}
        {slotSelected && selectedDayObj && selectedDayFormatted && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white border border-emerald-200 flex items-center justify-center font-bold text-amber-500 shrink-0 shadow-sm">
                {session === 'MORNING' ? <Sun className="w-7 h-7" /> : <Sunset className="w-7 h-7" />}
              </div>
              <div>
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider block mb-1">
                  {lang === 'hi' ? 'वर्तमान में चयनित खरीद स्लॉट' : 'SELECTED ARRIVAL SLOT'}
                </span>
                <div className="text-lg sm:text-[22px] font-bold text-slate-900 mt-0.5 leading-tight">
                  {selectedDayFormatted.dayFull}, {selectedDayFormatted.dayNum} {selectedDayFormatted.monthFull} {selectedDayFormatted.year}
                </div>
                <div className="text-sm text-slate-600 font-medium mt-1">
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
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1.5 self-start sm:self-center mt-2 sm:mt-0">
                <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-white border border-slate-200 text-slate-700 flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                  <span className={`w-2 h-2 rounded-full ${selectedCongestion.level === 'low' ? 'bg-emerald-500' : selectedCongestion.level === 'moderate' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                  {lang === 'hi' ? selectedCongestion.labelHi : selectedCongestion.labelEn}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {lang === 'hi' ? 'त्वरित गेट क्लीयरेंस' : 'Fast Gate Clearance'}
                </span>
              </div>
            )}
          </div>
        )}

        {!slotSelected && (
          <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <Calendar className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-base font-bold text-slate-900">
              {lang === 'hi'
                ? '👆 कृपया ऊपर कैलेंडर में से एक उपलब्ध सत्र स्लॉट चुनें'
                : '👆 Please select an available slot from the calendar above'}
            </p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {lang === 'hi'
                ? 'स्लॉट चुनते ही मात्रा और वाहन विवरण प्रविष्ट करने का फॉर्म यहाँ खुल जाएगा।'
                : 'Selecting a slot reveals the produce quantity and vehicle details directly below.'}
            </p>
          </div>
        )}

        {/* Form Fields: Only active when slot is selected */}
        {slotSelected && (
          <div className="space-y-8 pt-2">
            {/* Step 2: Quantity Input with Presets & Quota Bar */}
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {lang === 'hi' ? '2. अपेक्षित फसल मात्रा' : '2. Expected Produce Quantity'}
                  </h3>
                  <span className="text-sm text-slate-500 block mt-1">
                    {lang === 'hi'
                      ? 'तौल और गेट आगमन विंडो आवंटित करने के लिए मात्रा दर्ज करें'
                      : 'Specify produce quantity to calculate unload duration and pacing'}
                  </span>
                </div>
                <span className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium self-start sm:self-auto">
                  {lang === 'hi' ? 'केंद्र प्रमुख दैनिक सीमा' : 'Max Limit'}:{' '}
                  <b className="text-slate-900 font-bold">{centreHeadDailyLimit} {lang === 'hi' ? 'क्विंटल' : 'quintals'}</b>
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
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
                      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                        quantity === presetVal.toString()
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      {presetVal} {lang === 'hi' ? 'क्विंटल' : 'Qtl'}
                    </button>
                  ))}
              </div>

              {/* Input Box */}
              <div className="relative w-full">
                <input
                  type="number"
                  min="1"
                  max={centreHeadDailyLimit}
                  step="0.5"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full text-xl font-bold rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-36 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono shadow-sm transition-all"
                />
                <div className="absolute right-2.5 top-2.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  QUINTAL
                </div>
              </div>

              {/* Warning if input exceeds Centre Head limit */}
              {parsedQty > centreHeadDailyLimit && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>
                    {lang === 'hi'
                      ? `दर्ज की गई मात्रा (${parsedQty} q) केंद्र प्रमुख द्वारा निर्धारित दैनिक सीमा (${centreHeadDailyLimit} q) से अधिक है।`
                      : `Entered quantity (${parsedQty} q) exceeds the Centre Head daily operational limit (${centreHeadDailyLimit} q) for this centre.`}
                  </span>
                </div>
              )}

              {/* Notice if farmer already booked quantity on this date */}
              {capacityInfo?.bookedTodayQuintals > 0 && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
                  <Info className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {lang === 'hi'
                      ? `आप इस तारीख पर पहले ही ${capacityInfo.bookedTodayQuintals} क्विंटल बुक कर चुके हैं (शेष स्वीकार्य: ${capacityInfo.remainingCapacityQuintals} q)।`
                      : `You have already booked ${capacityInfo.bookedTodayQuintals} q on this date (Remaining permissible: ${capacityInfo.remainingCapacityQuintals} q).`}
                  </span>
                </div>
              )}

              {/* Visual Quota Progress Bar */}
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <span>
                    {lang === 'hi' ? 'दैनिक कोटा उपयोग' : 'Quota Usage'}:{' '}
                    <b className="text-slate-700">{parsedQty} / {centreHeadDailyLimit} Qtl</b>
                  </span>
                  <span className={parsedQty > centreHeadDailyLimit ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {qtyPercentage}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      parsedQty > centreHeadDailyLimit ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, qtyPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Transport & Vehicle Details (Optional) */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'hi' ? '3. परिवहन एवं वाहन विवरण (वैकल्पिक)' : '3. Transport & Vehicle Details (Optional)'}
                </h3>
                <span className="text-sm text-slate-500 mt-1 block">
                  {lang === 'hi'
                    ? 'गेट और यार्ड में वाहन पार्किंग तथा प्रवेश व्यवस्था के लिए'
                    : 'Helps the depot team coordinate gate entry and yard unloading'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {lang === 'hi' ? 'वाहन का प्रकार' : 'Vehicle Type'}
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 py-3 px-3.5 bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                  >
                    <option value="Tractor Trolley">Tractor Trolley (ट्रैक्टर ट्रॉली)</option>
                    <option value="Mini Truck / Pick-up">Mini Truck / Pick-up (छोटा हाथी/पिकअप)</option>
                    <option value="Commercial Lorry">Commercial Lorry (ट्रक/लॉरी)</option>
                    <option value="Animal Cart / Traditional">Animal Cart / Traditional (बैलगाड़ी/अन्य)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {lang === 'hi' ? 'वाहन संख्या' : 'Vehicle Registration No.'}
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. BR-06-GA-1234"
                    className="w-full text-sm rounded-xl border border-slate-300 bg-white py-3 px-3.5 text-slate-900 placeholder-slate-400 uppercase font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {lang === 'hi' ? 'चालक / सहयोगी का नाम' : 'Driver / Transporter'}
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Driver Name"
                    className="w-full text-sm rounded-xl border border-slate-300 bg-white py-3 px-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
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
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <span>{lang === 'hi' ? 'Astra स्वचालित आगमन विंडो एवं समय अनुमान' : 'Astra Smart Arrival Window'}</span>
                    </span>
                    {estimating && (
                      <span className="text-xs text-emerald-600 font-bold animate-pulse flex items-center gap-1.5 bg-emerald-100 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        {lang === 'hi' ? 'सत्र क्षमता गणना जारी...' : 'Evaluating capacity...'}
                      </span>
                    )}
                  </div>

                  {/* Helpful Farmer Profile Prompt if missing */}
                  {isProfileMissing ? (
                    <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        <UserCheck className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-bold text-amber-900">
                            {lang === 'hi' ? 'किसान प्रोफ़ाइल पंजीकरण आवश्यक है' : 'Farmer Registration Required'}
                          </div>
                          <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                            {lang === 'hi'
                              ? 'सरकारी खरीद आगमन टोकन सुरक्षित करने के लिए आपके खाते में किसान प्रोफ़ाइल और भूमि रिकॉर्ड का सत्यापन आवश्यक है।'
                              : 'To reserve an official procurement arrival window and generate your gate token, your farmer profile must be linked to this account.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-4">
                        <Link
                          href="/farmer/register"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
                        >
                          <span>{lang === 'hi' ? 'किसान पंजीकरण पूर्ण करें' : 'Complete Farmer Registration'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <span className="text-xs text-amber-700 font-semibold">
                          {lang === 'hi' ? 'MSP पात्रता और प्रत्यक्ष बैंक हस्तांतरण (DBT) सुरक्षित करता है' : 'Ensures direct DBT bank payment and MSP entitlement'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isSessionFull ? (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium flex items-center gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          <span>
                            {lang === 'hi'
                              ? 'इस सत्र की कुल क्षमता पूर्ण हो चुकी है। कृपया दोपहर सत्र या अन्य तारीख चुनें।'
                              : 'This physical session is fully booked. Please select an alternate session or date.'}
                          </span>
                        </div>
                      ) : isExceedingCapacity ? (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2.5">
                          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          <span>
                            {lang === 'hi'
                              ? `अपेक्षित मात्रा (${parsedQty} q) सत्र में उपलब्ध शेष क्षमता (${selectedSessionData?.remainingCapacityQuintals} q) से अधिक है।`
                              : `Requested quantity (${parsedQty} q) exceeds remaining session capacity (${selectedSessionData?.remainingCapacityQuintals} q).`}
                          </span>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                            {lang === 'hi' ? 'आवंटित 15-मिनट आगमन विंडो' : 'Allocated 15-Min Gate Window'}
                          </div>
                          <div className="text-[28px] sm:text-[32px] font-black text-emerald-600 font-mono leading-none">
                            {assignedWindowStart} – {assignedWindowEnd}
                          </div>
                          <div className="text-xs text-slate-500 mt-2 font-medium">
                            {lang === 'hi' ? 'इस समय पर गेट पर रिपोर्ट करें' : 'Report at procurement gate within this window'}
                          </div>
                        </div>

                        <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                            {lang === 'hi' ? 'अनुमानित प्रक्रिया अवधि' : 'Estimated Depot Duration'}
                          </div>
                          <div className="text-2xl sm:text-[28px] font-black text-slate-900 leading-none">
                            ~{expectedDurationMinutes} {lang === 'hi' ? 'मिनट' : 'Minutes'}
                          </div>
                          <div className="text-xs text-slate-500 mt-2 font-medium">
                            {lang === 'hi' ? 'गेट इन → तौल → नमूना जांच → गेट आउट' : 'Gate In → Weighbridge → Quality → Gate Out'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 pt-1 font-medium">
                        <span>
                          {lang === 'hi' ? 'सत्र में शेष क्षमता' : 'Remaining Session Capacity'}:{' '}
                          <b className="text-slate-900 font-bold text-sm">
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
                        <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          {lang === 'hi' ? 'काउण्टर पेसिंग द्वारा सत्यापित' : 'Pacing constraints verified'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Step 5: Final Confirmation Action */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-slate-600 max-w-md font-medium leading-relaxed">
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-base font-bold shadow-md transition-all active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {submitting
                    ? lang === 'hi'
                      ? 'टोकन सुरक्षित हो रहा है...'
                      : 'Reserving Slot...'
                    : lang === 'hi'
                      ? 'खरीद यात्रा स्लॉट सुरक्षित करें'
                      : 'Confirm Procurement Visit'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default function FarmerBookingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-w-0 max-w-4xl mx-auto px-4 py-16 text-center text-[#94A3B8] font-semibold text-sm">
          Loading Booking Window...
        </div>
      }
    >
      <FarmerBookingContent />
    </React.Suspense>
  );
}
