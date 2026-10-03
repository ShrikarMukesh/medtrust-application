import { apiFetch, SERVICE_URLS, isMockMode } from '../api';
import { mockAppointments } from '../mock-data';

export interface AppointmentResponse {
  id: string; patientId: string; providerId: string; startTime: string; endTime: string;
  status: string; type: string; reason: string; createdAt: string; updatedAt: string;
}

export interface CreateAppointmentData {
  patientId: string; providerId: string; startTime: string; endTime: string; type: string; reason?: string;
}

export interface RescheduleData {
  newStartTime: string;
  newEndTime: string;
}

export const APPOINTMENT_TYPES = ['CHECKUP', 'FOLLOW_UP', 'EMERGENCY', 'LAB_WORK', 'SURGERY', 'CONSULTATION'] as const;
export const APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;
export type AppointmentType = typeof APPOINTMENT_TYPES[number];
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];

const BASE = SERVICE_URLS.appointment;

export async function getAppointments(): Promise<AppointmentResponse[]> {
  if (isMockMode()) return mockAppointments;
  return apiFetch<AppointmentResponse[]>(BASE, '/api/appointments');
}

export async function getAppointment(id: string): Promise<AppointmentResponse> {
  if (isMockMode()) {
    const a = mockAppointments.find(a => a.id === id);
    if (!a) throw new Error('Appointment not found');
    return a;
  }
  return apiFetch<AppointmentResponse>(BASE, `/api/appointments/${id}`);
}

export async function getAppointmentsByPatient(patientId: string): Promise<AppointmentResponse[]> {
  if (isMockMode()) return mockAppointments.filter(a => a.patientId === patientId);
  return apiFetch<AppointmentResponse[]>(BASE, `/api/appointments/patient/${patientId}`);
}

export async function getAppointmentsByProvider(providerId: string): Promise<AppointmentResponse[]> {
  if (isMockMode()) return mockAppointments.filter(a => a.providerId === providerId);
  return apiFetch<AppointmentResponse[]>(BASE, `/api/appointments/provider/${providerId}`);
}

export async function getAppointmentsByDateRange(start: string, end: string): Promise<AppointmentResponse[]> {
  if (isMockMode()) return mockAppointments;
  return apiFetch<AppointmentResponse[]>(BASE, `/api/appointments/date-range?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
}

export async function createAppointment(data: CreateAppointmentData): Promise<AppointmentResponse> {
  if (isMockMode()) return { ...mockAppointments[0], ...data, id: 'a-new', status: 'SCHEDULED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  return apiFetch<AppointmentResponse>(BASE, '/api/appointments', {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function cancelAppointment(id: string, reason?: string): Promise<AppointmentResponse> {
  if (isMockMode()) {
    const a = mockAppointments.find(a => a.id === id);
    if (!a) throw new Error('Not found');
    return { ...a, status: 'CANCELLED' };
  }
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return apiFetch<AppointmentResponse>(BASE, `/api/appointments/${id}/cancel${query}`, { method: 'PUT' });
}

export async function confirmAppointment(id: string): Promise<AppointmentResponse> {
  if (isMockMode()) {
    const a = mockAppointments.find(a => a.id === id);
    if (!a) throw new Error('Not found');
    return { ...a, status: 'CONFIRMED' };
  }
  return apiFetch<AppointmentResponse>(BASE, `/api/appointments/${id}/confirm`, { method: 'PUT' });
}

export async function checkInAppointment(id: string): Promise<AppointmentResponse> {
  if (isMockMode()) {
    const a = mockAppointments.find(a => a.id === id);
    if (!a) throw new Error('Not found');
    return { ...a, status: 'CHECKED_IN' };
  }
  return apiFetch<AppointmentResponse>(BASE, `/api/appointments/${id}/check-in`, { method: 'PUT' });
}

export async function completeAppointment(id: string): Promise<AppointmentResponse> {
  if (isMockMode()) {
    const a = mockAppointments.find(a => a.id === id);
    if (!a) throw new Error('Not found');
    return { ...a, status: 'COMPLETED' };
  }
  return apiFetch<AppointmentResponse>(BASE, `/api/appointments/${id}/complete`, { method: 'PUT' });
}

export async function markNoShow(id: string): Promise<AppointmentResponse> {
  if (isMockMode()) {
    const a = mockAppointments.find(a => a.id === id);
    if (!a) throw new Error('Not found');
    return { ...a, status: 'NO_SHOW' };
  }
  return apiFetch<AppointmentResponse>(BASE, `/api/appointments/${id}/no-show`, { method: 'PUT' });
}

export async function rescheduleAppointment(id: string, data: RescheduleData): Promise<AppointmentResponse> {
  if (isMockMode()) {
    const a = mockAppointments.find(a => a.id === id);
    if (!a) throw new Error('Not found');
    return { ...a, startTime: data.newStartTime, endTime: data.newEndTime, status: 'SCHEDULED' };
  }
  return apiFetch<AppointmentResponse>(BASE, `/api/appointments/${id}/reschedule`, {
    method: 'PUT', body: JSON.stringify(data),
  });
}
