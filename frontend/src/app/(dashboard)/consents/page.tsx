'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './consents.module.css';
import { Header } from '@/components/layout/Header';
import { Table } from '@/components/ui/Table';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  getConsents,
  grantConsent,
  revokeConsent,
  ConsentResponse,
  CONSENT_SCOPES,
} from '@/lib/api/consents';
import { mockPatients, mockUsers, getPatientName, getProviderName } from '@/lib/mock-data';
import { getCurrentUserRole } from '@/lib/api/auth';
import { format } from 'date-fns';
import { Plus, ShieldOff, ShieldCheck } from 'lucide-react';

export default function ConsentsPage() {
  const [consents, setConsents] = useState<ConsentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: 'pat-001',
    grantedToUserId: 'dr-001',
    scope: 'VIEW_CLINICAL_RECORDS',
    reason: 'Clinical care consultation and diagnosis',
  });

  const role = getCurrentUserRole();

  const loadConsents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConsents();
      if (role === 'PATIENT') {
        // Patient views only their own consents
        setConsents(data.filter((c) => c.patientId === 'pat-001'));
      } else {
        setConsents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await grantConsent({
        patientId: formData.patientId,
        grantedToUserId: formData.grantedToUserId,
        scope: formData.scope,
        reason: formData.reason,
      });
      setShowGrantModal(false);
      await loadConsents();
    } catch (err) {
      console.error('Grant consent failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setActionLoading(id);
    try {
      await revokeConsent(id);
      await loadConsents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (c: ConsentResponse) => (
        <span className={styles.nameCell}>{getPatientName(c.patientId)}</span>
      ),
    },
    {
      key: 'grantedTo',
      header: 'Granted To Provider',
      render: (c: ConsentResponse) => getProviderName(c.grantedToUserId),
    },
    {
      key: 'scope',
      header: 'Permission Scope',
      render: (c: ConsentResponse) => (
        <Badge variant="info" size="sm">
          {c.scope.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (c: ConsentResponse) => (
        <Badge variant={statusVariant(c.status)} size="sm" dot>
          {c.status}
        </Badge>
      ),
    },
    {
      key: 'grantedAt',
      header: 'Granted At',
      render: (c: ConsentResponse) =>
        c.grantedAt ? format(new Date(c.grantedAt), 'MMM d, yyyy') : '—',
    },
    {
      key: 'expiresAt',
      header: 'Expires At',
      render: (c: ConsentResponse) =>
        c.expiresAt ? format(new Date(c.expiresAt), 'MMM d, yyyy') : '—',
    },
    {
      key: 'actions',
      header: '',
      width: '110px',
      render: (c: ConsentResponse) =>
        c.status === 'GRANTED' ? (
          <Button
            variant="ghost"
            size="sm"
            loading={actionLoading === c.id}
            onClick={(e) => {
              e.stopPropagation();
              handleRevoke(c.id);
            }}
            icon={<ShieldOff size={14} />}
          >
            Revoke
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Header
        title="Consent Management"
        subtitle="HIPAA PHI Access Authorization & Consent Lifecycle"
      />
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Patients have legal authority to grant and revoke access to their health records at any time.
          </div>
          <Button
            variant="primary"
            onClick={() => setShowGrantModal(true)}
            icon={<Plus size={16} />}
          >
            Grant Consent
          </Button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading consents...</div>
        ) : (
          <Table columns={columns} data={consents} emptyMessage="No consents found" />
        )}

        {/* Grant Consent Modal */}
        <Modal
          open={showGrantModal}
          onClose={() => setShowGrantModal(false)}
          title="Grant Health Data Access Consent"
        >
          <form onSubmit={handleGrant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                Patient
              </label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
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
                {mockPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                Provider / Healthcare Worker
              </label>
              <select
                value={formData.grantedToUserId}
                onChange={(e) => setFormData({ ...formData, grantedToUserId: e.target.value })}
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
                {mockUsers
                  .filter((u) => ['DOCTOR', 'NURSE', 'ADMIN'].includes(u.role))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                Authorization Scope
              </label>
              <select
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
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
                {CONSENT_SCOPES.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Reason / Clinical Context"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Follow-up consultation and treatment coordination"
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setShowGrantModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} icon={<ShieldCheck size={16} />}>
                Authorize Consent
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
