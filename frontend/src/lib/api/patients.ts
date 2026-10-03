import { apiFetch, SERVICE_URLS, isMockMode } from '../api';
import { mockPatients } from '../mock-data';

export interface PatientResponse {
  id: string; mrn: string; firstName: string; middleName: string | null; lastName: string;
  fullName: string; dateOfBirth: string; gender: string; bloodType: string;
  contactInfo: { phone: string; email: string; address: string; city: string; state: string; zipCode: string; };
  emergencyContact: { name: string; relationship: string; phone: string; };
  insuranceInfo: { provider: string; policyNumber: string; groupNumber: string; expirationDate: string; };
  allergies: string[]; active: boolean; createdAt: string; updatedAt: string;
}

const BASE = SERVICE_URLS.patient;

export async function getPatients(lastName?: string): Promise<PatientResponse[]> {
  if (isMockMode()) {
    if (lastName) return mockPatients.filter(p => p.lastName.toLowerCase().includes(lastName.toLowerCase()));
    return mockPatients;
  }
  const query = lastName ? `?lastName=${encodeURIComponent(lastName)}` : '';
  return apiFetch<PatientResponse[]>(BASE, `/api/patients${query}`);
}

export async function getPatient(id: string): Promise<PatientResponse> {
  if (isMockMode()) {
    const p = mockPatients.find(p => p.id === id);
    if (!p) throw new Error('Patient not found');
    return p;
  }
  return apiFetch<PatientResponse>(BASE, `/api/patients/${id}`);
}

export interface RegisterPatientData {
  mrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  emergencyContact?: { name: string; relationship: string; phone: string };
  insuranceInfo?: { provider: string; policyNumber: string; groupNumber?: string; expirationDate?: string };
  allergies?: string[];
}

export async function registerPatient(data: RegisterPatientData): Promise<PatientResponse> {
  if (isMockMode()) {
    return {
      ...mockPatients[0],
      ...data,
      id: `p-${Date.now()}`,
      fullName: [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' '),
      middleName: data.middleName ?? null,
      bloodType: data.bloodType || 'UNKNOWN',
      contactInfo: {
        phone: data.contactInfo.phone,
        email: data.contactInfo.email,
        address: data.contactInfo.address,
        city: data.contactInfo.city || '',
        state: data.contactInfo.state || '',
        zipCode: data.contactInfo.zipCode || '',
      },
      emergencyContact: data.emergencyContact || { name: '', relationship: '', phone: '' },
      insuranceInfo: data.insuranceInfo
        ? {
            provider: data.insuranceInfo.provider,
            policyNumber: data.insuranceInfo.policyNumber,
            groupNumber: data.insuranceInfo.groupNumber || '',
            expirationDate: data.insuranceInfo.expirationDate || '',
          }
        : { provider: '', policyNumber: '', groupNumber: '', expirationDate: '' },
      allergies: data.allergies || [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return apiFetch<PatientResponse>(BASE, '/api/patients', {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function updatePatientContact(
  id: string,
  data: { phone: string; email: string; address: string; city?: string; state?: string; zipCode?: string }
): Promise<PatientResponse> {
  if (isMockMode()) {
    const p = mockPatients.find((p) => p.id === id);
    if (!p) throw new Error('Patient not found');
    p.contactInfo = {
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city || p.contactInfo.city,
      state: data.state || p.contactInfo.state,
      zipCode: data.zipCode || p.contactInfo.zipCode,
    };
    p.updatedAt = new Date().toISOString();
    return { ...p };
  }
  return apiFetch<PatientResponse>(BASE, `/api/patients/${id}/contact`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updatePatientInsurance(
  id: string,
  data: { provider: string; policyNumber: string; groupNumber?: string; expirationDate?: string }
): Promise<PatientResponse> {
  if (isMockMode()) {
    const p = mockPatients.find((p) => p.id === id);
    if (!p) throw new Error('Patient not found');
    p.insuranceInfo = {
      provider: data.provider,
      policyNumber: data.policyNumber,
      groupNumber: data.groupNumber || p.insuranceInfo.groupNumber,
      expirationDate: data.expirationDate || p.insuranceInfo.expirationDate,
    };
    p.updatedAt = new Date().toISOString();
    return { ...p };
  }
  return apiFetch<PatientResponse>(BASE, `/api/patients/${id}/insurance`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deactivatePatient(id: string): Promise<PatientResponse> {
  if (isMockMode()) {
    const p = mockPatients.find((p) => p.id === id);
    if (!p) throw new Error('Patient not found');
    p.active = false;
    p.updatedAt = new Date().toISOString();
    return { ...p };
  }
  return apiFetch<PatientResponse>(BASE, `/api/patients/${id}`, { method: 'DELETE' });
}
