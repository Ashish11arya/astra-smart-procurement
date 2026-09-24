'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Building2,
  Phone,
  BarChart2,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { HelpModal } from '../components/common/HelpModal';
import { apiRequest } from '../lib/api';

interface ProcurementSummary {
  farmersRegistered: number;
  farmersProcessed: number;
  quantityProcured: number;
  procurementCentres: number;
  reportingPeriod: string;
  lastUpdated: string;
}

export default function PublicLandingPage() {
  const { locale } = useLanguage();
  const lang = locale;
  const [helpOpen, setHelpOpen] = useState(false);
  const [stats, setStats] = useState<ProcurementSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        setStatsLoading(true);
        const data = await apiRequest<ProcurementSummary>('/public/procurement-summary');
        if (isMounted && data) {
          setStats(data);
        }
      } catch (err: any) {
        // Fallback for visual rendering if API fails
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, []);

  const formatUpdatedTime = (isoStr?: string) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch { return null; }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#062D3D] flex flex-col font-sans">
      {/* FULL WIDTH HERO SECTION */}
      <section 
        className="w-full relative bg-gray-100 flex items-center"
        style={{
          minHeight: '440px',
          backgroundImage: 'url(/hero-farmer-real.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }}
      >
        {/* Subtle overlay for text readability on left side */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.78) 35%, rgba(255,255,255,0.20) 68%, rgba(255,255,255,0) 100%)'
          }}
        />

        <div className="max-w-[1450px] w-full mx-auto px-6 sm:px-8 relative z-10 py-12 md:py-0">
          <div className="max-w-[650px]">
            <p className="text-[#087A46] font-bold text-[18px] sm:text-[20px] tracking-wide mb-2">
              {lang === 'hi' ? 'शासकीय अनाज उपार्जन' : 'Government Grain Procurement'}
            </p>
            <h1 className="text-[44px] sm:text-[56px] md:text-[64px] font-bold leading-[1.0] tracking-tight mb-6">
              <span className="block text-[#062D3D]">
                {lang === 'hi' ? 'एक कदम' : 'A Step Towards'}
              </span>
              <span className="block text-[#087A46]">
                {lang === 'hi' ? 'समृद्ध किसानों की ओर' : 'Prosperous Farmers'}
              </span>
            </h1>
            <p className="text-[#123B4A] text-[18px] sm:text-[21px] font-medium leading-[1.45] mb-8 max-w-[620px]">
              {lang === 'hi' 
                ? 'उपार्जन यात्रा बुक करें, अधिकृत खरीद केंद्र खोजें, और अपनी उपार्जन और भुगतान स्थिति को ऑनलाइन ट्रैक करें।' 
                : 'Book a procurement visit, find an authorised procurement centre, and track your procurement and payment status online.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/farmer/register"
                className="inline-flex items-center justify-center gap-2 px-8 h-[60px] rounded-[10px] bg-[#10B981] hover:bg-[#0ea572] text-white font-bold text-[18px] transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>{lang === 'hi' ? 'किसान पंजीकरण' : 'Farmer Registration'}</span>
              </Link>
              <Link
                href="/farmer/login"
                className="inline-flex items-center justify-center gap-2 px-8 h-[60px] rounded-[10px] bg-[#2167D5] hover:bg-[#1d5abf] text-white font-bold text-[18px] transition-colors"
              >
                <UserCheck className="w-5 h-5" />
                <span>{lang === 'hi' ? 'किसान लॉगिन' : 'Farmer Login'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROCUREMENT AT A GLANCE */}
      <section className="w-full bg-white py-12">
        <div className="max-w-[1450px] mx-auto px-6 sm:px-8">
          <div className="bg-[#EAF8F2] border border-[#D2EDE1] rounded-[16px] p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-[30px] sm:text-[34px] font-bold text-[#062D3D] leading-tight">
                  {lang === 'hi' ? 'एक नज़र में उपार्जन' : 'Procurement at a Glance'}
                </h2>
                <p className="text-[#315462] text-[16px] sm:text-[18px] font-semibold mt-1">
                  {lang === 'hi' ? 'वर्तमान खरीद सीजन से लाइव डेटा' : 'Live data from the current procurement season'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm font-semibold text-[#315462]">
                <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-md border border-[#D2EDE1]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                  <span>{stats?.reportingPeriod || (lang === 'hi' ? 'खरीफ एवं रबी उपार्जन सत्र 2026-27' : 'Kharif & Rabi Season 2026–27')}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-md border border-[#D2EDE1]">
                  <Clock className="w-4 h-4 text-[#315462]" />
                  <span>
                    {statsLoading
                      ? lang === 'hi' ? 'अपडेट हो रहा है...' : 'Updating...'
                      : stats?.lastUpdated
                      ? `${lang === 'hi' ? 'अंतिम अद्यतन:' : 'Last Updated:'} ${formatUpdatedTime(stats.lastUpdated)}`
                      : lang === 'hi' ? 'सक्रिय प्रणाली' : 'Live System'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Farmers Registered */}
              <div className="bg-white border border-[#D9E9E4] rounded-[12px] p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] sm:text-[17px] font-bold text-[#163D4C] leading-tight">
                    {lang === 'hi' ? 'पंजीकृत किसान' : 'Farmers\nRegistered'}
                  </span>
                  <div className="w-11 h-11 rounded-full bg-[#E3F7EE] text-[#08A86B] flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[36px] sm:text-[42px] font-bold text-[#062D3D] leading-none mt-2">
                  {stats ? stats.farmersRegistered.toLocaleString('en-IN') : '0'}
                </div>
              </div>

              {/* Farmers Processed */}
              <div className="bg-white border border-[#D9E9E4] rounded-[12px] p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] sm:text-[17px] font-bold text-[#163D4C] leading-tight whitespace-pre-line">
                    {lang === 'hi' ? 'संसाधित किसान' : 'Farmers\nProcessed'}
                  </span>
                  <div className="w-11 h-11 rounded-full bg-[#E7F0FF] text-[#2468D8] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[36px] sm:text-[42px] font-bold text-[#062D3D] leading-none mt-2">
                  {stats ? stats.farmersProcessed.toLocaleString('en-IN') : '0'}
                </div>
              </div>

              {/* Quantity Procured */}
              <div className="bg-white border border-[#D9E9E4] rounded-[12px] p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] sm:text-[17px] font-bold text-[#163D4C] leading-tight whitespace-pre-line">
                    {lang === 'hi' ? 'उपार्जित मात्रा' : 'Quantity\nProcured'}
                  </span>
                  <div className="w-11 h-11 rounded-full bg-[#FFF0E4] text-[#E47725] flex items-center justify-center">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[36px] sm:text-[42px] font-bold text-[#062D3D] leading-none mt-2 flex items-baseline gap-1.5">
                  <span>{stats ? stats.quantityProcured.toLocaleString('en-IN') : '0'}</span>
                  <span className="text-[18px] sm:text-[20px] font-bold text-[#315462]">Qtl</span>
                </div>
              </div>

              {/* Procurement Centres */}
              <div className="bg-white border border-[#D9E9E4] rounded-[12px] p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] sm:text-[17px] font-bold text-[#163D4C] leading-tight whitespace-pre-line">
                    {lang === 'hi' ? 'उपार्जन केंद्र' : 'Procurement\nCentres'}
                  </span>
                  <div className="w-11 h-11 rounded-full bg-[#EFE7FF] text-[#7A4DE8] flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[36px] sm:text-[42px] font-bold text-[#062D3D] leading-none mt-2">
                  {stats ? stats.procurementCentres.toLocaleString('en-IN') : '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KEY SERVICES */}
      <section className="w-full bg-white pb-16">
        <div className="max-w-[1450px] mx-auto px-6 sm:px-8">
          <div className="bg-red-50 border border-red-100 rounded-[16px] p-6 sm:p-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-[30px] sm:text-[34px] font-bold text-[#062D3D]">
                  {lang === 'hi' ? 'प्रमुख सेवाएं' : 'Key Services'}
                </h2>
                <div className="w-[45px] h-[4px] bg-red-400 mt-2 rounded-full"></div>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Service 1 */}
            <Link href="/farmer/register" className="group block bg-white border border-[#DCE8E5] rounded-[12px] p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-[52px] h-[52px] shrink-0 rounded-[10px] bg-[#E2F7ED] text-[#08A86B] flex items-center justify-center mt-1">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[19px] sm:text-[21px] font-bold text-[#062D3D] mb-1.5 flex justify-between items-center">
                    {lang === 'hi' ? 'किसान पंजीकरण' : 'Farmer Registration'}
                    <ArrowRight className="w-4 h-4 text-[#08A86B] opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-[#294B58] text-[15px] font-semibold leading-snug">
                    {lang === 'hi' ? 'सरकारी खरीद केंद्रों पर अपनी धान बेचने के लिए ऑनलाइन पंजीकरण करें।' : 'Register online to sell your paddy at government procurement centers.'}
                  </p>
                </div>
              </div>
            </Link>

            {/* Service 2 */}
            <Link href="/farmer/registration-status" className="group block bg-white border border-[#DCE8E5] rounded-[12px] p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-[52px] h-[52px] shrink-0 rounded-[10px] bg-[#E7F0FF] text-[#2468D8] flex items-center justify-center mt-1">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[19px] sm:text-[21px] font-bold text-[#062D3D] mb-1.5 flex justify-between items-center">
                    {lang === 'hi' ? 'उपार्जन स्थिति' : 'Procurement Status'}
                    <ArrowRight className="w-4 h-4 text-[#2468D8] opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-[#294B58] text-[15px] font-semibold leading-snug">
                    {lang === 'hi' ? 'रीयल-टाइम में अपनी धान खरीद स्थिति और भुगतान विवरण की जांच करें।' : 'Check your paddy procurement status and payment details in real time.'}
                  </p>
                </div>
              </div>
            </Link>

            {/* Service 3 */}
            <Link href="/farmer/centres" className="group block bg-white border border-[#DCE8E5] rounded-[12px] p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-[52px] h-[52px] shrink-0 rounded-[10px] bg-[#FFF0E5] text-[#F07824] flex items-center justify-center mt-1">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[19px] sm:text-[21px] font-bold text-[#062D3D] mb-1.5 flex justify-between items-center">
                    {lang === 'hi' ? 'उपार्जन केंद्र' : 'Procurement Centres'}
                    <ArrowRight className="w-4 h-4 text-[#F07824] opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-[#294B58] text-[15px] font-semibold leading-snug">
                    {lang === 'hi' ? 'अपने जिले या ब्लॉक में निकटतम खरीद केंद्र खोजें।' : 'Locate the nearest procurement center in your district or block.'}
                  </p>
                </div>
              </div>
            </Link>

            {/* Service 4 */}
            <button onClick={() => setHelpOpen(true)} className="group block w-full text-left bg-white border border-[#DCE8E5] rounded-[12px] p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-[52px] h-[52px] shrink-0 rounded-[10px] bg-[#EFE7FF] text-[#7A4DE8] flex items-center justify-center mt-1">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[19px] sm:text-[21px] font-bold text-[#062D3D] mb-1.5 flex justify-between items-center">
                    {lang === 'hi' ? 'सहायता एवं समर्थन' : 'Help & Support'}
                    <ArrowRight className="w-4 h-4 text-[#7A4DE8] opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-[#294B58] text-[15px] font-semibold leading-snug">
                    {lang === 'hi' ? 'सहायता के लिए जिला स्तर के अधिकारियों या राज्य हेल्पडेस्क से संपर्क करें।' : 'Reach out to district-level officers or state helpdesk for assistance.'}
                  </p>
                </div>
              </div>
            </button>
          </div>
          </div>
        </div>
      </section>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}
