'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileCheck2,
  Printer,
  X,
  Building2,
  Calendar,
  Scale,
  Award,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  User,
  Truck,
  Download,
} from 'lucide-react';

export interface ProcurementVoucherData {
  id?: string;
  bookingNumber: string;
  centreName?: string;
  centreCode?: string;
  centreAddress?: string;
  bookingDate?: string;
  session?: string;
  farmerName?: string;
  farmerCode?: string;
  farmerMobile?: string;
  vehicleNumber?: string;
  commodityName?: string;
  qualityGrade?: string;
  moisturePercent?: number;
  actualWeightQuintals?: number;
  acceptedQuantityQuintals?: number;
  ratePerQuintal?: number;
  totalAmount?: number;
  deductions?: number;
  decidedAt?: string;
  decidedBy?: string;
  paymentStatus?: string;
  transactionRef?: string;
  bankAccountMasked?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  voucher: ProcurementVoucherData | null;
  lang?: 'en' | 'hi';
}

function numberToIndianWords(amount: number): string {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  const rounded = Math.round(amount);
  const crore = Math.floor(rounded / 10000000);
  let rem = rounded % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const remaining = rem;

  let words = '';
  if (crore > 0) words += convertLessThanOneThousand(crore) + ' Crore ';
  if (lakh > 0) words += convertLessThanOneThousand(lakh) + ' Lakh ';
  if (thousand > 0) words += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (remaining > 0) words += convertLessThanOneThousand(remaining) + ' ';

  return words.trim() ? 'Rupees ' + words.trim() + ' Only' : 'Zero Rupees Only';
}

export function ProcurementVoucherModal({ isOpen, onClose, voucher, lang = 'en' }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('has-print-modal');
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('has-print-modal');
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !voucher || !mounted) return null;

  const isHindi = lang === 'hi';
  const acceptedQty = voucher.acceptedQuantityQuintals ?? voucher.actualWeightQuintals ?? 0;
  const rate = voucher.ratePerQuintal ?? 2325;
  const deductions = voucher.deductions ?? 0;
  const totalAmount = voucher.totalAmount ?? Math.max(0, acceptedQty * rate - deductions);
  const amountWords = numberToIndianWords(totalAmount);
  const voucherNumber = `ASTRA-PV-${voucher.bookingNumber.replace(/^ASTRA-BOOK-/, '')}`;
  const qrToken = `ASTRA-VOUCHER:${voucher.bookingNumber}:${acceptedQty}QTL:INR${totalAmount}`;
  const issuanceTime = voucher.decidedAt
    ? new Date(voucher.decidedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  const handlePrint = () => {
    window.print();
  };

  const modalTree = (
    <div
      id="astra-print-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="procurement-voucher-dialog-title"
      className="fixed inset-0 z-[100] w-screen h-screen overflow-y-auto print:static print:inset-auto print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10 w-screen h-screen bg-black/75 backdrop-blur-sm cursor-pointer print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container */}
      <div className="relative z-20 min-h-full w-full flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10 pointer-events-none print:static print:block print:w-full print:h-auto print:p-0 print:m-0 print:min-h-0">
        <div className="relative pointer-events-auto w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-150 print:static print:block print:w-full print:max-w-none print:m-0 print:p-0">
          
          {/* ======================================================== */}
          {/* 1. SCREEN VIEW (DARK GRAPHITE OFFICIAL CARD - HIDDEN ON PRINT) */}
          {/* ======================================================== */}
          <div className="relative print:hidden rounded-2xl border border-[#334155] bg-[#151C2F] p-6 sm:p-8 shadow-2xl space-y-6 text-[#F8FAFC] text-left">
            
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1E293B] hover:bg-[#283548] border border-[#334155] rounded-xl transition shadow-xs"
              aria-label="Close voucher"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Badges */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono tracking-wider">
                    Official MSP Acquisition Voucher
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase font-mono">
                    {voucher.paymentStatus || 'DBT Payment Authorized'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight">
                  {isHindi ? 'खरीद आदेश एवं भुगतान वाउचर' : 'Procurement Purchase Voucher'}
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Voucher Ref: <strong className="text-emerald-400 font-mono font-bold">{voucherNumber}</strong> &bull; Booking: <span className="font-mono text-[#CBD5E1]">#{voucher.bookingNumber}</span>
                </p>
              </div>
            </div>

            {/* Centre & Farmer Info Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#0B1020] border border-[#334155] rounded-xl text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#94A3B8] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Procurement Centre</span>
                </span>
                <p className="font-bold text-[#F8FAFC] text-sm">{voucher.centreName || 'Muzaffarpur Central Depot'}</p>
                <p className="text-[#94A3B8] text-[11px] leading-tight">{voucher.centreAddress || 'Depot Yard, Bihar'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#94A3B8] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Beneficiary Farmer</span>
                </span>
                <p className="font-bold text-[#F8FAFC] text-sm">{voucher.farmerName}</p>
                <p className="text-[#94A3B8] font-mono text-[11px]">
                  ID: {voucher.farmerCode} {voucher.farmerMobile ? `• ${voucher.farmerMobile}` : ''}
                </p>
              </div>
            </div>

            {/* Grain Inspection & Weight Breakdown Table */}
            <div className="border border-[#334155] rounded-xl overflow-hidden bg-[#0B1020] text-xs shadow-xs">
              <div className="bg-[#1E293B] px-4 py-2.5 border-b border-[#334155] font-semibold text-[#CBD5E1] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Certified Acquisition Breakdown</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Grade: {voucher.qualityGrade || 'GRADE_A (FAQ)'} {voucher.moisturePercent ? `(${voucher.moisturePercent}% Moisture)` : ''}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-semibold block">Commodity</span>
                    <span className="font-bold text-[#F8FAFC] text-sm mt-0.5 block">{voucher.commodityName || 'Wheat (गेहूं)'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-semibold block">Net Weighed</span>
                    <span className="font-bold text-[#CBD5E1] text-sm mt-0.5 block font-mono">
                      {voucher.actualWeightQuintals ?? acceptedQty} Qtl
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-semibold block">Accepted Qty</span>
                    <span className="font-black text-emerald-400 text-sm mt-0.5 block font-mono">
                      {acceptedQty} Qtl
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-semibold block">Official MSP</span>
                    <span className="font-bold text-amber-400 text-sm mt-0.5 block font-mono">
                      ₹{rate.toLocaleString('en-IN')}/Qtl
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-[#94A3B8]">
                    Gross: ₹{(acceptedQty * rate).toLocaleString('en-IN')} &bull; Deductions: ₹{deductions.toLocaleString('en-IN')}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Total Net Payable (DBT)</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 font-medium">
                  <strong>In Words:</strong> {amountWords}
                </div>
              </div>
            </div>

            {/* Verification Footer with QR Code */}
            <div className="flex items-center justify-between gap-4 p-4 bg-[#0B1020] border border-[#334155] rounded-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorized Procurement Seal</span>
                </span>
                <p className="text-xs text-[#CBD5E1]">
                  Issued on: <strong className="text-[#F8FAFC] font-mono">{issuanceTime}</strong>
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Payment mode: <strong className="text-emerald-400">Direct Benefit Transfer (DBT)</strong> to Aadhaar-seeded Bank A/C
                </p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-300 shrink-0 shadow-xs">
                <QRCodeSVG value={qrToken} size={70} level="M" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-[0.99]"
              >
                <Printer className="w-4 h-4" />
                <span>{isHindi ? 'वाउचर प्रिंट / डाउनलोड करें' : 'Print Official Voucher'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#CBD5E1] hover:text-[#F8FAFC] bg-[#1E293B] hover:bg-[#283548] rounded-xl border border-[#334155] transition"
              >
                {isHindi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. DEDICATED PRINT VIEW (PURE WHITE A4 OFFICIAL VOUCHER)   */}
          {/* ======================================================== */}
          <div
            id="astra-printable-voucher"
            className="hidden print:block print:w-full print:mx-auto print:p-0 print:bg-white print:text-black print:font-sans"
            style={{ color: '#000000', backgroundColor: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            {/* Government Masthead */}
            <div className="border-b-2 border-black pb-3 text-center space-y-1">
              <div className="text-xl font-black tracking-wider uppercase">
                GOVERNMENT OF INDIA &bull; STATE CIVIL SUPPLIES
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-700 font-bold">
                National Grain Procurement Portal &bull; ASTRA
              </div>
              <div className="text-sm font-black mt-2 pt-1 border-t border-slate-400 uppercase tracking-wide">
                OFFICIAL MSP GRAIN PURCHASE VOUCHER & DBT PAYMENT ADVICE
              </div>
            </div>

            {/* Voucher Reference Strip */}
            <div className="grid grid-cols-2 gap-4 py-3 border-b border-black text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Voucher Number</span>
                <span className="font-mono text-base font-black text-black block">{voucherNumber}</span>
                <span className="text-[10px] text-slate-600 block mt-0.5">Booking Ref: #{voucher.bookingNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Date & Time of Issuance</span>
                <span className="font-mono text-xs font-bold text-black block">{issuanceTime}</span>
                <span className="text-[10px] font-bold text-emerald-800 uppercase block mt-0.5">
                  STATUS: {voucher.paymentStatus || 'APPROVED & DBT INITIATED'}
                </span>
              </div>
            </div>

            {/* Centre & Beneficiary Details */}
            <div className="grid grid-cols-2 gap-4 py-3 border-b border-black text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Procurement Centre Details</span>
                <span className="font-bold text-black text-sm block">{voucher.centreName || 'Muzaffarpur Central Procurement Depot'}</span>
                <span className="text-[11px] text-slate-700 block leading-tight">{voucher.centreAddress || 'Muzaffarpur, Bihar'}</span>
                <span className="text-[10px] font-mono text-slate-600 block">Depot Code: {voucher.centreCode || 'MUZ-BRA-001'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Beneficiary Farmer Details</span>
                <span className="font-bold text-black text-sm block">{voucher.farmerName}</span>
                <span className="text-[11px] text-slate-700 block">Unique Farmer ID: <strong className="font-mono">{voucher.farmerCode}</strong></span>
                <span className="text-[11px] text-slate-700 block">Registered Mobile: {voucher.farmerMobile || 'XXXXXXXXXX'}</span>
                {voucher.vehicleNumber && (
                  <span className="text-[10px] font-mono text-slate-600 block">Vehicle: {voucher.vehicleNumber}</span>
                )}
              </div>
            </div>

            {/* Itemized Produce Table */}
            <div className="py-3">
              <div className="text-[10px] font-bold uppercase text-slate-700 mb-1.5">Acquisition & Settlement Particulars</div>
              <table className="w-full text-xs border border-black text-left">
                <thead className="bg-slate-100 border-b border-black text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-2 border-r border-black">Commodity</th>
                    <th className="p-2 border-r border-black">Grade / Quality</th>
                    <th className="p-2 border-r border-black text-right">Net Weight</th>
                    <th className="p-2 border-r border-black text-right">Accepted Qty</th>
                    <th className="p-2 border-r border-black text-right">MSP Rate</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-mono">
                  <tr>
                    <td className="p-2 border-r border-black font-sans font-bold">
                      {voucher.commodityName || 'Wheat (गेहूं)'}
                    </td>
                    <td className="p-2 border-r border-black font-sans">
                      {voucher.qualityGrade || 'GRADE_A (FAQ)'}
                      {voucher.moisturePercent ? ` (${voucher.moisturePercent}% Moisture)` : ''}
                    </td>
                    <td className="p-2 border-r border-black text-right">
                      {voucher.actualWeightQuintals ?? acceptedQty} Qtl
                    </td>
                    <td className="p-2 border-r border-black text-right font-bold">
                      {acceptedQty} Qtl
                    </td>
                    <td className="p-2 border-r border-black text-right">
                      ₹{rate.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 text-right font-bold">
                      ₹{(acceptedQty * rate).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {deductions > 0 && (
                    <tr>
                      <td colSpan={5} className="p-2 border-r border-black text-right font-sans text-slate-600">
                        Less Deductions (Excess moisture / Quality adjustments)
                      </td>
                      <td className="p-2 text-right text-rose-700">
                        -₹{deductions.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-sans border-t-2 border-black">
                    <td colSpan={4} className="p-2 border-r border-black font-bold text-right uppercase text-[11px]">
                      Net Amount Payable via Direct Benefit Transfer (DBT):
                    </td>
                    <td colSpan={2} className="p-2 text-right font-black text-base font-mono">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2 mt-2 border border-black bg-slate-50 text-xs">
                <span className="font-bold">Amount in Words: </span>
                <span className="font-semibold text-slate-900">{amountWords}</span>
              </div>
            </div>

            {/* Bank Transfer Advisory */}
            <div className="py-2 border-t border-black text-[11px] leading-relaxed">
              <p>
                <strong>Payment Mandate:</strong> The net payable amount of <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> will be disbursed electronically through the Public Financial Management System (PFMS) / DBT into the farmer’s Aadhaar-linked verified bank account.
              </p>
            </div>

            {/* Signatures & Official Stamp Grid */}
            <div className="grid grid-cols-3 gap-4 pt-6 mt-4 border-t-2 border-black text-center text-xs">
              <div className="flex flex-col items-center justify-between space-y-4">
                <div className="w-16 h-16 p-1 border border-black">
                  <QRCodeSVG value={qrToken} size={56} level="M" />
                </div>
                <span className="text-[9px] text-slate-600">Secure Cryptographic Verification QR</span>
              </div>

              <div className="flex flex-col justify-end space-y-1">
                <div className="border-b border-black w-32 mx-auto mb-1"></div>
                <span className="font-bold text-[11px]">Farmer Signature / Thumb</span>
                <span className="text-[9px] text-slate-600">Received and Accepted</span>
              </div>

              <div className="flex flex-col justify-end space-y-1">
                <div className="border-b border-black w-36 mx-auto mb-1"></div>
                <span className="font-bold text-[11px]">Authorized Procurement Officer</span>
                <span className="text-[9px] text-slate-600">For Food Corporation / State Civil Supplies</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 mt-3 border-t border-slate-300 text-[9px] text-slate-500">
              This is a digitally verified government procurement purchase receipt generated via the ASTRA National Grain Portal.
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}
