const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Smart, portal-isolated token resolution.
 * Supports concurrent sessions in different tabs (sessionStorage)
 * and portal-scoped isolation (Authority vs Officer vs Farmer).
 */
export function getActiveTokenForEndpoint(endpoint: string): string | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;

  // 1. Current Tab Session Check (highest priority for multi-tab isolation)
  const tabAuthToken = sessionStorage.getItem('astra_authority_token');
  const tabOfficerToken = sessionStorage.getItem('astra_officer_token');
  const tabFarmerToken = sessionStorage.getItem('astra_farmer_token');

  // If on Authority portal or current tab is Authority session:
  if (pathname.startsWith('/authority') || tabAuthToken) {
    if (
      endpoint.includes('/admin/') ||
      endpoint.includes('/authority') ||
      pathname.startsWith('/authority')
    ) {
      return tabAuthToken || localStorage.getItem('astra_authority_token') || localStorage.getItem('astra_token');
    }
    // Authority oversight into operations desks:
    if (
      tabAuthToken &&
      (endpoint.includes('/weighment') ||
        endpoint.includes('/quality') ||
        endpoint.includes('/checkin') ||
        endpoint.includes('/payment') ||
        endpoint.includes('/centres'))
    ) {
      return tabAuthToken;
    }
  }

  // If on Operations portal or current tab is Officer session:
  if (pathname.startsWith('/operations') || tabOfficerToken) {
    if (
      endpoint.includes('/weighment') ||
      endpoint.includes('/quality') ||
      endpoint.includes('/checkin') ||
      endpoint.includes('/payment') ||
      endpoint.includes('/procurement') ||
      endpoint.includes('/centres')
    ) {
      if (tabOfficerToken) return tabOfficerToken;
      if (tabAuthToken) return tabAuthToken; // Authority inspecting operations
      return (
        localStorage.getItem('astra_officer_token') ||
        localStorage.getItem('astra_authority_token') ||
        localStorage.getItem('astra_token')
      );
    }
  }

  // If on Farmer portal or current tab is Farmer session:
  if (pathname.startsWith('/farmer') || tabFarmerToken) {
    if (
      endpoint.includes('/farmer/') ||
      endpoint.includes('/bookings') ||
      endpoint.includes('/registration')
    ) {
      return (
        tabFarmerToken ||
        localStorage.getItem('astra_farmer_token') ||
        localStorage.getItem('astra_token')
      );
    }
  }

  // 2. Direct endpoint matching as fallback:
  if (endpoint.includes('/admin/') || endpoint.includes('/authority')) {
    return (
      tabAuthToken ||
      localStorage.getItem('astra_authority_token') ||
      sessionStorage.getItem('astra_token') ||
      localStorage.getItem('astra_token')
    );
  }

  if (
    endpoint.includes('/weighment') ||
    endpoint.includes('/quality') ||
    endpoint.includes('/checkin') ||
    endpoint.includes('/payment') ||
    endpoint.includes('/procurement') ||
    endpoint.includes('/centres')
  ) {
    return (
      tabOfficerToken ||
      tabAuthToken ||
      localStorage.getItem('astra_officer_token') ||
      localStorage.getItem('astra_authority_token') ||
      sessionStorage.getItem('astra_token') ||
      localStorage.getItem('astra_token')
    );
  }

  if (endpoint.includes('/farmer/') || endpoint.includes('/bookings')) {
    return (
      tabFarmerToken ||
      localStorage.getItem('astra_farmer_token') ||
      sessionStorage.getItem('astra_token') ||
      localStorage.getItem('astra_token')
    );
  }

  return (
    sessionStorage.getItem('astra_token') ||
    tabFarmerToken ||
    tabOfficerToken ||
    tabAuthToken ||
    localStorage.getItem('astra_token')
  );
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    token?: string | null;
  } = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const resolvedToken = options.token || getActiveTokenForEndpoint(endpoint);

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (resolvedToken) {
    finalHeaders['Authorization'] = `Bearer ${resolvedToken}`;
  }

  const normalizedEndpoint = endpoint.startsWith('/api/')
    ? endpoint
    : endpoint === '/api'
    ? endpoint
    : endpoint.startsWith('/')
    ? `/api${endpoint}`
    : `/api/${endpoint}`;

  const url = `${API_BASE}${normalizedEndpoint}`;

  const fetchOptions: RequestInit = {
    method,
    headers: finalHeaders,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error: any) {
    throw new ApiError(
      'Network error: Failed to connect to server.',
      0,
      { originalError: error.message }
    );
  }

  const text = await response.text();
  let data: any;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
      data.error ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
