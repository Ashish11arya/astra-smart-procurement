'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNavigationItems } from './useNavigationItems';
import { HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { HelpModal } from '@/components/common/HelpModal';

export function BottomNav() {
  const { primaryItems, secondaryItems, isPublic, isDepotStaff } = useNavigationItems();
  const [mounted, setMounted] = useState(false);
  const { logoutPortal } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = isPublic ? secondaryItems : primaryItems;

  if (!mounted || navItems.length === 0) return null;

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        data-print-hide
        className="print:hidden fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-1.5 py-1.5 pb-safe"
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition ${
                  item.isActive
                    ? 'text-emerald-700 font-bold bg-emerald-100 border border-emerald-200'
                    : 'text-emerald-800/80 hover:text-[#014532] hover:bg-emerald-50 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5] text-emerald-600' : 'stroke-[1.8] text-emerald-800/80'}`} />
                  {item.isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </div>
                <span className="text-[12px] sm:text-[13px] font-semibold mt-1 tracking-tight text-center truncate w-full max-w-[70px]">{item.shortLabel}</span>
              </Link>
            );
          })}

          {isDepotStaff && (
            <>
              <button
                onClick={() => setHelpOpen(true)}
                className="flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition text-emerald-800/80 hover:text-[#014532] hover:bg-emerald-50 font-medium"
              >
                <div className="relative">
                  <HelpCircle className="w-5 h-5 stroke-[1.8] text-emerald-800/80" />
                </div>
                <span className="text-[12px] sm:text-[13px] font-semibold mt-1 tracking-tight text-center truncate w-full max-w-[70px]">Help</span>
              </button>

              <button
                onClick={() => logoutPortal('operations')}
                className="flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition text-rose-600/80 hover:text-rose-700 hover:bg-rose-50 font-medium"
              >
                <div className="relative">
                  <LogOut className="w-5 h-5 stroke-[1.8] text-rose-600/80" />
                </div>
                <span className="text-[12px] sm:text-[13px] font-semibold mt-1 tracking-tight text-center truncate w-full max-w-[70px]">Logout</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {isDepotStaff && <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />}
    </>
  );
}
