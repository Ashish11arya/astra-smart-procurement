import os
import re

filepath = r"d:\Astra\apps\web\src\app\operations\login\page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# We will replace from `return (` to the end of the file.
new_return = """  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-[#F8FBF9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-[480px] space-y-6">
        {/* Top Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#014532] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Public Entry Page'}</span>
        </Link>

        {/* Official Login Card */}
        <div className="bg-white rounded-[24px] border border-emerald-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-[#014532] shadow-sm">
              <Building2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50/80 px-3 py-1 rounded-full border border-emerald-100">
                <Shield className="w-3.5 h-3.5 text-[#014532]" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#014532]">
                  {lang === 'hi' ? 'अधिकृत कार्मिक' : 'AUTHORISED DEPOT PERSONNEL'}
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-[#014532] tracking-tight">
                {lang === 'hi' ? 'खरीद केंद्र संचालन' : 'Procurement Centre Personnel'}
              </h1>
              <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
                {lang === 'hi'
                  ? 'अपने पंजीकृत आधिकारिक क्रेडेंशियल्स का उपयोग करके साइन इन करें।'
                  : 'Sign in using your registered official credentials.'}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-emerald-50"></div>

          {/* Form Content */}
          <div className="p-8 pt-6 space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-[14px] text-sm text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {step === 'MOBILE' ? (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#014532]">
                    {lang === 'hi' ? 'आधिकारिक पंजीकृत मोबाइल नंबर' : 'Official Registered Mobile Number'}
                  </label>
                  <div className="relative flex items-center h-[52px] rounded-[14px] border border-emerald-100 overflow-hidden focus-within:border-[#014532] focus-within:ring-1 focus-within:ring-[#014532]/20 transition-all bg-white">
                    <div className="flex items-center justify-center h-full px-4 bg-slate-50 border-r border-emerald-100 text-slate-600 font-semibold text-sm">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit mobile number"
                      className="flex-1 h-full px-4 text-base font-semibold text-gray-900 placeholder-slate-400 focus:outline-none"
                      suppressHydrationWarning
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium pt-1">
                    {lang === 'hi'
                      ? 'केवल प्राधिकृत खरीद केंद्र अधिकारियों के मोबाइल नंबर ही मान्य हैं।'
                      : 'Only mobile numbers registered with active depot assignments can access.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || mobile.length !== 10}
                  className="w-full h-[52px] rounded-[14px] bg-[#00695C] hover:bg-[#00574B] active:bg-[#004D40] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-base flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>{loading ? (lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...') : (lang === 'hi' ? 'आधिकारिक OTP भेजें' : 'Send Official OTP')}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="p-4 bg-slate-50 border border-emerald-100 rounded-[14px] flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-xs font-semibold mb-0.5">
                      {lang === 'hi' ? 'आधिकारिक मोबाइल' : 'Official Mobile'}
                    </span>
                    <span className="font-semibold text-gray-900">+91 {mobile}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('MOBILE');
                      setOtp('');
                      setError(null);
                    }}
                    className="text-sm font-bold text-[#00695C] hover:underline px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    {lang === 'hi' ? 'बदलें' : 'Change'}
                  </button>
                </div>

                {devOtpHint && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[14px] text-sm text-emerald-800 flex items-center justify-between">
                    <span>Dev OTP: <b className="font-mono">{devOtpHint}</b></span>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtpHint)}
                      className="text-sm font-bold text-[#00695C] underline"
                    >
                      Autofill
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#014532]">
                    {lang === 'hi' ? '6-अंकीय सुरक्षा OTP दर्ज करें' : 'Enter 6-Digit Security OTP'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full h-[52px] text-center text-2xl tracking-[0.5em] font-bold rounded-[14px] border border-emerald-100 bg-white text-gray-900 placeholder-slate-300 focus:outline-none focus:border-[#014532] focus:ring-1 focus:ring-[#014532]/20 transition-all"
                    suppressHydrationWarning
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-[52px] rounded-[14px] bg-[#00695C] hover:bg-[#00574B] active:bg-[#004D40] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-base flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{loading ? (lang === 'hi' ? 'प्रवेश हो रहा है...' : 'Authenticating...') : (lang === 'hi' ? 'सत्यापित करें एवं पोर्टल खोलें' : 'Verify & Access Depot')}</span>
                </button>
              </form>
            )}

            <div className="h-px w-full bg-emerald-50"></div>

            {/* Official Security Advisory Notice */}
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-4">
              <div className="flex items-center gap-2 text-[#014532] font-bold mb-1.5">
                <Lock className="w-4 h-4" />
                <span className="text-sm">{lang === 'hi' ? 'आधिकारिक सुरक्षा दिशा-निर्देश' : 'Authorised Personnel Protocol'}</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-900/80 font-medium">
                {lang === 'hi'
                  ? 'यह पोर्टल केवल नामित खरीद केंद्र अधिकारियों के उपयोग हेतु है। सार्वजनिक पंजीकरण उपलब्ध नहीं है।'
                  : 'This terminal is restricted to officially assigned procurement centre personnel. Public self-registration is disabled.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 font-medium">
          <span>Astra Procurement Network • Official Operations Terminal</span>
        </div>
      </div>
    </div>
  );
}
"""

match = re.search(r'  return \(\s*<div.*?^\}', content, re.MULTILINE | re.DOTALL)
if match:
    new_content = content[:match.start()] + new_return
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Could not match the return statement")
