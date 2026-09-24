'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Truck,
  Package,
  RefreshCw,
  LogOut,
  Building2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Hash,
  Scale,
  Upload,
  SwitchCamera,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { StationGuard } from '@/components/operations/StationGuard';
import { useAuth } from '@/context/AuthContext';
import {
  CheckinValidateResponseDto,
  CheckinConfirmResponseDto,
} from '@astra/shared';

interface ScheduledArrival {
  id: string;
  bookingNumber: string;
  farmerName: string;
  farmerCode: string;
  farmerMobile: string;
  farmerVerified?: boolean;
  session: 'MORNING' | 'AFTERNOON' | string;
  windowStartTime: string;
  windowEndTime: string;
  expectedQuantityQuintals: number;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  status: string;
  checkInTime?: string;
  queuePosition?: number | null;
  queueToken?: string | null;
}

function CheckinDashboardContent() {
  const router = useRouter();
  const { logoutPortal } = useAuth();
  const [centreInfo, setCentreInfo] = useState<any>(null);
  const [arrivals, setArrivals] = useState<ScheduledArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scanner & Validation State
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual input state
  const [manualInput, setManualInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Scanned validation result & Confirm state
  const [validatedBooking, setValidatedBooking] = useState<CheckinValidateResponseDto | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmedResult, setConfirmedResult] = useState<CheckinConfirmResponseDto | null>(null);

  const loadScheduled = async () => {
    try {
      const res: any = await apiRequest('/checkin/today');
      setCentreInfo(res.centre);
      const normalizedArrivals = (res.scheduled || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || item.bookingId || `arrival-${idx}`,
      }));
      setArrivals(normalizedArrivals);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load today arrivals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduled();
  }, []);

  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (cameraIdToUse?: string) => {
    setScannerError(null);
    setValidationError(null);
    setScannerLoading(true);
    setValidatedBooking(null);
    setConfirmedResult(null);

    // Make container visible before starting scanner so dimensions are > 0
    setScannerActive(true);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // Allow DOM to update and measure container dimensions
      await new Promise((r) => setTimeout(r, 100));

      const element = document.getElementById('qr-reader');
      if (!element) {
        throw new Error('QR Reader DOM element not found');
      }

      // Stop any existing instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      // Query available cameras
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
        setAvailableCameras(cameras);
      } catch (camErr) {
        console.warn('Could not enumerate cameras:', camErr);
      }

      // Determine camera target: preferred user choice, back camera, or default camera
      let targetCameraConfig: any = { facingMode: { ideal: 'environment' } };
      if (cameraIdToUse) {
        targetCameraConfig = cameraIdToUse;
        setSelectedCameraId(cameraIdToUse);
      } else if (cameras.length > 0) {
        const backCam = cameras.find(
          (c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
        );
        const chosen = backCam ? backCam.id : cameras[0].id;
        targetCameraConfig = chosen;
        setSelectedCameraId(chosen);
      }

      const scanner = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        targetCameraConfig,
        {
          fps: 15,
          // Responsive QR box scanning 80% of viewfinder
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(160, Math.floor(minEdge * 0.8));
            return { width: size, height: size };
          },
          aspectRatio: undefined, // allow natural camera aspect ratio
        },
        async (decodedText: string) => {
          console.log('[ASTRA Scanner] QR Code Detected:', decodedText);
          if (!decodedText) return;

          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          } catch (e) {}

          // Stop camera stream cleanly on detection
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch {
            // ignore
          }
          setScannerActive(false);

          // Call backend validation
          await handleValidate(decodedText);
        },
        (errorMessage: string) => {
          // Frame parse miss, expected during video streaming
        }
      );
    } catch (err: any) {
      console.error('[ASTRA Scanner] Camera start error:', err);
      setScannerError(
        err.message ||
          'Camera access was not allowed. ASTRA needs camera access to scan the booking pass.'
      );
      setScannerActive(false);
    } finally {
      setScannerLoading(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  /**
   * Handle image file scan fallback
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidating(true);
    setValidationError(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = new Html5Qrcode('qr-reader-temp');
      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();

      if (decodedText) {
        await handleValidate(decodedText);
      } else {
        setValidationError('No valid booking QR found in the uploaded image.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to scan QR from image file.');
    } finally {
      setValidating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Authoritative validation of scanned QR or manual booking reference
   */
  const handleValidate = async (reference: string) => {
    if (!reference || !reference.trim()) return;
    setValidating(true);
    setValidationError(null);
    setConfirmError(null);
    setConfirmedResult(null);

    try {
      const res: CheckinValidateResponseDto = await apiRequest('/checkin/validate', {
        method: 'POST',
        body: { tokenOrNumber: reference.trim() },
      });
      setValidatedBooking(res);
      setManualInput('');
    } catch (err: any) {
      setValidationError(err.message || 'Unable to verify the booking right now.');
      setValidatedBooking(null);
    } finally {
      setValidating(false);
    }
  };

  /**
   * Final atomic check-in confirmation
   */
  const handleConfirmCheckin = async () => {
    if (!validatedBooking) return;
    setConfirming(true);
    setConfirmError(null);

    try {
      const res: CheckinConfirmResponseDto = await apiRequest('/checkin/confirm', {
        method: 'POST',
        body: { bookingId: validatedBooking.bookingId },
      });

      setConfirmedResult(res);
      setValidatedBooking(null);
      // Reload schedule so arrivals table reflects new checked-in booking immediately
      await loadScheduled();
    } catch (err: any) {
      setConfirmError(err.message || 'Check-in confirmation failed.');
    } finally {
      setConfirming(false);
    }
  };

  const resetAll = () => {
    stopCamera();
    setValidatedBooking(null);
    setConfirmedResult(null);
    setValidationError(null);
    setConfirmError(null);
    setManualInput('');
  };

  const handleLogout = () => {
    stopCamera();
    logoutPortal('operations');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400 text-xs space-y-3">
        <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
        <p>Initializing Gate & Arrival Desk Terminal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          href="/operations/login"
          className="inline-flex px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
        >
          Sign In to Operations Portal
        </Link>
      </div>
    );
  }

  const checkedInCount = arrivals.filter((a) => a.status !== 'BOOKED' && a.status !== 'PENDING').length;
  const pendingCount = arrivals.filter((a) => a.status === 'BOOKED' || a.status === 'PENDING').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hidden container for image file scanning */}
      <div id="qr-reader-temp" className="hidden" />

      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#334155]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded text-[11px] font-mono font-bold tracking-wider uppercase">
              GATE & ARRIVAL DESK
            </span>
            <span className="text-xs text-slate-400 font-mono font-semibold">
              {centreInfo?.centreCode}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Check-in & Queue
          </h1>
          <p className="text-xs text-slate-400">
            {centreInfo?.name || 'Depot Terminal'} • National Grain Procurement Platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadScheduled}
            className="p-2 text-slate-300 hover:text-white bg-[#151C2F] hover:bg-[#1B2438] border border-[#334155] rounded-xl text-xs font-medium shadow-sm transition"
            title="Refresh Arrivals"
          >
            <RefreshCw className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/30 rounded-xl border border-rose-800/40 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#151C2F] border border-[#334155] p-4 rounded-xl shadow-lg space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Today Expected</span>
          <div className="text-2xl font-bold text-white font-mono">{arrivals.length}</div>
        </div>
        <div className="bg-[#151C2F] border border-[#334155] p-4 rounded-xl shadow-lg space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Awaiting Arrival</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">{pendingCount}</div>
        </div>
        <div className="bg-[#151C2F] border border-[#334155] p-4 rounded-xl shadow-lg space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">In Physical Queue (Weighment)</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{checkedInCount}</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. SUCCESS CONFIRMATION MODAL / BANNER                       */}
      {/* ============================================================ */}
      {confirmedResult && (
        <div className="bg-[#151C2F] border-2 border-emerald-500/70 p-6 sm:p-7 rounded-2xl shadow-xl text-center space-y-5 animate-in fade-in zoom-in duration-200">
          <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-700/60 font-mono uppercase tracking-wider">
              CHECK-IN CONFIRMED
            </span>
            <h2 className="text-xl font-bold text-white pt-1">
              Farmer Transferred to Physical Queue
            </h2>
            <p className="text-xs text-slate-300">
              Physical arrival verified. Dispatching farmer to weighbridge queue.
            </p>
          </div>

          {/* Queue Details Card */}
          <div className="max-w-md mx-auto bg-[#0B1020] border border-[#334155] rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
              <span className="text-xs text-slate-400">Farmer Name</span>
              <span className="font-semibold text-white text-xs">
                {confirmedResult.booking.farmerName}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
              <span className="text-xs text-slate-400">Booking Reference</span>
              <span className="font-mono font-semibold text-slate-200 text-xs">
                {confirmedResult.booking.bookingNumber}
              </span>
            </div>

            <div className="bg-[#151C2F] p-3.5 rounded-lg border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  PHYSICAL QUEUE TOKEN
                </span>
                <span className="font-mono font-black text-xl text-emerald-300">
                  {confirmedResult.booking.queueToken}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  QUEUE POSITION
                </span>
                <span className="font-mono font-black text-2xl text-emerald-400">
                  #{confirmedResult.booking.queuePosition}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400">Next Station:</span>
              <span className="font-semibold text-amber-400 flex items-center gap-1 font-mono text-xs">
                <Scale className="w-3.5 h-3.5" />
                <span>Station 02: Weighment (Depot Scales)</span>
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={resetAll}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Scan Next Arrival
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. VERIFICATION CARD (REVIEW DETAILS BEFORE CHECK-IN)        */}
      {/* ============================================================ */}
      {validatedBooking && !confirmedResult && (
        <div className="bg-[#151C2F] border-2 border-sky-500/50 p-6 sm:p-7 rounded-2xl shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Booking Verified & Validated</h2>
                <p className="text-xs text-slate-400">
                  Review booking credentials before authorizing depot gate check-in.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold self-start sm:self-auto">
              ✓ VERIFIED FARMER
            </span>
          </div>

          {/* Booking & Farmer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#0B1020] p-3.5 rounded-xl border border-[#334155] space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Farmer Name</span>
              <span className="font-bold text-white text-xs block">
                {validatedBooking.farmerDisplayName}
              </span>
              <span className="font-mono text-emerald-400 text-[11px] block">
                {validatedBooking.farmerCode}
              </span>
            </div>

            <div className="bg-[#0B1020] p-3.5 rounded-xl border border-[#334155] space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Booking Reference</span>
              <span className="font-mono font-semibold text-white text-xs block">
                {validatedBooking.bookingNumber}
              </span>
              <span className="text-slate-400 text-[11px] block">
                Session: <strong className="text-white capitalize">{validatedBooking.session.toLowerCase()}</strong>
              </span>
            </div>

            <div className="bg-[#0B1020] p-3.5 rounded-xl border border-[#334155] space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expected Produce</span>
              <span className="font-mono font-bold text-white text-xs block">
                {validatedBooking.expectedQuantityQuintals} Quintals
              </span>
              <span className="text-slate-400 text-[11px] block truncate">
                Transport: {validatedBooking.transport}
                {validatedBooking.vehicleNumber ? ` (${validatedBooking.vehicleNumber})` : ''}
              </span>
            </div>
          </div>

          {/* Arrival Window Compliance Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              validatedBooking.windowStatus === 'ON_TIME'
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                ARRIVAL WINDOW EVALUATION
              </span>
              <div className="text-base font-bold font-mono">
                Assigned Window: {validatedBooking.arrivalWindow}
              </div>
              <p className="text-xs opacity-80">
                Depot Time: <strong>{validatedBooking.currentTime}</strong> • {validatedBooking.windowMessage}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-bold font-mono border self-start sm:self-auto ${
                validatedBooking.windowStatus === 'ON_TIME'
                  ? 'bg-emerald-900/60 border-emerald-500/70 text-emerald-200'
                  : 'bg-amber-900/60 border-amber-500/70 text-amber-200'
              }`}
            >
              {validatedBooking.windowStatus === 'ON_TIME' ? 'ON TIME' : validatedBooking.windowStatus}
            </span>
          </div>

          {confirmError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{confirmError}</span>
            </div>
          )}

          {/* Action Confirmation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={resetAll}
              disabled={confirming}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#334155] bg-[#0B1020] hover:bg-[#1B2438] text-slate-300 text-xs font-semibold transition"
            >
              Cancel / Scan Again
            </button>

            <button
              onClick={handleConfirmCheckin}
              disabled={confirming}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Confirming Check-in...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CONFIRM GATE CHECK-IN</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. PRIMARY SCANNER & MANUAL SEARCH TERMINAL                  */}
      {/* ============================================================ */}
      {!validatedBooking && !confirmedResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* CAMERA SCANNER AREA (7 Cols) */}
          <div className="lg:col-span-7 bg-[#151C2F] border border-[#334155] rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Scan Booking QR Pass</h2>
                  <p className="text-[11px] text-slate-400">
                    Scan the digital booking QR code from the farmer&apos;s receipt or mobile device.
                  </p>
                </div>
              </div>

              {availableCameras.length > 1 && scannerActive && (
                <button
                  onClick={() => {
                    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
                    const nextIndex = (currentIndex + 1) % availableCameras.length;
                    startCamera(availableCameras[nextIndex].id);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#0B1020] hover:bg-[#1B2438] border border-[#334155] rounded-lg transition inline-flex items-center gap-1.5"
                  title="Switch Camera"
                >
                  <SwitchCamera className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Switch</span>
                </button>
              )}
            </div>

            {/* Camera Viewport Container */}
            <div className="relative bg-[#0B1020] rounded-xl border border-[#334155] overflow-hidden min-h-[280px] flex flex-col items-center justify-center p-3">
              {/* Visible QR Container */}
              <div
                id="qr-reader"
                className="w-full max-w-sm mx-auto overflow-hidden rounded-xl"
                style={{ display: scannerActive ? 'block' : 'none' }}
              />

              {!scannerActive && !scannerLoading && (
                <div className="text-center space-y-3 py-8 max-w-xs">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 mx-auto flex items-center justify-center">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-xs">
                      Ready to Scan Booking QR
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Depot camera will authenticate booking credentials and queue eligibility.
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => startCamera()}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Start Camera Scanner</span>
                    </button>

                    {/* Image File Upload Option */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#151C2F] hover:bg-[#1B2438] text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-[#334155] transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>Select QR Image File</span>
                    </button>
                  </div>
                </div>
              )}

              {scannerLoading && (
                <div className="text-center space-y-3 py-12">
                  <RefreshCw className="w-7 h-7 text-sky-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Initializing camera scanner...</p>
                </div>
              )}

              {scannerActive && (
                <div className="w-full pt-3 flex flex-col items-center gap-2.5">
                  <span className="text-xs text-sky-400 font-medium animate-pulse flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Point camera at the booking QR pass</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={stopCamera}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#151C2F] hover:bg-[#1B2438] text-slate-200 rounded-lg text-xs font-medium border border-[#334155] transition"
                    >
                      <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Stop Camera</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#151C2F] hover:bg-[#1B2438] text-slate-300 rounded-lg text-xs font-medium border border-[#334155] transition"
                      title="Upload QR Image"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Upload Image</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {validationError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/70 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <span className="font-semibold block text-rose-200">Booking Validation Failed</span>
                  <span className="text-[11px] opacity-90 block">{validationError}</span>
                </div>
              </div>
            )}

            {scannerError && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-300 space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">Camera Access Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{scannerError}</p>
                <div className="pt-0.5">
                  <button
                    onClick={() => {
                      const input = document.getElementById('manual-booking-input');
                      if (input) input.focus();
                    }}
                    className="text-xs font-medium text-sky-400 underline hover:text-sky-300"
                  >
                    Enter Booking Reference manually
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MANUAL FALLBACK ENTRY (5 Cols) */}
          <div className="lg:col-span-5 bg-[#151C2F] border border-[#334155] rounded-2xl p-5 space-y-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#334155]">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Manual Reference Lookup</h2>
                  <p className="text-[11px] text-slate-400">
                    Search by Booking Reference if QR is unreadable or camera is offline.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="manual-booking-input"
                  className="text-xs font-semibold text-slate-300 block"
                >
                  Booking Reference Number
                </label>
                <div className="space-y-2">
                  <input
                    id="manual-booking-input"
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleValidate(manualInput);
                    }}
                    placeholder="e.g. ASTRA-BOOK-260924-2756"
                    className="w-full px-3.5 py-2.5 bg-[#0B1020] border border-[#334155] rounded-xl text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition"
                  />
                  <button
                    onClick={() => handleValidate(manualInput)}
                    disabled={validating || !manualInput.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-40"
                  >
                    {validating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Validating Reference...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Lookup & Verify Booking</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {validationError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">Validation Rejected</span>
                    <span className="text-[11px] leading-tight block opacity-90">
                      {validationError}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Helpful Terminal Security Note */}
            <div className="bg-[#0B1020] p-3.5 rounded-xl border border-[#334155] text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Verification Policy</span>
              </span>
              <p className="leading-relaxed">
                Both QR scanning and reference entry perform identical backend validation checks. Gate entry requires valid date, centre alignment, and verified farmer identity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* AREA 1: TODAY'S SCHEDULED ARRIVALS (Awaiting Arrival)        */}
      {/* ============================================================ */}
      <div className="bg-[#151C2F] border border-[#334155] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-[#334155] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-white text-sm">Today&apos;s Scheduled Arrivals</h3>
            <p className="text-xs text-slate-400">
              Procurement slots booked for this depot today awaiting gate arrival
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Pending Arrival: {arrivals.filter((b) => b.status === 'BOOKED' || b.status === 'PENDING').length} of {arrivals.length}
          </span>
        </div>

        {arrivals.filter((b) => b.status === 'BOOKED' || b.status === 'PENDING').length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs space-y-1">
            <Clock className="w-7 h-7 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">No pending scheduled arrivals.</p>
            <p className="text-[11px]">All scheduled farmers for today have completed gate arrival or no further slots are booked.</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto operations-queue-scroll overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#0F172A] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#334155]">
                <tr>
                  <th className="px-4 py-3">Arrival Window</th>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Produce</th>
                  <th className="px-4 py-3">Transport</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60">
                {arrivals
                  .filter((b) => b.status === 'BOOKED' || b.status === 'PENDING')
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-[#1B2438] transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-sky-400 whitespace-nowrap">
                        {b.windowStartTime} – {b.windowEndTime}
                        <span className="block text-[10px] text-slate-400 capitalize font-normal">
                          {b.session.toLowerCase()} session
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-white whitespace-nowrap">
                        {b.bookingNumber}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-white block">{b.farmerName}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {b.farmerCode}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-200">
                        {b.expectedQuantityQuintals} q
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-300 text-xs">
                        {b.vehicleNumber || 'Standard Transport'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 text-[10px] font-semibold font-mono">
                          AWAITING ARRIVAL
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setManualInput(b.bookingNumber);
                            handleValidate(b.bookingNumber);
                          }}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                        >
                          Check In
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* AREA 2: PHYSICAL ARRIVAL QUEUE (Admitted produce at Depot)   */}
      {/* ============================================================ */}
      <div className="bg-[#151C2F] border border-[#334155] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-[#334155] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-white text-sm">Physical Arrival Queue (Admitted Lots)</h3>
            </div>
            <p className="text-xs text-slate-400">
              Farmers verified and admitted through the gate awaiting scale weighment
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 bg-emerald-950/50 border border-emerald-800/50 rounded-lg">
            Admitted: {arrivals.filter((b) => b.status !== 'BOOKED' && b.status !== 'PENDING').length}
          </span>
        </div>

        {arrivals.filter((b) => b.status !== 'BOOKED' && b.status !== 'PENDING').length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs space-y-1">
            <Truck className="w-7 h-7 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">No vehicles in physical queue yet.</p>
            <p className="text-[11px]">Farmers will enter this queue once their QR code is scanned and checked in at the gate.</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto operations-queue-scroll overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#0F172A] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#334155]">
                <tr>
                  <th className="px-4 py-3">Queue # / Token</th>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Produce</th>
                  <th className="px-4 py-3">Check-in Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Next Station</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60">
                {arrivals
                  .filter((b) => b.status !== 'BOOKED' && b.status !== 'PENDING')
                  .map((b, idx) => (
                    <tr key={b.id} className="hover:bg-[#1B2438] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 font-mono font-bold text-xs">
                          #{b.queuePosition || idx + 1}
                        </span>
                        {b.queueToken && (
                          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                            Token: {b.queueToken}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-white whitespace-nowrap">
                        {b.bookingNumber}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-white block">{b.farmerName}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {b.farmerCode}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-200">
                        {b.expectedQuantityQuintals} q
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-300 text-[11px]">
                        {b.checkInTime ? new Date(b.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Arrived Today'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-800/80 text-[10px] font-semibold font-mono">
                          {b.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-amber-400 font-mono">
                          → Weighbridge Desk
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default function CheckinDashboardPage() {
  return (
    <StationGuard
      allowedRoles={['CHECK_IN_OFFICER', 'CHECK_IN']}
      stationName="Depot Gate & Physical Check-in"
      stationCode="STATION-GATE-01"
      stationDescription="Verify physical arrival, authenticate digital booking QR passes, and admit produce to the physical weighment queue."
    >
      <CheckinDashboardContent />
    </StationGuard>
  );
}
