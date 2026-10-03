'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './users.module.css';
import { Header } from '@/components/layout/Header';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  getUsers,
  adminCreateUser,
  deactivateUser,
  reactivateUser,
  UserResponse,
} from '@/lib/api/auth';
import { Search, UserPlus, Shield, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  ADMIN: 'danger',
  DOCTOR: 'info',
  NURSE: 'success',
  RECEPTIONIST: 'warning',
  PATIENT: 'default',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Create form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'DOCTOR',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await adminCreateUser(formData);
      setModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'DOCTOR',
      });
      await loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: UserResponse) => {
    setActionUserId(user.id);
    try {
      if (user.active) {
        await deactivateUser(user.id);
      } else {
        await reactivateUser(user.id);
      }
      await loadUsers();
    } catch (err) {
      console.error('Failed to update user status', err);
    } finally {
      setActionUserId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.firstName + ' ' + u.lastName).toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (u: UserResponse) => (
        <span className={styles.nameCell}>
          {u.firstName} {u.lastName}
        </span>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      width: '140px',
      render: (u: UserResponse) => (
        <Badge variant={ROLE_COLORS[u.role] || 'default'} size="sm">
          {u.role}
        </Badge>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      width: '110px',
      render: (u: UserResponse) => (
        <Badge variant={u.active ? 'success' : 'danger'} size="sm" dot>
          {u.active ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (u: UserResponse) =>
        u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM d, yyyy h:mm a') : 'Never',
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '140px',
      render: (u: UserResponse) => (
        <Button
          variant={u.active ? 'secondary' : 'primary'}
          size="sm"
          loading={actionUserId === u.id}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(u);
          }}
          icon={u.active ? <UserX size={14} /> : <UserCheck size={14} />}
        >
          {u.active ? 'Deactivate' : 'Reactivate'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Header
        title="User Administration"
        subtitle={`Total Accounts: ${users.length} (${users.filter((u) => u.active).length} active)`}
      />
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.search}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DOCTOR">DOCTOR</option>
              <option value="NURSE">NURSE</option>
              <option value="RECEPTIONIST">RECEPTIONIST</option>
              <option value="PATIENT">PATIENT</option>
            </select>

            <Button
              variant="primary"
              onClick={() => setModalOpen(true)}
              icon={<UserPlus size={16} />}
            >
              Add Staff Member
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading system users...</div>
        ) : (
          <Table columns={columns} data={filtered} />
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Create New Staff Account"
        >
          <form onSubmit={handleCreate} className={styles.formGrid}>
            {error && (
              <div style={{
                color: 'var(--color-danger, #ef4444)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.row}>
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <Input
              label="Work Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Temporary Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <div>
              <label className={styles.fieldLabel}>Role Assignment</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={styles.selectInput}
              >
                <option value="DOCTOR">DOCTOR (Physician)</option>
                <option value="NURSE">NURSE (Clinical & Triage)</option>
                <option value="RECEPTIONIST">RECEPTIONIST (Front Desk)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
