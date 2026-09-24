'use client';

import React from 'react';
import { Phone, Clock, HelpCircle, X, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { t, locale } = useLanguage();

  if (!isOpen) return null;

  const faqs = [
    {
      q:
        locale === 'hi'
          ? 'क्या मोबाइल ओटीपी सत्यापन का मतलब है कि मैं खरीद के लिए सत्यापित हो गया हूं?'
          : 'Does mobile OTP verification mean I am approved for procurement?',
      a:
        locale === 'hi'
          ? 'नहीं। मोबाइल ओटीपी केवल आपके फोन नंबर के नियंत्रण की पुष्टि करता है। आपकी किसान प्रोफ़ाइल और भूमि अभिलेखों का सत्यापन अधिकृत प्राधिकारी द्वारा स्वतंत्र रूप से किया जाता है।'
          : 'No. Mobile OTP proves possession of your phone number only. Government identity and land record validation is conducted by the authorized procurement authority.',
    },
    {
      q:
        locale === 'hi'
          ? 'खरीद स्लॉट बुकिंग कब खुलेगी?'
          : 'When does procurement visit booking open?',
      a:
        locale === 'hi'
          ? 'पंजीकरण सत्यापन पूरा होने के बाद आपके नामित खरीद केंद्र के फसल कैलेंडर और क्षमता के अनुसार बुकिंग खुलेगी।'
          : 'Once your registration is verified, procurement slot scheduling will open based on your designated centre capacity and local harvest calendar.',
    },
    {
      q:
        locale === 'hi'
          ? 'यदि पंजीकरण में सुधार (Action Required) मांगा जाए तो क्या करें?'
          : 'What should I do if my registration status shows Action Required?',
      a:
        locale === 'hi'
          ? 'मुख्य पृष्ठ पर "जानकारी अपडेट करें" पर क्लिक करें और प्राधिकारी द्वारा बताए गए विवरण (जैसे बैंक खाता या भूमि खसरा) को ठीक करके पुनः सबमिट करें।'
          : 'Click "Update Information" on your home screen, review the instructions provided by the verifying authority, correct the flagged detail, and re-submit.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-[#151C2F] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#334155] relative max-h-[90vh] overflow-y-auto text-[#F8FAFC]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] border border-transparent hover:border-[#334155] transition"
          aria-label="Close help modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#334155] pb-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 font-bold">
            <HelpCircle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">{t.help}</h3>
            <p className="text-xs text-[#94A3B8]">
              {locale === 'hi'
                ? 'Astra किसान सहायता एवं समाधान केंद्र'
                : 'Astra Farmer Assistance & Coordination Desk'}
            </p>
          </div>
        </div>

        {/* Helpline Card */}
        <div className="bg-[#0B1020] border border-emerald-500/30 rounded-xl p-4 sm:p-5 mb-5 space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">
                {t.helpline}
              </div>
              <a
                href={`tel:${t.helplineNumber}`}
                className="text-2xl font-black text-[#F8FAFC] font-mono tracking-tight hover:text-emerald-400 transition"
              >
                {t.helplineNumber}
              </a>
            </div>
          </div>
          <div className="pt-2.5 border-t border-[#1E293B] flex items-center gap-2 text-xs text-[#94A3B8] font-medium">
            <Clock className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{t.hours}</span>
          </div>
        </div>

        {/* FAQ list */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            {t.faq}
          </h4>
          <div className="space-y-2.5">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-3.5 bg-[#0B1020] rounded-xl border border-[#1E293B] space-y-1.5">
                <div className="font-bold text-xs text-[#F8FAFC] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-xs text-[#94A3B8] pl-6 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition active:scale-[0.99]"
        >
          {locale === 'hi' ? 'बंद करें' : 'Close'}
        </button>
      </div>
    </div>
  );
}
