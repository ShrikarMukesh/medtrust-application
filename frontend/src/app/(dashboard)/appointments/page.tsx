'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './appointments.module.css';
import { Header } from '@/components/layout/Header';
import { Table } from '@/components/ui/Table';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  getAppointments,
  createAppointment,
  cancelAppointment,
  confirmAppointment,
  checkInAppointment,
  completeAppointment,
  markNoShow,
  rescheduleAppointment,
  AppointmentResponse,
  APPOINTMENT_TYPES,
} from '@/lib/api/appointments';
import { mockPatients, mockUsers, getPatientName, getProviderName } from '@/lib/mock-data';
import { hasRole, getCurrentUserRole } from '@/lib/api/auth';
import { format } from 'date-fns';
import {
  Plus, Check, X, CheckCircle, Calendar, AlertCircle,
  RefreshCw, Clock, User, Stethoscope, UserCheck,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */

type ActionKey = 'confirm' | 'check-in' | 'cancel' | 'complete' | 'no-show' | 'reschedule';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

/* ─── Main Component ─────────────────────────────────────── */

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({ newStartTime: '', newEndTime: '' });

  // Create form state
  const [createForm, setCreateForm] = useState({
    patientId: 'pat-001', providerId: '', type: 'CHECKUP', startTime: '', endTime: '', reason: '',
  });

  const isStaff = hasRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST');

  /* ── Data loading ── */
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAppointments();
      const role = getCurrentUserRole();
      if (role === 'PATIENT') {
        setAppointments(data.filter(a => a.patientId === 'pat-001'));
      } else {
        setAppointments(data);
      }
    } catch (err) {
      showToast('error', 'Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  /* ── Toast helpers ── */
  const showToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  /* ── Action handler ── */
  const handleAction = async (id: string, action: ActionKey) => {
    setActionLoading(id + action);
    try {
      if (action === 'confirm') {
        await confirmAppointment(id);
        showToast('success', 'Appointment confirmed');
      }
      if (action === 'check-in') {
        await checkInAppointment(id);
        showToast('success', 'Patient checked in (arrival recorded)');
      }
      if (action === 'complete') {
        await completeAppointment(id);
        showToast('success', 'Appointment marked complete');
      }
      if (action === 'no-show') {
        await markNoShow(id);
        showToast('success', 'Marked as no-show');
      }
      await loadAppointments();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Cancel with reason ── */
  const openCancelModal = (id: string) => { setSelectedId(id); setCancelReason(''); setShowCancelModal(true); };
  const handleCancel = async () => {
    if (!selectedId) return;
    setActionLoading(selectedId + 'cancel');
    try {
      await cancelAppointment(selectedId, cancelReason || 'Cancelled via dashboard');
      showToast('success', 'Appointment cancelled');
      setShowCancelModal(false);
      await loadAppointments();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Reschedule ── */
  const openRescheduleModal = (a: AppointmentResponse) => {
    setSelectedId(a.id);
    setRescheduleData({
      newStartTime: a.startTime.slice(0, 16),
      newEndTime: a.endTime.slice(0, 16),
    });
    setShowRescheduleModal(true);
  };
  const handleReschedule = async () => {
    if (!selectedId) return;
    setActionLoading(selectedId + 'reschedule');
    try {
      await rescheduleAppointment(selectedId, {
        newStartTime: new Date(rescheduleData.newStartTime).toISOString(),
        newEndTime: new Date(rescheduleData.newEndTime).toISOString(),
      });
      showToast('success', 'Appointment rescheduled');
      setShowRescheduleModal(false);
      await loadAppointments();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Reschedule failed');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Create appointment ── */
  const handleCreate = async () => {
    if (!createForm.patientId || !createForm.providerId || !createForm.startTime || !createForm.endTime) {
      showToast('error', 'Please fill in all required fields');
      return;
    }
    setActionLoading('create');
    try {
      await createAppointment({
        patientId: createForm.patientId,
        providerId: createForm.providerId,
        type: createForm.type,
        startTime: new Date(createForm.startTime).toISOString(),
        endTime: new Date(createForm.endTime).toISOString(),
        reason: createForm.reason || undefined,
      });
      showToast('success', 'Appointment scheduled successfully');
      setShowCreateModal(false);
      setCreateForm({ patientId: '', providerId: '', type: 'CHECKUP', startTime: '', endTime: '', reason: '' });
      await loadAppointments();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Filtering ── */
  const statuses = ['ALL', 'SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? appointments.length : appointments.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  /* ── Table columns ── */
  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (a: AppointmentResponse) => (
        <div className={styles.cellStack}>
          <span className={styles.nameCell}><User size={13} />{getPatientName(a.patientId)}</span>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (a: AppointmentResponse) => (
        <span className={styles.providerCell}><Stethoscope size={13} />{getProviderName(a.providerId)}</span>
      ),
    },
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (a: AppointmentResponse) => (
        <div className={styles.cellStack}>
          <span className={styles.date}><Calendar size={13} />{format(new Date(a.startTime), 'MMM d, yyyy')}</span>
          <span className={styles.time}><Clock size={13} />{format(new Date(a.startTime), 'h:mm a')} – {format(new Date(a.endTime), 'h:mm a')}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '120px',
      render: (a: AppointmentResponse) => (
        <Badge variant="default" size="sm">{a.type.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (a: AppointmentResponse) => (
        <Badge variant={statusVariant(a.status)} size="sm" dot>{a.status.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (a: AppointmentResponse) => (
        <span className={styles.reason}>{a.reason || '—'}</span>
      ),
    },
    ...(isStaff ? [{
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (a: AppointmentResponse) => {
        const busy = (action: string) => actionLoading === a.id + action;
        return (
          <div className={styles.actionBtns}>
            {a.status === 'SCHEDULED' && (
              <button
                className={`${styles.actionBtn} ${styles.confirm}`}
                onClick={(e) => { e.stopPropagation(); handleAction(a.id, 'confirm'); }}
                disabled={!!actionLoading}
                title="Confirm Appointment"
              >
                {busy('confirm') ? <RefreshCw size={13} className={styles.spin} /> : <Check size={13} />}
              </button>
            )}
            {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
              <>
                <button
                  className={`${styles.actionBtn} ${styles.confirm}`}
                  onClick={(e) => { e.stopPropagation(); handleAction(a.id, 'check-in'); }}
                  disabled={!!actionLoading}
                  title="Check In Patient (Arrival)"
                >
                  {busy('check-in') ? <RefreshCw size={13} className={styles.spin} /> : <UserCheck size={13} />}
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.reschedule}`}
                  onClick={(e) => { e.stopPropagation(); openRescheduleModal(a); }}
                  disabled={!!actionLoading}
                  title="Reschedule"
                >
                  <Calendar size={13} />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.noshow}`}
                  onClick={(e) => { e.stopPropagation(); handleAction(a.id, 'no-show'); }}
                  disabled={!!actionLoading}
                  title="Mark No-Show"
                >
                  {busy('no-show') ? <RefreshCw size={13} className={styles.spin} /> : <AlertCircle size={13} />}
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.cancel}`}
                  onClick={(e) => { e.stopPropagation(); openCancelModal(a.id); }}
                  disabled={!!actionLoading}
                  title="Cancel"
                >
                  <X size={13} />
                </button>
              </>
            )}
            {(a.status === 'CONFIRMED' || a.status === 'CHECKED_IN') && (
              <button
                className={`${styles.actionBtn} ${styles.complete}`}
                onClick={(e) => { e.stopPropagation(); handleAction(a.id, 'complete'); }}
                disabled={!!actionLoading}
                title="Complete Visit"
              >
                {busy('complete') ? <RefreshCw size={13} className={styles.spin} /> : <CheckCircle size={13} />}
              </button>
            )}
          </div>
        );
      },
    }] : [{
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (a: AppointmentResponse) => (
        (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); openCancelModal(a.id); }}
            icon={<X size={14} />}
          >
            Cancel
          </Button>
        ) : null
      ),
    }]),
  ];

  return (
    <>
      <Header
        title="Appointments"
        subtitle={`${appointments.length} total · ${appointments.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status)).length} active`}
      />

      {/* Toast notifications */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            {t.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            {t.message}
          </div>
        ))}
      </div>

      <div className={styles.content}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {statuses.map(s => (
              <button
                key={s}
                className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
                onClick={() => setFilter(s)}
              >
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
                {statusCounts[s] > 0 && (
                  <span className={styles.filterCount}>{statusCounts[s]}</span>
                )}
              </button>
            ))}
          </div>
          {isStaff && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
              New Appointment
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.loading}>
            <RefreshCw size={24} className={styles.spin} />
            <span>Loading appointments…</span>
          </div>
        ) : (
          <Table columns={columns} data={filtered} emptyMessage="No appointments found" />
        )}
      </div>

      {/* ── Create Appointment Modal ── */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Appointment"
      >
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Patient *</label>
            <select
              className={styles.select}
              value={createForm.patientId}
              onChange={e => setCreateForm(f => ({ ...f, patientId: e.target.value }))}
            >
              <option value="">Select patient…</option>
              {mockPatients.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Provider *</label>
            <select
              className={styles.select}
              value={createForm.providerId}
              onChange={e => setCreateForm(f => ({ ...f, providerId: e.target.value }))}
            >
              <option value="">Select provider…</option>
              {mockUsers.filter(u => u.role === 'DOCTOR').map(u => (
                <option key={u.id} value={u.id}>Dr. {u.lastName} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Appointment Type *</label>
            <select
              className={styles.select}
              value={createForm.type}
              onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))}
            >
              {APPOINTMENT_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Start Date & Time *</label>
              <input
                type="datetime-local"
                className={styles.inputDate}
                value={createForm.startTime}
                onChange={e => setCreateForm(f => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>End Date & Time *</label>
              <input
                type="datetime-local"
                className={styles.inputDate}
                value={createForm.endTime}
                onChange={e => setCreateForm(f => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>

          <Input
            label="Reason (optional)"
            placeholder="e.g. Annual physical examination"
            value={createForm.reason}
            onChange={e => setCreateForm(f => ({ ...f, reason: e.target.value }))}
          />

          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={actionLoading === 'create'}
              onClick={handleCreate}
            >
              Schedule Appointment
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Cancel Modal ── */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Appointment"
      >
        <div className={styles.modalForm}>
          <p className={styles.modalDesc}>
            Please provide a reason for cancelling this appointment (optional).
          </p>
          <Input
            label="Cancellation Reason"
            placeholder="e.g. Patient requested cancellation"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep Appointment</Button>
            <Button
              variant="danger"
              loading={!!actionLoading}
              onClick={handleCancel}
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Reschedule Modal ── */}
      <Modal
        open={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Appointment"
      >
        <div className={styles.modalForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>New Start Time *</label>
              <input
                type="datetime-local"
                className={styles.inputDate}
                value={rescheduleData.newStartTime}
                onChange={e => setRescheduleData(d => ({ ...d, newStartTime: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>New End Time *</label>
              <input
                type="datetime-local"
                className={styles.inputDate}
                value={rescheduleData.newEndTime}
                onChange={e => setRescheduleData(d => ({ ...d, newEndTime: e.target.value }))}
              />
            </div>
          </div>
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowRescheduleModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={!!actionLoading}
              onClick={handleReschedule}
            >
              Reschedule
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
