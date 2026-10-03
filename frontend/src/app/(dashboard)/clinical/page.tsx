'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './clinical.module.css';
import { Header } from '@/components/layout/Header';
import { Table } from '@/components/ui/Table';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  getEncounters,
  createEncounter,
  admitEncounter,
  dischargeEncounter,
  addNote,
  EncounterResponse,
} from '@/lib/api/clinical';
import { mockPatients, getPatientName } from '@/lib/mock-data';
import { getCurrentUserRole, getCurrentUserFromStorage } from '@/lib/api/auth';
import { format } from 'date-fns';
import { Plus, FileText, CheckCircle2, UserCheck, ShieldAlert, Send } from 'lucide-react';

export default function ClinicalPage() {
  const [encounters, setEncounters] = useState<EncounterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterResponse | null>(null);
  const [showNewEncounterModal, setShowNewEncounterModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(mockPatients[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  // Note form state
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('PROGRESS');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const role = getCurrentUserRole();
  const currentUser = getCurrentUserFromStorage();
  const isDoctor = role === 'DOCTOR' || role === 'ADMIN';

  const loadEncounters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEncounters();
      setEncounters(data);
      if (selectedEncounter) {
        const refreshed = data.find((e) => e.id === selectedEncounter.id);
        if (refreshed) setSelectedEncounter(refreshed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedEncounter]);

  useEffect(() => {
    loadEncounters();
  }, [loadEncounters]);

  useEffect(() => {
    if (role === 'NURSE') {
      setNoteType('NURSING');
    } else {
      setNoteType('PROGRESS');
    }
  }, [role]);

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    setSubmitting(true);
    try {
      await createEncounter(selectedPatientId);
      setShowNewEncounterModal(false);
      await loadEncounters();
    } catch (err) {
      console.error('Failed to create encounter', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdmit = async (id: string) => {
    setSubmitting(true);
    try {
      const updated = await admitEncounter(id);
      setSelectedEncounter(updated);
      await loadEncounters();
    } catch (err) {
      console.error('Admit failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (id: string) => {
    setSubmitting(true);
    try {
      const updated = await dischargeEncounter(id);
      setSelectedEncounter(updated);
      await loadEncounters();
    } catch (err) {
      console.error('Discharge failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter || !noteContent.trim()) return;
    setNoteSubmitting(true);
    try {
      const author = currentUser
        ? `${currentUser.firstName} ${currentUser.lastName} (${role})`
        : `Staff (${role || 'Clinician'})`;
      await addNote(selectedEncounter.id, {
        content: noteContent.trim(),
        authorId: author,
        noteType,
      });
      setNoteContent('');
      await loadEncounters();
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (e: EncounterResponse) => (
        <span className={styles.nameCell}>{getPatientName(e.patientId)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (e: EncounterResponse) => (
        <Badge variant={statusVariant(e.status)} size="sm" dot>
          {e.status}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (e: EncounterResponse) => format(new Date(e.startDate), 'MMM d, yyyy h:mm a'),
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (e: EncounterResponse) =>
        e.endDate ? format(new Date(e.endDate), 'MMM d, yyyy h:mm a') : '—',
    },
    {
      key: 'notes',
      header: 'Notes',
      width: '90px',
      render: (e: EncounterResponse) => (
        <Badge variant="default" size="sm">
          {e.clinicalNotes.length}
        </Badge>
      ),
    },
    {
      key: 'diagnoses',
      header: 'Diagnoses',
      render: (e: EncounterResponse) => (
        <span className={styles.diagnoses}>
          {e.diagnoses.length > 0 ? e.diagnoses.map((d) => d.code).join(', ') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (e: EncounterResponse) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(ev) => {
            ev.stopPropagation();
            setSelectedEncounter(e);
          }}
          icon={<FileText size={14} />}
        >
          Chart
        </Button>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Clinical Encounters & SOAP Notes"
        subtitle={`${encounters.length} active charts · Role: ${role || 'Clinician'}`}
      />
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Authorized Personnel: <strong>DOCTOR</strong> (Diagnoses, Prescriptions, Discharge) •{' '}
            <strong>NURSE</strong> (Triage, Intake, Rooming, Vitals)
          </div>
          <Button
            variant="primary"
            onClick={() => setShowNewEncounterModal(true)}
            icon={<Plus size={16} />}
          >
            New Clinical Encounter
          </Button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading encounters...</div>
        ) : (
          <Table
            columns={columns}
            data={encounters}
            onRowClick={(e) => setSelectedEncounter(e)}
            emptyMessage="No encounters found"
          />
        )}
      </div>

      {/* New Encounter Modal */}
      <Modal
        open={showNewEncounterModal}
        onClose={() => setShowNewEncounterModal(false)}
        title="Open New Clinical Encounter"
      >
        <form onSubmit={handleCreateEncounter}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Select Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-md, 6px)',
                background: 'var(--bg-elevated, #1e293b)',
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" variant="secondary" onClick={() => setShowNewEncounterModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Start Encounter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notes & Clinical Chart Modal */}
      <Modal
        open={!!selectedEncounter}
        onClose={() => setSelectedEncounter(null)}
        title={`Clinical Chart — ${selectedEncounter ? getPatientName(selectedEncounter.patientId) : ''}`}
        size="lg"
      >
        {selectedEncounter && (
          <div className={styles.notesModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className={styles.encounterInfo}>
                <Badge variant={statusVariant(selectedEncounter.status)} dot>
                  {selectedEncounter.status}
                </Badge>
                <span className={styles.encounterDate}>
                  Started: {format(new Date(selectedEncounter.startDate), 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              {/* Status Action Workflow */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['PLANNED', 'REGISTERED'].includes(selectedEncounter.status) && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submitting}
                    onClick={() => handleAdmit(selectedEncounter.id)}
                    icon={<UserCheck size={14} />}
                  >
                    Admit to Bed
                  </Button>
                )}

                {selectedEncounter.status === 'ADMITTED' && (
                  <>
                    {isDoctor ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={submitting}
                        onClick={() => handleDischarge(selectedEncounter.id)}
                        icon={<CheckCircle2 size={14} />}
                      >
                        Authorize Discharge
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ShieldAlert size={14} /> Physician sign-off required for discharge
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {selectedEncounter.diagnoses.length > 0 && (
              <div className={styles.diagnosesSection}>
                <h4 className={styles.subsectionTitle}>Diagnoses</h4>
                {selectedEncounter.diagnoses.map((d, i) => (
                  <div key={i} className={styles.diagnosisItem}>
                    <Badge variant="info" size="sm">{d.code}</Badge>
                    <span>{d.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Clinical Note Form */}
            <form onSubmit={handleAddNote} style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Add Clinical Note ({role || 'Staff'})
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  style={{
                    height: '36px',
                    padding: '0 0.5rem',
                    borderRadius: '4px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                  }}
                >
                  {role === 'NURSE' ? (
                    <>
                      <option value="NURSING">NURSING (Care & Vitals)</option>
                      <option value="TRIAGE">TRIAGE (Intake & Acuity)</option>
                      <option value="PROGRESS">PROGRESS NOTE</option>
                    </>
                  ) : (
                    <>
                      <option value="PROGRESS">PROGRESS (SOAP Note)</option>
                      <option value="CONSULTATION">CONSULTATION</option>
                      <option value="ADMISSION">ADMISSION NOTE</option>
                      <option value="PROCEDURE">PROCEDURE</option>
                      <option value="DISCHARGE">DISCHARGE SUMMARY</option>
                    </>
                  )}
                </select>
              </div>

              <textarea
                rows={3}
                placeholder={
                  role === 'NURSE'
                    ? 'Record vital signs (BP, Pulse, Temp, SpO2) and nursing observations...'
                    : 'Record clinical observations, subjective/objective findings, assessment and plan (SOAP)...'
                }
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="submit" variant="primary" size="sm" loading={noteSubmitting} icon={<Send size={13} />}>
                  Save Note
                </Button>
              </div>
            </form>

            <div className={styles.notesTimeline}>
              <h4 className={styles.subsectionTitle}>Chart Timeline</h4>
              {selectedEncounter.clinicalNotes.length === 0 ? (
                <p className={styles.noNotes}>No notes recorded yet</p>
              ) : (
                selectedEncounter.clinicalNotes.map((note) => (
                  <Card key={note.id} variant="outlined" padding="sm" className={styles.noteCard}>
                    <div className={styles.noteHeader}>
                      <Badge variant="default" size="sm">{note.noteType.replace('_', ' ')}</Badge>
                      <span className={styles.noteDate}>{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className={styles.noteContent}>{note.content}</p>
                    <span className={styles.noteAuthor}>Author: {note.authorId}</span>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
