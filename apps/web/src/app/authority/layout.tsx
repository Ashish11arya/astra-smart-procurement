'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function AuthorityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublicRoute = pathname === '/authority/login';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <RouteGuard allowedRoles={['GOVERNMENT_ADMIN']} loginRedirect="/authority/login">
      {children}
    </RouteGuard>
  );
}
