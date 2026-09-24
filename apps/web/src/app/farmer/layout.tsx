'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public/open routes inside farmer directory
  const isPublicRoute =
    pathname === '/farmer/login' ||
    pathname === '/farmer/register' ||
    pathname === '/farmer/centres';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <RouteGuard allowedRoles={['FARMER']} loginRedirect="/farmer/login">
      <div className="min-h-screen bg-white w-full">
        {children}
      </div>
    </RouteGuard>
  );
}
