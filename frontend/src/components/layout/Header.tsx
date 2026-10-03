'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { Bell, Search, LogOut, User, Sparkles } from 'lucide-react';
import { logout, getCurrentUserFromStorage, getCurrentUserRole } from '@/lib/api/auth';
import { mockUsers, mockAuthResponse } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const ROLE_BADGE_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  ADMIN: 'danger',
  DOCTOR: 'info',
  NURSE: 'success',
  RECEPTIONIST: 'warning',
  PATIENT: 'default',
};

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUserFromStorage>>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserFromStorage());
    setRole(getCurrentUserRole());
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSwitchRole = (newRole: string) => {
    const targetUser = mockUsers.find((u) => u.role === newRole) || mockUsers[0];
    localStorage.setItem('medtrust_access_token', mockAuthResponse.accessToken);
    localStorage.setItem('medtrust_refresh_token', mockAuthResponse.refreshToken);
    localStorage.setItem('medtrust_user_role', targetUser.role);
    localStorage.setItem(
      'medtrust_user',
      JSON.stringify({
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
      })
    );
    window.location.href = '/dashboard';
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      <div className={styles.right}>
        {/* Role Demo Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem' }}>
          <Sparkles size={14} style={{ color: 'var(--accent, #3b82f6)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role:</span>
          <select
            value={role || 'ADMIN'}
            onChange={(e) => handleSwitchRole(e.target.value)}
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-sm, 4px)',
              background: 'var(--bg-elevated, #1e293b)',
              color: 'var(--text-primary, #f8fafc)',
              border: '1px solid var(--border, #334155)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            title="Switch user role demo"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="NURSE">NURSE</option>
            <option value="RECEPTIONIST">RECEPTIONIST</option>
            <option value="PATIENT">PATIENT</option>
          </select>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.search}
            placeholder="Search..."
          />
        </div>

        {/* Notifications */}
        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.notifDot} />
        </button>

        {/* Profile */}
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <User size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginRight: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>
              {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System User'}
            </span>
            {role && (
              <span style={{ marginTop: '2px' }}>
                <Badge variant={ROLE_BADGE_VARIANTS[role] || 'default'} size="sm">
                  {role}
                </Badge>
              </span>
            )}
          </div>
          <button className={styles.iconBtn} aria-label="Logout" onClick={handleLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

