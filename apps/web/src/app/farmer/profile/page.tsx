'use client';

import React from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
  Landmark,
  Phone,
  FileText,
  Map,
  Home,
  Sprout
} from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { FarmerState } from '@astra/shared';

export default function FarmerProfilePage() {
  const { t, locale } = useLanguage();
  const { user, farmer, registration, farmerState } = useAuth();

  return (
    <main className="flex-1 max-w-[960px] mx-auto w-full p-4 sm:p-6 md:p-8 pt-6 sm:pt-8 text-[#123B3A] font-sans">

      {/* Main Profile Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Profile Identity */}
        <div className="bg-[#F3FBF8] p-6 sm:p-8 border-b border-[#CDEDE1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#E8F8F3] border border-[#CDEDE1] flex items-center justify-center text-[#00695C] text-2xl font-bold">
              {farmer?.fullName?.charAt(0).toUpperCase() || 'K'}
            </div>
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-bold text-[#123B3A] tracking-tight">
                {farmer?.fullName || 'Farmer Profile'}
              </h1>
              <p className="text-[14px] sm:text-[15px] text-[#557A78] font-medium mt-0.5">
                Farmer ID: {farmer?.farmerCode || '—'}
              </p>
            </div>
          </div>

          <div>
            {farmerState === FarmerState.VERIFIED ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-bold bg-[#E8F8F3] border border-[#00695C]/20 text-[#00695C]">
                <CheckCircle2 className="w-4 h-4" />
                {t.statusVerified || 'Verified'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                <Clock className="w-4 h-4" />
                {t.statusUnderVerification || 'Under Verification'}
              </span>
            )}
          </div>
        </div>

        {/* Profile Details Sections */}
        <div className="p-6 sm:p-8 space-y-10">
          
          {/* Personal Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#E8F8F3] flex items-center justify-center">
                <User className="w-4 h-4 text-[#00695C]" />
              </div>
              <h2 className="text-[17px] font-bold text-[#00695C]">
                Personal Details
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-[15px] pt-2">
              <div>
                <span className="text-[#557A78] font-medium block mb-1">Farmer Name</span>
                <strong className="text-[#123B3A] text-[16px] font-bold">{farmer?.fullName}</strong>
              </div>
              <div>
                <span className="text-[#557A78] font-medium block mb-1">Father / Husband / Guardian Name</span>
                <strong className="text-[#123B3A] text-[16px] font-bold">
                  {farmer?.fatherOrSpouseName || '—'}
                </strong>
              </div>
              <div>
                <span className="text-[#557A78] font-medium block mb-1">Gender</span>
                <strong className="text-[#123B3A] text-[16px] font-bold">{farmer?.gender === 'MALE' ? 'Male' : farmer?.gender === 'FEMALE' ? 'Female' : farmer?.gender || '—'}</strong>
              </div>
              <div>
                <span className="text-[#557A78] font-medium block mb-1">Category</span>
                <strong className="text-[#123B3A] text-[16px] font-bold">{farmer?.category || '—'}</strong>
              </div>
            </div>
          </section>

          {/* Contact & Jurisdiction */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#E8F8F3] flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#00695C]" />
              </div>
              <h2 className="text-[17px] font-bold text-[#00695C]">
                Address & Village
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-[15px] pt-2">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#00695C] mt-0.5" />
                <div>
                  <span className="text-[#557A78] font-medium block mb-1">Mobile Number</span>
                  <strong className="text-[#123B3A] text-[16px] font-bold">
                    +91 {farmer?.mobile || user?.mobile}
                  </strong>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Map className="w-5 h-5 text-[#00695C] mt-0.5" />
                <div>
                  <span className="text-[#557A78] font-medium block mb-1">District</span>
                  <strong className="text-[#123B3A] text-[16px] font-bold capitalize">{farmer?.district?.toLowerCase() || '—'}</strong>
                </div>
              </div>
              <div className="sm:col-span-2 flex items-start gap-3">
                <Home className="w-5 h-5 text-[#00695C] mt-0.5" />
                <div>
                  <span className="text-[#557A78] font-medium block mb-1">Revenue Village</span>
                  <strong className="text-[#123B3A] text-[16px] font-bold capitalize">{farmer?.village?.toLowerCase() || '—'}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Registered Land Parcels */}
          {registration?.landParcels && registration.landParcels.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-8 h-8 rounded-full bg-[#E8F8F3] flex items-center justify-center">
                  <Map className="w-4 h-4 text-[#00695C]" />
                </div>
                <h2 className="text-[17px] font-bold text-[#00695C]">
                  Land Parcels & Cultivated Area ({registration.landParcels.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {registration.landParcels.map((parcel, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-[14px] border border-[#CDEDE1] bg-[#F3FBF8] flex flex-col justify-between text-[15px]"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#00695C] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[#557A78] font-medium block mb-1">Khasra / Survey / Dag Number</span>
                          <span className="text-[#123B3A] font-bold text-[16px]">{parcel.khasraNumber}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Sprout className="w-5 h-5 text-[#00695C] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[#557A78] font-medium block mb-1">Area</span>
                          <span className="text-[#123B3A] font-bold text-[16px]">{parcel.areaAcres} Acre{parcel.areaAcres !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-end pl-8">
                      <span className="text-[#123B3A]/80 font-medium capitalize">
                        {parcel.village?.toLowerCase()}, {parcel.block?.toLowerCase()}
                      </span>
                      <span className="text-[#123B3A]/80 font-bold capitalize">
                        {parcel.ownershipType?.toLowerCase() || 'OWNER'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Masked Bank Account for Procurement Disbursal */}
          {registration?.bank && (
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-8 h-8 rounded-full bg-[#E8F8F3] flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-[#00695C]" />
                </div>
                <h2 className="text-[17px] font-bold text-[#00695C]">
                  Bank Account for Direct Benefit Transfer (DBT)
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-[15px] pt-2">
                <div>
                  <span className="text-[#557A78] font-medium block mb-1">Bank Name</span>
                  <strong className="text-[#123B3A] text-[16px] font-bold uppercase">{registration.bank.bankName}</strong>
                </div>
                <div>
                  <span className="text-[#557A78] font-medium block mb-1">Bank Account Number</span>
                  <strong className="text-[#123B3A] font-bold text-[16px] tracking-widest">
                    {registration.bank.accountNumberMasked || '••••••••'}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {/* Privacy Notice */}
          <div className="p-4 rounded-[14px] bg-[#E8F8F3] border border-[#CDEDE1] text-[14px] text-[#123B3A] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00695C] shrink-0" />
            <span className="leading-relaxed font-medium text-[#123B3A]">
              {locale === 'hi'
                ? 'राष्ट्रीय डेटा सुरक्षा मानकों के अनुसार पूर्ण बैंक खाता संख्या और पहचान संख्या सुरक्षित एवं छिपाई गई है।'
                : 'Sensitive details such as full bank account numbers and government IDs are protected and masked in accordance with national data privacy standards.'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/farmer/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white font-bold text-[16px] flex items-center justify-center transition shadow-sm"
            >
              <span>Go to Farmer Dashboard</span>
            </Link>

            <Link
              href="/farmer/registration-status"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white border border-[#CDEDE1] hover:bg-[#E8F8F3] text-[#00695C] font-bold text-[16px] flex items-center justify-center gap-2 transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>View Registration Status</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
