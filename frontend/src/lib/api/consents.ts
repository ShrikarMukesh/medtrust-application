import { apiFetch, SERVICE_URLS, isMockMode } from '../api';
import { mockConsents } from '../mock-data';

export interface ConsentResponse {
  id: string;
  patientId: string;
  grantedToUserId: string;
  scope: string;
  status: string;
  validFrom?: string;
  validUntil?: string;
  grantedAt: string;
  expiresAt: string;
  reason?: string;
  currentlyValid?: boolean;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const CONSENT_SCOPES = [
  'VIEW_DEMOGRAPHICS',
  'VIEW_CLINICAL_RECORDS',
  'VIEW_APPOINTMENTS',
  'VIEW_PRESCRIPTIONS',
  'VIEW_LAB_RESULTS',
  'FULL_ACCESS',
] as const;

const BASE = SERVICE_URLS.consent;

function normalizeConsent(c: any): ConsentResponse {
  return {
    ...c,
    grantedAt: c.grantedAt || c.validFrom || c.createdAt || new Date().toISOString(),
    expiresAt: c.expiresAt || c.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function getConsents(): Promise<ConsentResponse[]> {
  if (isMockMode()) return mockConsents;
  const list = await apiFetch<any[]>(BASE, '/api/consents');
  return list.map(normalizeConsent);
}

export async function grantConsent(data: { patientId: string; grantedToUserId: string; scope: string; validFrom?: string; validUntil?: string; reason?: string }): Promise<ConsentResponse> {
  if (isMockMode()) return { id: 'c-new', ...data, status: 'GRANTED', grantedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() };
  const res = await apiFetch<any>(BASE, '/api/consents', {
    method: 'POST', body: JSON.stringify(data),
  });
  return normalizeConsent(res);
}

export async function revokeConsent(id: string): Promise<ConsentResponse> {
  if (isMockMode()) {
    const c = mockConsents.find(c => c.id === id);
    if (!c) throw new Error('Consent not found');
    return { ...c, status: 'REVOKED' };
  }
  const res = await apiFetch<any>(BASE, `/api/consents/${id}`, { method: 'DELETE' });
  return normalizeConsent(res);
}

export async function verifyConsent(patientId: string, userId: string, scope: string): Promise<{ hasConsent: boolean }> {
  if (isMockMode()) {
    const found = mockConsents.some(c => c.patientId === patientId && c.grantedToUserId === userId && c.scope === scope && c.status === 'GRANTED');
    return { hasConsent: found };
  }
  return apiFetch<{ hasConsent: boolean }>(BASE, `/api/consents/verify?patientId=${patientId}&userId=${userId}&scope=${scope}`);
}
