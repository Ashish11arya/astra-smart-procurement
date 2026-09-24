'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  Landmark,
  Save,
  Clock,
  Phone,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { ProgressBar } from '../../../components/common/ProgressBar';
import {
  DISTRICT_LIST,
  getBlocks,
  getPanchayats,
  getVillages,
} from '../../../lib/location-data';
import { apiRequest } from '../../../lib/api';
import {
  Gender,
  FarmerCategory,
  LandOwnershipType,
  FarmerRegistrationDto,
  RegistrationSummaryDto,
  LandParcelDto,
  DocumentDto,
  RequestOtpResponseDto,
  VerifyOtpResponseDto,
  CheckFarmerRegistrationResponseDto,
  FarmerState,
} from '@astra/shared';

function FarmerRegistrationContent() {
  const { t, locale } = useLanguage();
  const { user, token, updateLocalRegistration, loginWithVerifyOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpdateMode = searchParams.get('action') === 'update';

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<RegistrationSummaryDto | null>(null);

  // Form State
  const [personal, setPersonal] = useState({
    fullName: '',
    fatherOrSpouseName: '',
    gender: Gender.MALE,
    category: FarmerCategory.OBC,
    aadhaarNumberMasked: '',
  });

  const [address, setAddress] = useState({
    district: '',
    block: '',
    panchayat: '',
    village: '',
    pincode: '',
    addressLine: '',
  });

  // Mobile & OTP Verification State
  // For fresh registrations (!isUpdateMode), mobile MUST ALWAYS start empty and unverified
  const [mobile, setMobile] = useState(isUpdateMode && user?.mobile ? user.mobile : '');
  const [isMobileVerified, setIsMobileVerified] = useState(isUpdateMode && !!user?.mobile);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [existingRegStatus, setExistingRegStatus] = useState<FarmerState | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Only sync mobile from active user session if in explicit update mode
  useEffect(() => {
    if (isUpdateMode && user?.mobile) {
      setMobile(user.mobile);
      setIsMobileVerified(true);
    }
  }, [isUpdateMode, user?.mobile]);

  // Clean fresh registration state on mount if not updating
  useEffect(() => {
    if (!isUpdateMode) {
      localStorage.removeItem('astra_draft_reg');
    }
  }, [isUpdateMode]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request OTP for Mobile Verification
  const handleRequestOtp = async () => {
    setOtpError(null);
    setOtpSuccessMsg(null);
    setIsAlreadyRegistered(false);
    setExistingRegStatus(null);
    const cleanMobile = mobile.trim().replace(/^(\+91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setOtpError(
        locale === 'hi'
          ? 'कृपया मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit Indian mobile number.',
      );
      return;
    }

    setOtpLoading(true);
    try {
      // 1. Check database first to verify if mobile is already registered
      const checkRes = await apiRequest<CheckFarmerRegistrationResponseDto>(
        '/api/auth/farmer/check-registration',
        {
          method: 'POST',
          body: { mobile: cleanMobile },
        },
      );

      if (checkRes.exists) {
        setIsAlreadyRegistered(true);
        setExistingRegStatus(checkRes.status);
        if (checkRes.status === FarmerState.VERIFIED) {
          setOtpError(
            locale === 'hi'
              ? 'यह मोबाइल नंबर पहले से पंजीकृत एवं सत्यापित है। कृपया किसान लॉगिन का उपयोग करें।'
              : 'This mobile number is already registered and verified. Please use Farmer Login.',
          );
        } else if (
          checkRes.status === FarmerState.UNDER_VERIFICATION ||
          checkRes.status === FarmerState.SUBMITTED
        ) {
          setOtpError(
            locale === 'hi'
              ? 'इस मोबाइल नंबर के लिए पंजीकरण आवेदन पहले से जमा है। कृपया लॉगिन करके स्थिति देखें।'
              : 'A registration application already exists for this mobile number. Please log in to check status.',
          );
        } else if (checkRes.status === FarmerState.ACTION_REQUIRED) {
          setOtpError(
            locale === 'hi'
              ? 'आपके पंजीकरण में सुधार आवश्यक है। कृपया लॉगिन करके विवरण अपडेट करें।'
              : 'Your registration requires corrections. Please log in to update details.',
          );
        } else {
          setOtpError(
            locale === 'hi'
              ? 'यह मोबाइल नंबर पहले से पंजीकृत है। कृपया किसान लॉगिन का उपयोग करें।'
              : 'This mobile number is already registered. Please use Farmer Login.',
          );
        }
        return;
      }

      // Mobile is fresh -> proceed to request OTP with scope: 'REGISTER'
      setIsAlreadyRegistered(false);
      setExistingRegStatus(null);

      const res = await apiRequest<RequestOtpResponseDto>('/api/auth/farmer/request-otp', {
        method: 'POST',
        body: { mobile: cleanMobile, scope: 'REGISTER' },
      });

      if (res.devOtp) {
        setDevOtp(res.devOtp);
      } else {
        setDevOtp(null);
      }

      setOtpSuccessMsg(res.message || (locale === 'hi' ? 'ओटीपी सफलतापूर्वक भेजा गया।' : 'OTP sent successfully.'));
      setCooldown(res.cooldownSeconds || 60);
      setOtpSent(true);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setOtpError(err.message || t.serverError);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const pastedDigits = val.replace(/\D/g, '').slice(0, 6).split('');
      if (pastedDigits.length > 0) {
        const newOtp = [...otpDigits];
        pastedDigits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtpDigits(newOtp);
        const nextFocus = Math.min(pastedDigits.length, 5);
        otpInputRefs.current[nextFocus]?.focus();
        if (newOtp.every((d) => d !== '')) {
          handleVerifyOtp(newOtp.join(''));
        }
        return;
      }
    }

    const digit = val.slice(-1).replace(/\D/g, '');
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (otpOverride?: string) => {
    const otpToVerify = otpOverride || otpDigits.join('');
    if (otpToVerify.length !== 6) {
      setOtpError(locale === 'hi' ? 'कृपया 6-अंकीय ओटीपी दर्ज करें।' : 'Please enter 6-digit OTP.');
      return;
    }

    setOtpError(null);
    setOtpLoading(true);

    const cleanMobile = mobile.trim().replace(/^(\+91|0)/, '');
    try {
      const res = await apiRequest<VerifyOtpResponseDto>('/api/auth/farmer/verify-otp', {
        method: 'POST',
        body: { mobile: cleanMobile, otp: otpToVerify, scope: 'REGISTER' },
      });

      loginWithVerifyOtp(res);
      setMobile(cleanMobile);
      setIsMobileVerified(true);
      setOtpSent(false);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError(null);
      setDevOtp(null);
      setIsAlreadyRegistered(false);

      // If mobile is already registered, redirect immediately
      if (res.farmerState === FarmerState.VERIFIED) {
        setOtpSuccessMsg(
          locale === 'hi'
            ? 'यह मोबाइल नंबर पहले से पंजीकृत एवं सत्यापित है। किसान डैशबोर्ड पर पुनः निर्देशित किया जा रहा है...'
            : 'This mobile number is already registered and verified! Redirecting to Farmer Dashboard...',
        );
        setTimeout(() => router.push('/farmer/dashboard'), 1500);
        return;
      }

      if (
        res.farmerState === FarmerState.SUBMITTED ||
        res.farmerState === FarmerState.UNDER_VERIFICATION
      ) {
        setOtpSuccessMsg(
          locale === 'hi'
            ? 'इस मोबाइल नंबर के लिए पंजीकरण पहले से जमा है। पंजीकरण स्थिति पर पुनः निर्देशित किया जा रहा है...'
            : 'A registration application already exists for this mobile number! Redirecting to status...',
        );
        setTimeout(() => router.push('/farmer/registration-status'), 1500);
        return;
      }

      setOtpSuccessMsg(
        locale === 'hi'
          ? 'मोबाइल नंबर सफलतापूर्वक सत्यापित हो गया!'
          : 'Mobile number verified successfully! You may now proceed with registration.',
      );
    } catch (err: any) {
      setOtpError(err.message || t.otpInvalid);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangeMobile = () => {
    setIsMobileVerified(false);
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError(null);
    setOtpSuccessMsg(null);
    setDevOtp(null);
    setIsAlreadyRegistered(false);
    setExistingRegStatus(null);
  };

  const [landParcels, setLandParcels] = useState<LandParcelDto[]>([
    {
      district: '',
      block: '',
      panchayat: '',
      village: '',
      khasraNumber: '',
      areaAcres: 1.0,
      ownershipType: LandOwnershipType.OWNER,
    },
  ]);

  const [bank, setBank] = useState({
    accountHolderName: '',
    bankName: '',
    branchName: '',
    ifscCode: '',
    accountNumber: '',
    confirmAccountNumber: '',
  });

  const [documents, setDocuments] = useState<DocumentDto[]>([
    {
      documentType: 'IDENTITY',
      fileName: 'aadhaar_card_masked.pdf',
      fileSize: 420000,
      uploadedAt: new Date().toISOString(),
      verified: false,
    },
    {
      documentType: 'LAND',
      fileName: 'land_parcels_khatiyan.pdf',
      fileSize: 850000,
      uploadedAt: new Date().toISOString(),
      verified: false,
    },
    {
      documentType: 'BANK',
      fileName: 'bank_passbook_copy.jpg',
      fileSize: 610000,
      uploadedAt: new Date().toISOString(),
      verified: false,
    },
  ]);

  const [confirmed, setConfirmed] = useState(false);
  const [savedLocallyMsg, setSavedLocallyMsg] = useState(false);

  // Load draft from localStorage only if in update mode
  useEffect(() => {
    if (isUpdateMode) {
      const saved = localStorage.getItem('astra_draft_reg');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.personal) setPersonal(parsed.personal);
          if (parsed.address) setAddress(parsed.address);
          if (parsed.landParcels?.length > 0) setLandParcels(parsed.landParcels);
          if (parsed.bank) setBank(parsed.bank);
        } catch {
          // Ignore parse error
        }
      }
    }
  }, [isUpdateMode]);

  // Save draft locally
  const saveDraft = () => {
    const draft = { personal, address, landParcels, bank, mobile };
    localStorage.setItem('astra_draft_reg', JSON.stringify(draft));
    setSavedLocallyMsg(true);
    setTimeout(() => setSavedLocallyMsg(false), 2500);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!personal.fullName.trim()) {
      setError(locale === 'hi' ? 'कृपया किसान का पूरा नाम दर्ज करें।' : 'Please enter full name.');
      return false;
    }
    if (!personal.fatherOrSpouseName.trim()) {
      setError(
        locale === 'hi'
          ? 'कृपया पिता / पति / अभिभावक का नाम दर्ज करें।'
          : 'Please enter father/husband/guardian name.',
      );
      return false;
    }
    const cleanMobile = mobile.trim().replace(/^(\+91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError(
        locale === 'hi'
          ? 'कृपया मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit Indian mobile number.',
      );
      return false;
    }
    if (!isMobileVerified) {
      setError(
        locale === 'hi'
          ? 'कृपया आगे बढ़ने से पहले मोबाइल नंबर को ओटीपी द्वारा सत्यापित करें।'
          : 'Please verify your mobile number with OTP before proceeding.',
      );
      return false;
    }
    setError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!address.district || !address.block || !address.village) {
      setError(
        locale === 'hi'
          ? 'कृपया जिला, प्रखंड और गांव का चयन करें।'
          : 'Please select district, block, and village.',
      );
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      setError(
        locale === 'hi'
          ? 'कृपया 6 अंकों का मान्य पिन कोड दर्ज करें।'
          : 'Please enter a valid 6-digit PIN code.',
      );
      return false;
    }
    setError(null);
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    for (let i = 0; i < landParcels.length; i++) {
      const p = landParcels[i];
      if (!p.khasraNumber.trim()) {
        setError(
          locale === 'hi'
            ? `पार्सल #${i + 1} के लिए खसरा संख्या दर्ज करें।`
            : `Please enter Khasra / Survey number for Parcel #${i + 1}.`,
        );
        return false;
      }
      if (!p.areaAcres || Number(p.areaAcres) <= 0) {
        setError(
          locale === 'hi'
            ? `पार्सल #${i + 1} के लिए मान्य रकबा (एकड़) दर्ज करें।`
            : `Please enter a valid land area in acres for Parcel #${i + 1}.`,
        );
        return false;
      }
    }
    setError(null);
    return true;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    if (!bank.accountHolderName.trim()) {
      setError(locale === 'hi' ? 'कृपया खाताधारक का नाम दर्ज करें।' : 'Please enter account holder name.');
      return false;
    }
    if (!bank.accountNumber.trim()) {
      setError(locale === 'hi' ? 'कृपया बैंक खाता संख्या दर्ज करें।' : 'Please enter account number.');
      return false;
    }
    if (bank.accountNumber !== bank.confirmAccountNumber) {
      setError(t.accountMismatch);
      return false;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifscCode.trim())) {
      setError(
        locale === 'hi'
          ? 'कृपया मान्य 11-अक्षरीय IFSC कोड दर्ज करें (उदा. SBIN0001234)।'
          : 'Please enter a valid 11-character IFSC code (e.g. SBIN0001234).',
      );
      return false;
    }
    setError(null);
    return true;
  };

  // Navigation handlers
  const handleNext = () => {
    setError(null);
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;

    saveDraft();
    setCurrentStep((prev) => Math.min(prev + 1, 6));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add & Remove Land Parcels
  const addLandParcel = () => {
    setLandParcels((prev) => [
      ...prev,
      {
        district: address.district,
        block: address.block,
        panchayat: address.panchayat,
        village: address.village,
        khasraNumber: '',
        areaAcres: 1.0,
        ownershipType: LandOwnershipType.OWNER,
      },
    ]);
  };

  const removeLandParcel = (idx: number) => {
    if (landParcels.length <= 1) return;
    setLandParcels((prev) => prev.filter((_, i) => i !== idx));
  };

  // Final Registration Submission
  const handleSubmit = async () => {
    if (!confirmed) {
      setError(
        locale === 'hi'
          ? 'कृपया जानकारी की सत्यता प्रमाणित करने वाले चेकबॉक्स को टिक करें।'
          : 'Please check the confirmation box before submitting.',
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    const cleanMobile = mobile.trim().replace(/^(\+91|0)/, '');
    const payload: FarmerRegistrationDto = {
      personal: {
        ...personal,
        mobile: cleanMobile || user?.mobile || '',
      },
      address,
      landParcels: landParcels.map((p) => ({
        ...p,
        district: p.district || address.district,
        block: p.block || address.block,
        panchayat: p.panchayat || address.panchayat,
        village: p.village || address.village,
        areaAcres: Number(p.areaAcres),
      })),
      bank: {
        accountHolderName: bank.accountHolderName.trim(),
        bankName: bank.bankName.trim() || 'State Bank of India',
        branchName: bank.branchName.trim() || 'Main Branch',
        ifscCode: bank.ifscCode.trim().toUpperCase(),
        accountNumber: bank.accountNumber.trim(),
      },
      documents,
    };

    try {
      const endpoint = isUpdateMode ? '/api/farmer/registration' : '/api/farmer/registration';
      const method = isUpdateMode ? 'PUT' : 'POST';

      const res = await apiRequest<RegistrationSummaryDto>(endpoint, {
        method,
        body: payload,
      });

      updateLocalRegistration(res);
      localStorage.removeItem('astra_draft_reg');
      setSubmittedResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || t.serverError);
    } finally {
      setSubmitting(false);
    }
  };

  // Document upload simulation
  const handleDocUpload = (type: 'IDENTITY' | 'LAND' | 'BANK', fileName: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.documentType === type
          ? { ...doc, fileName, uploadedAt: new Date().toISOString() }
          : doc,
      ),
    );
  };

  // Mask display account number
  const maskedAcc = bank.accountNumber.length >= 4
    ? `••••••••${bank.accountNumber.slice(-4)}`
    : bank.accountNumber;

  // ==========================================================================
  // VIEW: SUBMITTED CONFIRMATION SCREEN
  // ==========================================================================
  if (submittedResult) {
    return (
      <main className="min-h-screen overflow-x-hidden w-full relative flex items-center justify-center p-4">
        {/* Background with explicit opacity matching exactly the reference image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/farmer-registration-bg.png')",
            opacity: 0.9,
          }}
        />
        <div className="absolute inset-0 z-0 bg-black/10" />

        <div className="relative z-10 w-full max-w-2xl mx-auto my-8">
          <div className="bg-[#151C2F] rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
          <div className="bg-[#F8FAFC] p-8 text-[#062D3D] text-center border-b border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9 text-[#0BAA72]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#062D3D]">{t.regSubmittedTitle}</h1>
            <p className="text-[#64748B] text-sm mt-2 max-w-md mx-auto leading-relaxed">
              {t.regSubmittedDesc}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#0BAA72] uppercase tracking-wider">
                    {t.regId}
                  </span>
                  <div className="text-xl font-mono font-extrabold text-[#062D3D] mt-0.5">
                    {submittedResult.registrationNumber}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  {t.statusUnderVerification}
                </span>
              </div>

              {/* Status Timeline */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-[#0BAA72] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.statusSubmitted}
                  </span>
                  <span className="text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {t.statusUnderVerification}
                  </span>
                  <span className="text-slate-500">{t.statusVerified}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-50 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full w-2/3"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/farmer/registration-status')}
                className="w-full py-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-[#062D3D] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>{t.goToStatus}</span>
                <ArrowRight className="w-4 h-4 text-[#0BAA72]" />
              </button>

              <button
                onClick={() => router.push('/farmer/dashboard')}
                className="w-full py-4 rounded-2xl bg-[#0BAA72] hover:bg-[#099664] active:scale-[0.99] text-[#062D3D] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition"
              >
                <span>{t.goToDashboard}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        </div>
      </main>
    );
  }

  // ==========================================================================
  // VIEW: 6-STEP WIZARD FORM
  // ==========================================================================
  return (
    <main className="min-h-screen overflow-x-hidden w-full relative flex items-center justify-center p-4">
      {/* Background with explicit opacity matching exactly the reference image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/farmer-registration-bg.png')",
          opacity: 0.9,
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/10" />

      <div className="relative z-10 w-full max-w-[800px] mx-auto text-[#062D3D] my-8">
        {/* Wizard Header & Progress Bar */}
        <div className="mb-0 bg-white p-6 rounded-[24px] rounded-b-none border border-slate-200 shadow-sm relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-[28px] font-[900] text-[#062D3D] tracking-tight">
                {isUpdateMode ? (locale === 'hi' ? 'विवरण अद्यतन करें' : 'Update Details') : (locale === 'hi' ? 'किसान पंजीकरण' : 'Farmer Registration')}
              </h1>
              <p className="text-[14px] font-[500] text-[#64748B] mt-1">
                {locale === 'hi' ? 'पोर्टल पर किसान के रूप में पंजीकरण करने के लिए निम्नलिखित चरणों को पूरा करें।' : 'Complete the following steps to register as a farmer on the portal.'}
              </p>
            </div>

            <button
              suppressHydrationWarning
              type="button"
              onClick={saveDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-[14px] font-[800] text-[#0BAA72] transition"
            >
              <Save className="w-4 h-4" />
              <span>{savedLocallyMsg ? 'Saved!' : 'Save Progress'}</span>
            </button>
          </div>

          <ProgressBar
            currentStep={currentStep}
            totalSteps={6}
            onStepClick={(step) => setCurrentStep(step)}
          />
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-0 p-4 bg-red-50 border-x border-red-200 text-red-600 flex items-start gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="font-semibold">{error}</div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-[#F8FAFC] rounded-[24px] rounded-t-none border border-slate-200 shadow-xl p-6 sm:p-8 pt-6 relative z-0">
        {/* ============================================================ */}
        {/* STEP 1: PERSONAL DETAILS                                     */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[18px] font-[800] text-[#062D3D]">{t.personalTitle}</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">
                {locale === 'hi' ? 'कृपया अपना नाम आधार या सरकारी पहचान पत्र के अनुसार दर्ज करें।' : 'Enter your name exactly as shown on your official government identification.'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                  {t.fullName} <span className="text-rose-500">*</span>
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  required
                  value={personal.fullName}
                  onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full px-4 py-3.5 rounded-[12px] border border-slate-300 bg-white text-[#062D3D] placeholder-slate-400 focus:border-[#0BAA72] focus:ring-1 focus:ring-[#0BAA72]/20 font-[600] text-[16px] transition shadow-sm"
                />
              </div>

              {/* Father / Husband Name */}
              <div>
                <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                  {t.fatherSpouseName} <span className="text-rose-500">*</span>
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  required
                  value={personal.fatherOrSpouseName}
                  onChange={(e) => setPersonal({ ...personal, fatherOrSpouseName: e.target.value })}
                  placeholder={t.fatherSpousePlaceholder}
                  className="w-full px-4 py-3.5 rounded-[12px] border border-slate-300 bg-white text-[#062D3D] placeholder-slate-400 focus:border-[#0BAA72] focus:ring-1 focus:ring-[#0BAA72]/20 font-[600] text-[16px] transition shadow-sm"
                />
              </div>

              {/* Gender & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.gender}
                  </label>
                  <select
                    value={personal.gender}
                    onChange={(e) => setPersonal({ ...personal, gender: e.target.value as Gender })}
                    className="w-full px-4 py-3.5 rounded-[12px] border border-slate-300 bg-white text-[#062D3D] focus:border-[#0BAA72] focus:ring-1 focus:ring-[#0BAA72]/20 font-[600] text-[16px] transition shadow-sm"
                  >
                    <option value={Gender.MALE} className="bg-[#F8FAFC] text-[#062D3D]">{t.male}</option>
                    <option value={Gender.FEMALE} className="bg-[#F8FAFC] text-[#062D3D]">{t.female}</option>
                    <option value={Gender.OTHER} className="bg-[#F8FAFC] text-[#062D3D]">{t.other}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.category}
                  </label>
                  <select
                    value={personal.category}
                    onChange={(e) =>
                      setPersonal({ ...personal, category: e.target.value as FarmerCategory })
                    }
                    className="w-full px-4 py-3.5 rounded-[12px] border border-slate-300 bg-white text-[#062D3D] focus:border-[#0BAA72] focus:ring-1 focus:ring-[#0BAA72]/20 font-[600] text-[16px] transition shadow-sm"
                  >
                    <option value={FarmerCategory.OBC} className="bg-[#F8FAFC] text-[#062D3D]">{t.obc}</option>
                    <option value={FarmerCategory.GENERAL} className="bg-[#F8FAFC] text-[#062D3D]">{t.gen}</option>
                    <option value={FarmerCategory.SC} className="bg-[#F8FAFC] text-[#062D3D]">{t.sc}</option>
                    <option value={FarmerCategory.ST} className="bg-[#F8FAFC] text-[#062D3D]">{t.st}</option>
                  </select>
                </div>
              </div>

              {/* Mobile Number & OTP Verification */}
              {isMobileVerified ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#64748B]">
                      {t.mobileLabel} <span className="text-rose-500">*</span>
                    </label>
                    {!isUpdateMode && (
                      <button
                        type="button"
                        onClick={handleChangeMobile}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0BAA72] hover:text-[#0BAA72] hover:underline"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{t.changeMobile}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white border border-emerald-500/40 text-[#062D3D] font-mono font-bold text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0BAA72]" />
                      <span>+91 {mobile}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0BAA72] bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/40">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      {t.verifiedBadge}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                      {t.mobileLabel} <span className="text-rose-500">*</span>
                      <span className="text-slate-500 font-normal ml-1.5">
                        ({locale === 'hi' ? 'सत्यापन हेतु ओटीपी भेजा जाएगा' : 'Required for official OTP verification'})
                      </span>
                    </label>
                    <div className="flex rounded-[12px] border border-slate-300 focus-within:border-[#0BAA72] focus-within:ring-1 focus-within:ring-[#0BAA72]/20 overflow-hidden bg-white transition shadow-sm">
                      <div className="px-4 py-3.5 bg-[#F8FAFC] border-r border-slate-300 text-[#64748B] font-bold text-[16px] flex items-center font-mono">
                        +91
                      </div>
                      <input
                        suppressHydrationWarning
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={mobile}
                        disabled={otpSent && cooldown > 0}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setMobile(digits);
                          setOtpError(null);
                        }}
                        placeholder="e.g. 9876543210"
                        className="w-full px-4 py-3.5 bg-transparent text-[#062D3D] font-mono font-[600] text-[16px] placeholder:text-slate-400 focus:outline-none tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={otpLoading || mobile.length !== 10 || (otpSent && cooldown > 0)}
                        className="px-4 py-2 my-1 mr-1.5 rounded-lg bg-[#0BAA72] hover:bg-[#099664] active:bg-[#077D53] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shrink-0 transition flex items-center gap-1.5 shadow-sm"
                      >
                        {otpLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : otpSent && cooldown > 0 ? (
                          <span className="font-mono">00:{cooldown < 10 ? `0${cooldown}` : cooldown}</span>
                        ) : (
                          <span>{otpSent ? t.resendOtp : (locale === 'hi' ? 'ओटीपी प्राप्त करें' : 'Get OTP')}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Already Registered Notification with Action */}
                  {isAlreadyRegistered && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-amber-700">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-amber-800">
                            {locale === 'hi'
                              ? 'यह मोबाइल नंबर पहले से पंजीकृत है।'
                              : 'This mobile number is already registered.'}
                          </div>
                          <p className="text-[11px] text-amber-700/80 mt-0.5">
                            {existingRegStatus === FarmerState.VERIFIED
                              ? (locale === 'hi' ? 'यह खाता पहले से सत्यापित है। कृपया अपने किसान डैशबोर्ड में लॉगिन करें।' : 'This account is already verified. Please sign in to your Farmer Dashboard.')
                              : existingRegStatus === FarmerState.SUBMITTED || existingRegStatus === FarmerState.UNDER_VERIFICATION
                              ? (locale === 'hi' ? 'इस नंबर के लिए आवेदन पहले से जमा है। कृपया स्थिति देखने के लिए लॉगिन करें।' : 'An application is already submitted for this mobile. Please log in to check your status.')
                              : (locale === 'hi' ? 'कृपया अपनी मौजूदा प्रोफ़ाइल के साथ आगे बढ़ने के लिए किसान लॉगिन का उपयोग करें।' : 'Please use Farmer Login to access your existing registration.')}
                          </p>
                        </div>
                      </div>
                      <div className="pt-1">
                        <Link
                          href="/farmer/login"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                        >
                          <span>{locale === 'hi' ? 'किसान लॉगिन पर जाएं' : 'Go to Farmer Login'}</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* OTP Feedback Messages */}
                  {otpError && !isAlreadyRegistered && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-start gap-2.5 text-xs animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{otpError}</span>
                    </div>
                  )}

                  {otpSuccessMsg && !otpError && (
                    <div className="p-3 rounded-xl bg-[#E6F6F0] border border-[#0BAA72]/20 text-[#0BAA72] flex items-start gap-2.5 text-xs animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-[#0BAA72] shrink-0 mt-0.5" />
                      <span className="font-medium">{otpSuccessMsg}</span>
                    </div>
                  )}

                  {/* Inline 6-Digit OTP Entry */}
                  {otpSent && !isMobileVerified && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">
                          {locale === 'hi' ? '6-अंकीय ओटीपी दर्ज करें' : 'Enter 6-Digit OTP'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono font-bold">
                          +91 {mobile}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        {otpDigits.map((digit, idx) => (
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
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpDigitKeyDown(idx, e)}
                            className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 bg-white text-[#062D3D] font-mono transition"
                            aria-label={`Digit ${idx + 1}`}
                          />
                        ))}
                      </div>

                      {devOtp && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-300 flex items-center justify-between gap-2 animate-in fade-in shadow-sm">
                          <span className="text-[11px] text-black font-mono">
                            Dev OTP: <strong className="text-black text-xs font-bold">{devOtp}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const digits = devOtp.split('').slice(0, 6);
                              setOtpDigits(digits);
                              handleVerifyOtp(devOtp);
                            }}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-[#062D3D] font-bold rounded-lg text-[11px] transition shadow-sm"
                          >
                            {locale === 'hi' ? 'स्वतः भरें और सत्यापित करें' : 'Auto-fill & Verify'}
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleVerifyOtp()}
                        disabled={otpLoading || otpDigits.some((d) => d === '')}
                        className="w-full py-3 rounded-xl bg-[#0BAA72] hover:bg-[#099664] active:from-emerald-700 active:to-teal-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-[#062D3D] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99]"
                      >
                        {otpLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>{locale === 'hi' ? 'ओटीपी सत्यापित करें' : 'Verify Mobile OTP'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Aadhaar / MSP Notice */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs text-black flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0BAA72] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {locale === 'hi'
                    ? 'आपके पंजीकरण विवरण आधिकारिक भूमि एवं बैंक रिकॉर्ड से सुरक्षित रूप से सत्यापित किए जाते हैं ताकि न्यूनतम समर्थन मूल्य (MSP) का सीधा डीबीटी भुगतान सुनिश्चित हो सके।'
                    : 'Your registration details are securely verified against government land and banking records to ensure direct Minimum Support Price (MSP) payments.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: ADDRESS & CASCADING JURISDICTION                     */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[18px] font-[800] text-[#062D3D]">{t.addressTitle}</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">{t.addressSubtitle}</p>
            </div>

            <div className="space-y-4">
              {/* District */}
              <div>
                <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                  {t.district} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={address.district}
                  onChange={(e) => {
                    const dist = e.target.value;
                    setAddress({
                      ...address,
                      district: dist,
                      block: '',
                      panchayat: '',
                      village: '',
                    });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#062D3D] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium text-sm transition"
                >
                  <option value="" className="bg-[#F8FAFC] text-slate-500">-- {t.selectDistrict} --</option>
                  {DISTRICT_LIST.map((dist) => (
                    <option key={dist} value={dist} className="bg-[#F8FAFC] text-[#062D3D]">
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Block & Panchayat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.block} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!address.district}
                    value={address.block}
                    onChange={(e) => {
                      const blk = e.target.value;
                      setAddress({
                        ...address,
                        block: blk,
                        panchayat: '',
                        village: '',
                      });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#062D3D] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-[#F8FAFC] text-slate-500">-- {t.selectBlock} --</option>
                    {getBlocks(address.district).map((blk) => (
                      <option key={blk} value={blk} className="bg-[#F8FAFC] text-[#062D3D]">
                        {blk}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.panchayat}
                  </label>
                  <select
                    disabled={!address.block}
                    value={address.panchayat}
                    onChange={(e) => {
                      const pan = e.target.value;
                      setAddress({ ...address, panchayat: pan, village: '' });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#062D3D] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-[#F8FAFC] text-slate-500">-- {t.selectPanchayat} --</option>
                    {getPanchayats(address.district, address.block).map((pan) => (
                      <option key={pan} value={pan} className="bg-[#F8FAFC] text-[#062D3D]">
                        {pan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Revenue Village */}
              <div>
                <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                  {t.village} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={!address.panchayat}
                  value={address.village}
                  onChange={(e) => setAddress({ ...address, village: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#062D3D] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-[#F8FAFC] text-slate-500">-- {t.selectVillage} --</option>
                  {getVillages(address.district, address.block, address.panchayat).map((vil) => (
                    <option key={vil} value={vil} className="bg-[#F8FAFC] text-[#062D3D]">
                      {vil}
                    </option>
                  ))}
                </select>
              </div>

              {/* PIN Code & House / Address Line */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.pincode} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={address.pincode}
                    onChange={(e) =>
                      setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder={t.pincodePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#062D3D] font-mono placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-medium text-sm transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.addressLine}
                  </label>
                  <input
                    type="text"
                    value={address.addressLine}
                    onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                    placeholder={t.addressPlaceholder}
                    className="w-full px-4 py-3 rounded-[12px] border border-slate-200 bg-white text-[#062D3D] placeholder-slate-400 focus:border-[#0BAA72] focus:ring-1 focus:ring-[#0BAA72]/20 font-[600] text-[15px] transition shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: LAND DETAILS & MULTI-PARCEL                          */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-[800] text-[#062D3D]">{t.landTitle}</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">{t.landSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={addLandParcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#0BAA72] border border-emerald-500/30 text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addParcel}</span>
              </button>
            </div>

            <div className="space-y-5">
              {landParcels.map((parcel, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 relative space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0BAA72]">
                      {t.parcelNumber.replace('{index}', String(idx + 1))}
                    </span>
                    {landParcels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLandParcel(idx)}
                        className="text-rose-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.removeParcel}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                        {t.khasraNumber} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={parcel.khasraNumber}
                        onChange={(e) => {
                          const updated = [...landParcels];
                          updated[idx].khasraNumber = e.target.value;
                          setLandParcels(updated);
                        }}
                        placeholder={t.khasraPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#062D3D] font-mono placeholder-slate-400 focus:border-emerald-500 font-medium text-xs transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                        {t.areaAcres} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={parcel.areaAcres}
                        onChange={(e) => {
                          const updated = [...landParcels];
                          updated[idx].areaAcres = parseFloat(e.target.value) || 0;
                          setLandParcels(updated);
                        }}
                        placeholder={t.areaPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#062D3D] font-mono placeholder-slate-400 focus:border-emerald-500 font-medium text-xs transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                        {t.ownershipType}
                      </label>
                      <select
                        value={parcel.ownershipType}
                        onChange={(e) => {
                          const updated = [...landParcels];
                          updated[idx].ownershipType = e.target.value as LandOwnershipType;
                          setLandParcels(updated);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#062D3D] focus:border-emerald-500 font-medium text-xs transition"
                      >
                        <option value={LandOwnershipType.OWNER} className="bg-[#F8FAFC] text-[#062D3D]">{t.owner}</option>
                        <option value={LandOwnershipType.TENANT} className="bg-[#F8FAFC] text-[#062D3D]">{t.tenant}</option>
                        <option value={LandOwnershipType.SHARECROPPER} className="bg-[#F8FAFC] text-[#062D3D]">{t.sharecropper}</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4: BANK DETAILS                                         */}
        {/* ============================================================ */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[18px] font-[800] text-[#062D3D]">{t.bankTitle}</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">{t.bankSubtitle}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                  {t.accountHolderName} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bank.accountHolderName}
                  onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar Sharma"
                  className="w-full px-4 py-3 rounded-[12px] border border-slate-200 bg-white text-[#062D3D] placeholder-slate-400 focus:border-[#0BAA72] focus:ring-1 focus:ring-[#0BAA72]/20 font-[600] text-[15px] transition shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.bankName}
                  </label>
                  <input
                    type="text"
                    value={bank.bankName}
                    onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-4 py-3 rounded-[12px] border border-slate-200 bg-white text-[#062D3D] placeholder-slate-400 focus:border-[#0BAA72] focus:ring-1 focus:ring-[#0BAA72]/20 font-[600] text-[15px] transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.ifscCode} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={bank.ifscCode}
                    onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase() })}
                    placeholder={t.ifscPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#0BAA72] placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono font-bold text-sm tracking-wider uppercase transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.accountNumber} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter Account Number"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#062D3D] placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono font-bold text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-[700] text-[#062D3D] mb-1.5">
                    {t.confirmAccountNumber} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bank.confirmAccountNumber}
                    onChange={(e) =>
                      setBank({ ...bank, confirmAccountNumber: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="Re-enter Account Number"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#062D3D] placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono font-bold text-sm transition"
                  />
                </div>
              </div>

              {bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber && (
                <div className="text-xs text-rose-500 font-bold flex items-center gap-1.5 p-3 rounded-xl bg-rose-950/30 border border-rose-800/40">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{t.accountMismatch}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 font-medium leading-relaxed">
                {t.bankDisclaimer}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 5: DOCUMENTS UPLOAD                                     */}
        {/* ============================================================ */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[18px] font-[800] text-[#062D3D]">{t.docTitle}</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">{t.docSubtitle}</p>
            </div>

            <div className="space-y-4">
              {[
                { type: 'IDENTITY' as const, label: t.docIdentity, opt: false },
                { type: 'LAND' as const, label: t.docLand, opt: false },
                { type: 'BANK' as const, label: t.docBank, opt: true },
              ].map((item, idx) => {
                const doc = documents.find((d) => d.documentType === item.type);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#0BAA72] flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#062D3D]">{item.label}</div>
                        <div className="text-[13px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-[#0BAA72] font-semibold">
                            {doc?.fileName || 'No file selected'}
                          </span>
                          <span>•</span>
                          <span>PDF, JPG, PNG (Max 5MB)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151C2F] hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-200 transition shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-[#0BAA72]" />
                        <span>{doc?.fileName ? t.replace : t.uploadBtn}</span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleDocUpload(item.type, e.target.files[0].name);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 6: REVIEW & CONFIRMATION                                */}
        {/* ============================================================ */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[18px] font-[800] text-[#062D3D]">{t.reviewTitle}</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">{t.reviewSubtitle}</p>
            </div>

            <div className="space-y-4">
              {/* Section 1: Personal */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    {t.personalTitle}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-[#0BAA72] hover:text-[#0BAA72]"
                  >
                    {t.edit}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">{t.fullName}:</span>{' '}
                    <strong className="text-[#062D3D] font-semibold">{personal.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.fatherSpouseName}:</span>{' '}
                    <strong className="text-[#062D3D] font-semibold">{personal.fatherOrSpouseName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.gender}:</span>{' '}
                    <strong className="text-[#062D3D]">{personal.gender || "Male"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.mobileLabel}:</span>{' '}
                    <strong className="text-[#062D3D] font-mono">+91 {mobile || user?.mobile}</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: Address */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    {t.addressTitle}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-[#0BAA72] hover:text-[#0BAA72]"
                  >
                    {t.edit}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">{t.district}:</span>{' '}
                    <strong className="text-[#062D3D]">{address.district}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.block}:</span>{' '}
                    <strong className="text-[#062D3D]">{address.block}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.village}:</span>{' '}
                    <strong className="text-[#062D3D]">{address.village}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.pincode}:</span>{' '}
                    <strong className="text-[#062D3D] font-mono">{address.pincode}</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Land */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    {t.landTitle} ({landParcels.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs font-bold text-[#0BAA72] hover:text-[#0BAA72]"
                  >
                    {t.edit}
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {landParcels.map((p, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span>
                        Parcel #{i + 1}: Khasra <strong className="text-[#0BAA72] font-mono font-bold text-base">{p.khasraNumber}</strong>
                      </span>
                      <span>
                        <strong className="text-[#062D3D]">{p.areaAcres} Acres</strong> ({p.ownershipType})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Bank */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    {t.bankTitle}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-xs font-bold text-[#0BAA72] hover:text-[#0BAA72]"
                  >
                    {t.edit}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">{t.accountHolderName}:</span>{' '}
                    <strong className="text-[#062D3D]">{bank.accountHolderName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.ifscCode}:</span>{' '}
                    <strong className="text-[#0BAA72] font-mono font-bold">{bank.ifscCode}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">{t.accountNumber}:</span>{' '}
                    <strong className="text-[#062D3D] font-mono font-bold tracking-wider">{maskedAcc}</strong>
                  </div>
                </div>
              </div>

              {/* Mandatory Confirmation Checkbox */}
              <div className="pt-4 border-t border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl bg-emerald-50 border border-emerald-200 select-none">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-200 bg-white"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-emerald-800 leading-snug">
                    {t.confirmDeclaration}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#64748B] font-bold text-sm flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.back}</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-3.5 rounded-xl bg-[#0BAA72] hover:bg-[#099664] text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-[0.99]"
            >
              <span>{t.next}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !confirmed}
              className="px-8 py-4 rounded-xl bg-[#0BAA72] hover:bg-[#099664] disabled:opacity-40 disabled:cursor-not-allowed text-[#062D3D] font-bold text-base flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-[0.99]"
            >
              {submitting ? (
                <span>{t.submitting}</span>
              ) : (
                <>
                  <span>{t.submitRegistration}</span>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  </main>
);
}

export default function FarmerRegistrationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-slate-500 font-semibold">
          Loading registration...
        </div>
      }
    >
      <FarmerRegistrationContent />
    </React.Suspense>
  );
}
