package com.medtrust.appointment.domain.model;

import com.medtrust.appointment.domain.event.AppointmentCancelledEvent;
import com.medtrust.appointment.domain.event.AppointmentRescheduledEvent;
import com.medtrust.appointment.domain.event.AppointmentScheduledEvent;
import com.medtrust.appointment.domain.event.DomainEvent;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Appointment {

    private final String id;
    private final String patientId;
    private final String providerId;
    private Instant startTime;
    private Instant endTime;
    private AppointmentStatus status;
    private final AppointmentType type;
    private final String reason;
    private final Instant createdAt;
    private Instant updatedAt;

    private final List<DomainEvent> domainEvents = new ArrayList<>();

    private Appointment(String id, String patientId, String providerId,
            Instant startTime, Instant endTime,
            AppointmentStatus status, AppointmentType type, String reason,
            Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.patientId = patientId;
        this.providerId = providerId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.type = type;
        this.reason = reason;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Appointment schedule(String patientId, String providerId, Instant startTime, Instant endTime,
            AppointmentType type, String reason) {
        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        var appointment = new Appointment(
                UUID.randomUUID().toString(),
                patientId,
                providerId,
                startTime,
                endTime,
                AppointmentStatus.SCHEDULED,
                type,
                reason,
                Instant.now(),
                Instant.now());
        appointment.addDomainEvent(new AppointmentScheduledEvent(
                appointment.id, patientId, providerId, startTime));
        return appointment;
    }

    public static Appointment reconstitute(String id, String patientId, String providerId,
            Instant startTime, Instant endTime,
            AppointmentStatus status, AppointmentType type, String reason,
            Instant createdAt, Instant updatedAt) {
        return new Appointment(id, patientId, providerId, startTime, endTime, status, type, reason, createdAt,
                updatedAt);
    }

    // ── Domain behaviour ──

    public void cancel(String reason) {
        if (this.status == AppointmentStatus.COMPLETED || this.status == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel a completed or already cancelled appointment");
        }
        this.status = AppointmentStatus.CANCELLED;
        this.updatedAt = Instant.now();
        addDomainEvent(new AppointmentCancelledEvent(this.id, reason));
    }

    public void reschedule(Instant newStartTime, Instant newEndTime) {
        if (this.status == AppointmentStatus.COMPLETED || this.status == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot reschedule a completed or cancelled appointment");
        }
        if (newStartTime.isAfter(newEndTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        Instant oldStartTime = this.startTime;
        this.startTime = newStartTime;
        this.endTime = newEndTime;
        this.status = AppointmentStatus.SCHEDULED; // Re-confirm scheduling if needed, or keep previous status?
                                                   // Let's reset to SCHEDULED as simplistic logic for now.
        this.updatedAt = Instant.now();
        addDomainEvent(new AppointmentRescheduledEvent(this.id, oldStartTime, newStartTime));
    }

    public void confirm() {
        if (this.status != AppointmentStatus.SCHEDULED) {
            throw new IllegalStateException("Only scheduled appointments can be confirmed");
        }
        this.status = AppointmentStatus.CONFIRMED;
        this.updatedAt = Instant.now();
    }

    public void checkIn() {
        if (this.status != AppointmentStatus.SCHEDULED && this.status != AppointmentStatus.CONFIRMED) {
            throw new IllegalStateException("Only scheduled or confirmed appointments can be checked in");
        }
        this.status = AppointmentStatus.CHECKED_IN;
        this.updatedAt = Instant.now();
    }

    public void complete() {
        if (this.status != AppointmentStatus.CONFIRMED && this.status != AppointmentStatus.SCHEDULED && this.status != AppointmentStatus.CHECKED_IN) {
            throw new IllegalStateException("Only confirmed, scheduled, or checked-in appointments can be completed");
        }
        this.status = AppointmentStatus.COMPLETED;
        this.updatedAt = Instant.now();
    }

    public void markNoShow() {
        if (this.status != AppointmentStatus.SCHEDULED && this.status != AppointmentStatus.CONFIRMED) {
            throw new IllegalStateException("Can only mark no-show for scheduled or confirmed appointments");
        }
        this.status = AppointmentStatus.NO_SHOW;
        this.updatedAt = Instant.now();
    }

    // ── Domain events ──

    private void addDomainEvent(DomainEvent event) {
        this.domainEvents.add(event);
    }

    public List<DomainEvent> pullDomainEvents() {
        var events = List.copyOf(this.domainEvents);
        this.domainEvents.clear();
        return events;
    }

    // ── Getters ──

    public String getId() {
        return id;
    }

    public String getPatientId() {
        return patientId;
    }

    public String getProviderId() {
        return providerId;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public AppointmentType getType() {
        return type;
    }

    public String getReason() {
        return reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
