'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  FileText,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, ApiError } from '../../../lib/api';
import {
  RequestOtpResponseDto,
  VerifyOtpResponseDto,
  CheckFarmerRegistrationResponseDto,
  FarmerState,
  RegistrationStatus,
} from '@astra/shared';
import { HelpModal } from '../../../components/common/HelpModal';

type AuthStep = 'ENTER_MOBILE' | 'ENTER_OTP' | 'RESOLVED_STATE';

export default function FarmerLoginPage() {
  const { t, locale } = useLanguage();
  const { loginWithVerifyOtp, farmerState, farmer, registration } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>('ENTER_MOBILE');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [notRegisteredError, setNotRegisteredError] = useState(false);

  // Cooldown countdown timer
  const [cooldown, setCooldown] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  // Verification result cache for this view
  const [authResult, setAuthResult] = useState<VerifyOtpResponseDto | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setNotRegisteredError(false);

    try {
      const res = await apiRequest<RequestOtpResponseDto>('/auth/farmer/request-otp', {
        method: 'POST',
        body: { mobile },
      });
      setSuccessMsg('OTP sent successfully');
      setStep('ENTER_OTP');
      setCooldown(30);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
    } catch (err: any) {
      if (err instanceof ApiError && ((err as any).code === 'NOT_REGISTERED' || err.data?.code === 'NOT_REGISTERED' || err.data?.message === 'NOT_REGISTERED')) {
        setNotRegisteredError(true);
      } else {
        setError(err.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (otpValue: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiRequest<VerifyOtpResponseDto>('/auth/farmer/verify-otp', {
        method: 'POST',
        body: { mobile, otp: otpValue },
      });
      loginWithVerifyOtp(res);
      setAuthResult(res);
      setStep('RESOLVED_STATE');
      setSuccessMsg('Verified successfully');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== '' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <main className="flex-1 flex relative w-full bg-white py-10">
      {/* Subtle overlay to ensure text readability on the left */}
      

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-2 lg:py-4 flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10 h-full">
        
        {/* LEFT CONTENT */}
        <div className="hidden lg:flex flex-col max-w-[500px] mt-0 pr-4">
          <h1 className="text-[#062D3D] text-3xl xl:text-4xl font-bold leading-[1.2] mb-4">
            Access Government<br />Procurement Services
          </h1>
          <p className="text-[#163F50] text-[19px] font-[600] mb-10 max-w-[420px]">
            Login to manage your paddy procurement, check status and track payments securely.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[#DDF5EB] flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6 text-[#006B56]" />
              </div>
              <div>
                <h3 className="text-[#062D3D] text-[18px] font-[800] mb-1">Secure Login</h3>
                <p className="text-[#163F50] text-[15px] font-[600] leading-[1.4]">
                  Access your account using<br/>your registered mobile number.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[#DDF5EB] flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-[#006B56]" />
              </div>
              <div>
                <h3 className="text-[#062D3D] text-[18px] font-[800] mb-1">View Procurement Details</h3>
                <p className="text-[#163F50] text-[15px] font-[600] leading-[1.4]">
                  Check your paddy procurement<br/>records and payment status.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[#DDF5EB] flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-[#006B56]" />
              </div>
              <div>
                <h3 className="text-[#062D3D] text-[18px] font-[800] mb-1">Track Status</h3>
                <p className="text-[#163F50] text-[15px] font-[600] leading-[1.4]">
                  Get real-time updates on your<br/>procurement and payments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT (LOGIN CARD) */}
        <div className="w-full max-w-[520px] bg-white rounded-[22px] shadow-2xl p-5 lg:p-6 border border-slate-100 xl:mr-[4%] my-auto flex flex-col">
          
          <div className="text-center mb-4">
            <div className="w-[60px] h-[60px] rounded-full bg-[#DDF5EB] flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7 text-[#006B56]" />
            </div>
            <h1 className="text-[#062D3D] text-3xl font-bold leading-tight mb-2">
              Farmer Login
            </h1>
            <p className="text-[#234B5D] text-base font-semibold leading-[1.4]">
              Login using your registered mobile number<br className="hidden sm:block" />to continue to your account.
            </p>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-[12px] bg-red-50 text-red-700 flex items-start gap-3 text-[15px] border border-red-100 font-[500]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div>{error}</div>
            </div>
          )}
          
          {successMsg && !error && step !== 'RESOLVED_STATE' && (
            <div className="mb-4 p-3 rounded-[12px] bg-green-50 text-green-700 flex items-start gap-3 text-[15px] border border-green-100 font-[500]">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* STEP 1: MOBILE */}
          {step === 'ENTER_MOBILE' && (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="space-y-4">
                <label htmlFor="mobile-input" className="block text-[16px] font-[700] text-[#062D3D] mb-1">
                  Mobile Number
                </label>
                <div className="flex rounded-[12px] border border-[#D1DFE5] focus-within:border-[#0BAA72] focus-within:ring-1 focus-within:ring-[#0BAA72] bg-white overflow-hidden transition-all shadow-sm">
                  <div className="px-5 py-[16px] bg-[#F8FAFC] border-r border-[#D1DFE5] text-black font-[700] text-[17px] flex items-center select-none">
                    +91
                  </div>
                  <input
                    id="mobile-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    autoFocus
                    required
                    value={mobile}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobile(digits);
                      setError(null);
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-4 py-[14px] text-black font-semibold text-[17px] placeholder:text-[#94A3B8] focus:outline-none bg-white"
                    suppressHydrationWarning
                  />
                </div>
                <div className="flex items-center gap-2 mt-2 text-[#315968] text-[14px] font-[500]">
                  <ShieldCheck className="w-[18px] h-[18px] text-[#0BAA72]" />
                  <span>We will send a 6-digit OTP to verify your mobile number securely.</span>
                </div>
              </div>

              {/* Farmer Not Registered */}
              {notRegisteredError && (
                <div className="p-5 rounded-[16px] bg-[#FFFBEB] border border-[#FEF3C7] space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-[800] text-[#92400E]">
                        {locale === 'hi' ? 'किसान पंजीकृत नहीं है' : 'Farmer Not Registered'}
                      </h3>
                      <p className="text-[14px] text-[#B45309] mt-1 leading-[1.4] font-[500]">
                        {locale === 'hi'
                          ? `इस मोबाइल नंबर (+91 ${mobile}) के लिए कोई किसान पंजीकरण नहीं मिला। कृपया पहले अपना किसान खाता बनाएं।`
                          : `We could not find a farmer registration for mobile +91 ${mobile}. Please register first to create your farmer account.`}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/farmer/register"
                      className="w-full py-3.5 px-4 rounded-[12px] bg-[#0BAA72] hover:bg-[#099664] text-white font-[800] text-[15px] flex items-center justify-center gap-2 transition"
                    >
                      <span>{locale === 'hi' ? 'अभी पंजीकरण करें' : 'Register Now'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setNotRegisteredError(false);
                        setMobile('');
                        setError(null);
                      }}
                      className="py-3.5 px-4 rounded-[12px] bg-white border border-[#E2E8F0] text-[#475569] font-[700] text-[15px] transition hover:bg-[#F8FAFC]"
                    >
                      {locale === 'hi' ? 'दूसरा नंबर दर्ज करें' : 'Try Another Number'}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || mobile.length !== 10}
                className="w-full h-[46px] rounded-[12px] bg-[#0BAA72] hover:bg-[#099664] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] disabled:cursor-not-allowed text-white font-bold text-[17px] flex items-center justify-center gap-2 transition mt-2"
              >
                {loading ? 'Sending...' : 'Get OTP →'}
              </button>

              <div className="pt-4 text-center">
                <span className="text-[#315968] text-[15px] font-[500] mr-2">Don't have a farmer account?</span>
                <Link
                  href="/farmer/register"
                  className="inline-flex items-center text-[15px] font-bold text-[#0BAA72] hover:text-[#099664] transition"
                >
                  Register as New Farmer →
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 'ENTER_OTP' && (
            <div className="space-y-5">
              <div className="p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-[#64748B] font-[600]">Mobile:</span>
                  <span className="text-[16px] font-[800] text-[#062D3D]">
                    +91 {mobile}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('ENTER_MOBILE');
                    setOtp(['', '', '', '', '', '']);
                    setError(null);
                  }}
                  className="text-[14px] font-[800] text-[#0BAA72] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-4 h-4" /> Change
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 sm:w-[50px] sm:h-[56px] text-center text-[22px] font-[800] rounded-[12px] border border-[#D1DFE5] focus:border-[#0BAA72] focus:ring-1 focus:ring-[#0BAA72] bg-white text-[#062D3D] transition shadow-sm"
                    />
                  ))}
                </div>

                {devOtp && (
                  <div className="mt-4 p-3 rounded-[12px] bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between">
                    <div className="text-[13px] text-[#065F46] flex items-center">
                      <span className="font-[800] bg-[#D1FAE5] px-2 py-1 rounded-[6px]">DEV</span>
                      <span className="ml-3 font-[800] text-[16px] tracking-widest">{devOtp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devOtp.split('').slice(0, 6);
                        setOtp(digits);
                        submitOtp(devOtp);
                      }}
                      className="text-[13px] font-[800] bg-[#059669] hover:bg-[#047857] text-white px-3 py-1.5 rounded-[8px] transition"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => submitOtp(otp.join(''))}
                disabled={loading || otp.some((d) => d === '')}
                className="w-full h-[46px] rounded-[12px] bg-[#0BAA72] hover:bg-[#099664] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-bold text-[17px] flex items-center justify-center transition"
              >
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>

              <div className="pt-4 text-center">
                {cooldown > 0 ? (
                  <div className="text-[15px] text-[#475569] font-[600]">
                    Resend in <span className="font-[800] text-[#0F172A]">00:{cooldown < 10 ? `0${cooldown}` : cooldown}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="text-[15px] font-[800] text-[#0BAA72] hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: RESOLVED STATE */}
          {step === 'RESOLVED_STATE' && authResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* STATE A: EXISTING VERIFIED FARMER */}
              {authResult.farmerState === FarmerState.VERIFIED && (
                <div className="space-y-6">
                  <div className="p-6 rounded-[16px] bg-[#F0FDF4] border border-[#BBF7D0]">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-[52px] h-[52px] rounded-[12px] bg-[#22C55E] text-white flex items-center justify-center shadow-md">
                        <UserCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-[800] bg-[#DCFCE7] text-[#166534]">
                          <CheckCircle2 className="w-4 h-4" />
                          Profile Verified
                        </div>
                        <h2 className="text-[20px] font-[900] text-[#064E3B] mt-1">
                          {authResult.farmer?.fullName}
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#BBF7D0] text-[14px]">
                      <div>
                        <span className="text-[#166534] font-[700] block mb-0.5">Farmer ID</span>
                        <span className="font-mono font-[800] text-[#064E3B]">
                          {authResult.farmer?.farmerCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#166534] font-[700] block mb-0.5">Mobile</span>
                        <span className="font-mono font-[800] text-[#064E3B]">
                          +91 {authResult.farmer?.mobile}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/farmer/dashboard')}
                    className="w-full h-[60px] rounded-[12px] bg-[#0BAA72] hover:bg-[#099664] text-white font-[800] text-[18px] flex items-center justify-center gap-2 transition"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>
              )}

              {/* STATE B: UNDER VERIFICATION / SUBMITTED */}
              {(authResult.farmerState === FarmerState.UNDER_VERIFICATION ||
                authResult.farmerState === FarmerState.SUBMITTED) && (
                <div className="space-y-6">
                  <div className="p-6 rounded-[16px] bg-[#FFFBEB] border border-[#FDE68A] space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-[50px] h-[50px] rounded-[12px] bg-[#F59E0B] text-white flex items-center justify-center shadow-md">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[12px] font-[800] text-[#B45309] uppercase tracking-wide">
                          Under Verification
                        </span>
                        <h3 className="font-mono font-[900] text-[#78350F] text-[17px] mt-0.5">
                          {authResult.registration?.registrationNumber}
                        </h3>
                      </div>
                    </div>

                    <p className="text-[14px] text-[#92400E] font-[600] leading-snug">
                      Your registration is currently under review by the authorities. You do not need to resubmit.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/farmer/registration-status')}
                      className="w-full h-[60px] rounded-[12px] bg-[#062D3D] hover:bg-[#0A3D51] text-white font-[800] text-[17px] flex items-center justify-center gap-2 transition shadow-lg"
                    >
                      <FileText className="w-5 h-5" />
                      <span>View Status</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE C: ACTION REQUIRED */}
              {authResult.farmerState === FarmerState.ACTION_REQUIRED && (
                <div className="space-y-6">
                  <div className="p-6 rounded-[16px] bg-[#FEF2F2] border border-[#FECACA] space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-[50px] h-[50px] rounded-[12px] bg-[#EF4444] text-white flex items-center justify-center shadow-md">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[12px] font-[800] text-[#B91C1C] uppercase tracking-wide">
                          Action Required
                        </span>
                        <div className="text-[17px] font-mono font-[900] text-[#7F1D1D] mt-0.5">
                          {authResult.registration?.registrationNumber}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-[12px] bg-white border border-[#FECACA] text-[14px] text-[#991B1B] font-[600]">
                      {authResult.registration?.actionRequiredNotes ||
                        'Please verify and re-submit your bank or land details.'}
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/farmer/register?action=update')}
                    className="w-full h-[60px] rounded-[12px] bg-[#DC2626] hover:bg-[#B91C1C] text-white font-[800] text-[17px] flex items-center justify-center gap-2 transition"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Update Details</span>
                  </button>
                </div>
              )}

              {/* STATE D: NOT REGISTERED */}
              {authResult.farmerState === FarmerState.NOT_REGISTERED && (
                <div className="space-y-6">
                  <div className="p-6 rounded-[16px] bg-[#F1F5F9] border border-[#E2E8F0] text-center space-y-3">
                    <div className="w-[56px] h-[56px] rounded-[14px] bg-white border border-[#CBD5E1] text-[#64748B] mx-auto flex items-center justify-center mb-2 shadow-sm">
                      <FileText className="w-7 h-7" />
                    </div>
                    <h3 className="font-[800] text-[#0F172A] text-[18px]">No Record Found</h3>
                    <p className="text-[15px] text-[#475569] font-[500] leading-snug">
                      We couldn't find a farmer account associated with this mobile number.
                    </p>
                  </div>

                  <button
                    onClick={() => router.push('/farmer/register')}
                    className="w-full h-[60px] rounded-[12px] bg-[#0BAA72] hover:bg-[#099664] text-white font-[800] text-[18px] flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    <span>Start Registration</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>
              )}

              {/* STATE E: DRAFT REGISTRATION */}
              {authResult.farmerState === FarmerState.DRAFT && (
                <div className="space-y-6">
                  <div className="p-6 rounded-[16px] bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-3">
                    <h3 className="font-[800] text-[#0F172A] text-[18px]">Resume Draft</h3>
                    <p className="text-[15px] text-[#475569] font-[500]">
                      You have an incomplete registration draft saved.
                    </p>
                  </div>

                  <button
                    onClick={() => router.push('/farmer/register')}
                    className="w-full h-[60px] rounded-[12px] bg-[#0BAA72] hover:bg-[#099664] text-white font-[800] text-[18px] flex items-center justify-center gap-2 transition"
                  >
                    <span>Resume Draft</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}
