'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  const { user, token, isLoading, farmerState } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLoginRedirect = useCallback(() => {
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
  }, [loginRedirect, pathname]);

  useEffect(() => {
    if (!mounted || isLoading) return;

    // Check if session token and user exist
    if (!token || !user) {
      const target = getLoginRedirect();
      router.replace(target);
    }
  }, [mounted, isLoading, token, user, router, getLoginRedirect]);

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

  // 3. Enforce Farmer Registration Completion
  if (user.role === 'FARMER' && pathname.startsWith('/farmer')) {
    const isRegistrationIncomplete =
      !farmerState ||
      farmerState === 'NOT_REGISTERED' ||
      farmerState === 'DRAFT';

    if (isRegistrationIncomplete) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-5 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#014532]">
              Complete your farmer registration first.
            </h2>
            <p className="text-sm text-emerald-800/80 max-w-md mx-auto">
              Please complete all required registration steps before accessing procurement services.
            </p>
          </div>
          <button
            onClick={() => router.push('/farmer/register')}
            className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Continue Registration
          </button>
        </div>
      );
    }
  }

  // 4. Authorized -> Render protected workspace
  return <>{children}</>;
}
