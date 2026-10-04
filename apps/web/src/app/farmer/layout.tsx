'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { AppBackground } from '@/components/common/AppBackground';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public/open routes inside farmer directory
  const isPublicRoute =
    pathname === '/farmer/login' ||
    pathname === '/farmer/register' ||
    pathname === '/farmer/centres';

  if (isPublicRoute) {
    return (
      <div className="text-slate-900">
        {children}
      </div>
    );
  }

  return (
    <RouteGuard allowedRoles={['FARMER']} loginRedirect="/farmer/login">
      <AppBackground />
      <div className="min-h-screen bg-transparent w-full text-slate-900">
        {children}
      </div>
    </RouteGuard>
  );
}
