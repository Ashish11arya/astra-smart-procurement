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
    <div className="w-full flex-1 flex flex-col bg-[#EEFaf7] relative after:absolute after:top-full after:inset-x-0 after:h-[calc(72px+env(safe-area-inset-bottom))] after:bg-[#EEFaf7] md:after:hidden">
      <RouteGuard
        allowedRoles={['FARMER_VERIFICATION_AUTHORITY']}
        loginRedirect="/verification/login"
        stationName="Farmer Verification Authority Desk"
      >
        <main className="w-full min-h-[85vh] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-[calc(72px+env(safe-area-inset-bottom))]">
          {children}
        </main>
      </RouteGuard>
    </div>
  );
}
