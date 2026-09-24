'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface MapCentre {
  id: string;
  name: string;
  centreCode: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  morningCapacityQuintals: number;
  afternoonCapacityQuintals: number;
}

interface CentreMapProps {
  centres: MapCentre[];
  selectedCentreId?: string | null;
  onSelectCentre: (centreId: string) => void;
  userLocation?: { lat: number; lon: number } | null;
}

export default function CentreMap({
  centres,
  selectedCentreId,
  onSelectCentre,
  userLocation,
}: CentreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let L: any;
    try {
      L = require('leaflet');
    } catch {
      return;
    }

    // Default center (Bihar / Muzaffarpur area)
    const defaultLat = userLocation?.lat || (centres.length > 0 ? centres[0].latitude : 26.1209);
    const defaultLon = userLocation?.lon || (centres.length > 0 ? centres[0].longitude : 85.3647);

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([defaultLat, defaultLon], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => map.removeLayer(marker));
    markersRef.current = {};

    // Custom Icon generator
    const createMarkerIcon = (isSelected: boolean) => {
      const color = isSelected ? '#15803d' : '#2563eb';
      const size = isSelected ? 36 : 28;
      return L.divIcon({
        className: 'astra-custom-marker',
        html: `
          <div style="
            background-color: ${color};
            color: white;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            border: 2px solid white;
            cursor: pointer;
          ">
            <div style="transform: rotate(45deg); font-size: ${isSelected ? '14px' : '11px'}; font-weight: bold;">
              P
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });
    };

    // User Location Pin
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-loc-marker',
        html: `
          <div style="
            background-color: #dc2626;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Current Location</b><br/><span style="font-size:12px;color:#666;">Used to calculate approx. road distance</span>');
    }

    // Centre Markers
    centres.forEach((centre) => {
      if (!centre.latitude || !centre.longitude) return;

      const isSelected = centre.id === selectedCentreId;
      const marker = L.marker([centre.latitude, centre.longitude], {
        icon: createMarkerIcon(isSelected),
      }).addTo(map);

      const popupContent = `
        <div style="font-family: inherit; min-width: 190px; padding: 4px; color: #F8FAFC;">
          <div style="font-weight: 700; font-size: 13px; color: #F8FAFC; margin-bottom: 3px;">
            ${centre.name}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">
            Code: <b style="color: #CBD5E1;">${centre.centreCode}</b> ${centre.distanceKm !== undefined ? `• ${centre.distanceKm} km approx.` : ''}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 10px; line-height: 1.4;">
            ${centre.address}
          </div>
          <button id="btn-select-${centre.id}" style="
            width: 100%;
            background: #16a34a;
            color: white;
            border: none;
            padding: 7px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease;
          ">
            Select This Centre
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${centre.id}`);
        if (btn) {
          btn.onclick = () => onSelectCentre(centre.id);
        }
      });

      marker.on('click', () => {
        onSelectCentre(centre.id);
      });

      markersRef.current[centre.id] = marker;
    });

    // Auto-pan if selected
    if (selectedCentreId && markersRef.current[selectedCentreId]) {
      const selected = centres.find((c) => c.id === selectedCentreId);
      if (selected) {
        map.panTo([selected.latitude, selected.longitude]);
        markersRef.current[selectedCentreId].openPopup();
      }
    }
  }, [centres, selectedCentreId, userLocation, onSelectCentre]);

  return (
    <div className="relative w-full h-[360px] md:h-full min-h-[320px] rounded-xl overflow-hidden border border-[#334155] shadow-sm bg-[#0B1020]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-2 left-2 bg-[#0B1020]/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] text-[#94A3B8] z-10 shadow-sm border border-[#334155]">
        Leaflet • © OpenStreetMap contributors
      </div>
    </div>
  );
}
