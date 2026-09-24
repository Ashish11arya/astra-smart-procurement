'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessRestricted } from '@/components/auth/AccessRestricted';

interface StationGuardProps {
  allowedRoles: string[];
  stationName: string;
  stationCode?: string;
  stationDescription?: string;
  children: React.ReactNode;
}

export function StationGuard({
  allowedRoles,
  stationName,
  stationCode,
  stationDescription,
  children,
}: StationGuardProps) {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (!token || !user) {
      router.replace('/operations/login');
    }
  }, [mounted, isLoading, token, user, router]);

  if (!mounted || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm text-slate-400">Verifying station clearance & departmental role...</p>
      </div>
    );
  }

  // 1. Not Logged In
  if (!token || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Redirecting to depot operations login...</p>
      </div>
    );
  }

  // 2. Logged In, but Role Not Authorized for this specific station
  const isAuthorized = allowedRoles.includes(user.role as string);

  if (!isAuthorized) {
    return (
      <AccessRestricted
        requiredRole={allowedRoles}
        customMessage={`The ${stationName} terminal is restricted to authorized departmental personnel. Your account role does not have operational clearance for this station.`}
      />
    );
  }

  // 3. Authorized -> Render station children
  return <>{children}</>;
}
