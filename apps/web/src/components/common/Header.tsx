'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Languages,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Building,
  Users,
  LayoutDashboard,
  Scale,
  Sparkles,
  CreditCard,
  QrCode,
  PackageCheck,
  Calendar,
  Activity,
  FileCheck,
  History,
  Menu,
  X,
  Layers,
  Phone,
} from 'lucide-react';
import { AstraLogo } from './AstraLogo';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { HelpModal } from './HelpModal';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const { locale, toggleLanguage, t } = useLanguage();
  const { user, farmer, token, logoutPortal } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

  const isHomePage = pathname === '/';
  const isLoginPage =
    pathname === '/farmer/login' ||
    pathname === '/farmer/register' ||
    pathname === '/authority/login' ||
    pathname === '/verification/login' ||
    pathname === '/operations/login' ||
    pathname === '/centre/login';

  const isAuthenticated = Boolean(mounted && !isLoginPage && !isHomePage && token && user);

  const role = user?.role as string | undefined;
  const isFarmer = role === 'FARMER';
  const isAuthority = role === 'GOVERNMENT_ADMIN';
  const isVerificationAuthority = role === 'FARMER_VERIFICATION_AUTHORITY';
  const isCentreHead = role === 'PROCUREMENT_CENTRE_OFFICER';
  const isCheckinOfficer = role === 'CHECK_IN_OFFICER' || role === 'CHECK_IN';
  const isWeighmentOfficer =
    role === 'WEIGHMENT_OFFICER' || role === 'WEIGHMENT' || role === 'WEIGHMENT_SUPERVISOR';
  const isQualityOfficer = role === 'QUALITY_OFFICER' || role === 'QUALITY';
  const isProcurementOfficer = role === 'PROCUREMENT_OFFICER' || role === 'PROCUREMENT';
  const isPaymentOfficer = role === 'PAYMENT_OFFICER' || role === 'PAYMENT';

  const currentCentreView = searchParams.get('view') || 'today';

  const getDashboardHref = () => {
    if (!isAuthenticated) return '/';
    if (isAuthority) return '/authority/dashboard';
    if (isVerificationAuthority) return '/verification/dashboard';
    if (isFarmer) return '/farmer/dashboard';
    if (isCentreHead) return '/operations/centre';
    if (isCheckinOfficer) return '/operations/checkin';
    if (isWeighmentOfficer) return '/operations/weighment';
    if (isQualityOfficer) return '/operations/quality';
    if (isProcurementOfficer) return '/operations/procurement';
    if (isPaymentOfficer) return '/operations/payment';
    return '/operations/centre';
  };

  const handlePortalLogout = () => {
    if (isFarmer) {
      logoutPortal('farmer');
    } else if (isAuthority) {
      logoutPortal('authority');
    } else if (isVerificationAuthority) {
      logoutPortal('verification');
    } else {
      logoutPortal('operations');
    }
  };

  return (
    <>
      <header
        data-print-hide
        className="print:hidden sticky top-0 z-50 bg-[#003F3B] border-b border-[#002f2d] shadow-lg shadow-black/20"
      >
        <div className="max-w-[1440px] w-full mx-auto px-2 md:px-4 lg:px-6 h-[80px] lg:h-[100px] flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center shrink-0">
            <Link
              href={getDashboardHref()}
              className="flex items-center gap-3 lg:gap-4 group focus:outline-none shrink-0"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white rounded-full p-1.5 shadow-sm">
                <AstraLogo className="w-10 h-10 sm:w-12 sm:h-12 text-[#003F3B]" />
              </div>
              <div className="flex flex-col justify-center transition-transform hover:scale-105">
                <span className="text-[22px] sm:text-[28px] font-[900] tracking-tight text-teal-50 group-hover:text-teal-200 transition-colors leading-[1]">
                  ASTRA
                </span>
                <span className="hidden sm:block text-[10px] lg:text-[12px] font-[700] text-[#BFE9DA] tracking-wider mt-1 sm:mt-1.5 leading-none whitespace-nowrap">
                  NATIONAL GRAIN PROCUREMENT PORTAL
                </span>
              </div>
            </Link>
          </div>

          {/* Role-Specific Navigation Links */}
          <nav className="hidden lg:flex flex-1 justify-center items-center gap-1 lg:gap-2 xl:gap-4 text-[12px] xl:text-[14px] font-bold text-teal-50">
            {!isAuthenticated ? (
              /* PUBLIC & LOGIN PAGES */
              <>
                <Link
                  href="/"
                  className={`h-[64px] flex items-center justify-center text-center leading-[1.2] transition-colors border-b-[3px] border-transparent ${
                    isHomePage
                      ? 'text-[#10B981] px-4 rounded-t-lg bg-white/5 border-b-[#10B981]'
                      : 'text-teal-50 hover:text-[#10B981] opacity-90 hover:opacity-100 hover:border-b-[#10B981] hover:bg-white/5 px-4 rounded-t-lg'
                  }`}
                >
                  {locale === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}
                </Link>
                <Link
                  href="/farmer/centres"
                  className={`h-[64px] flex items-center justify-center text-center leading-[1.2] transition-colors border-b-[3px] border-transparent ${
                    pathname === '/farmer/centres'
                      ? 'text-[#10B981] px-4 rounded-t-lg bg-white/5 border-b-[#10B981]'
                      : 'text-teal-50 hover:text-[#10B981] opacity-90 hover:opacity-100 hover:border-b-[#10B981] hover:bg-white/5 px-4 rounded-t-lg'
                  }`}
                >
                  {locale === 'hi' ? 'खरीद केन्द्र' : 'Procurement Centres'}
                </Link>
                <Link
                  href="/farmer/login"
                  className={`h-[64px] flex items-center justify-center text-center leading-[1.2] transition-colors border-b-[3px] border-transparent ${
                    pathname === '/farmer/login'
                      ? 'text-[#10B981] px-4 rounded-t-lg bg-white/5 border-b-[#10B981]'
                      : 'text-teal-50 hover:text-[#10B981] opacity-90 hover:opacity-100 hover:border-b-[#10B981] hover:bg-white/5 px-4 rounded-t-lg'
                  }`}
                >
                  {locale === 'hi' ? 'किसान पोर्टल' : 'Farmer Portal'}
                </Link>
                {pathname !== '/farmer/login' && pathname !== '/farmer/register' && (
                  <>
                    <Link
                      href="/operations/login"
                      className={`h-[64px] flex items-center justify-center text-center leading-[1.2] transition-colors border-b-[3px] border-transparent ${
                        pathname === '/operations/login'
                          ? 'text-teal-50 border-b-[#10B981] px-4 rounded-t-lg bg-white/5'
                          : 'text-teal-50 hover:text-teal-50 opacity-90 hover:opacity-100 hover:border-b-[#10B981] hover:bg-white/5 px-4 rounded-t-lg'
                      }`}
                    >
                      {locale === 'hi' ? 'केन्द्र कर्मी' : 'Depot Staff'}
                    </Link>
                    <Link
                      href="/authority/login"
                      className={`h-[64px] flex items-center justify-center text-center leading-[1.2] transition-colors border-b-[3px] border-transparent ${
                        pathname === '/authority/login'
                          ? 'text-teal-50 border-b-[#10B981] px-4 rounded-t-lg bg-white/5'
                          : 'text-teal-50 hover:text-teal-50 opacity-90 hover:opacity-100 hover:border-b-[#10B981] hover:bg-white/5 px-4 rounded-t-lg'
                      }`}
                    >
                      {locale === 'hi' ? 'प्राधिकरण' : 'Authority'}
                    </Link>
                  </>
                )}
              </>
            ) : isFarmer ? (
              /* 1. FARMER AUTHENTICATED NAVIGATION */
              <>
                <Link
                  href="/farmer/dashboard"
                  className={`px-2 py-1.5 rounded-lg transition-colors ${
                    pathname === '/farmer/dashboard'
                      ? 'text-[#014532] bg-white border border-teal-200 font-bold shadow-md'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {locale === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                </Link>

                <Link
                  href="/farmer/profile"
                  className={`px-2 py-1.5 rounded-lg transition-colors ${
                    pathname === '/farmer/profile'
                      ? 'text-[#014532] bg-white border border-teal-200 font-bold shadow-md'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {locale === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My Profile'}
                </Link>

                <Link
                  href="/farmer/registration-status"
                  className={`px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    pathname === '/farmer/registration-status'
                      ? 'text-[#014532] bg-white border border-teal-200 font-bold shadow-md'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{locale === 'hi' ? 'सत्यापन स्थिति' : 'Verification Status'}</span>
                </Link>

                <Link
                  href="/farmer/centres"
                  className={`px-2 py-1.5 rounded-lg transition-colors ${
                    pathname === '/farmer/centres'
                      ? 'text-[#014532] bg-white border border-teal-200 font-bold shadow-md'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {locale === 'hi' ? 'केन्द्र खोजें' : 'Find Centres'}
                </Link>

                <Link
                  href="/farmer/visits"
                  className={`px-2 py-1.5 rounded-lg transition-colors ${
                    pathname === '/farmer/visits' || pathname.startsWith('/farmer/bookings/')
                      ? 'text-[#014532] bg-white border border-teal-200 font-bold shadow-md'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {locale === 'hi' ? 'मेरी बुकिंग' : 'My Bookings'}
                </Link>
              </>
            ) : isAuthority ? (
              /* 2. HIGHER AUTHORITY */
              <>
                <Link
                  href="/authority/dashboard"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    pathname === '/authority/dashboard'
                      ? 'text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 font-bold'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Procurement Authority</span>
                </Link>

                <Link
                  href="/authority/centres"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/authority/centres')
                      ? 'text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 font-bold'
                      : 'text-emerald-900/80 hover:text-indigo-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Centres & Workload</span>
                </Link>

                <Link
                  href="/authority/personnel"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/authority/personnel')
                      ? 'text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 font-bold'
                      : 'text-emerald-900/80 hover:text-indigo-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Personnel</span>
                </Link>
              </>
            ) : isVerificationAuthority ? (
              /* 2.5 FARMER VERIFICATION */
              <>
                <Link
                  href="/verification/dashboard"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    pathname === '/verification/dashboard'
                      ? 'text-purple-300 bg-purple-950/60 border border-purple-500/40 font-bold'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                  <span>Farmer Verification</span>
                </Link>

                <Link
                  href="/verification/applications"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/verification/applications')
                      ? 'text-purple-300 bg-purple-950/60 border border-purple-500/40 font-bold'
                      : 'text-emerald-900/80 hover:text-purple-300 hover:bg-slate-800/60'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Applications Queue</span>
                </Link>

                <Link
                  href="/verification/history"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/verification/history')
                      ? 'text-purple-300 bg-purple-950/60 border border-purple-500/40 font-bold'
                      : 'text-emerald-900/80 hover:text-purple-300 hover:bg-slate-800/60'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-purple-400" />
                  <span>Audit History</span>
                </Link>
              </>
            ) : isCentreHead ? (
              /* 3. CENTRE HEAD */
              <>
                <Link
                  href="/operations/centre?view=today"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    currentCentreView === 'today'
                      ? 'text-amber-700 bg-amber-50 border border-amber-200 font-bold'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />
                  <span>Today</span>
                </Link>

                <Link
                  href="/operations/centre?view=monitor"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    currentCentreView === 'monitor'
                      ? 'text-amber-700 bg-amber-50 border border-amber-200 font-bold'
                      : 'text-emerald-900/80 hover:text-amber-700 hover:bg-slate-800/60'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  <span>Processing Monitor</span>
                </Link>

                <Link
                  href="/operations/centre?view=forecast"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    currentCentreView === 'forecast'
                      ? 'text-amber-700 bg-amber-50 border border-amber-200 font-bold'
                      : 'text-emerald-900/80 hover:text-amber-700 hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Next 7 Days</span>
                </Link>

                <Link
                  href="/operations/centre?view=personnel"
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    currentCentreView === 'personnel'
                      ? 'text-amber-700 bg-amber-50 border border-amber-200 font-bold'
                      : 'text-emerald-900/80 hover:text-amber-700 hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>Personnel</span>
                </Link>
              </>
            ) : isCheckinOfficer ? (
              /* 4. CHECK-IN */
              <Link
                href="/operations/checkin"
                className="px-3.5 py-1.5 rounded-lg text-sky-300 bg-sky-950/60 border border-sky-500/40 transition-all font-bold flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4 text-sky-400" />
                <span>Check-in & Queue</span>
              </Link>
            ) : isWeighmentOfficer ? (
              /* 5. WEIGHMENT */
              <Link
                href="/operations/weighment"
                className="px-3.5 py-1.5 rounded-lg text-orange-300 bg-orange-950/60 border border-orange-500/40 transition-all font-bold flex items-center gap-1.5"
              >
                <Scale className="w-4 h-4 text-orange-400" />
                <span>Weighment</span>
              </Link>
            ) : isQualityOfficer ? (
              /* 6. QUALITY */
              <Link
                href="/operations/quality"
                className="px-3.5 py-1.5 rounded-lg text-teal-300 bg-teal-950/60 border border-teal-500/40 transition-all font-bold flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Quality Assessment</span>
              </Link>
            ) : isProcurementOfficer ? (
              /* 7. PROCUREMENT */
              <Link
                href="/operations/procurement"
                className="px-3.5 py-1.5 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-200 transition-all font-bold flex items-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4 text-emerald-700" />
                <span>Procurement</span>
              </Link>
            ) : isPaymentOfficer ? (
              /* 8. PAYMENT */
              <Link
                href="/operations/payment"
                className="px-3.5 py-1.5 rounded-lg text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 transition-all font-bold flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>Payments</span>
              </Link>
            ) : null}
          </nav>

          {/* Right Side: Helpline, Language, Help & User Controls */}
          <div className="flex items-center justify-end shrink-0 gap-1 sm:gap-2 lg:gap-3">
            {/* Toll-Free Helpline Pill */}
            <div className="hidden lg:flex items-center gap-2 h-[42px] px-3.5 rounded-lg border border-white/10 bg-white/5">
              <Phone className="w-4 h-4 text-[#10B981]" />
              <span className="text-[14px] text-teal-50 opacity-90">Helpline:</span>
              <a href="tel:18001801551" className="text-[15px] text-[#10B981] font-[800] hover:underline">
                1800-180-1551
              </a>
            </div>

            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              type="button"
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 h-[42px] px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[15px] font-[700] text-teal-50 hover:text-white transition"
              title={locale === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
            >
              <Languages className="w-4 h-4 text-[#BFE9DA]" />
              <span suppressHydrationWarning>{locale === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Help Button */}
            <button
              onClick={() => setHelpOpen(true)}
              type="button"
              suppressHydrationWarning
              className="hidden sm:inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[14px] font-[700] text-teal-50 hover:text-white transition"
              title={t.help}
            >
              <HelpCircle className="w-4 h-4 text-[#BFE9DA]" />
              <span suppressHydrationWarning>Need Help?</span>
            </button>

            {/* Authenticated User Badge (Shows Farmer Name Only when Farmer Login) */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#005a56]">
                <div className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[#005a56] bg-[#004a46] text-sm shadow-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isFarmer
                        ? 'bg-emerald-400'
                        : isAuthority
                        ? 'bg-indigo-400'
                        : isVerificationAuthority
                        ? 'bg-purple-400'
                        : isCentreHead
                        ? 'bg-amber-400'
                        : isCheckinOfficer
                        ? 'bg-sky-400'
                        : isWeighmentOfficer
                        ? 'bg-orange-400'
                        : isQualityOfficer
                        ? 'bg-teal-400'
                        : isPaymentOfficer
                        ? 'bg-cyan-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  {isFarmer ? (
                    /* Show Farmer Name Only without 'Verified Farmer' */
                    <span className="font-bold text-white max-w-[80px] sm:max-w-[120px] lg:max-w-[160px] truncate">
                      {farmer?.fullName || (user as any)?.fullName || 'Farmer'}
                    </span>
                  ) : isAuthority ? (
                    <div className="flex flex-col text-left leading-tight">
                      <span className="font-bold text-teal-50">CENTRAL ADMIN</span>
                      <span className="text-sm text-emerald-800/80 font-mono">
                        +91 {user.mobile ? user.mobile.slice(-4) : '0001'}
                      </span>
                    </div>
                  ) : isVerificationAuthority ? (
                    <div className="flex flex-col text-left leading-tight">
                      <span className="font-bold text-teal-50">VERIFICATION</span>
                      <span className="text-sm text-purple-300 font-mono">
                        +91 {user.mobile ? user.mobile.slice(-4) : 'AUTH'}
                      </span>
                    </div>
                  ) : isCentreHead ? (
                    <div className="flex flex-col text-left leading-tight">
                      <span className="font-bold text-teal-50">CENTRE HEAD</span>
                      <span className="text-sm text-amber-700 font-mono">MUZ-BRA-001</span>
                    </div>
                  ) : (
                    <div className="flex flex-col text-left leading-tight">
                      <span className="font-bold text-teal-50">{role?.replace(/_OFFICER|_SUPERVISOR/g, '')}</span>
                      <span className="text-sm text-emerald-800/80 font-mono">
                        +91 {user.mobile ? user.mobile.slice(-4) : 'DESK'}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePortalLogout}
                  type="button"
                  suppressHydrationWarning
                  className="p-2 rounded-lg text-teal-200 hover:text-rose-400 hover:bg-[#002f2d] border border-[#005a56] transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              suppressHydrationWarning
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-[#005a56] bg-[#004a46] text-teal-200 hover:text-white transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-teal-50" /> : <Menu className="w-5 h-5 text-teal-200" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#002f2d] bg-[#003F3B] px-4 py-3 shadow-2xl">
            {!isAuthenticated ? (
              <div className="flex flex-col space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg font-bold text-base ${
                    isHomePage
                      ? 'text-teal-50 bg-[#002f2d]'
                      : 'text-teal-100 hover:bg-[#004a46]'
                  }`}
                >
                  {locale === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}
                </Link>
                <Link
                  href="/farmer/centres"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-teal-100 hover:text-teal-50 hover:bg-[#004a46] font-medium text-base"
                >
                  {locale === 'hi' ? 'खरीद केन्द्र' : 'Find Centres'}
                </Link>
                <Link
                  href="/farmer/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 font-medium text-base"
                >
                  {locale === 'hi' ? 'किसान पोर्टल' : 'Farmer Portal'}
                </Link>
                <Link
                  href="/operations/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-emerald-900/80 hover:text-amber-600 hover:bg-slate-800/50 font-medium text-base"
                >
                  {locale === 'hi' ? 'केन्द्र कर्मी' : 'Depot Staff'}
                </Link>
                <Link
                  href="/authority/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-emerald-900/80 hover:text-indigo-400 hover:bg-slate-800/50 font-medium text-base"
                >
                  {locale === 'hi' ? 'प्राधिकरण' : 'Authority'}
                </Link>
              </div>
            ) : isFarmer ? (
              <div className="flex flex-col space-y-1">
                <Link
                  href="/farmer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-white/10 text-base font-semibold"
                >
                  Dashboard
                </Link>
                <Link
                  href="/farmer/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-white/10 text-base font-semibold"
                >
                  My Profile
                </Link>
                <Link
                  href="/farmer/registration-status"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-white/10 text-base font-semibold"
                >
                  Verification Status
                </Link>
                <Link
                  href="/farmer/centres"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-white/10 text-base font-semibold"
                >
                  Find Centres
                </Link>
                <Link
                  href="/farmer/visits"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-white/10 text-base font-semibold"
                >
                  My Bookings
                </Link>
              </div>
            ) : isCentreHead ? (
              <div className="flex flex-col space-y-1">
                <Link
                  href="/operations/centre?view=today"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-amber-700 bg-amber-50 text-base font-semibold"
                >
                  Today View
                </Link>
                <Link
                  href="/operations/centre?view=monitor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-white/10 text-base font-semibold"
                >
                  Processing Monitor
                </Link>
                <Link
                  href="/operations/centre?view=forecast"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-white/10 text-base font-semibold"
                >
                  Next 7 Days Forecast
                </Link>
                <Link
                  href="/operations/centre?view=personnel"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-white/10 text-base font-semibold"
                >
                  Personnel
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </header>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
