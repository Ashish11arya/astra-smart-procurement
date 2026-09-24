'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessRestricted } from './AccessRestricted';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  loginRedirect?: string;
  stationName?: string;
}

export function RouteGuard({
  children,
  allowedRoles,
  loginRedirect,
  stationName,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLoginRedirect = () => {
    if (loginRedirect) return loginRedirect;
    if (pathname.startsWith('/farmer')) return '/farmer/login';
    if (pathname.startsWith('/authority')) return '/authority/login';
    if (pathname.startsWith('/verification')) return '/verification/login';
    if (
      pathname.startsWith('/operations') ||
      pathname.startsWith('/checkin') ||
      pathname.startsWith('/weighment') ||
      pathname.startsWith('/quality') ||
      pathname.startsWith('/payment') ||
      pathname.startsWith('/procurement') ||
      pathname.startsWith('/centre')
    ) {
      return '/operations/login';
    }
    return '/';
  };

  useEffect(() => {
    if (!mounted || isLoading) return;

    // Check if session token and user exist
    if (!token || !user) {
      const target = getLoginRedirect();
      router.replace(target);
    }
  }, [mounted, isLoading, token, user, router, pathname]);

  // Loading state
  if (!mounted || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm font-medium">Verifying security clearance & access permissions...</p>
      </div>
    );
  }

  // 1. Unauthenticated -> Do not render children, show redirecting state
  if (!token || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Authentication Required</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Please sign in to access this protected ASTRA workspace. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // 2. Authenticated, but Role is NOT authorized
  const isAuthorized = allowedRoles.includes(user.role as string);

  if (!isAuthorized) {
    return <AccessRestricted requiredRole={allowedRoles} />;
  }

  // 3. Authorized -> Render protected workspace
  return <>{children}</>;
}
