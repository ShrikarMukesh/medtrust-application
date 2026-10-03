'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getCurrentUserRole } from '@/lib/api/auth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AuthGuardProps {
  children: React.ReactNode;
}

/** Route permission mappings: pattern -> allowed roles */
const ROUTE_PERMISSIONS: { pattern: RegExp; roles: string[]; label: string }[] = [
  { pattern: /^\/audit(\/.*)?$/, roles: ['ADMIN'], label: 'Audit Log' },
  { pattern: /^\/users(\/.*)?$/, roles: ['ADMIN'], label: 'User Administration' },
  { pattern: /^\/clinical(\/.*)?$/, roles: ['ADMIN', 'DOCTOR', 'NURSE'], label: 'Clinical Encounters' },
  { pattern: /^\/patients(\/.*)?$/, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'], label: 'Patient Directory' },
  { pattern: /^\/consents(\/.*)?$/, roles: ['ADMIN', 'DOCTOR', 'PATIENT'], label: 'Consents' },
  { pattern: /^\/appointments(\/.*)?$/, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'], label: 'Appointments' },
  { pattern: /^\/dashboard(\/.*)?$/, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'], label: 'Dashboard' },
];

/** Decode the JWT payload (base64url) without verifying signature — client-side only */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('medtrust_access_token');
    const refreshToken = localStorage.getItem('medtrust_refresh_token');

    if (!token || !isAuthenticated()) {
      router.replace('/login');
      return;
    }

    if (isTokenExpired(token)) {
      if (!refreshToken) {
        localStorage.removeItem('medtrust_access_token');
        localStorage.removeItem('medtrust_user_role');
        localStorage.removeItem('medtrust_user');
        router.replace('/login');
        return;
      }
    }

    setUserRole(getCurrentUserRole());
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-muted)',
        fontSize: 'var(--text-sm)',
      }}>
        Verifying authentication…
      </div>
    );
  }

  // Check role authorization for current path
  const matchingRule = ROUTE_PERMISSIONS.find(r => r.pattern.test(pathname));
  if (matchingRule && userRole && !matchingRule.roles.includes(userRole)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-danger, #ef4444)',
          marginBottom: '1.5rem',
        }}>
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Access Restricted (403)
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '440px', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Your account role (<strong>{userRole}</strong>) does not have authorization to access {matchingRule.label}. This action has been logged for compliance.
        </p>
        <Button variant="primary" onClick={() => router.push('/dashboard')} icon={<ArrowLeft size={16} />}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
