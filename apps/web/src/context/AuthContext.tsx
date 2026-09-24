'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  FarmerState,
  FarmerProfileDto,
  RegistrationSummaryDto,
  UserSummaryDto,
  VerifyOtpResponseDto,
  FarmerStatusResponseDto,
} from '@astra/shared';
import { apiRequest } from '../lib/api';

interface AuthContextType {
  token: string | null;
  user: UserSummaryDto | null;
  farmer: FarmerProfileDto | null;
  registration: RegistrationSummaryDto | null;
  farmerState: FarmerState | null;
  isLoading: boolean;
  loginWithVerifyOtp: (data: VerifyOtpResponseDto) => void;
  loginAsAuthority: (token: string, user: UserSummaryDto) => void;
  loginAsOfficer: (token: string, user: UserSummaryDto, assignment?: any) => void;
  loginAsVerificationAuthority: (token: string, user: UserSummaryDto) => void;
  logout: () => void;
  logoutPortal: (portal: 'farmer' | 'authority' | 'operations' | 'verification') => void;
  refreshStatus: () => Promise<void>;
  updateFarmerProfile: (profile: Partial<FarmerProfileDto>) => void;
  updateLocalRegistration: (reg: RegistrationSummaryDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummaryDto | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfileDto | null>(null);
  const [registration, setRegistration] = useState<RegistrationSummaryDto | null>(null);
  const [farmerState, setFarmerState] = useState<FarmerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  /**
   * Sync active session based on current route/portal.
   * Isolates tab-scoped sessionStorage and portal-scoped localStorage namespaces.
   */
  const syncSessionFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    const isUpdateMode =
      typeof window !== 'undefined' &&
      window.location.search.includes('action=update');

    // NEVER restore authenticated session on explicit login pages or fresh registration
    const isFreshFarmerRegistration = pathname === '/farmer/register' && !isUpdateMode;
    const isExplicitLoginPage =
      pathname === '/farmer/login' ||
      isFreshFarmerRegistration ||
      pathname === '/authority/login' ||
      pathname === '/verification/login' ||
      pathname === '/operations/login' ||
      pathname === '/centre/login';

    if (isExplicitLoginPage) {
      setUser(null);
      setToken(null);
      setFarmer(null);
      setFarmerState(null);
      setRegistration(null);
      setIsLoading(false);
      return;
    }

    if (pathname.startsWith('/authority')) {
      // 1. Authority Portal Context - STRICT ISOLATION
      const authTok =
        sessionStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_authority_token');

      const authUserStr =
        sessionStorage.getItem('astra_authority_user') ||
        localStorage.getItem('astra_authority_user');

      if (authTok && authUserStr) {
        try {
          const parsed = JSON.parse(authUserStr);
          if (parsed.role === 'GOVERNMENT_ADMIN') {
            setUser(parsed);
            setToken(authTok);
          } else {
            setUser(null);
            setToken(null);
          }
        } catch {
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setFarmer(null);
      setFarmerState(null);
      setRegistration(null);
      setIsLoading(false);
      return;
    }

    if (pathname.startsWith('/verification')) {
      // 2. Farmer Verification Authority Context - STRICT ISOLATION
      const verTok =
        sessionStorage.getItem('astra_verification_token') ||
        localStorage.getItem('astra_verification_token');

      const verUserStr =
        sessionStorage.getItem('astra_verification_user') ||
        localStorage.getItem('astra_verification_user');

      if (verTok && verUserStr) {
        try {
          const parsed = JSON.parse(verUserStr);
          if (parsed.role === 'FARMER_VERIFICATION_AUTHORITY') {
            setUser(parsed);
            setToken(verTok);
          } else {
            setUser(null);
            setToken(null);
          }
        } catch {
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setFarmer(null);
      setFarmerState(null);
      setRegistration(null);
      setIsLoading(false);
      return;
    }

    if (
      pathname.startsWith('/operations') ||
      pathname.startsWith('/quality') ||
      pathname.startsWith('/weighment') ||
      pathname.startsWith('/checkin') ||
      pathname.startsWith('/payment') ||
      pathname.startsWith('/centre')
    ) {
      // 2. Depot Operations Staff Context - STRICT ISOLATION (No authority fallback)
      const offTok =
        sessionStorage.getItem('astra_officer_token') ||
        localStorage.getItem('astra_officer_token');

      const offUserStr =
        sessionStorage.getItem('astra_officer_user') ||
        localStorage.getItem('astra_officer_user');

      if (offTok && offUserStr) {
        try {
          const parsed = JSON.parse(offUserStr);
          // Ensure it's not a farmer or authority token
          if (parsed.role && parsed.role !== 'FARMER' && parsed.role !== 'GOVERNMENT_ADMIN') {
            setUser(parsed);
            setToken(offTok);
          } else {
            setUser(null);
            setToken(null);
          }
        } catch {
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setFarmer(null);
      setFarmerState(null);
      setRegistration(null);
      setIsLoading(false);
      return;
    }

    if (pathname.startsWith('/farmer')) {
      // 3. Farmer Portal Context (Supports per-tab sessionStorage isolation)
      const fTok =
        sessionStorage.getItem('astra_farmer_token') ||
        localStorage.getItem('astra_farmer_token');

      const fUserStr =
        sessionStorage.getItem('astra_farmer_user') ||
        localStorage.getItem('astra_farmer_user');

      const fFarmerStr =
        sessionStorage.getItem('astra_farmer') ||
        localStorage.getItem('astra_farmer');

      const fStateStr =
        (sessionStorage.getItem('astra_farmer_state') as FarmerState) ||
        (localStorage.getItem('astra_farmer_state') as FarmerState);

      const fRegStr =
        sessionStorage.getItem('astra_farmer_registration') ||
        localStorage.getItem('astra_farmer_registration');

      if (fTok && fUserStr) {
        try {
          const parsed = JSON.parse(fUserStr);
          if (parsed.role === 'FARMER') {
            setUser(parsed);
            setToken(fTok);
            if (fFarmerStr) setFarmer(JSON.parse(fFarmerStr));
            if (fStateStr) setFarmerState(fStateStr);
            if (fRegStr) setRegistration(JSON.parse(fRegStr));
          } else {
            setUser(null);
            setToken(null);
          }
        } catch {
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
        setFarmer(null);
        setFarmerState(null);
        setRegistration(null);
      }
      setIsLoading(false);
      return;
    }

    // 4. Public Landing Page ('/') or Other Common Pages:
    const anyUserStr =
      sessionStorage.getItem('astra_farmer_user') ||
      sessionStorage.getItem('astra_authority_user') ||
      sessionStorage.getItem('astra_verification_user') ||
      sessionStorage.getItem('astra_officer_user') ||
      localStorage.getItem('astra_authority_user') ||
      localStorage.getItem('astra_verification_user') ||
      localStorage.getItem('astra_officer_user') ||
      localStorage.getItem('astra_farmer_user');

    const anyTok =
      sessionStorage.getItem('astra_farmer_token') ||
      sessionStorage.getItem('astra_authority_token') ||
      sessionStorage.getItem('astra_verification_token') ||
      sessionStorage.getItem('astra_officer_token') ||
      localStorage.getItem('astra_authority_token') ||
      localStorage.getItem('astra_verification_token') ||
      localStorage.getItem('astra_officer_token') ||
      localStorage.getItem('astra_farmer_token');

    if (anyUserStr && anyTok) {
      try {
        const parsed = JSON.parse(anyUserStr);
        setUser(parsed);
        setToken(anyTok);
        if (parsed.role === 'FARMER') {
          const fStr =
            sessionStorage.getItem('astra_farmer') || localStorage.getItem('astra_farmer');
          if (fStr) setFarmer(JSON.parse(fStr));
          const fState =
            sessionStorage.getItem('astra_farmer_state') ||
            localStorage.getItem('astra_farmer_state');
          if (fState) setFarmerState(fState as FarmerState);
        } else {
          setFarmer(null);
          setFarmerState(null);
          setRegistration(null);
        }
      } catch {
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
      setFarmer(null);
      setFarmerState(null);
      setRegistration(null);
    }
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    syncSessionFromStorage();
  }, [syncSessionFromStorage]);

  const logoutPortal = useCallback(
    (portal: 'farmer' | 'authority' | 'operations' | 'verification') => {
      if (portal === 'farmer') {
        sessionStorage.removeItem('astra_farmer_token');
        sessionStorage.removeItem('astra_farmer_user');
        sessionStorage.removeItem('astra_farmer');
        sessionStorage.removeItem('astra_farmer_registration');
        sessionStorage.removeItem('astra_farmer_state');
        localStorage.removeItem('astra_farmer_token');
        localStorage.removeItem('astra_farmer_user');
        localStorage.removeItem('astra_farmer');
        localStorage.removeItem('astra_farmer_registration');
        localStorage.removeItem('astra_farmer_state');
        localStorage.removeItem('astra_draft_reg');
        localStorage.removeItem('astra_token');
        localStorage.removeItem('astra_user');
        setUser(null);
        setToken(null);
        setFarmer(null);
        setRegistration(null);
        setFarmerState(null);
        router.push('/farmer/login');
        return;
      }

      if (portal === 'authority') {
        sessionStorage.removeItem('astra_authority_token');
        sessionStorage.removeItem('astra_authority_user');
        localStorage.removeItem('astra_authority_token');
        localStorage.removeItem('astra_authority_user');
        localStorage.removeItem('astra_token');
        localStorage.removeItem('astra_user');
        if (user?.role === 'GOVERNMENT_ADMIN') {
          setUser(null);
          setToken(null);
        }
        router.push('/authority/login');
        return;
      }

      if (portal === 'verification') {
        sessionStorage.removeItem('astra_verification_token');
        sessionStorage.removeItem('astra_verification_user');
        localStorage.removeItem('astra_verification_token');
        localStorage.removeItem('astra_verification_user');
        localStorage.removeItem('astra_token');
        localStorage.removeItem('astra_user');
        if (user?.role === 'FARMER_VERIFICATION_AUTHORITY') {
          setUser(null);
          setToken(null);
        }
        router.push('/verification/login');
        return;
      }

      if (portal === 'operations') {
        sessionStorage.removeItem('astra_officer_token');
        sessionStorage.removeItem('astra_officer_user');
        sessionStorage.removeItem('astra_officer_assignment');
        localStorage.removeItem('astra_officer_token');
        localStorage.removeItem('astra_officer_user');
        localStorage.removeItem('astra_officer_assignment');
        localStorage.removeItem('astra_token');
        localStorage.removeItem('astra_user');
        if (user?.role && user.role !== 'FARMER' && user.role !== 'GOVERNMENT_ADMIN' && user.role !== 'FARMER_VERIFICATION_AUTHORITY') {
          setUser(null);
          setToken(null);
        }
        router.push('/operations/login');
        return;
      }
    },
    [user, router]
  );

  const logout = useCallback(() => {
    sessionStorage.clear();
    localStorage.removeItem('astra_token');
    localStorage.removeItem('astra_user');
    localStorage.removeItem('astra_farmer_token');
    localStorage.removeItem('astra_farmer_user');
    localStorage.removeItem('astra_farmer');
    localStorage.removeItem('astra_farmer_registration');
    localStorage.removeItem('astra_farmer_state');
    localStorage.removeItem('astra_draft_reg');
    localStorage.removeItem('astra_authority_token');
    localStorage.removeItem('astra_authority_user');
    localStorage.removeItem('astra_verification_token');
    localStorage.removeItem('astra_verification_user');
    localStorage.removeItem('astra_officer_token');
    localStorage.removeItem('astra_officer_user');
    localStorage.removeItem('astra_officer_assignment');

    setUser(null);
    setToken(null);
    setFarmer(null);
    setRegistration(null);
    setFarmerState(null);

    router.push('/');
  }, [router]);

  const refreshStatus = useCallback(async () => {
    if (!pathname.startsWith('/farmer')) return;

    const savedToken =
      sessionStorage.getItem('astra_farmer_token') ||
      localStorage.getItem('astra_farmer_token') ||
      localStorage.getItem('astra_token');

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest<FarmerStatusResponseDto>('/api/farmer/me', {
        token: savedToken,
      });

      setFarmerState(res.farmerState);
      if (res.farmer) {
        setFarmer(res.farmer);
        sessionStorage.setItem('astra_farmer', JSON.stringify(res.farmer));
        localStorage.setItem('astra_farmer', JSON.stringify(res.farmer));
      }
      if (res.registration) {
        setRegistration(res.registration);
        sessionStorage.setItem('astra_farmer_registration', JSON.stringify(res.registration));
        localStorage.setItem('astra_farmer_registration', JSON.stringify(res.registration));
      }
      sessionStorage.setItem('astra_farmer_state', res.farmerState);
      localStorage.setItem('astra_farmer_state', res.farmerState);
    } catch {
      // Token expired or invalid
      logoutPortal('farmer');
    } finally {
      setIsLoading(false);
    }
  }, [pathname, logoutPortal]);

  /**
   * Farmer Login - Persists to per-tab sessionStorage for multi-farmer tab concurrency
   * as well as localStorage for persistence across single-tab reloads.
   */
  const loginWithVerifyOtp = (data: VerifyOtpResponseDto) => {
    setToken(data.token);
    setUser(data.user);
    setFarmerState(data.farmerState);
    if (data.farmer) setFarmer(data.farmer);
    if (data.registration) setRegistration(data.registration);

    // Tab-level isolation
    sessionStorage.setItem('astra_farmer_token', data.token);
    sessionStorage.setItem('astra_farmer_user', JSON.stringify(data.user));
    sessionStorage.setItem('astra_farmer_state', data.farmerState);
    if (data.farmer) {
      sessionStorage.setItem('astra_farmer', JSON.stringify(data.farmer));
    }
    if (data.registration) {
      sessionStorage.setItem('astra_farmer_registration', JSON.stringify(data.registration));
    }

    // Storage persistence
    localStorage.setItem('astra_farmer_token', data.token);
    localStorage.setItem('astra_farmer_user', JSON.stringify(data.user));
    localStorage.setItem('astra_farmer_state', data.farmerState);
    if (data.farmer) {
      localStorage.setItem('astra_farmer', JSON.stringify(data.farmer));
    }
    if (data.registration) {
      localStorage.setItem('astra_farmer_registration', JSON.stringify(data.registration));
    }
  };

  /**
   * Authority Login - Persists strictly under authority namespace
   */
  const loginAsAuthority = (authTok: string, authUser: UserSummaryDto) => {
    setToken(authTok);
    setUser(authUser);
    setFarmer(null);
    setFarmerState(null);
    setRegistration(null);

    // Tab-level isolation
    sessionStorage.setItem('astra_authority_token', authTok);
    sessionStorage.setItem('astra_authority_user', JSON.stringify(authUser));

    // Storage persistence
    localStorage.setItem('astra_authority_token', authTok);
    localStorage.setItem('astra_authority_user', JSON.stringify(authUser));
  };

  /**
   * Depot Operations Officer Login - Persists strictly under officer namespace
   */
  const loginAsOfficer = (offTok: string, offUser: UserSummaryDto, assignment?: any) => {
    setToken(offTok);
    setUser(offUser);
    setFarmer(null);
    setFarmerState(null);
    setRegistration(null);

    // Tab-level isolation
    sessionStorage.setItem('astra_officer_token', offTok);
    sessionStorage.setItem('astra_officer_user', JSON.stringify(offUser));
    if (assignment) {
      sessionStorage.setItem('astra_officer_assignment', JSON.stringify(assignment));
    }

    // Storage persistence
    localStorage.setItem('astra_officer_token', offTok);
    localStorage.setItem('astra_officer_user', JSON.stringify(offUser));
    if (assignment) {
      localStorage.setItem('astra_officer_assignment', JSON.stringify(assignment));
    }
  };

  /**
   * Farmer Verification Authority Login - Persists strictly under verification namespace
   */
  const loginAsVerificationAuthority = (verTok: string, verUser: UserSummaryDto) => {
    setToken(verTok);
    setUser(verUser);
    setFarmer(null);
    setFarmerState(null);
    setRegistration(null);

    // Tab-level isolation
    sessionStorage.setItem('astra_verification_token', verTok);
    sessionStorage.setItem('astra_verification_user', JSON.stringify(verUser));

    // Storage persistence
    localStorage.setItem('astra_verification_token', verTok);
    localStorage.setItem('astra_verification_user', JSON.stringify(verUser));
  };

  const updateFarmerProfile = (profile: Partial<FarmerProfileDto>) => {
    if (!farmer) return;
    const updated = { ...farmer, ...profile };
    setFarmer(updated);
    sessionStorage.setItem('astra_farmer', JSON.stringify(updated));
    localStorage.setItem('astra_farmer', JSON.stringify(updated));
  };

  const updateLocalRegistration = (reg: RegistrationSummaryDto) => {
    setRegistration(reg);
    setFarmerState(FarmerState.SUBMITTED);
    sessionStorage.setItem('astra_farmer_registration', JSON.stringify(reg));
    sessionStorage.setItem('astra_farmer_state', FarmerState.SUBMITTED);
    localStorage.setItem('astra_farmer_registration', JSON.stringify(reg));
    localStorage.setItem('astra_farmer_state', FarmerState.SUBMITTED);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        farmer,
        registration,
        farmerState,
        isLoading,
        loginWithVerifyOtp,
        loginAsAuthority,
        loginAsOfficer,
        loginAsVerificationAuthority,
        logout,
        logoutPortal,
        refreshStatus,
        updateFarmerProfile,
        updateLocalRegistration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
