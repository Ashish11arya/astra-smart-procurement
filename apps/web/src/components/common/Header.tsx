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
  ChevronDown,
} from 'lucide-react';
import { AstraLogo } from './AstraLogo';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { HelpModal } from './HelpModal';
import { useNavigationItems } from './useNavigationItems';

const getIdentityName = (user: any) => {
  if (user?.name?.trim()) return user.name.trim();
  if (user?.fullName?.trim()) return user.fullName.trim();
  if (user?.role) {
    const roleStr = user.role.replace(/_/g, ' ').toLowerCase();
    return roleStr.replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
  return 'Staff';
};

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

  const { 
    primaryItems, 
    secondaryItems, 
    isPublic, 
    isFarmer, 
    isAuthority, 
    isVerificationAuthority, 
    isCentreHead, 
    isCheckinOfficer, 
    isWeighmentOfficer, 
    isQualityOfficer, 
    isProcurementOfficer,
    isPaymentOfficer 
  } = useNavigationItems();

  const displayAsPublic = !mounted || isPublic;

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
        <div className="w-full px-4 lg:px-4 xl:px-5 h-[80px] lg:h-[100px] flex items-center justify-between min-w-0">
          {/* Logo & Platform Name */}
          <div className="flex items-center shrink min-w-0 gap-1.5 sm:gap-3 mr-2 xl:mr-4">
            <Link
              href={getDashboardHref()}
              className="flex items-center gap-1.5 sm:gap-3 group focus:outline-none shrink min-w-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-full p-1 shadow-sm shrink-0">
                <AstraLogo className="w-8 h-8 sm:w-10 sm:h-10 text-[#003F3B]" />
              </div>
              <div className="flex flex-col justify-center transition-transform hover:scale-105 shrink min-w-0">
                <span className="text-[22px] sm:text-[26px] lg:text-[28px] font-bold leading-none tracking-[-0.025em] text-teal-50 group-hover:text-teal-200 transition-colors">
                  ASTRA
                </span>
                {!(mounted && !isPublic && (isCentreHead || isCheckinOfficer || isWeighmentOfficer || isQualityOfficer || isProcurementOfficer || isPaymentOfficer)) && (
                  <span className="hidden sm:block text-[9px] lg:text-[10px] xl:text-[11px] font-semibold text-[#BFE9DA] tracking-[0.01em] mt-1 sm:mt-1.5 leading-[1.2] whitespace-nowrap truncate">
                    NATIONAL GRAIN PROCUREMENT PORTAL
                  </span>
                )}
              </div>
            </Link>

            {/* Department Branding for Centre Staff */}
            {mounted && !isPublic && (isCentreHead || isCheckinOfficer || isWeighmentOfficer || isQualityOfficer || isProcurementOfficer || isPaymentOfficer) && (
              <div className="hidden sm:flex flex-col pl-3 border-l border-teal-700/50 justify-center h-[32px] sm:h-[40px] shrink min-w-0">
                <span className="text-[9px] lg:text-[10px] text-[#BFE9DA] font-semibold tracking-wider leading-none mb-1">
                  DEPARTMENT
                </span>
                <span className="text-[11px] lg:text-[13px] font-bold text-white tracking-wide leading-none whitespace-nowrap truncate" suppressHydrationWarning>
                  {typeof window !== 'undefined' && sessionStorage.getItem('astra_officer_assignment') 
                    ? (() => {
                        try {
                          const assignment = JSON.parse(sessionStorage.getItem('astra_officer_assignment') || '{}');
                          return assignment.department || assignment.centreName || 'PROCUREMENT CENTRE OPERATIONS';
                        } catch { return 'PROCUREMENT CENTRE OPERATIONS'; }
                      })()
                    : 'PROCUREMENT CENTRE OPERATIONS'}
                </span>
              </div>
            )}
          </div>

          {/* Role-Specific Navigation Links */}
          <nav className={`hidden xl:flex flex-[1_1_auto] justify-center items-center text-teal-50 min-w-0 ${displayAsPublic ? 'gap-8 2xl:gap-12' : 'gap-1 2xl:gap-2'}`}>
            {mounted && (
              displayAsPublic ? (
                secondaryItems.map((item) => (
                  <div key={item.href || item.label} className="relative group flex items-center h-full shrink-0">
                    <Link
                      href={item.href}
                      className={`h-[64px] inline-flex items-center justify-center gap-1.5 text-center leading-[1.25] tracking-[-0.01em] text-[15px] xl:text-[16px] transition-colors border-b-[3px] border-transparent whitespace-nowrap ${
                        item.isActive
                          ? 'font-bold text-[#10B981] px-2.5 rounded-t-lg bg-white/5 border-b-[#10B981]'
                          : 'font-semibold text-teal-50 hover:text-[#10B981] opacity-90 hover:opacity-100 hover:border-b-[#10B981] hover:bg-white/5 px-2.5 rounded-t-lg'
                      }`}
                    >
                      {item.icon && <item.icon className="w-[16px] h-[16px] shrink-0" />}
                      {item.label}
                      {item.children && <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />}
                    </Link>
                    {item.children && (
                      <div className="absolute top-full right-0 hidden group-hover:block bg-[#003F3B] border border-[#005a56] shadow-2xl py-2 rounded-b-lg rounded-tl-lg min-w-[240px] z-50">
                        {item.children.map((child: any) => (
                          <Link key={child.href} href={child.href} className="block px-4 py-3 text-[16px] leading-[1.25] font-semibold text-teal-100 hover:bg-[#004a46] hover:text-white transition-colors">
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                primaryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-2 xl:px-2.5 py-1.5 xl:py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[13px] xl:text-[14px] 2xl:text-[15px] leading-[1.25] tracking-[-0.01em] ${
                        item.isActive ? item.activeCls : item.inactiveCls
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0" />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })
              )
            )}
          </nav>

          {/* Right Side: Language, Help & User Controls */}
          <div className="flex items-center justify-end shrink min-w-0 gap-1.5 xl:gap-2 ml-auto pl-2">
            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              type="button"
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 h-[36px] sm:h-[40px] px-2 sm:px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[14px] xl:text-[15px] font-semibold leading-[1.25] text-teal-50 hover:text-white transition shrink-0"
              title={locale === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
            >
              <Languages className="w-4 h-4 sm:w-4 sm:h-4 text-[#BFE9DA]" />
              <span suppressHydrationWarning className="hidden sm:inline-block">{locale === 'en' ? 'हिन्दी' : 'English'}</span>
              <span suppressHydrationWarning className="sm:hidden">{locale === 'en' ? 'HI' : 'EN'}</span>
            </button>

            {/* Help Button */}
            <button
              onClick={() => setHelpOpen(true)}
              type="button"
              suppressHydrationWarning
              className="hidden lg:inline-flex items-center justify-center gap-1.5 h-[40px] px-2.5 xl:px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[14px] xl:text-[15px] font-semibold leading-[1.25] text-teal-50 hover:text-white transition shrink-0"
              title={t.help}
            >
              <HelpCircle className="w-4 h-4 text-[#BFE9DA]" />
              <span suppressHydrationWarning>Need Help?</span>
            </button>

            {/* Authenticated User Badge (Shows Farmer Name Only when Farmer Login) */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#005a56] shrink min-w-0">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 rounded-lg border border-[#005a56] bg-[#004a46] text-sm shadow-sm shrink min-w-0">
                  <span
                    className={`hidden sm:block w-2 h-2 rounded-full shrink-0 ${
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
                    <span className="font-semibold text-[13px] xl:text-[14px] leading-[1.25] text-white max-w-[60px] sm:max-w-[100px] lg:max-w-[120px] xl:max-w-[160px] truncate">
                      {farmer?.fullName || (user as any)?.fullName || 'Farmer'}
                    </span>
                  ) : (
                    <div className="flex flex-col text-left leading-tight min-w-0">
                      <span className="font-bold text-teal-50 truncate max-w-[60px] sm:max-w-[120px] lg:max-w-[160px]">
                        {getIdentityName(user)}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePortalLogout}
                  type="button"
                  suppressHydrationWarning
                  className="p-1.5 sm:p-2 rounded-lg text-teal-200 hover:text-rose-400 hover:bg-[#002f2d] border border-[#005a56] transition shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}

            {/* Mobile/Tablet Hamburger Toggle */}
            {(displayAsPublic || mounted) && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                type="button"
                suppressHydrationWarning
                className="hidden md:flex xl:hidden items-center justify-center p-1.5 sm:p-2 rounded-lg border border-[#005a56] bg-[#004a46] text-teal-200 hover:text-white transition shrink-0"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-teal-50" /> : <Menu className="w-5 h-5 text-teal-200" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="hidden md:block xl:hidden border-t border-[#002f2d] bg-[#003F3B] px-4 py-3 shadow-2xl">
            <div className="flex flex-col space-y-1">
              {(displayAsPublic ? secondaryItems : primaryItems).map((item) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.href || item.label}>
                    <Link
                      href={item.href}
                      onClick={() => !item.children && setMobileMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-lg font-bold text-[15px] flex items-center justify-between ${
                        item.isActive
                          ? 'text-teal-50 bg-[#002f2d]'
                          : 'text-teal-100 hover:text-white hover:bg-[#004a46]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {!displayAsPublic && Icon && <Icon className="w-5 h-5 opacity-80" />}
                        {item.label}
                      </div>
                      {item.children && <ChevronDown className="w-4 h-4 opacity-70" />}
                    </Link>
                    {item.children && (
                      <div className="flex flex-col ml-3 pl-3 border-l-2 border-[#005a56] space-y-1 mt-1 mb-2">
                        {item.children.map((child: any) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-lg font-semibold text-[14px] text-teal-200 hover:text-white hover:bg-[#004a46]"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
