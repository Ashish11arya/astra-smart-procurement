'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Building2,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export default function PersonnelLoginPage() {
  const router = useRouter();
  const { loginAsOfficer } = useAuth();
  const { locale } = useLanguage();
  const lang = locale;

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await apiRequest('/auth/officer/request-otp', {
        method: 'POST',
        body: { mobile, scope: 'OPERATIONS' },
      });

      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'No authorised personnel account found for this mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await apiRequest('/auth/officer/verify-otp', {
        method: 'POST',
        body: { mobile, otp, scope: 'OPERATIONS' },
      });

      if (res.token) {
        loginAsOfficer(res.token, res.user, res.assignment);

        // Automatic Departmental Routing based on backend assignment
        const role = res.user?.role;
        switch (role) {
          case 'CHECK_IN_OFFICER':
            router.push('/operations/checkin');
            break;
          case 'WEIGHMENT_OFFICER':
            router.push('/operations/weighment');
            break;
          case 'WEIGHMENT_SUPERVISOR':
            router.push('/operations/weighment?tab=supervisor');
            break;
          case 'QUALITY_OFFICER':
            router.push('/operations/quality');
            break;
          case 'PROCUREMENT_OFFICER':
            router.push('/operations/procurement');
            break;
          case 'PAYMENT_OFFICER':
            router.push('/operations/payment');
            break;
          case 'PROCUREMENT_CENTRE_OFFICER':
          default:
            router.push('/operations/centre');
            break;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Top Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Public Entry Page'}</span>
        </Link>

        {/* Official Login Card */}
        <div className="bg-[#151C2F] rounded-3xl border border-[#334155] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#0F172A] p-6 text-center space-y-2 border-b border-[#334155] relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                {lang === 'hi' ? 'अधिकृत कार्मिक' : 'AUTHORISED DEPOT PERSONNEL'}
              </span>
              <h1 className="text-xl font-bold text-white pt-2">
                {lang === 'hi' ? 'खरीद केंद्र संचालन लॉगिन' : 'Procurement Centre Personnel'}
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                {lang === 'hi'
                  ? 'अपने अधिकृत आधिकारिक क्रेडेंशियल्स का उपयोग करके साइन इन करें।'
                  : 'Sign in using your registered official credentials.'}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-7 space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {step === 'MOBILE' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'पंजीकृत आधिकारिक मोबाइल नंबर' : 'Official Registered Mobile'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full text-sm font-semibold rounded-xl border border-[#334155] bg-[#0B1020] py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {lang === 'hi'
                      ? 'केवल प्राधिकृत खरीद केंद्र अधिकारियों के मोबाइल नंबर ही मान्य हैं।'
                      : 'Only mobile numbers registered with active depot assignments can access.'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || mobile.length !== 10}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition active:scale-[0.99]"
                >
                  <span>{loading ? (lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...') : (lang === 'hi' ? 'आधिकारिक OTP भेजें' : 'Send Official OTP')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-[#0B1020] border border-[#334155] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      {lang === 'hi' ? 'आधिकारिक मोबाइल' : 'Official Mobile'}
                    </span>
                    <span className="font-mono font-bold text-white">+91 {mobile}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('MOBILE');
                      setOtp('');
                      setError(null);
                    }}
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    {lang === 'hi' ? 'बदलें' : 'Change'}
                  </button>
                </div>

                {devOtpHint && (
                  <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/70 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                    <span>Dev OTP: <b className="font-mono">{devOtpHint}</b></span>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtpHint)}
                      className="text-[11px] font-bold text-emerald-400 underline"
                    >
                      Autofill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? '6-अंकीय सुरक्षा OTP दर्ज करें' : 'Enter 6-Digit Security OTP'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-xl tracking-widest font-black rounded-xl border border-[#334155] bg-[#0B1020] py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{loading ? (lang === 'hi' ? 'प्रवेश हो रहा है...' : 'Authenticating...') : (lang === 'hi' ? 'सत्यापित करें एवं पोर्टल खोलें' : 'Verify & Access Depot')}</span>
                </button>
              </form>
            )}

            {/* Official Security Advisory Notice */}
            <div className="pt-4 border-t border-[#334155] text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'hi' ? 'आधिकारिक सुरक्षा दिशा-निर्देश' : 'Authorised Personnel Protocol'}</span>
              </div>
              <p className="leading-relaxed">
                {lang === 'hi'
                  ? 'यह पोर्टल केवल नामित खरीद केंद्र अधिकारियों के उपयोग हेतु है। सार्वजनिक पंजीकरण उपलब्ध नहीं है।'
                  : 'This terminal is restricted to officially assigned procurement centre personnel. Public self-registration is disabled.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          <span>Astra Procurement Network • Official Operations Terminal</span>
        </div>
      </div>
    </div>
  );
}
