'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Building2, ClipboardList, User } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export function BottomNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();

  // Only display on authenticated farmer routes on mobile devices
  if (!user || pathname === '/farmer/login' || pathname === '/') {
    return null;
  }

  const navItems = [
    {
      label: t.navHome,
      href: '/farmer/dashboard',
      icon: Home,
      isActive: pathname === '/farmer/dashboard',
    },
    {
      label: t.navBookings || 'Bookings',
      href: '/farmer/visits',
      icon: Calendar,
      isActive: pathname === '/farmer/visits' || pathname.startsWith('/farmer/bookings/'),
    },
    {
      label: t.navCentres || 'Find Centre',
      href: '/farmer/centres',
      icon: Building2,
      isActive: pathname === '/farmer/centres' || pathname === '/farmer/book',
    },
    {
      label: t.navStatus,
      href: '/farmer/registration-status',
      icon: ClipboardList,
      isActive: pathname === '/farmer/registration-status' || pathname === '/farmer/verification',
    },
    {
      label: t.navProfile,
      href: '/farmer/profile',
      icon: User,
      isActive: pathname === '/farmer/profile',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      data-print-hide
      className="print:hidden fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-2xl px-1.5 py-1.5 pb-safe"
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
              <span className="text-sm mt-1 tracking-tight text-center truncate max-w-[62px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
