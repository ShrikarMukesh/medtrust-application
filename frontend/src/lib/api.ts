/* ─── Central API Client ──────────────────────────────────────────────── */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const SERVICE_URLS = {
  patient: process.env.NEXT_PUBLIC_PATIENT_SERVICE_URL || 'http://localhost:8081',
  appointment: process.env.NEXT_PUBLIC_APPOINTMENT_SERVICE_URL || 'http://localhost:8082',
  auth: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8083',
  consent: process.env.NEXT_PUBLIC_CONSENT_SERVICE_URL || 'http://localhost:8084',
  audit: process.env.NEXT_PUBLIC_AUDIT_SERVICE_URL || 'http://localhost:8085',
  clinical: process.env.NEXT_PUBLIC_CLINICAL_SERVICE_URL || 'http://localhost:8080',
  notification: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:8086',
  integration: process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_URL || 'http://localhost:8087',
} as const;

export function isMockMode(): boolean {
  return USE_MOCK;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.message) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      /* body is not JSON */
    }
    return err.message || `HTTP ${err.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('medtrust_access_token');
}

function buildHeaders(options: RequestInit): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function doFetch<T>(baseUrl: string, path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(400, json.message || 'Request failed');
  }

  return json.data;
}

/** Flag to prevent infinite refresh loops */
let isRefreshing = false;

export async function apiFetch<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    return await doFetch<T>(baseUrl, path, options);
  } catch (err) {
    // Auto-refresh on 401: attempt token refresh once, then retry
    if (err instanceof ApiError && err.status === 401 && !isRefreshing) {
      isRefreshing = true;
      try {
        // Dynamically import to avoid circular dependency
        const { refreshAccessToken } = await import('./api/auth');
        await refreshAccessToken();
        isRefreshing = false;
        // Retry original request with new token
        return await doFetch<T>(baseUrl, path, options);
      } catch {
        isRefreshing = false;
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem('medtrust_access_token');
        localStorage.removeItem('medtrust_refresh_token');
        localStorage.removeItem('medtrust_user_role');
        localStorage.removeItem('medtrust_user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError(401, 'Session expired. Please log in again.');
      }
    }
    throw err;
  }
}
