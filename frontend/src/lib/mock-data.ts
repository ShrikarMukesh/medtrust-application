/* ─── Mock Data for all MedTrust services ─────────────────────────────── */

// ── Patients ────────────────────────────────────────────────────────────
export const mockPatients = [
  {
    id: 'p-001', mrn: 'MRN-100001', firstName: 'Sarah', middleName: 'J', lastName: 'Johnson',
    fullName: 'Sarah J Johnson', dateOfBirth: '1985-03-15', gender: 'FEMALE', bloodType: 'A_POSITIVE',
    contactInfo: { phone: '(555) 123-4567', email: 'sarah.johnson@email.com', address: '123 Oak Street', city: 'Boston', state: 'MA', zipCode: '02101' },
    emergencyContact: { name: 'Michael Johnson', relationship: 'Spouse', phone: '(555) 123-4568' },
    insuranceInfo: { provider: 'Blue Cross', policyNumber: 'BC-789456', groupNumber: 'GRP-001', expirationDate: '2027-12-31' },
    allergies: ['Penicillin', 'Latex'], active: true, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2025-08-20T14:15:00Z',
  },
  {
    id: 'p-002', mrn: 'MRN-100002', firstName: 'James', middleName: null, lastName: 'Williams',
    fullName: 'James Williams', dateOfBirth: '1972-08-22', gender: 'MALE', bloodType: 'O_NEGATIVE',
    contactInfo: { phone: '(555) 234-5678', email: 'james.w@email.com', address: '456 Pine Ave', city: 'Cambridge', state: 'MA', zipCode: '02139' },
    emergencyContact: { name: 'Linda Williams', relationship: 'Wife', phone: '(555) 234-5679' },
    insuranceInfo: { provider: 'Aetna', policyNumber: 'AE-321654', groupNumber: 'GRP-002', expirationDate: '2026-06-30' },
    allergies: ['Sulfa drugs'], active: true, createdAt: '2024-02-10T09:00:00Z', updatedAt: '2025-09-01T11:30:00Z',
  },
  {
    id: 'p-003', mrn: 'MRN-100003', firstName: 'Maria', middleName: 'Elena', lastName: 'Garcia',
    fullName: 'Maria Elena Garcia', dateOfBirth: '1990-11-05', gender: 'FEMALE', bloodType: 'B_POSITIVE',
    contactInfo: { phone: '(555) 345-6789', email: 'maria.g@email.com', address: '789 Elm Blvd', city: 'Somerville', state: 'MA', zipCode: '02143' },
    emergencyContact: { name: 'Carlos Garcia', relationship: 'Brother', phone: '(555) 345-6790' },
    insuranceInfo: { provider: 'United Health', policyNumber: 'UH-654987', groupNumber: 'GRP-003', expirationDate: '2027-03-31' },
    allergies: [], active: true, createdAt: '2024-03-20T14:45:00Z', updatedAt: '2025-07-15T16:00:00Z',
  },
  {
    id: 'p-004', mrn: 'MRN-100004', firstName: 'Robert', middleName: 'A', lastName: 'Chen',
    fullName: 'Robert A Chen', dateOfBirth: '1965-06-18', gender: 'MALE', bloodType: 'AB_POSITIVE',
    contactInfo: { phone: '(555) 456-7890', email: 'robert.chen@email.com', address: '321 Maple Dr', city: 'Brookline', state: 'MA', zipCode: '02445' },
    emergencyContact: { name: 'Amy Chen', relationship: 'Daughter', phone: '(555) 456-7891' },
    insuranceInfo: { provider: 'Cigna', policyNumber: 'CG-987321', groupNumber: 'GRP-004', expirationDate: '2026-09-30' },
    allergies: ['Aspirin', 'Ibuprofen', 'Codeine'], active: true, createdAt: '2024-04-05T08:15:00Z', updatedAt: '2025-08-10T10:45:00Z',
  },
  {
    id: 'p-005', mrn: 'MRN-100005', firstName: 'Emily', middleName: null, lastName: 'Davis',
    fullName: 'Emily Davis', dateOfBirth: '1998-12-30', gender: 'FEMALE', bloodType: 'O_POSITIVE',
    contactInfo: { phone: '(555) 567-8901', email: 'emily.d@email.com', address: '654 Birch Ln', city: 'Newton', state: 'MA', zipCode: '02458' },
    emergencyContact: { name: 'Thomas Davis', relationship: 'Father', phone: '(555) 567-8902' },
    insuranceInfo: { provider: 'Humana', policyNumber: 'HU-147258', groupNumber: 'GRP-005', expirationDate: '2027-01-31' },
    allergies: [], active: false, createdAt: '2024-05-12T11:30:00Z', updatedAt: '2025-06-20T09:00:00Z',
  },
  {
    id: 'p-006', mrn: 'MRN-100006', firstName: 'David', middleName: 'K', lastName: 'Miller',
    fullName: 'David K Miller', dateOfBirth: '1978-04-10', gender: 'MALE', bloodType: 'A_NEGATIVE',
    contactInfo: { phone: '(555) 678-9012', email: 'david.m@email.com', address: '987 Cedar Way', city: 'Medford', state: 'MA', zipCode: '02155' },
    emergencyContact: { name: 'Karen Miller', relationship: 'Wife', phone: '(555) 678-9013' },
    insuranceInfo: { provider: 'Kaiser', policyNumber: 'KP-369852', groupNumber: 'GRP-006', expirationDate: '2026-12-31' },
    allergies: ['Morphine'], active: true, createdAt: '2024-06-01T13:00:00Z', updatedAt: '2025-09-05T15:30:00Z',
  },
];

// ── Appointments ────────────────────────────────────────────────────────
export const mockAppointments = [
  { id: 'a-001', patientId: 'p-001', providerId: 'dr-001', startTime: '2026-09-17T09:00:00Z', endTime: '2026-09-17T09:30:00Z', status: 'SCHEDULED', type: 'CHECKUP', reason: 'Annual physical examination', createdAt: '2026-09-10T14:00:00Z', updatedAt: '2026-09-10T14:00:00Z' },
  { id: 'a-002', patientId: 'p-002', providerId: 'dr-002', startTime: '2026-09-17T10:00:00Z', endTime: '2026-09-17T10:45:00Z', status: 'CONFIRMED', type: 'FOLLOW_UP', reason: 'Post-surgery follow up', createdAt: '2026-09-08T09:30:00Z', updatedAt: '2026-09-12T11:00:00Z' },
  { id: 'a-003', patientId: 'p-003', providerId: 'dr-001', startTime: '2026-09-17T11:00:00Z', endTime: '2026-09-17T11:30:00Z', status: 'SCHEDULED', type: 'CONSULTATION', reason: 'Headache & dizziness assessment', createdAt: '2026-09-11T16:00:00Z', updatedAt: '2026-09-11T16:00:00Z' },
  { id: 'a-004', patientId: 'p-004', providerId: 'dr-003', startTime: '2026-09-16T14:00:00Z', endTime: '2026-09-16T14:30:00Z', status: 'COMPLETED', type: 'LAB_WORK', reason: 'Routine blood work', createdAt: '2026-09-05T10:00:00Z', updatedAt: '2026-09-16T14:35:00Z' },
  { id: 'a-005', patientId: 'p-001', providerId: 'dr-002', startTime: '2026-09-15T09:00:00Z', endTime: '2026-09-15T09:30:00Z', status: 'CANCELLED', type: 'CHECKUP', reason: 'Flu symptoms', createdAt: '2026-09-01T08:00:00Z', updatedAt: '2026-09-14T17:00:00Z' },
  { id: 'a-006', patientId: 'p-006', providerId: 'dr-001', startTime: '2026-09-18T08:30:00Z', endTime: '2026-09-18T09:00:00Z', status: 'SCHEDULED', type: 'FOLLOW_UP', reason: 'Medication review', createdAt: '2026-09-12T12:00:00Z', updatedAt: '2026-09-12T12:00:00Z' },
  { id: 'a-007', patientId: 'p-002', providerId: 'dr-003', startTime: '2026-09-18T10:30:00Z', endTime: '2026-09-18T11:30:00Z', status: 'SCHEDULED', type: 'SURGERY', reason: 'Knee arthroscopy', createdAt: '2026-09-05T14:00:00Z', updatedAt: '2026-09-05T14:00:00Z' },
  { id: 'a-008', patientId: 'p-003', providerId: 'dr-002', startTime: '2026-09-14T13:00:00Z', endTime: '2026-09-14T13:30:00Z', status: 'COMPLETED', type: 'CONSULTATION', reason: 'Dermatology referral', createdAt: '2026-09-02T09:00:00Z', updatedAt: '2026-09-14T13:45:00Z' },
  { id: 'a-009', patientId: 'p-005', providerId: 'dr-001', startTime: '2026-09-13T15:00:00Z', endTime: '2026-09-13T15:30:00Z', status: 'NO_SHOW', type: 'CHECKUP', reason: 'General checkup', createdAt: '2026-09-01T11:00:00Z', updatedAt: '2026-09-13T15:45:00Z' },
  { id: 'a-010', patientId: 'p-004', providerId: 'dr-002', startTime: '2026-09-19T09:00:00Z', endTime: '2026-09-19T10:00:00Z', status: 'CONFIRMED', type: 'EMERGENCY', reason: 'Chest pain evaluation', createdAt: '2026-09-16T07:00:00Z', updatedAt: '2026-09-16T08:30:00Z' },
];

// ── Encounters ──────────────────────────────────────────────────────────
export const mockEncounters = [
  {
    id: 'e-001', patientId: 'p-001', status: 'DISCHARGED', startDate: '2026-09-14T08:00:00Z', endDate: '2026-09-14T16:00:00Z',
    clinicalNotes: [
      { id: 'n-001', content: 'Patient presents with mild hypertension. BP 145/92. Started on lisinopril 10mg daily.', authorId: 'dr-001', noteType: 'PROGRESS_NOTE', createdAt: '2026-09-14T09:30:00Z' },
      { id: 'n-002', content: 'Discharge summary: Stable. Follow up in 2 weeks.', authorId: 'dr-001', noteType: 'DISCHARGE_SUMMARY', createdAt: '2026-09-14T15:30:00Z' },
    ],
    diagnoses: [{ code: 'I10', description: 'Essential hypertension' }],
    createdAt: '2026-09-14T08:00:00Z', updatedAt: '2026-09-14T16:00:00Z',
  },
  {
    id: 'e-002', patientId: 'p-002', status: 'ADMITTED', startDate: '2026-09-16T10:00:00Z', endDate: null,
    clinicalNotes: [
      { id: 'n-003', content: 'Pre-operative assessment complete. Patient cleared for knee arthroscopy.', authorId: 'dr-003', noteType: 'ASSESSMENT', createdAt: '2026-09-16T10:30:00Z' },
    ],
    diagnoses: [{ code: 'M23.51', description: 'Chronic instability of knee, right' }],
    createdAt: '2026-09-16T10:00:00Z', updatedAt: '2026-09-16T10:30:00Z',
  },
  {
    id: 'e-003', patientId: 'p-004', status: 'REGISTERED', startDate: '2026-09-17T14:00:00Z', endDate: null,
    clinicalNotes: [],
    diagnoses: [],
    createdAt: '2026-09-17T14:00:00Z', updatedAt: '2026-09-17T14:00:00Z',
  },
  {
    id: 'e-004', patientId: 'p-003', status: 'DISCHARGED', startDate: '2026-09-12T09:00:00Z', endDate: '2026-09-12T12:00:00Z',
    clinicalNotes: [
      { id: 'n-004', content: 'Migraine evaluation. CT scan normal. Prescribed sumatriptan.', authorId: 'dr-001', noteType: 'PROGRESS_NOTE', createdAt: '2026-09-12T10:15:00Z' },
    ],
    diagnoses: [{ code: 'G43.909', description: 'Migraine, unspecified, not intractable' }],
    createdAt: '2026-09-12T09:00:00Z', updatedAt: '2026-09-12T12:00:00Z',
  },
];

// ── Audit Entries ───────────────────────────────────────────────────────
export const mockAuditEntries = [
  { id: 'au-001', eventType: 'appointment.scheduled', category: 'APPOINTMENT', sourceService: 'appointment-service', actorId: 'dr-001', targetId: 'a-001', targetType: 'APPOINTMENT', payload: { patientId: 'p-001', providerId: 'dr-001', startTime: '2026-09-17T09:00:00Z' }, eventTimestamp: '2026-09-10T14:00:00Z', receivedAt: '2026-09-10T14:00:01Z' },
  { id: 'au-002', eventType: 'patient.registered', category: 'PATIENT', sourceService: 'patient-service', actorId: 'admin-001', targetId: 'p-006', targetType: 'PATIENT', payload: { mrn: 'MRN-100006', firstName: 'David', lastName: 'Miller' }, eventTimestamp: '2026-09-10T13:00:00Z', receivedAt: '2026-09-10T13:00:01Z' },
  { id: 'au-003', eventType: 'user.logged_in', category: 'AUTHENTICATION', sourceService: 'auth-service', actorId: 'dr-001', targetId: 'dr-001', targetType: 'USER', payload: { email: 'dr.smith@medtrust.com' }, eventTimestamp: '2026-09-16T08:00:00Z', receivedAt: '2026-09-16T08:00:00Z' },
  { id: 'au-004', eventType: 'consent.granted', category: 'CONSENT', sourceService: 'consent-service', actorId: 'p-001', targetId: 'c-001', targetType: 'CONSENT', payload: { patientId: 'p-001', grantedToUserId: 'dr-001', scope: 'VIEW_RECORDS' }, eventTimestamp: '2026-09-15T10:00:00Z', receivedAt: '2026-09-15T10:00:01Z' },
  { id: 'au-005', eventType: 'appointment.cancelled', category: 'APPOINTMENT', sourceService: 'appointment-service', actorId: 'p-001', targetId: 'a-005', targetType: 'APPOINTMENT', payload: { reason: 'Patient requested cancellation' }, eventTimestamp: '2026-09-14T17:00:00Z', receivedAt: '2026-09-14T17:00:01Z' },
  { id: 'au-006', eventType: 'encounter.created', category: 'CLINICAL', sourceService: 'clinical-service', actorId: 'dr-003', targetId: 'e-002', targetType: 'ENCOUNTER', payload: { patientId: 'p-002' }, eventTimestamp: '2026-09-16T10:00:00Z', receivedAt: '2026-09-16T10:00:01Z' },
  { id: 'au-007', eventType: 'patient.contact_updated', category: 'PATIENT', sourceService: 'patient-service', actorId: 'admin-001', targetId: 'p-002', targetType: 'PATIENT', payload: { field: 'phone' }, eventTimestamp: '2026-09-15T14:30:00Z', receivedAt: '2026-09-15T14:30:01Z' },
  { id: 'au-008', eventType: 'user.registered', category: 'AUTHENTICATION', sourceService: 'auth-service', actorId: 'admin-001', targetId: 'dr-003', targetType: 'USER', payload: { email: 'dr.wilson@medtrust.com', role: 'PROVIDER' }, eventTimestamp: '2026-09-10T09:00:00Z', receivedAt: '2026-09-10T09:00:01Z' },
  { id: 'au-009', eventType: 'note.added', category: 'CLINICAL', sourceService: 'clinical-service', actorId: 'dr-001', targetId: 'e-001', targetType: 'ENCOUNTER', payload: { noteType: 'PROGRESS_NOTE', encounterId: 'e-001' }, eventTimestamp: '2026-09-14T09:30:00Z', receivedAt: '2026-09-14T09:30:01Z' },
  { id: 'au-010', eventType: 'consent.revoked', category: 'CONSENT', sourceService: 'consent-service', actorId: 'p-003', targetId: 'c-002', targetType: 'CONSENT', payload: { patientId: 'p-003', grantedToUserId: 'dr-002', scope: 'VIEW_RECORDS' }, eventTimestamp: '2026-09-13T11:00:00Z', receivedAt: '2026-09-13T11:00:01Z' },
];

// ── Consents ────────────────────────────────────────────────────────────
export const mockConsents = [
  { id: 'c-001', patientId: 'p-001', grantedToUserId: 'dr-001', scope: 'VIEW_RECORDS', status: 'GRANTED', grantedAt: '2026-09-15T10:00:00Z', expiresAt: '2027-09-15T10:00:00Z' },
  { id: 'c-002', patientId: 'p-003', grantedToUserId: 'dr-002', scope: 'VIEW_RECORDS', status: 'REVOKED', grantedAt: '2026-08-01T08:00:00Z', expiresAt: '2027-08-01T08:00:00Z' },
  { id: 'c-003', patientId: 'p-002', grantedToUserId: 'dr-003', scope: 'VIEW_RECORDS', status: 'GRANTED', grantedAt: '2026-09-10T12:00:00Z', expiresAt: '2027-09-10T12:00:00Z' },
  { id: 'c-004', patientId: 'p-004', grantedToUserId: 'dr-001', scope: 'VIEW_RECORDS', status: 'GRANTED', grantedAt: '2026-09-12T09:00:00Z', expiresAt: '2027-09-12T09:00:00Z' },
  { id: 'c-005', patientId: 'p-001', grantedToUserId: 'dr-002', scope: 'EDIT_RECORDS', status: 'GRANTED', grantedAt: '2026-09-14T15:00:00Z', expiresAt: '2027-09-14T15:00:00Z' },
];

// ── Auth / Users ────────────────────────────────────────────────────────
export const mockUsers = [
  { id: 'dr-001', email: 'dr.smith@medtrust.com', firstName: 'John', lastName: 'Smith', role: 'DOCTOR', active: true, lastLoginAt: '2026-09-16T08:00:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dr-002', email: 'dr.patel@medtrust.com', firstName: 'Priya', lastName: 'Patel', role: 'DOCTOR', active: true, lastLoginAt: '2026-09-16T07:30:00Z', createdAt: '2024-01-15T00:00:00Z' },
  { id: 'dr-003', email: 'dr.wilson@medtrust.com', firstName: 'Mark', lastName: 'Wilson', role: 'DOCTOR', active: true, lastLoginAt: '2026-09-15T18:00:00Z', createdAt: '2024-03-01T00:00:00Z' },
  { id: 'nurse-001', email: 'nurse.clara@medtrust.com', firstName: 'Clara', lastName: 'Barton', role: 'NURSE', active: true, lastLoginAt: '2026-09-16T08:15:00Z', createdAt: '2024-02-01T00:00:00Z' },
  { id: 'recep-001', email: 'recep.sarah@medtrust.com', firstName: 'Sarah', lastName: 'Jenkins', role: 'RECEPTIONIST', active: true, lastLoginAt: '2026-09-16T07:45:00Z', createdAt: '2024-02-15T00:00:00Z' },
  { id: 'pat-001', email: 'patient.james@medtrust.com', firstName: 'James', lastName: 'Rodriguez', role: 'PATIENT', active: true, lastLoginAt: '2026-09-15T14:20:00Z', createdAt: '2024-04-10T00:00:00Z' },
  { id: 'admin-001', email: 'admin@medtrust.com', firstName: 'System', lastName: 'Admin', role: 'ADMIN', active: true, lastLoginAt: '2026-09-16T09:00:00Z', createdAt: '2024-01-01T00:00:00Z' },
];

export const mockAuthResponse = {
  accessToken: 'mock-jwt-token-xyz',
  refreshToken: 'mock-refresh-token-abc',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: {
    id: 'admin-001',
    email: 'admin@medtrust.com',
    firstName: 'System',
    lastName: 'Admin',
    role: 'ADMIN',
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────
export function getPatientName(patientId: string): string {
  const p = mockPatients.find((p) => p.id === patientId);
  return p ? p.fullName : patientId;
}

export function getProviderName(providerId: string): string {
  const u = mockUsers.find((u) => u.id === providerId);
  return u ? `Dr. ${u.lastName}` : providerId;
}
