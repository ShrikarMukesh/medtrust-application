'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './patient-detail.module.css';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  getPatient,
  updatePatientContact,
  updatePatientInsurance,
  deactivatePatient,
  PatientResponse,
} from '@/lib/api/patients';
import { ArrowLeft, Phone, Mail, MapPin, Heart, AlertTriangle, Shield, Edit, UserX } from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactData, setContactData] = useState({
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [insuranceData, setInsuranceData] = useState({
    provider: '',
    policyNumber: '',
    groupNumber: '',
    expirationDate: '',
  });

  const loadPatient = useCallback(async (id: string) => {
    try {
      const data = await getPatient(id);
      setPatient(data);
      setContactData({
        phone: data.contactInfo?.phone || '',
        email: data.contactInfo?.email || '',
        address: data.contactInfo?.address || '',
        city: data.contactInfo?.city || '',
        state: data.contactInfo?.state || '',
        zipCode: data.contactInfo?.zipCode || '',
      });
      setInsuranceData({
        provider: data.insuranceInfo?.provider || '',
        policyNumber: data.insuranceInfo?.policyNumber || '',
        groupNumber: data.insuranceInfo?.groupNumber || '',
        expirationDate: data.insuranceInfo?.expirationDate || '',
      });
    } catch {
      console.error('Patient not found');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      loadPatient(params.id as string);
    }
  }, [params.id, loadPatient]);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSubmitting(true);
    try {
      const updated = await updatePatientContact(patient.id, contactData);
      setPatient(updated);
      setShowContactModal(false);
    } catch (err) {
      console.error('Failed to update contact info', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSubmitting(true);
    try {
      const updated = await updatePatientInsurance(patient.id, insuranceData);
      setPatient(updated);
      setShowInsuranceModal(false);
    } catch (err) {
      console.error('Failed to update insurance', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!patient || !confirm('Are you sure you want to deactivate this patient record?')) return;
    setSubmitting(true);
    try {
      const updated = await deactivatePatient(patient.id);
      setPatient(updated);
    } catch (err) {
      console.error('Failed to deactivate patient', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!patient) return <div className={styles.loading}>Patient not found</div>;

  return (
    <>
      <Header title={patient.fullName} subtitle={`MRN: ${patient.mrn}`} />
      <div className={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Button variant="ghost" size="sm" onClick={() => router.back()} icon={<ArrowLeft size={16} />}>
            Back to Patients
          </Button>

          {patient.active && (
            <Button
              variant="secondary"
              size="sm"
              loading={submitting}
              onClick={handleDeactivate}
              icon={<UserX size={14} />}
            >
              Deactivate Patient
            </Button>
          )}
        </div>

        {/* Profile Header */}
        <Card className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{patient.fullName}</h2>
              <div className={styles.profileMeta}>
                <span>MRN: {patient.mrn}</span>
                <span>DOB: {patient.dateOfBirth}</span>
                <span>{patient.gender}</span>
                <span>Blood: {patient.bloodType?.replace('_', ' ')}</span>
              </div>
              <Badge variant={statusVariant(patient.active ? 'ACTIVE' : 'INACTIVE')} dot>
                {patient.active ? 'Active' : 'Deactivated'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Info Grid */}
        <div className={styles.grid}>
          {/* Contact Info */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Phone size={16} /> Contact Information
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactModal(true)}
                icon={<Edit size={14} />}
              >
                Edit
              </Button>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{patient.contactInfo.phone || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{patient.contactInfo.email || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Address</span>
                <span className={styles.infoValue}>
                  {patient.contactInfo.address}
                  {patient.contactInfo.city && `, ${patient.contactInfo.city}`}
                  {patient.contactInfo.state && ` ${patient.contactInfo.state}`}
                  {patient.contactInfo.zipCode && ` ${patient.contactInfo.zipCode}`}
                </span>
              </div>
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <h3 className={styles.sectionTitle}>
              <AlertTriangle size={16} /> Emergency Contact
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.infoValue}>{patient.emergencyContact?.name || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Relationship</span>
                <span className={styles.infoValue}>{patient.emergencyContact?.relationship || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{patient.emergencyContact?.phone || '—'}</span>
              </div>
            </div>
          </Card>

          {/* Insurance */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Shield size={16} /> Insurance
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsuranceModal(true)}
                icon={<Edit size={14} />}
              >
                Edit
              </Button>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Provider</span>
                <span className={styles.infoValue}>{patient.insuranceInfo?.provider || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Policy #</span>
                <span className={styles.infoValue}>{patient.insuranceInfo?.policyNumber || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Group #</span>
                <span className={styles.infoValue}>{patient.insuranceInfo?.groupNumber || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Expires</span>
                <span className={styles.infoValue}>{patient.insuranceInfo?.expirationDate || '—'}</span>
              </div>
            </div>
          </Card>

          {/* Allergies */}
          <Card>
            <h3 className={styles.sectionTitle}>
              <Heart size={16} /> Allergies
            </h3>
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className={styles.allergyList}>
                {patient.allergies.map((a, i) => (
                  <Badge key={i} variant="danger" size="md">
                    {a}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className={styles.noAllergies}>No known allergies</p>
            )}
          </Card>
        </div>

        {/* Edit Contact Modal */}
        <Modal
          open={showContactModal}
          onClose={() => setShowContactModal(false)}
          title="Update Contact Information"
        >
          <form onSubmit={handleUpdateContact} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Input
              label="Phone Number"
              value={contactData.phone}
              onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={contactData.email}
              onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
              required
            />
            <Input
              label="Street Address"
              value={contactData.address}
              onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
              <Input
                label="City"
                value={contactData.city}
                onChange={(e) => setContactData({ ...contactData, city: e.target.value })}
              />
              <Input
                label="State"
                value={contactData.state}
                onChange={(e) => setContactData({ ...contactData, state: e.target.value })}
              />
              <Input
                label="Zip"
                value={contactData.zipCode}
                onChange={(e) => setContactData({ ...contactData, zipCode: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setShowContactModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Insurance Modal */}
        <Modal
          open={showInsuranceModal}
          onClose={() => setShowInsuranceModal(false)}
          title="Update Insurance Details"
        >
          <form onSubmit={handleUpdateInsurance} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Input
              label="Insurance Provider"
              value={insuranceData.provider}
              onChange={(e) => setInsuranceData({ ...insuranceData, provider: e.target.value })}
              required
            />
            <Input
              label="Policy Number"
              value={insuranceData.policyNumber}
              onChange={(e) => setInsuranceData({ ...insuranceData, policyNumber: e.target.value })}
              required
            />
            <Input
              label="Group Number"
              value={insuranceData.groupNumber}
              onChange={(e) => setInsuranceData({ ...insuranceData, groupNumber: e.target.value })}
            />
            <Input
              label="Expiration Date"
              type="date"
              value={insuranceData.expirationDate}
              onChange={(e) => setInsuranceData({ ...insuranceData, expirationDate: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setShowInsuranceModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Save Insurance
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
