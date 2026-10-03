'use client';

import React from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  Building2,
  Package,
  Truck,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface BookingPassData {
  id?: string;
  bookingNumber: string;
  centreName: string;
  centreAddress: string;
  centreCode?: string;
  bookingDate: string;
  session: 'MORNING' | 'AFTERNOON' | string;
  windowStartTime: string;
  windowEndTime: string;
  expectedQuantityQuintals: number;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  farmerName?: string | null;
  farmerCode?: string | null;
  status?: string;
}

interface Props {
  booking: BookingPassData;
  lang?: 'en' | 'hi';
  onClose?: () => void;
  showVisitLink?: boolean;
}

export function DigitalBookingPass({
  booking,
  lang = 'en',
  onClose,
  showVisitLink = true,
}: Props) {
  // Secure QR Token encoding strictly the booking reference
  const qrValue = `ASTRA-BK-TOKEN:${booking.bookingNumber}`;

  const handlePrint = () => {
    window.print();
  };

  const isHindi = lang === 'hi';

  return (
    <div className="w-full">
      {/* ============================================================ */}
      {/* 1. SCREEN VIEW (CLEAN OFFICIAL GOV SLIP - HIDDEN ON PRINT)   */}
      {/* ============================================================ */}
      <div className="relative print:hidden bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xl shadow-slate-200/50 space-y-4 text-center text-slate-900 max-w-2xl mx-auto">
        
        {/* Status Icon */}
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-md shadow-emerald-200">
          <CheckCircle2 className="w-5 h-5" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase bg-emerald-50 px-3 py-0.5 rounded-full inline-block">
            {isHindi ? 'खरीद स्लॉट आरक्षित' : 'Procurement Visit Confirmed'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {isHindi ? 'बुकिंग कन्फर्म' : 'Booking Confirmed'}
          </h1>
          <p className="text-xs text-slate-600 max-w-[400px] mx-auto leading-relaxed">
            {isHindi
              ? 'आपका आगमन समय निर्धारित है। डिपो गेट पर चेक-इन के लिए यह क्यूआर कोड प्रस्तुत करें।'
              : 'Your arrival window is reserved. Please present this QR code or booking reference at the depot gate.'}
          </p>
        </div>

        {/* Prominent QR Code Presentation Card */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 sm:p-4 max-w-[360px] mx-auto shadow-sm space-y-2">
          <div className="bg-white p-3 rounded-xl inline-block shadow-sm mx-auto border border-slate-200">
            <QRCodeSVG
              value={qrValue}
              size={120}
              level="H"
              includeMargin={true}
              aria-label={`Booking QR Code for ${booking.bookingNumber}`}
            />
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHindi ? 'गेट पर स्कैन करें' : 'Scan at the centre gate'}</span>
            </div>
            <div className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-wider">
              {booking.bookingNumber}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {isHindi
                ? 'यह सुरक्षित क्यूआर आपकी खरीद बुकिंग से प्रमाणित है।'
                : 'This QR is securely linked to your procurement booking.'}
            </p>
          </div>
        </div>

        {/* Safe Operational Details Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 text-left space-y-3 shadow-sm">
          {/* Top Row: Booking Reference and Confirmed Pill */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                {isHindi ? 'बुकिंग संदर्भ' : 'Booking Reference'}
              </span>
              <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                {booking.bookingNumber}
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full font-mono uppercase">
              {isHindi ? 'पुष्टीकृत' : 'CONFIRMED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500 flex items-center gap-1.5 text-[11px] font-semibold">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isHindi ? 'खरीद केंद्र' : 'Procurement Centre'}</span>
              </span>
              <div className="font-bold text-slate-900 mt-1 text-xs">
                {booking.centreName}
              </div>
              <div className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">
                {booking.centreAddress}
              </div>
            </div>

            <div>
              <span className="text-slate-500 flex items-center gap-1.5 text-[11px] font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{isHindi ? 'निर्धारित तिथि व सत्र' : 'Scheduled Date & Session'}</span>
              </span>
              <div className="font-bold text-slate-900 mt-1 text-xs">
                {booking.bookingDate}
              </div>
              <div className="text-slate-500 text-[10px] mt-0.5 capitalize">
                {booking.session.toLowerCase()} {isHindi ? 'सत्र' : 'Session'}
              </div>
            </div>
          </div>

          {/* Assigned Arrival Window Card */}
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">
                  {isHindi ? 'निर्धारित आगमन खिड़की' : 'ASSIGNED ARRIVAL WINDOW'}
                </span>
                <div className="text-base sm:text-lg font-black text-emerald-900 font-mono mt-0.5">
                  {booking.windowStartTime} – {booking.windowEndTime}
                </div>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                  {isHindi
                    ? 'समय पर आगमन सीधी तौल सुनिश्चित करता है।'
                    : 'Punctual arrival ensures direct weighment.'}
                </span>
              </div>
            </div>
            <Clock className="w-6 h-6 text-emerald-200 hidden sm:block opacity-50" />
          </div>

          {/* Farmer & Transport Summary */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">
                {isHindi ? 'अनुमानित मात्रा' : 'Expected Quantity'}
              </span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                {booking.expectedQuantityQuintals} Quintals
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] font-medium">
                {isHindi ? 'परिवहन' : 'Transport'}
              </span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                {booking.vehicleType || 'Standard Transport'}
              </span>
            </div>

            {booking.farmerCode && (
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">
                  {isHindi ? 'किसान आईडी' : 'Farmer ID'}
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                  {booking.farmerCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-[#004D40] text-white hover:bg-[#003d33] rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isHindi ? 'पास प्रिंट / सेव करें' : 'Print / Save Pass'}</span>
          </button>

          {showVisitLink && (
            <Link
              href="/farmer/visits"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-sm transition-all"
            >
              <span>{isHindi ? 'मेरी बुकिंग्स में देखें' : 'View in My Visits'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-100 rounded-lg border border-transparent transition"
            >
              {isHindi ? 'बंद करें' : 'Close'}
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DEDICATED PRINT VIEW (PURE WHITE A4 DOCUMENT LAYOUT)       */}
      {/* ============================================================ */}
      <div
        id="astra-printable-pass"
        className="hidden print:block print:w-full print:max-w-xl print:mx-auto print:p-0 print:bg-white print:text-black print:font-sans"
        style={{ color: '#000000', backgroundColor: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}
      >
        {/* Official Header */}
        <div className="border-b-2 border-black pb-4 text-center space-y-1">
          <div className="text-2xl font-black tracking-wider uppercase">ASTRA</div>
          <div className="text-xs uppercase tracking-widest text-slate-700 font-semibold">
            Smart Farmer Procurement Platform
          </div>
          <div className="text-sm font-bold mt-2 pt-1 border-t border-slate-300">
            OFFICIAL GATE APPOINTMENT PASS
          </div>
        </div>

        {/* Verification & Booking Reference */}
        <div className="py-4 text-center space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            BOOKING CONFIRMED ✓
          </div>
          <div className="text-xs text-slate-600">Booking ID</div>
          <div className="font-mono text-xl font-extrabold text-black">
            {booking.bookingNumber}
          </div>
        </div>

        {/* Crisp Scannable QR Code Container */}
        <div className="py-3 text-center">
          <div className="inline-block p-3 border-2 border-black rounded-xl bg-white">
            <QRCodeSVG
              value={qrValue}
              size={210}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-xs font-bold text-black mt-2">
            Show this QR at the procurement centre gate
          </p>
          <p className="text-[10px] text-slate-600">
            Secure digital gate token for check-in verification
          </p>
        </div>

        <div className="border-t-2 border-black my-4"></div>

        {/* Procurement Depot Section */}
        <div className="space-y-1 py-1 text-left">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-700">
            PROCUREMENT CENTRE
          </div>
          <div className="text-base font-bold text-black">{booking.centreName}</div>
          <div className="text-xs text-slate-800 leading-tight">
            {booking.centreAddress}
          </div>
        </div>

        <div className="border-t border-dashed border-slate-400 my-3"></div>

        {/* Schedule & Logistics Grid */}
        <div className="grid grid-cols-2 gap-3 py-1 text-left text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Date</span>
            <span className="font-bold text-black text-sm block">{booking.bookingDate}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Session</span>
            <span className="font-bold text-black text-sm block capitalize">{booking.session.toLowerCase()}</span>
          </div>

          <div className="col-span-2 border-2 border-black p-2.5 rounded-lg my-1 bg-slate-50">
            <span className="text-[10px] font-black uppercase tracking-wider text-black block">
              ASSIGNED ARRIVAL WINDOW
            </span>
            <span className="text-lg font-black font-mono text-black block mt-0.5">
              {booking.windowStartTime} – {booking.windowEndTime}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Expected Quantity</span>
            <span className="font-bold text-black text-sm block">{booking.expectedQuantityQuintals} Quintals</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Transport</span>
            <span className="font-bold text-black text-sm block truncate">
              {booking.vehicleType || 'Standard Transport'}
              {booking.vehicleNumber ? ` (${booking.vehicleNumber})` : ''}
            </span>
          </div>

          {booking.farmerName && (
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Farmer Name</span>
              <span className="font-bold text-black text-sm block">{booking.farmerName}</span>
            </div>
          )}

          {booking.farmerCode && (
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Farmer ID</span>
              <span className="font-mono font-bold text-black text-sm block">{booking.farmerCode}</span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-black my-4"></div>

        {/* Footer Guidance */}
        <div className="text-center space-y-1 pt-1">
          <p className="text-xs font-bold text-black">
            &quot;Please arrive within your assigned arrival window.&quot;
          </p>
          <p className="text-[9px] text-slate-600 leading-tight">
            This pass must be presented at the entry gate alongside a valid government-issued photo ID.
            Queue tokens and weighment allocations are assigned upon physical arrival check-in.
          </p>
        </div>
      </div>
    </div>
  );
}
