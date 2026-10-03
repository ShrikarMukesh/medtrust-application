package com.medtrust.appointment.application.service;

import com.medtrust.appointment.application.dto.AppointmentResponse;
import com.medtrust.appointment.application.dto.CreateAppointmentRequest;
import com.medtrust.appointment.application.dto.RescheduleAppointmentRequest;
import com.medtrust.appointment.domain.model.Appointment;
import com.medtrust.appointment.domain.model.AppointmentType;
import com.medtrust.appointment.domain.repository.AppointmentRepository;
import com.medtrust.appointment.infrastructure.kafka.AppointmentKafkaProducer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);
    private static final String APPOINTMENT_EVENTS_TOPIC = "appointment-events";

    private final AppointmentRepository appointmentRepository;
    private final AppointmentKafkaProducer kafkaProducer;

    public AppointmentService(AppointmentRepository appointmentRepository,
            AppointmentKafkaProducer kafkaProducer) {
        this.appointmentRepository = appointmentRepository;
        this.kafkaProducer = kafkaProducer;
    }

    public AppointmentResponse create(CreateAppointmentRequest request) {
        Appointment appointment = Appointment.schedule(
                request.patientId(),
                request.providerId(),
                request.startTime(),
                request.endTime(),
                AppointmentType.valueOf(request.type()),
                request.reason());

        Appointment saved = appointmentRepository.save(appointment);
        publishDomainEvents(saved);
        return toResponse(saved);
    }

    public AppointmentResponse cancel(String id, String reason) {
        Appointment appointment = findByIdOrThrow(id);
        appointment.cancel(reason);
        Appointment saved = appointmentRepository.save(appointment);
        publishDomainEvents(saved);
        return toResponse(saved);
    }

    public AppointmentResponse reschedule(String id, RescheduleAppointmentRequest request) {
        Appointment appointment = findByIdOrThrow(id);
        appointment.reschedule(request.newStartTime(), request.newEndTime());
        Appointment saved = appointmentRepository.save(appointment);
        publishDomainEvents(saved);
        return toResponse(saved);
    }

    public AppointmentResponse confirm(String id) {
        Appointment appointment = findByIdOrThrow(id);
        appointment.confirm();
        Appointment saved = appointmentRepository.save(appointment);
        publishDomainEvents(saved);
        return toResponse(saved);
    }

    public AppointmentResponse checkIn(String id) {
        Appointment appointment = findByIdOrThrow(id);
        appointment.checkIn();
        Appointment saved = appointmentRepository.save(appointment);
        publishDomainEvents(saved);
        return toResponse(saved);
    }

    public AppointmentResponse complete(String id) {
        Appointment appointment = findByIdOrThrow(id);
        appointment.complete();
        Appointment saved = appointmentRepository.save(appointment);
        publishDomainEvents(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAll() {
        return appointmentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(String id) {
        return toResponse(findByIdOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByPatientId(String patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByProviderId(String providerId) {
        return appointmentRepository.findByProviderId(providerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByDateRange(Instant start, Instant end) {
        return appointmentRepository.findByDateRange(start, end).stream()
                .map(this::toResponse)
                .toList();
    }

    public AppointmentResponse markNoShow(String id) {
        Appointment appointment = findByIdOrThrow(id);
        appointment.markNoShow();
        Appointment saved = appointmentRepository.save(appointment);
        publishDomainEvents(saved);
        return toResponse(saved);
    }

    private Appointment findByIdOrThrow(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment with ID " + id + " not found"));
    }

    private void publishDomainEvents(Appointment appointment) {
        appointment.pullDomainEvents().forEach(event -> {
            log.info("[AppointmentService] Publishing domain event: {}", event.eventType());
            kafkaProducer.publish(APPOINTMENT_EVENTS_TOPIC, event);
        });
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatientId(),
                appointment.getProviderId(),
                appointment.getStartTime().toString(),
                appointment.getEndTime().toString(),
                appointment.getStatus().name(),
                appointment.getType().name(),
                appointment.getReason(),
                appointment.getCreatedAt().toString(),
                appointment.getUpdatedAt().toString());
    }
}
