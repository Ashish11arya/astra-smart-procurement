'use client';
import { usePathname } from 'next/navigation';
import React from 'react';

export function AppBackground() {
  const pathname = usePathname();
  if (!pathname) return null;

  // Exclude Home, Login, and Registration
  if (
    pathname === '/' ||
    pathname === '/farmer/login' ||
    pathname === '/farmer/register'
  ) {
    return null;
  }

  return (
    <div className="astra-app-background">
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
    </div>
  );
}
