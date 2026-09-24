'use client';

import React from 'react';
import { ShieldCheck, PhoneCall, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { AstraLogo } from './AstraLogo';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer data-print-hide className="print:hidden bg-[#003F3B] text-teal-100 text-xs py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full p-1 shadow-sm">
            <AstraLogo className="w-8 h-8 text-[#003F3B]" />
          </div>
          <div>
            <div className="font-[900] text-white text-[16px] leading-tight">ASTRA</div>
            <p className="text-[#BFE9DA] text-[11px] font-[600]">NATIONAL GRAIN PROCUREMENT PORTAL</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-white font-[600]">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
            <PhoneCall className="w-4 h-4 text-[#10B981]" />
            <span className="text-[13px]">
              {t.helpline}: <strong className="text-[#10B981] font-[800] font-mono">1800-180-1551</strong> <span className="opacity-80 font-normal">(8 AM – 8 PM)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#BFE9DA]" />
            <span className="opacity-90 text-[13px]">Direct MSP Guarantee & Calibrated IoT Scales</span>
          </div>
        </div>

        <div className="text-center md:text-right text-[11px] text-[#BFE9DA] opacity-70 font-[500]">
          Official Agricultural Public Service Digital Infrastructure
        </div>
      </div>
    </footer>
  );
}
