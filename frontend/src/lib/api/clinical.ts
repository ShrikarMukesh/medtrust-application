import { apiFetch, SERVICE_URLS, isMockMode } from '../api';
import { mockEncounters } from '../mock-data';

export interface ClinicalNoteResponse { id: string; content: string; authorId: string; noteType: string; createdAt: string; }
export interface DiagnosisResponse { code: string; description: string; }
export interface EncounterResponse {
  id: string; patientId: string; status: string; startDate: string; endDate: string | null;
  clinicalNotes: ClinicalNoteResponse[]; diagnoses: DiagnosisResponse[];
  createdAt: string; updatedAt: string;
}

const BASE = SERVICE_URLS.clinical;

export async function getEncounters(): Promise<EncounterResponse[]> {
  if (isMockMode()) return [...mockEncounters];
  return apiFetch<EncounterResponse[]>(BASE, '/api/encounters');
}

export async function getEncountersByPatient(patientId: string): Promise<EncounterResponse[]> {
  if (isMockMode()) return mockEncounters.filter(e => e.patientId === patientId);
  return apiFetch<EncounterResponse[]>(BASE, `/api/encounters/patient/${patientId}`);
}

export async function getEncounter(id: string): Promise<EncounterResponse> {
  if (isMockMode()) {
    const e = mockEncounters.find(e => e.id === id);
    if (!e) throw new Error('Encounter not found');
    return { ...e };
  }
  return apiFetch<EncounterResponse>(BASE, `/api/encounters/${id}`);
}

export async function createEncounter(patientId: string): Promise<EncounterResponse> {
  if (isMockMode()) {
    const newEncounter: EncounterResponse = {
      id: `e-${Date.now()}`,
      patientId,
      status: 'REGISTERED',
      startDate: new Date().toISOString(),
      endDate: null,
      clinicalNotes: [],
      diagnoses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockEncounters.unshift(newEncounter);
    return newEncounter;
  }
  return apiFetch<EncounterResponse>(BASE, '/api/encounters', {
    method: 'POST', body: JSON.stringify({ patientId }),
  });
}

export async function admitEncounter(id: string): Promise<EncounterResponse> {
  if (isMockMode()) {
    const e = mockEncounters.find(e => e.id === id);
    if (!e) throw new Error('Not found');
    e.status = 'ADMITTED';
    e.updatedAt = new Date().toISOString();
    return { ...e };
  }
  return apiFetch<EncounterResponse>(BASE, `/api/encounters/${id}/admit`, { method: 'PUT' });
}

export async function dischargeEncounter(id: string): Promise<EncounterResponse> {
  if (isMockMode()) {
    const e = mockEncounters.find(e => e.id === id);
    if (!e) throw new Error('Not found');
    e.status = 'DISCHARGED';
    e.endDate = new Date().toISOString();
    e.updatedAt = new Date().toISOString();
    return { ...e };
  }
  return apiFetch<EncounterResponse>(BASE, `/api/encounters/${id}/discharge`, { method: 'PUT' });
}

export async function addNote(encounterId: string, data: { content: string; authorId: string; noteType: string }): Promise<ClinicalNoteResponse> {
  if (isMockMode()) {
    const note: ClinicalNoteResponse = {
      id: `n-${Date.now()}`,
      content: data.content,
      authorId: data.authorId,
      noteType: data.noteType,
      createdAt: new Date().toISOString(),
    };
    const e = mockEncounters.find(e => e.id === encounterId);
    if (e) {
      e.clinicalNotes = [note, ...e.clinicalNotes];
      e.updatedAt = new Date().toISOString();
    }
    return note;
  }
  return apiFetch<ClinicalNoteResponse>(BASE, `/api/encounters/${encounterId}/notes`, {
    method: 'POST', body: JSON.stringify(data),
  });
}
