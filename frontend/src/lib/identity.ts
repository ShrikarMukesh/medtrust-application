'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPatients, PatientResponse } from './api/patients';
import {
  getCurrentUserFromStorage,
  getStaffDirectory,
  UserResponse,
} from './api/auth';

export function displayUserName(u: Pick<UserResponse, 'firstName' | 'lastName' | 'role'>): string {
  const last = u.lastName?.trim() || '';
  if (u.role === 'DOCTOR' && last) return `Dr. ${last}`;
  const full = `${u.firstName || ''} ${last}`.trim();
  return full || 'Unknown user';
}

export function useIdentity() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);

  const reload = useCallback(async () => {
    const [patientResult, userResult] = await Promise.allSettled([
      getPatients(),
      getStaffDirectory(),
    ]);

    if (patientResult.status === 'fulfilled') {
      setPatients(patientResult.value);
    }

    if (userResult.status === 'fulfilled') {
      setUsers(userResult.value);
    } else {
      const me = getCurrentUserFromStorage();
      if (me) {
        setUsers([{
          id: me.id,
          email: me.email,
          firstName: me.firstName,
          lastName: me.lastName,
          role: me.role,
          active: true,
          lastLoginAt: '',
          createdAt: '',
        }]);
      }
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const patientName = useCallback((id: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return id;
    return patient.fullName || `${patient.firstName} ${patient.lastName}`.trim() || id;
  }, [patients]);

  const userName = useCallback((id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? displayUserName(user) : id;
  }, [users]);

  const activePatients = useMemo(
    () => patients.filter((p) => p.active !== false),
    [patients],
  );

  const providers = useMemo(
    () => users.filter((u) => u.active !== false && ['DOCTOR', 'NURSE', 'ADMIN'].includes(u.role)),
    [users],
  );

  const staff = useMemo(
    () => users.filter((u) => u.active !== false && u.role !== 'PATIENT'),
    [users],
  );

  return {
    patients,
    users,
    activePatients,
    providers,
    staff,
    patientName,
    userName,
    reload,
  };
}
