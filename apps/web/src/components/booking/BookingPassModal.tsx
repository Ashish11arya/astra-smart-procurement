'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DigitalBookingPass, BookingPassData } from './DigitalBookingPass';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingPassData | null;
  lang?: 'en' | 'hi';
}

export function BookingPassModal({ isOpen, onClose, booking, lang = 'en' }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while modal is open, and restore on close/unmount
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('has-print-modal');
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('has-print-modal');
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking || !mounted) return null;

  const modalTree = (
    <div
      id="astra-print-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-pass-dialog-title"
      className="fixed inset-0 z-[100] w-screen h-screen overflow-y-auto print:static print:inset-auto print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0"
    >
      {/* 1. Viewport-level solid dark backdrop: covers 100% of viewport and intercepts outside clicks */}
      <div
        className="fixed inset-0 z-10 w-screen h-screen bg-[#070A13] cursor-pointer"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#070A13',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Centered modal scroll container: higher z-index, centered via my-auto */}
      <div className="relative z-20 min-h-full w-full flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10 pointer-events-none print:static print:block print:w-full print:h-auto print:p-0 print:m-0 print:min-h-0">
        <div className="relative pointer-events-auto w-full max-w-xl my-auto animate-in fade-in zoom-in-95 duration-150 print:static print:block print:w-full print:max-w-none print:m-0 print:p-0">
          {/* Visible Close Button inside Top Right of Card */}
          <button
            type="button"
            onClick={onClose}
            className="print:hidden absolute top-3.5 right-3.5 z-20 p-2 text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition shadow-lg"
            aria-label="Close booking pass"
          >
            <X className="w-5 h-5" />
          </button>

          <DigitalBookingPass
            booking={booking}
            lang={lang}
            onClose={onClose}
            showVisitLink={false}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}
