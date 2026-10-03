'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login, register, ApiError } from '@/lib/api/auth';
import { isMockMode } from '@/lib/api';
import { Activity, Shield, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
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
    } else {
      if (!email || !password || !firstName || !lastName) {
        setError('All fields are required.');
        return;
      }
      setLoading(true);
      try {
        await register({
          email,
          password,
          firstName,
          lastName,
          role: 'PATIENT',
        });
        router.push('/dashboard');
      } catch (err) {
        if (err instanceof ApiError) {
          try {
            const parsed = JSON.parse(err.message);
            setError(parsed.message || 'Registration failed');
          } catch {
            setError(err.message || 'Registration failed');
          }
        } else {
          setError('Unable to complete registration. Please try again.');
        }
      } finally {
        setLoading(false);
      }
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

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.6rem 0',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'login' ? '2px solid var(--accent, #3b82f6)' : '2px solid transparent',
              color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: mode === 'login' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.6rem 0',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'register' ? '2px solid var(--accent, #3b82f6)' : '2px solid transparent',
              color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: mode === 'register' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Register Patient
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'register' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder={mode === 'register' ? 'your.name@example.com' : 'admin@medtrust.com'}
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

          <Button type="submit" variant="primary" size="lg" loading={loading} icon={mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}>
            {mode === 'login' ? 'Sign In' : 'Create Patient Account'}
          </Button>

          {/* Quick Demo Role Logins */}
          {mode === 'login' && (
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
          )}
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <Shield size={14} />
          <span>HIPAA Compliant • SOC 2 Certified</span>
        </div>

        {/* Mock mode notice — only shown in mock mode */}
        {isMockMode() && (
          <div className={styles.mockNotice}>
            <span>Mock Mode Active</span>
          </div>
        )}
      </div>
    </div>
  );
}
