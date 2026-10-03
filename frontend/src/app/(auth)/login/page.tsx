'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login, ApiError } from '@/lib/api/auth';
import { isMockMode } from '@/lib/api';
import { Activity, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        // Try to parse the JSON error body from the backend
        try {
          const parsed = JSON.parse(err.message);
          setError(parsed.message || 'Authentication failed');
        } catch {
          setError(err.message || 'Authentication failed');
        }
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.page} mesh-gradient`}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Activity size={28} />
          </div>
          <h1 className={styles.brand}>MedTrust</h1>
          <p className={styles.tagline}>Healthcare Administration Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            placeholder="admin@medtrust.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" size="lg" loading={loading}>
            Sign In
          </Button>

          {/* Quick Demo Role Logins */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Demo Logins (Click to Fill)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginTop: '0.5rem' }}>
              {[
                { role: 'ADMIN', email: 'admin@medtrust.com' },
                { role: 'DOCTOR', email: 'dr.smith@medtrust.com' },
                { role: 'NURSE', email: 'nurse.clara@medtrust.com' },
                { role: 'RECEPTIONIST', email: 'recep.sarah@medtrust.com' },
                { role: 'PATIENT', email: 'patient.james@medtrust.com' },
              ].map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword('Password123!');
                  }}
                  style={{
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm, 4px)',
                    background: 'var(--bg-elevated, rgba(255,255,255,0.05))',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <strong>{d.role}</strong>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <Shield size={14} />
          <span>HIPAA Compliant • SOC 2 Certified</span>
        </div>

        {/* Mock mode notice — only shown in mock mode */}
        {isMockMode() && (
          <div className={styles.mockNotice}>
            <span>Mock Mode — any credentials will work</span>
          </div>
        )}
      </div>
    </div>
  );
}
