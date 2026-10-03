import { apiFetch, ApiError, SERVICE_URLS, isMockMode } from '../api';
import { mockAuthResponse, mockUsers } from '../mock-data';

export interface LoginData { email: string; password: string; }
export interface RegisterData { email: string; password: string; firstName: string; lastName: string; role: string; }
export interface AuthResponse {
  accessToken: string; refreshToken: string; tokenType: string; expiresIn: number;
  user: { id: string; email: string; firstName: string; lastName: string; role: string; };
}
export interface UserResponse {
  id: string; email: string; firstName: string; lastName: string; role: string;
  active: boolean; lastLoginAt: string; createdAt: string;
}

const BASE = SERVICE_URLS.auth;

export async function login(data: LoginData): Promise<AuthResponse> {
  if (isMockMode()) {
    const user = mockUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase()) || mockUsers[6]; // fallback admin
    const authRes: AuthResponse = {
      ...mockAuthResponse,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
    localStorage.setItem('medtrust_access_token', authRes.accessToken);
    localStorage.setItem('medtrust_refresh_token', authRes.refreshToken);
    localStorage.setItem('medtrust_user_role', authRes.user.role);
    localStorage.setItem('medtrust_user', JSON.stringify(authRes.user));
    return authRes;
  }
  const res = await apiFetch<AuthResponse>(BASE, '/api/auth/login', {
    method: 'POST', body: JSON.stringify(data),
  });
  localStorage.setItem('medtrust_access_token', res.accessToken);
  localStorage.setItem('medtrust_refresh_token', res.refreshToken);
  localStorage.setItem('medtrust_user_role', res.user.role);
  localStorage.setItem('medtrust_user', JSON.stringify(res.user));
  return res;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  if (isMockMode()) return mockAuthResponse;
  const res = await apiFetch<AuthResponse>(BASE, '/api/auth/register', {
    method: 'POST', body: JSON.stringify(data),
  });
  localStorage.setItem('medtrust_access_token', res.accessToken);
  localStorage.setItem('medtrust_refresh_token', res.refreshToken);
  localStorage.setItem('medtrust_user_role', res.user.role);
  localStorage.setItem('medtrust_user', JSON.stringify(res.user));
  return res;
}

export async function adminCreateUser(data: RegisterData): Promise<AuthResponse> {
  if (isMockMode()) {
    const newUser: UserResponse = {
      id: `usr-${Date.now()}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      active: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return {
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: newUser,
    };
  }
  return apiFetch<AuthResponse>(BASE, '/api/auth/register/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deactivateUser(id: string): Promise<UserResponse> {
  if (isMockMode()) {
    const user = mockUsers.find(u => u.id === id);
    if (user) user.active = false;
    return user || mockUsers[0];
  }
  return apiFetch<UserResponse>(BASE, `/api/users/${id}`, {
    method: 'DELETE',
  });
}

export async function reactivateUser(id: string): Promise<UserResponse> {
  if (isMockMode()) {
    const user = mockUsers.find(u => u.id === id);
    if (user) user.active = true;
    return user || mockUsers[0];
  }
  return apiFetch<UserResponse>(BASE, `/api/users/${id}/reactivate`, {
    method: 'PUT',
  });
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export async function changePassword(data: ChangePasswordData): Promise<UserResponse> {
  if (isMockMode()) {
    return mockUsers[0];
  }
  return apiFetch<UserResponse>(BASE, '/api/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function refreshAccessToken(): Promise<AuthResponse> {
  const refreshToken = localStorage.getItem('medtrust_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const res = await apiFetch<AuthResponse>(BASE, '/api/auth/refresh', {
    method: 'POST', body: JSON.stringify({ refreshToken }),
  });
  localStorage.setItem('medtrust_access_token', res.accessToken);
  localStorage.setItem('medtrust_refresh_token', res.refreshToken);
  localStorage.setItem('medtrust_user_role', res.user.role);
  localStorage.setItem('medtrust_user', JSON.stringify(res.user));
  return res;
}

export async function getUsers(): Promise<UserResponse[]> {
  if (isMockMode()) return [...mockUsers];
  return apiFetch<UserResponse[]>(BASE, '/api/users');
}

/** Staff picker for appointments/consents — available to any authenticated user. */
export async function getStaffDirectory(): Promise<UserResponse[]> {
  if (isMockMode()) return [...mockUsers];
  try {
    return await apiFetch<UserResponse[]>(BASE, '/api/users/directory');
  } catch {
    return getUsers();
  }
}

export async function getCurrentUser(): Promise<UserResponse> {
  const local = getCurrentUserFromStorage();
  if (isMockMode()) {
    if (local) {
      const match = mockUsers.find(u => u.id === local.id);
      if (match) return match;
    }
    return mockUsers[6]; // admin
  }
  return apiFetch<UserResponse>(BASE, '/api/users/me');
}

export function logout() {
  const refreshToken = localStorage.getItem('medtrust_refresh_token');
  // Best-effort server-side logout (revoke refresh token)
  if (refreshToken && !isMockMode()) {
    fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => { /* ignore errors during logout */ });
  }
  localStorage.removeItem('medtrust_access_token');
  localStorage.removeItem('medtrust_refresh_token');
  localStorage.removeItem('medtrust_user_role');
  localStorage.removeItem('medtrust_user');
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('medtrust_access_token');
}

/** Returns the current user's role from localStorage, or null if not logged in */
export function getCurrentUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('medtrust_user_role');
}

/** Returns the current user object from localStorage (sync, no network call) */
export function getCurrentUserFromStorage(): AuthResponse['user'] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('medtrust_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Check if current user has a specific role */
export function hasRole(...roles: string[]): boolean {
  const role = getCurrentUserRole();
  return role != null && roles.includes(role);
}

export { ApiError };
