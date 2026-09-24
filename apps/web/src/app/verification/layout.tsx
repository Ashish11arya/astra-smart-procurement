'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublicRoute = pathname === '/verification/login';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <RouteGuard
      allowedRoles={['FARMER_VERIFICATION_AUTHORITY']}
      loginRedirect="/verification/login"
      stationName="Farmer Verification Authority Desk"
    >
      {children}
    </RouteGuard>
  );
}
