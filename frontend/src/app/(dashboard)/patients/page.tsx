'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './patients.module.css';
import { Header } from '@/components/layout/Header';
import { Table } from '@/components/ui/Table';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { getPatients, registerPatient, PatientResponse } from '@/lib/api/patients';
import { Search, UserPlus } from 'lucide-react';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
    firstName: '',
    lastName: '',
    dateOfBirth: '1990-01-01',
    gender: 'MALE',
    bloodType: 'O_POSITIVE',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    insuranceProvider: 'Blue Cross Blue Shield',
    policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerPatient({
        mrn: formData.mrn,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodType: formData.bloodType,
        contactInfo: {
          phone: formData.phone || '+1-555-0100',
          email: formData.email || `${formData.firstName.toLowerCase()}@example.com`,
          address: formData.address || '123 Medical Center Blvd',
          city: formData.city || 'Metro City',
          state: formData.state || 'NY',
          zipCode: formData.zipCode || '10001',
        },
        insuranceInfo: {
          provider: formData.insuranceProvider,
          policyNumber: formData.policyNumber,
        },
      });
      setShowRegisterModal(false);
      await loadPatients();
    } catch (err) {
      console.error('Registration failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'mrn', header: 'MRN', width: '120px' },
    {
      key: 'fullName',
      header: 'Name',
      render: (p: PatientResponse) => <span className={styles.nameCell}>{p.fullName}</span>,
    },
    { key: 'dateOfBirth', header: 'Date of Birth', width: '130px' },
    { key: 'gender', header: 'Gender', width: '100px' },
    {
      key: 'phone',
      header: 'Phone',
      render: (p: PatientResponse) => p.contactInfo?.phone || '—',
    },
    {
      key: 'active',
      header: 'Status',
      width: '100px',
      render: (p: PatientResponse) => (
        <Badge variant={statusVariant(p.active ? 'ACTIVE' : 'INACTIVE')} size="sm" dot>
          {p.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'allergies',
      header: 'Allergies',
      render: (p: PatientResponse) => (
        <span className={styles.allergies}>
          {p.allergies && p.allergies.length > 0 ? p.allergies.join(', ') : '—'}
        </span>
      ),
    },
  ];

  return (
    <>
      <Header title="Patients" subtitle={`${patients.length} registered patients`} />
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder="Search by name or MRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setShowRegisterModal(true)}
            icon={<UserPlus size={16} />}
          >
            Register Patient
          </Button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading patients...</div>
        ) : (
          <Table
            columns={columns}
            data={filtered}
            onRowClick={(p) => router.push(`/patients/${p.id}`)}
            emptyMessage="No patients found"
          />
        )}

        {/* Register Patient Modal */}
        <Modal
          open={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          title="Register New Patient"
          size="lg"
        >
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="MRN"
                value={formData.mrn}
                onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
                required
              />
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 0.5rem',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  Blood Type
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 0.5rem',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="O_POSITIVE">O+</option>
                  <option value="O_NEGATIVE">O-</option>
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                  <option value="AB_POSITIVE">AB+</option>
                  <option value="AB_NEGATIVE">AB-</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0100"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@example.com"
              />
            </div>

            <Input
              label="Street Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Medical Center Blvd"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Insurance Provider"
                value={formData.insuranceProvider}
                onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
              />
              <Input
                label="Policy Number"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setShowRegisterModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Register Patient
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
