'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export default function VerificationLoginPage() {
  const router = useRouter();
  const { loginAsVerificationAuthority } = useAuth();
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
        body: { mobile, scope: 'VERIFICATION' },
      });

      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep('OTP');
    } catch (err: any) {
      setError(
        err.message ||
          'Access restricted to appointed Farmer Verification Authority officers only. Ensure you have been appointed by the State Authority.',
      );
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
        body: { mobile, otp, scope: 'VERIFICATION' },
      });

      if (res.token) {
        loginAsVerificationAuthority(res.token, res.user);
        router.push('/verification/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification officer OTP. Please try again.');
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Public Entry Page'}</span>
        </Link>

        {/* Verification Officer Login Card */}
        <div className="bg-[#151C2F] rounded-3xl border border-[#334155] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#0F172A] p-6 text-center space-y-2 border-b border-[#334155] relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-purple-400/10 border border-purple-400/25 flex items-center justify-center mx-auto text-purple-300 shadow-sm">
              <FileCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-purple-800/80">
                {lang === 'hi' ? 'सत्यापन प्राधिकरण' : 'FARMER VERIFICATION AUTHORITY'}
              </span>
              <h1 className="text-xl font-bold text-white pt-2">
                {lang === 'hi' ? 'किसान सत्यापन अधिकारी लॉगिन' : 'Verification Officer Login'}
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                {lang === 'hi'
                  ? 'स्वतंत्र सत्यापन कार्यक्षेत्र: किसान आवेदनों की सूक्ष्म जांच, अभिलेख सत्यापन व निर्णय।'
                  : 'Dedicated scrutiny workspace for farmer registration verification and decisions.'}
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
                    {lang === 'hi' ? 'नियुक्त सत्यापन अधिकारी मोबाइल नंबर' : 'Appointed Verification Officer Mobile'}
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
                      className="w-full text-sm font-semibold rounded-xl border border-[#334155] bg-[#0B1020] py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {lang === 'hi'
                      ? 'केवल राज्य प्राधिकरण द्वारा नियुक्त सत्यापन अधिकारियों को ही अनुमति है।'
                      : 'Restricted strictly to verification officers appointed by the State Authority.'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || mobile.length !== 10}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-500 hover:to-purple-700 active:from-purple-800 active:to-purple-900 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.25)] transition active:scale-[0.99]"
                >
                  <span>
                    {loading
                      ? lang === 'hi'
                        ? 'सत्यापित हो रहा है...'
                        : 'Verifying...'
                      : lang === 'hi'
                      ? 'सुरक्षा OTP भेजें'
                      : 'Send Officer OTP'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-[#0B1020] border border-[#334155] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      {lang === 'hi' ? 'अधिकारी मोबाइल' : 'Officer Mobile'}
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
                    className="text-xs font-bold text-purple-400 hover:underline"
                  >
                    {lang === 'hi' ? 'बदलें' : 'Change'}
                  </button>
                </div>

                {devOtpHint && (
                  <div className="p-2.5 bg-purple-950/50 border border-purple-800/70 rounded-xl text-xs text-purple-300 flex items-center justify-between">
                    <span>
                      Dev OTP: <b className="font-mono">{devOtpHint}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtpHint)}
                      className="text-[11px] font-bold text-purple-400 underline"
                    >
                      Autofill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'hi' ? 'सुरक्षा OTP दर्ज करें' : 'Enter 6-Digit Officer Security OTP'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-xl tracking-widest font-black rounded-xl border border-[#334155] bg-[#0B1020] py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-500 hover:to-purple-700 active:from-purple-800 active:to-purple-900 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.25)] transition active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>
                    {loading
                      ? lang === 'hi'
                        ? 'सत्यापित हो रहा है...'
                        : 'Authenticating...'
                      : lang === 'hi'
                      ? 'सत्यापित करें एवं कार्यक्षेत्र खोलें'
                      : 'Verify & Open Scrutiny Workspace'}
                  </span>
                </button>
              </form>
            )}

            {/* Official Security Advisory Notice */}
            <div className="pt-4 border-t border-[#334155] text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {lang === 'hi'
                    ? 'विभागीय पृथक्करण एवं सुरक्षा प्रोटोकॉल'
                    : 'Departmental Separation Protocol'}
                </span>
              </div>
              <p className="leading-relaxed">
                {lang === 'hi'
                  ? 'किसान पंजीकरणों की जांच व अंतिम निर्णय केवल नियुक्त सत्यापन अधिकारियों द्वारा ही किया जा सकता है। सभी निर्णयों का समय एवं अधिकारी आईडी सहित ऑडिट लॉग तैयार होता है।'
                  : 'Farmer scrutiny and final decisions are strictly executed by appointed Verification Officers. All actions generate immutable digital audit logs with officer ID and timestamps.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          <span>Astra Procurement Network • Farmer Verification Directorate</span>
        </div>
      </div>
    </div>
  );
}
