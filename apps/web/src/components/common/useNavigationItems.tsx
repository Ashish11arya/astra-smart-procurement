import { usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Calendar, Building2, ClipboardList, User,
  LayoutDashboard, Building, Users, FileCheck, History,
  Activity, QrCode, Scale, Sparkles, PackageCheck, CreditCard, ShieldCheck
} from 'lucide-react';

export function useNavigationItems() {
  const { locale, t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isHomePage = pathname === '/';
  const isLoginPage =
    pathname === '/farmer/login' ||
    pathname === '/farmer/register' ||
    pathname === '/authority/login' ||
    pathname === '/verification/login' ||
    pathname === '/operations/login' ||
    pathname === '/centre/login';

  const isPublic = !user || isLoginPage || isHomePage;

  const role = user?.role as string | undefined;
  const isFarmer = role === 'FARMER';
  const isAuthority = role === 'GOVERNMENT_ADMIN';
  const isVerificationAuthority = role === 'FARMER_VERIFICATION_AUTHORITY';
  const isCentreHead = role === 'PROCUREMENT_CENTRE_OFFICER';
  const isCheckinOfficer = role === 'CHECK_IN_OFFICER' || role === 'CHECK_IN';
  const isWeighmentOfficer = role === 'WEIGHMENT_OFFICER' || role === 'WEIGHMENT' || role === 'WEIGHMENT_SUPERVISOR';
  const isQualityOfficer = role === 'QUALITY_OFFICER' || role === 'QUALITY';
  const isProcurementOfficer = role === 'PROCUREMENT_OFFICER' || role === 'PROCUREMENT';
  const isPaymentOfficer = role === 'PAYMENT_OFFICER' || role === 'PAYMENT';

  const currentCentreView = searchParams?.get('view') || 'today';

  let primaryItems: any[] = [];
  let secondaryItems: any[] = []; // for hamburger menu on public pages

  if (isPublic) {
    secondaryItems = [
      { label: locale === 'hi' ? 'मुख्य पृष्ठ' : 'Home', shortLabel: locale === 'hi' ? 'मुख्य' : 'Home', href: '/', icon: Home, isActive: isHomePage },
      { label: locale === 'hi' ? 'खरीद केन्द्र' : 'Find Centres', shortLabel: locale === 'hi' ? 'केन्द्र' : 'Centres', href: '/farmer/centres', icon: Building2, isActive: pathname === '/farmer/centres' },
      { label: locale === 'hi' ? 'किसान पोर्टल' : 'Farmer Portal', shortLabel: locale === 'hi' ? 'किसान' : 'Farmer', href: '/farmer/login', icon: User, isActive: pathname === '/farmer/login' },
    ];
    if (pathname !== '/farmer/login' && pathname !== '/farmer/register') {
      secondaryItems.push(
        { label: locale === 'hi' ? 'केन्द्र कर्मी' : 'Depot Staff', shortLabel: locale === 'hi' ? 'कर्मी' : 'Staff', href: '/operations/login', icon: Users, isActive: pathname === '/operations/login' },
        { 
          label: locale === 'hi' ? 'प्राधिकरण' : 'Authority', 
          shortLabel: locale === 'hi' ? 'अधिकारी' : 'Admin', 
          href: '#', 
          icon: ShieldCheck,
          isActive: pathname === '/authority/login' || pathname === '/verification/login',
          children: [
            { label: locale === 'hi' ? 'प्रशासनिक लॉगिन' : 'Authority Login', href: '/authority/login' },
            { label: locale === 'hi' ? 'किसान सत्यापन प्राधिकरण' : 'Farmer Verification Authority', href: '/verification/login' }
          ]
        }
      );
    }
  } else if (isFarmer) {
    const activeCls = 'text-[#014532] bg-white border border-teal-200 font-bold shadow-md';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    primaryItems = [
      { label: locale === 'hi' ? 'डैशबोर्ड' : 'Dashboard', shortLabel: t.navHome || 'Home', href: '/farmer/dashboard', icon: Home, isActive: pathname === '/farmer/dashboard', activeCls, inactiveCls, iconCls },
      { label: locale === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My Profile', shortLabel: t.navProfile || 'Profile', href: '/farmer/profile', icon: User, isActive: pathname === '/farmer/profile', activeCls, inactiveCls, iconCls },
      { label: locale === 'hi' ? 'सत्यापन स्थिति' : 'Verification Status', shortLabel: t.navStatus || 'Status', href: '/farmer/registration-status', icon: ClipboardList, isActive: pathname === '/farmer/registration-status' || pathname === '/farmer/verification', activeCls, inactiveCls, iconCls },
      { label: locale === 'hi' ? 'केन्द्र खोजें' : 'Find Centres', shortLabel: t.navCentres || 'Find Centre', href: '/farmer/centres', icon: Building2, isActive: pathname === '/farmer/centres' || pathname === '/farmer/book', activeCls, inactiveCls, iconCls },
      { label: locale === 'hi' ? 'मेरी बुकिंग' : 'My Bookings', shortLabel: t.navBookings || 'Bookings', href: '/farmer/visits', icon: Calendar, isActive: pathname === '/farmer/visits' || pathname.startsWith('/farmer/bookings/'), activeCls, inactiveCls, iconCls },
    ];
  } else if (isAuthority) {
    const activeCls = 'text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 font-bold';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    primaryItems = [
      { label: 'Procurement Authority', shortLabel: 'Authority', href: '/authority/dashboard', icon: LayoutDashboard, isActive: pathname === '/authority/dashboard', activeCls, inactiveCls, iconCls },
      { label: 'Centres & Workload', shortLabel: 'Centres', href: '/authority/centres', icon: Building, isActive: pathname.startsWith('/authority/centres'), activeCls, inactiveCls, iconCls },
      { label: 'Personnel', shortLabel: 'Personnel', href: '/authority/personnel', icon: Users, isActive: pathname.startsWith('/authority/personnel'), activeCls, inactiveCls, iconCls },
    ];
  } else if (isVerificationAuthority) {
    const activeCls = 'text-purple-300 bg-purple-950/60 border border-purple-500/40 font-bold';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    primaryItems = [
      { label: 'Farmer Verification', shortLabel: 'Dashboard', href: '/verification/dashboard', icon: LayoutDashboard, isActive: pathname === '/verification/dashboard', activeCls, inactiveCls, iconCls },
      { label: 'Applications Queue', shortLabel: 'Queue', href: '/verification/applications', icon: FileCheck, isActive: pathname.startsWith('/verification/applications'), activeCls, inactiveCls, iconCls },
      { label: 'Audit History', shortLabel: 'History', href: '/verification/history', icon: History, isActive: pathname.startsWith('/verification/history'), activeCls, inactiveCls, iconCls },
    ];
  } else if (isCentreHead) {
    const activeCls = 'text-amber-700 bg-amber-50 border border-amber-200 font-bold';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    primaryItems = [
      { label: 'Today', shortLabel: 'Today', href: '/operations/centre?view=today', icon: LayoutDashboard, isActive: pathname === '/operations/centre' && currentCentreView === 'today', activeCls, inactiveCls, iconCls },
      { label: 'Processing Monitor', shortLabel: 'Monitor', href: '/operations/centre?view=monitor', icon: Activity, isActive: pathname === '/operations/centre' && currentCentreView === 'monitor', activeCls, inactiveCls, iconCls },
      { label: 'Next 7 Days', shortLabel: 'Forecast', href: '/operations/centre?view=forecast', icon: Calendar, isActive: pathname === '/operations/centre' && currentCentreView === 'forecast', activeCls, inactiveCls, iconCls },
      { label: 'Personnel', shortLabel: 'Personnel', href: '/operations/centre?view=personnel', icon: Users, isActive: pathname === '/operations/centre' && currentCentreView === 'personnel', activeCls, inactiveCls, iconCls },
    ];
  } else if (isCheckinOfficer) {
    const activeCls = 'text-teal-300 bg-teal-950/60 border border-teal-500/40 font-bold';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    primaryItems = [
      { label: 'Check-in & Queue', shortLabel: 'Check-in', href: '/operations/checkin', icon: QrCode, isActive: pathname.startsWith('/operations/checkin'), activeCls, inactiveCls, iconCls }
    ];
  } else if (isWeighmentOfficer) {
    const activeCls = 'text-teal-300 bg-teal-950/60 border border-teal-500/40 font-bold';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    
    const currentTab = searchParams?.get('tab') || 'officer';
    
    primaryItems = [
      { label: 'Weighbridge Desk', shortLabel: 'Weighment', href: '/operations/weighment?tab=officer', icon: Scale, isActive: pathname.startsWith('/operations/weighment') && currentTab === 'officer', activeCls, inactiveCls, iconCls },
      { label: 'Completed Weighments', shortLabel: 'Completed', href: '/operations/weighment?tab=history', icon: History, isActive: pathname.startsWith('/operations/weighment') && currentTab === 'history', activeCls, inactiveCls, iconCls },
      { label: 'Supervisor Verification', shortLabel: 'Verify', href: '/operations/weighment?tab=supervisor', icon: ShieldCheck, isActive: pathname.startsWith('/operations/weighment') && currentTab === 'supervisor', activeCls, inactiveCls, iconCls }
    ];
  } else if (isQualityOfficer) {
    const activeCls = 'text-teal-300 bg-teal-950/60 border border-teal-500/40 font-bold';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    primaryItems = [
      { label: 'Quality Assessment', shortLabel: 'Quality', href: '/operations/quality', icon: Sparkles, isActive: pathname.startsWith('/operations/quality'), activeCls, inactiveCls, iconCls }
    ];
  } else if (isProcurementOfficer) {
    const activeCls = 'text-teal-300 bg-teal-950/60 border border-teal-500/40 font-bold';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    primaryItems = [
      { label: 'Procurement', shortLabel: 'Procurement', href: '/operations/procurement', icon: PackageCheck, isActive: pathname.startsWith('/operations/procurement'), activeCls, inactiveCls, iconCls }
    ];
  } else if (isPaymentOfficer) {
    const activeCls = 'text-teal-300 bg-teal-950/60 border border-teal-500/40 font-bold';
    const inactiveCls = 'font-semibold text-teal-100/80 hover:text-white hover:bg-white/10';
    const iconCls = 'w-[18px] h-[18px] shrink-0';
    primaryItems = [
      { label: 'Payments', shortLabel: 'Payments', href: '/operations/payment', icon: CreditCard, isActive: pathname.startsWith('/operations/payment'), activeCls, inactiveCls, iconCls }
    ];
  }

  const isDepotStaff = isCheckinOfficer || isWeighmentOfficer || isQualityOfficer || isProcurementOfficer || isPaymentOfficer || isCentreHead;

  return { primaryItems, secondaryItems, isPublic, isFarmer, isAuthority, isVerificationAuthority, isCentreHead, isCheckinOfficer, isWeighmentOfficer, isQualityOfficer, isProcurementOfficer, isPaymentOfficer, isDepotStaff };
}
