'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Navigation,
  Search,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Phone,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';

// Dynamically import Leaflet map with SSR disabled
const CentreMap = dynamic(() => import('@/components/centre/CentreMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[340px] bg-[#F4F9F7] rounded-xl flex items-center justify-center text-emerald-800/80 text-base">
      Loading interactive map...
    </div>
  ),
});

interface CentreItem {
  id: string;
  centreCode: string;
  name: string;
  stateId: string;
  stateName?: string;
  districtId: string;
  districtName?: string;
  block?: string;
  address: string;
  latitude: number;
  longitude: number;
  agency: string;
  operatingDays: string;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  morningCapacityQuintals: number;
  afternoonCapacityQuintals: number;
  maxQuantityPerBooking: number;
  distanceKm?: number;
  verificationStatus: string;
}

interface StateItem {
  id: string;
  name: string;
  code: string;
}

interface DistrictItem {
  id: string;
  name: string;
  code: string;
}

export default function CentresDiscoveryPage() {
  const { locale, t } = useLanguage();
  const lang = locale;
  const router = useRouter();
  const { user } = useAuth();

  const [centres, setCentres] = useState<CentreItem[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load States
  useEffect(() => {
    apiRequest<StateItem[]>('/centres/states')
      .then((data) => setStates(data || []))
      .catch((err) => console.error('Failed to load states:', err));
  }, []);

  // Load Districts when state changes
  useEffect(() => {
    if (selectedStateId) {
      apiRequest<DistrictItem[]>(`/centres/districts?stateId=${selectedStateId}`)
        .then((data) => setDistricts(data || []))
        .catch((err) => console.error('Failed to load districts:', err));
    } else {
      setDistricts([]);
      setSelectedDistrictId('');
    }
  }, [selectedStateId]);

  // Fetch verified centres
  const loadCentres = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStateId) params.append('stateId', selectedStateId);
      if (selectedDistrictId) params.append('districtId', selectedDistrictId);
      if (searchTerm) params.append('search', searchTerm);
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lon', userLocation.lon.toString());
      }

      const res = await apiRequest<CentreItem[]>(`/centres?${params.toString()}`);
      setCentres(res || []);
      if (res && res.length > 0 && !selectedCentreId) {
        setSelectedCentreId(res[0].id);
      }
    } catch (err) {
      console.error('Failed to load centres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCentres();
  }, [selectedStateId, selectedDistrictId, userLocation]);

  // Handle Location Permission
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLocationDenied(false);
        setLocating(false);
      },
      (err) => {
        console.warn('Location permission denied or unavailable:', err.message);
        setLocationDenied(true);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'hi' ? 'शासकीय प्रमाणित खरीद नेटवर्क' : 'Government Verified Procurement Network'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#014532] tracking-tight">
            {lang === 'hi' ? 'सरकारी खरीद डिपो खोजें' : 'Find Procurement Depots'}
          </h1>
          <p className="text-emerald-900/80 text-sm sm:text-base mt-0.5">
            {lang === 'hi'
              ? 'सत्यापित सरकारी खरीद डिपो का पता लगाएं और अगले 7 दिनों में अपनी तौल यात्रा का स्लॉट बुक करें।'
              : 'Discover verified procurement depots and book your physical arrival slot for the next 7 days.'}
          </p>
        </div>

        {/* Location Button */}
        <div className="flex items-center gap-2">
          <button
            suppressHydrationWarning
            onClick={handleGetLocation}
            disabled={locating}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition shadow-sm active:scale-95 ${
              userLocation
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 font-bold'
                : 'bg-white/95 backdrop-blur-sm shadow-xl border-emerald-100 text-[#014532] hover:bg-emerald-50'
            }`}
          >
            <Navigation className={`w-4 h-4 ${locating ? 'animate-spin text-emerald-700' : 'text-emerald-800/80'}`} />
            <span>
              {locating
                ? 'Locating...'
                : userLocation
                ? 'Location Detected'
                : lang === 'hi'
                ? 'मेरे पास डिपो खोजें'
                : 'Use My Location'}
            </span>
          </button>
        </div>
      </div>

      {locationDenied && (
        <div className="bg-amber-50 border border-amber-600/50 rounded-xl p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {lang === 'hi'
              ? 'स्थान अनुमति उपलब्ध नहीं है। आप नीचे राज्य एवं जिला चुनकर सीधे डिपो खोज सकते हैं।'
              : 'Location permission was denied. You can filter by State and District below directly.'}
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white/95 backdrop-blur-sm shadow-xl p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* State select */}
        <div>
          <label className="block text-sm font-semibold text-emerald-900/80 mb-1.5">
            {lang === 'hi' ? 'राज्य' : 'State'}
          </label>
          <select
            suppressHydrationWarning
            value={selectedStateId}
            onChange={(e) => setSelectedStateId(e.target.value)}
            className="w-full text-sm font-medium rounded-xl border border-emerald-100 py-2.5 px-3 bg-[#F4F9F7] text-[#014532] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
          >
            <option value="" className="bg-white/95 backdrop-blur-md text-emerald-800/80">{lang === 'hi' ? 'सभी राज्य' : 'All States'}</option>
            {states.map((s) => (
              <option key={s.id} value={s.id} className="bg-white/95 backdrop-blur-md text-[#014532]">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* District select */}
        <div>
          <label className="block text-sm font-semibold text-emerald-900/80 mb-1.5">
            {lang === 'hi' ? 'ज़िला' : 'District'}
          </label>
          <select
            suppressHydrationWarning
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            disabled={!selectedStateId}
            className="w-full text-sm font-medium rounded-xl border border-emerald-100 py-2.5 px-3 bg-[#F4F9F7] text-[#014532] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <option value="" className="bg-white/95 backdrop-blur-md text-emerald-800/80">{lang === 'hi' ? 'सभी ज़िले' : 'All Districts'}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id} className="bg-white/95 backdrop-blur-md text-[#014532]">
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-emerald-900/80 mb-1.5">
            {lang === 'hi' ? 'डिपो नाम या कोड खोजें' : 'Search Depot or Code'}
          </label>
          <div className="relative">
            <input
              suppressHydrationWarning
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadCentres()}
              placeholder="e.g. Muzaffarpur or MUZ"
              className="w-full text-sm font-medium rounded-xl border border-emerald-100 py-2.5 pl-9 pr-3 bg-[#F4F9F7] text-[#014532] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
            <Search className="w-4 h-4 text-emerald-800/80 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Centre Cards List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-sm text-emerald-800/80 px-1">
            <span className="font-semibold text-emerald-900/80">
              {centres.length} {lang === 'hi' ? 'सत्यापित डिपो उपलब्ध' : 'verified depots available'}
            </span>
            {userLocation && (
              <span className="text-emerald-700 font-bold">Sorted by distance</span>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-emerald-800/80 text-base space-y-3">
              <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p>Loading verified procurement depots...</p>
            </div>
          ) : centres.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-dashed border-emerald-100 p-8 text-center space-y-2">
              <Building2 className="w-8 h-8 text-emerald-700/80 mx-auto" />
              <p className="font-bold text-[#014532] text-base">No depots match your search criteria</p>
              <p className="text-sm text-emerald-800/80">Try selecting another district or clearing your search query.</p>
            </div>
          ) : (
            centres.map((centre) => {
              const isSelected = centre.id === selectedCentreId;
              return (
                <div
                  key={centre.id}
                  onClick={() => setSelectedCentreId(centre.id)}
                  className={`p-5 rounded-2xl transition duration-150 cursor-pointer shadow-lg relative border ${
                    isSelected
                      ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-white/95 backdrop-blur-sm shadow-xl'
                      : 'border-emerald-100 bg-white/95 backdrop-blur-sm shadow-xl hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    
                    {/* Middle: Details */}
                    <div className="flex-1 flex flex-col justify-center space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED DEPOT
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-900/60 uppercase">
                          {centre.centreCode}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h3 className="font-extrabold text-[#014532] text-lg sm:text-xl leading-snug">
                          {centre.name}
                        </h3>
                        <p className="text-sm text-emerald-900/70 flex items-start gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{centre.address}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-900/80 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-700" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{centre.operatingDays}</span>
                            <span className="text-emerald-900/60">{centre.operatingHoursStart} - {centre.operatingHoursEnd}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-700" />
                          <div className="flex flex-col">
                            <span className="text-emerald-900/60">Capacity</span>
                            <span className="font-semibold text-[#014532]">{centre.morningCapacityQuintals + centre.afternoonCapacityQuintals} q/day</span>
                          </div>
                        </div>
                        {centre.distanceKm !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <Navigation className="w-4 h-4 text-emerald-700" />
                            <div className="flex flex-col">
                              <span className="text-emerald-900/60">Distance</span>
                              <span className="font-semibold text-[#014532]">{centre.distanceKm} km</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="shrink-0 flex flex-col sm:items-end justify-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-100">
                      <Link
                        href={`/farmer/book?centreId=${centre.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#00966a] hover:bg-[#007f59] text-white rounded-lg text-sm font-bold shadow-md transition"
                      >
                        <span>{lang === 'hi' ? 'स्लॉट बुक करें' : 'Book Arrival Slot'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/farmer/book?centreId=${centre.id}`}
                        className="text-sm font-bold text-[#00966a] hover:text-[#007f59] transition inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lang === 'hi' ? 'विवरण देखें →' : 'View Details →'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Interactive OpenStreetMap (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="bg-white/95 backdrop-blur-sm shadow-xl p-4 rounded-2xl border border-emerald-100 shadow-lg space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-bold text-[#014532] uppercase tracking-wider">
                {lang === 'hi' ? 'डिपो मानचित्र' : 'Interactive Depot Map'}
              </span>
              <span className="text-sm text-emerald-800/80">
                {lang === 'hi' ? 'डिपो चुनें' : 'Click pin to select'}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-emerald-100">
              <CentreMap
                centres={centres}
                selectedCentreId={selectedCentreId}
                onSelectCentre={(id) => {
                  setSelectedCentreId(id);
                }}
                userLocation={userLocation}
              />
            </div>

            <div className="text-sm text-emerald-800/80 px-1">
              • {lang === 'hi' ? 'सटीक भौगोलिक डिपो निर्देशांक एवं सड़क मार्ग से दूरी।' : 'Direct road distance and verified depot coordinates to guide your booking.'}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
