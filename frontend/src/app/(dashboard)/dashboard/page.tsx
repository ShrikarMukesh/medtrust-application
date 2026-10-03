'use client';

import React, { useEffect, useState } from 'react';
import styles from './dashboard.module.css';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  CalendarDays,
  Stethoscope,
  ScrollText,
  Plus,
  UserCheck,
  UserCog,
  ShieldCheck,
  Activity,
  HeartPulse,
  Clock,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import {
  mockPatients,
  mockAppointments,
  mockEncounters,
  mockAuditEntries,
  getPatientName,
  getProviderName,
} from '@/lib/mock-data';
import { getPatients, PatientResponse } from '@/lib/api/patients';
import {
  getAppointments,
  getAppointmentsByPatient,
  checkInAppointment,
  AppointmentResponse,
} from '@/lib/api/appointments';
import { getEncounters, EncounterResponse } from '@/lib/api/clinical';
import { getAuditEntries, AuditEntryResponse } from '@/lib/api/audit';
import { getCurrentUserRole, getCurrentUserFromStorage, getUsers } from '@/lib/api/auth';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const statusColors: Record<string, string> = {
  SCHEDULED: '#3b82f6',
  CONFIRMED: '#10b981',
  CHECKED_IN: '#8b5cf6',
  CANCELLED: '#ef4444',
  COMPLETED: '#64748b',
  NO_SHOW: '#f59e0b',
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string>('ADMIN');
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUserFromStorage>>(null);

  // Data states
  const [patients, setPatients] = useState<PatientResponse[]>(mockPatients);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>(mockAppointments);
  const [encounters, setEncounters] = useState<EncounterResponse[]>(mockEncounters);
  const [auditEntries, setAuditEntries] = useState<AuditEntryResponse[]>(mockAuditEntries);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(5);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const userRole = getCurrentUserRole() || 'ADMIN';
    setRole(userRole);
    setCurrentUser(getCurrentUserFromStorage());

    if (userRole === 'PATIENT') {
      // Patient Portal: Strictly load only their own data (HIPAA compliance)
      getAppointmentsByPatient('pat-001')
        .then(setAppointments)
        .catch(() => {
          setAppointments(mockAppointments.filter((a) => a.patientId === 'pat-001'));
        });
    } else {
      // Staff roles: Load relevant clinical and operational datasets
      Promise.allSettled([
        getPatients().then(setPatients).catch(() => {}),
        getAppointments().then(setAppointments).catch(() => {}),
        getEncounters().then(setEncounters).catch(() => {}),
        ...(userRole === 'ADMIN'
          ? [
              getAuditEntries().then(setAuditEntries).catch(() => {}),
              getUsers().then((u) => setTotalUsersCount(u.length)).catch(() => {}),
            ]
          : []),
      ]);
    }
  }, []);

  const handleDeskCheckIn = async (appointmentId: string) => {
    setActionLoading(appointmentId);
    try {
      await checkInAppointment(appointmentId);
      const updated = await getAppointments();
      setAppointments(updated);
    } catch (err) {
      console.error('Check in failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const todayAppts = appointments.filter(
    (a) => a.startTime && a.startTime.startsWith(new Date().toISOString().slice(0, 10))
  );

  const checkedInCount = appointments.filter((a) => a.status === 'CHECKED_IN').length;
  const scheduledCount = appointments.filter((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status)).length;

  const chartData = Object.entries(
    appointments.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  const recentAudit = [...auditEntries]
    .sort((a, b) => new Date(b.eventTimestamp || 0).getTime() - new Date(a.eventTimestamp || 0).getTime())
    .slice(0, 6);

  /* ───────────────────────────────────────────────────────────────────────
     1. PATIENT DASHBOARD VIEW
     ─────────────────────────────────────────────────────────────────────── */
  if (role === 'PATIENT') {
    return (
      <>
        <Header
          title="Patient Portal"
          subtitle={`Welcome back, ${currentUser?.firstName || 'James'} — your health records & appointments`}
        />
        <div className={styles.content}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.08))',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Welcome, {currentUser?.firstName || 'James'} {currentUser?.lastName || 'Rodriguez'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Patient ID: <strong>PAT-001</strong> • Medical Record Number: <strong>MRN-10001</strong> • Blood Type: <strong>O+</strong>
            </p>
          </div>

          <div className={styles.stats}>
            <StatCard
              icon={<CalendarDays size={22} />}
              label="My Upcoming Appointments"
              value={appointments.filter((a) => ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status)).length}
              color="accent"
            />
            <StatCard
              icon={<Stethoscope size={22} />}
              label="My Primary Doctor"
              value="Dr. J. Smith"
              color="info"
            />
            <StatCard
              icon={<ShieldCheck size={22} />}
              label="Active Privacy Consents"
              value="2 Granted"
              color="success"
            />
            <StatCard
              icon={<HeartPulse size={22} />}
              label="Health Profile"
              value="Active"
              color="warning"
            />
          </div>

          <div className={styles.grid}>
            {/* My Appointments */}
            <Card className={styles.tableCard} padding="none">
              <div className={styles.tableHeader}>
                <h3 className={styles.sectionTitle}>My Appointments</h3>
                <Link href="/appointments" className={styles.viewAll}>
                  View all →
                </Link>
              </div>
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                        No appointments scheduled.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((a) => (
                      <tr key={a.id}>
                        <td>{getProviderName(a.providerId)}</td>
                        <td>{format(new Date(a.startTime), 'MMM d, h:mm a')}</td>
                        <td>{a.type}</td>
                        <td>
                          <Badge variant={statusVariant(a.status)} size="sm">
                            {a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>

            {/* Quick Actions & Privacy */}
            <Card className={styles.actionsCard}>
              <h3 className={styles.sectionTitle}>Patient Services</h3>
              <div className={styles.actions}>
                <Link href="/appointments">
                  <Button variant="primary" icon={<Plus size={16} />}>
                    Schedule New Appointment
                  </Button>
                </Link>
                <Link href="/consents">
                  <Button variant="secondary" icon={<ShieldCheck size={16} />}>
                    Manage Data Access Consents
                  </Button>
                </Link>
              </div>
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong>HIPAA Privacy Notice:</strong> Your electronic protected health information (ePHI) is encrypted at rest and in transit. You have the right to grant or revoke provider access anytime in Consents.
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────
     2. RECEPTIONIST DASHBOARD VIEW
     ─────────────────────────────────────────────────────────────────────── */
  if (role === 'RECEPTIONIST') {
    return (
      <>
        <Header
          title="Front Desk & Check-In Desk"
          subtitle="Patient arrivals, schedule coordination, and clinic registrations"
        />
        <div className={styles.content}>
          <div className={styles.stats}>
            <StatCard
              icon={<CalendarDays size={22} />}
              label="Today's Appointments"
              value={todayAppts.length || appointments.length}
              color="accent"
            />
            <StatCard
              icon={<UserCheck size={22} />}
              label="In Waiting Room (Checked In)"
              value={checkedInCount}
              trend={{ value: 'Ready for nurse triage', positive: true }}
              color="success"
            />
            <StatCard
              icon={<Clock size={22} />}
              label="Awaiting Arrival"
              value={scheduledCount}
              color="warning"
            />
            <StatCard
              icon={<Users size={22} />}
              label="Total Patients Registered"
              value={patients.length}
              color="info"
            />
          </div>

          <div className={styles.grid}>
            {/* Today's Arrivals Queue */}
            <Card className={styles.tableCard} padding="none">
              <div className={styles.tableHeader}>
                <h3 className={styles.sectionTitle}>Arrivals & Check-In Queue</h3>
                <Link href="/appointments" className={styles.viewAll}>
                  Full Schedule →
                </Link>
              </div>
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{getPatientName(a.patientId)}</strong></td>
                      <td>{getProviderName(a.providerId)}</td>
                      <td>{format(new Date(a.startTime), 'h:mm a')}</td>
                      <td>
                        <Badge variant={statusVariant(a.status)} size="sm">
                          {a.status}
                        </Badge>
                      </td>
                      <td>
                        {['SCHEDULED', 'CONFIRMED'].includes(a.status) ? (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={actionLoading === a.id}
                            onClick={() => handleDeskCheckIn(a.id)}
                            icon={<UserCheck size={14} />}
                          >
                            Check In
                          </Button>
                        ) : a.status === 'CHECKED_IN' ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-success, #10b981)', fontWeight: 600 }}>
                            In Waiting Room
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {a.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Quick Actions */}
            <Card className={styles.actionsCard}>
              <h3 className={styles.sectionTitle}>Front Desk Quick Actions</h3>
              <div className={styles.actions}>
                <Link href="/patients">
                  <Button variant="primary" icon={<Plus size={16} />}>
                    Register New Patient
                  </Button>
                </Link>
                <Link href="/appointments">
                  <Button variant="secondary" icon={<CalendarDays size={16} />}>
                    Book Walk-In Appointment
                  </Button>
                </Link>
                <Link href="/patients">
                  <Button variant="secondary" icon={<Users size={16} />}>
                    Search Patient Directory
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────
     3. NURSE DASHBOARD VIEW
     ─────────────────────────────────────────────────────────────────────── */
  if (role === 'NURSE') {
    return (
      <>
        <Header
          title="Nursing & Triage Station"
          subtitle="Patient rooming, vital signs entry, and inpatient care tracking"
        />
        <div className={styles.content}>
          <div className={styles.stats}>
            <StatCard
              icon={<HeartPulse size={22} />}
              label="Waiting for Triage / Rooming"
              value={checkedInCount || 1}
              color="warning"
            />
            <StatCard
              icon={<Stethoscope size={22} />}
              label="Inpatient Floor Encounters"
              value={encounters.filter((e) => e.status === 'ADMITTED').length}
              color="success"
            />
            <StatCard
              icon={<CalendarDays size={22} />}
              label="Today's Clinic Encounters"
              value={encounters.length}
              color="accent"
            />
            <StatCard
              icon={<Users size={22} />}
              label="Assigned Care Team Patients"
              value={patients.length}
              color="info"
            />
          </div>

          <div className={styles.grid}>
            {/* Triage & Clinical Queue */}
            <Card className={styles.tableCard} padding="none">
              <div className={styles.tableHeader}>
                <h3 className={styles.sectionTitle}>Active Patient Encounters</h3>
                <Link href="/clinical" className={styles.viewAll}>
                  Open Clinical Hub →
                </Link>
              </div>
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>Clinical Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {encounters.slice(0, 5).map((e) => (
                    <tr key={e.id}>
                      <td><strong>{getPatientName(e.patientId)}</strong></td>
                      <td>
                        <Badge variant={statusVariant(e.status)} size="sm">
                          {e.status}
                        </Badge>
                      </td>
                      <td>{format(new Date(e.startDate), 'MMM d, h:mm a')}</td>
                      <td>{e.clinicalNotes.length} notes</td>
                      <td>
                        <Link href="/clinical">
                          <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                            Chart
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Nursing Station Actions */}
            <Card className={styles.actionsCard}>
              <h3 className={styles.sectionTitle}>Nursing Station Actions</h3>
              <div className={styles.actions}>
                <Link href="/clinical">
                  <Button variant="primary" icon={<HeartPulse size={16} />}>
                    Record Vitals / Nursing Note
                  </Button>
                </Link>
                <Link href="/patients">
                  <Button variant="secondary" icon={<Users size={16} />}>
                    Review Allergies & Patient Chart
                  </Button>
                </Link>
                <Link href="/appointments">
                  <Button variant="secondary" icon={<CalendarDays size={16} />}>
                    View Floor Appointments
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────
     4. DOCTOR DASHBOARD VIEW
     ─────────────────────────────────────────────────────────────────────── */
  if (role === 'DOCTOR') {
    return (
      <>
        <Header
          title="Physician Clinical Dashboard"
          subtitle={`Dr. ${currentUser?.lastName || 'Smith'} — daily clinical consultations and inpatient rounds`}
        />
        <div className={styles.content}>
          <div className={styles.stats}>
            <StatCard
              icon={<CalendarDays size={22} />}
              label="My Consultations Today"
              value={todayAppts.length || appointments.filter((a) => a.providerId === 'dr-001').length}
              color="accent"
            />
            <StatCard
              icon={<UserCheck size={22} />}
              label="Ready in Exam Room (Checked In)"
              value={checkedInCount || 1}
              color="warning"
            />
            <StatCard
              icon={<Stethoscope size={22} />}
              label="Active Inpatient Encounters"
              value={encounters.filter((e) => e.status !== 'DISCHARGED').length}
              color="success"
            />
            <StatCard
              icon={<Activity size={22} />}
              label="Completed Encounters"
              value={encounters.filter((e) => e.status === 'DISCHARGED').length}
              color="info"
            />
          </div>

          <div className={styles.grid}>
            {/* Clinical Schedule */}
            <Card className={styles.tableCard} padding="none">
              <div className={styles.tableHeader}>
                <h3 className={styles.sectionTitle}>Consultation Schedule</h3>
                <Link href="/clinical" className={styles.viewAll}>
                  Clinical Records →
                </Link>
              </div>
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td><strong>{getPatientName(a.patientId)}</strong></td>
                      <td>{format(new Date(a.startTime), 'h:mm a')}</td>
                      <td>{a.type}</td>
                      <td>
                        <Badge variant={statusVariant(a.status)} size="sm">
                          {a.status}
                        </Badge>
                      </td>
                      <td>
                        <Link href="/clinical">
                          <Button variant="primary" size="sm" icon={<Stethoscope size={13} />}>
                            Open Chart
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Quick Actions */}
            <Card className={styles.actionsCard}>
              <h3 className={styles.sectionTitle}>Physician Clinical Actions</h3>
              <div className={styles.actions}>
                <Link href="/clinical">
                  <Button variant="primary" icon={<Stethoscope size={16} />}>
                    Author SOAP Clinical Note
                  </Button>
                </Link>
                <Link href="/clinical">
                  <Button variant="secondary" icon={<Plus size={16} />}>
                    Admit / Discharge Patient
                  </Button>
                </Link>
                <Link href="/patients">
                  <Button variant="secondary" icon={<Users size={16} />}>
                    Inspect Medical History & Consents
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────
     5. ADMIN DASHBOARD VIEW (Default)
     ─────────────────────────────────────────────────────────────────────── */
  return (
    <>
      <Header
        title="System Administration"
        subtitle="Platform governance, staff provisioning, and immutable compliance audit trails"
      />
      <div className={styles.content}>
        {/* Stat Cards */}
        <div className={styles.stats}>
          <StatCard
            icon={<UserCog size={22} />}
            label="Total System Users"
            value={totalUsersCount}
            trend={{ value: 'Staff & Patients', positive: true }}
            color="accent"
          />
          <StatCard
            icon={<Users size={22} />}
            label="Total Patients"
            value={patients.length}
            color="info"
          />
          <StatCard
            icon={<CalendarDays size={22} />}
            label="Total Appointments"
            value={appointments.length}
            color="success"
          />
          <StatCard
            icon={<ScrollText size={22} />}
            label="Compliance Audit Events"
            value={auditEntries.length}
            color="warning"
          />
        </div>

        {/* Charts + Quick Actions */}
        <div className={styles.grid}>
          {/* Chart */}
          <Card className={styles.chartCard}>
            <h3 className={styles.sectionTitle}>Appointments by Status</h3>
            {mounted && (
              <div className={styles.chart}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="status"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1a2235',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        color: '#f1f5f9',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={statusColors[entry.status] || '#64748b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className={styles.actionsCard}>
            <h3 className={styles.sectionTitle}>Administrative Actions</h3>
            <div className={styles.actions}>
              <Link href="/users">
                <Button variant="primary" icon={<UserPlus size={16} />}>
                  Manage Staff Accounts
                </Button>
              </Link>
              <Link href="/audit">
                <Button variant="secondary" icon={<ScrollText size={16} />}>
                  Inspect Audit Logs (HIPAA)
                </Button>
              </Link>
              <Link href="/patients">
                <Button variant="secondary" icon={<Users size={16} />}>
                  Patient Directory
                </Button>
              </Link>
              <Link href="/appointments">
                <Button variant="secondary" icon={<CalendarDays size={16} />}>
                  Clinic Appointments
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Tables */}
        <div className={styles.grid}>
          {/* Recent Appointments */}
          <Card className={styles.tableCard} padding="none">
            <div className={styles.tableHeader}>
              <h3 className={styles.sectionTitle}>Recent Appointments</h3>
              <Link href="/appointments" className={styles.viewAll}>
                View all →
              </Link>
            </div>
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Provider</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>{getPatientName(a.patientId)}</td>
                    <td>{getProviderName(a.providerId)}</td>
                    <td>{format(new Date(a.startTime), 'MMM d, h:mm a')}</td>
                    <td>
                      <Badge variant={statusVariant(a.status)} size="sm">
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Audit Feed */}
          <Card className={styles.auditCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.sectionTitle}>Recent Security & Compliance Events</h3>
              <Link href="/audit" className={styles.viewAll}>
                View all →
              </Link>
            </div>
            <div className={styles.auditFeed}>
              {recentAudit.map((entry) => (
                <div key={entry.id} className={styles.auditItem}>
                  <div className={styles.auditDot} />
                  <div className={styles.auditContent}>
                    <span className={styles.auditEvent}>
                      {entry.eventType.replace(/\./g, ' → ')}
                    </span>
                    <span className={styles.auditMeta}>
                      {entry.sourceService} • {format(new Date(entry.eventTimestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <Badge variant={statusVariant(entry.category)} size="sm">
                    {entry.category}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
