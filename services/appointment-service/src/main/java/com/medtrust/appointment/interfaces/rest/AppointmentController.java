package com.medtrust.appointment.interfaces.rest;

import com.medtrust.appointment.application.dto.CreateAppointmentRequest;
import com.medtrust.appointment.application.dto.AppointmentResponse;
import com.medtrust.appointment.application.dto.RescheduleAppointmentRequest;
import com.medtrust.appointment.application.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody CreateAppointmentRequest request) {
        AppointmentResponse response = appointmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "data", response));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll() {
        List<AppointmentResponse> response = appointmentService.getAll();
        return ResponseEntity.ok(Map.of("success", true, "data", response, "count", response.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable String id) {
        AppointmentResponse response = appointmentService.getById(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    /** Get all appointments for a specific patient */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<Map<String, Object>> getByPatient(@PathVariable String patientId) {
        List<AppointmentResponse> response = appointmentService.getByPatientId(patientId);
        return ResponseEntity.ok(Map.of("success", true, "data", response, "count", response.size()));
    }

    /** Get all appointments for a specific provider */
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<Map<String, Object>> getByProvider(@PathVariable String providerId) {
        List<AppointmentResponse> response = appointmentService.getByProviderId(providerId);
        return ResponseEntity.ok(Map.of("success", true, "data", response, "count", response.size()));
    }

    /** Get appointments within a date range — expects ISO-8601 Instant strings */
    @GetMapping("/date-range")
    public ResponseEntity<Map<String, Object>> getByDateRange(
            @RequestParam Instant start,
            @RequestParam Instant end) {
        List<AppointmentResponse> response = appointmentService.getByDateRange(start, end);
        return ResponseEntity.ok(Map.of("success", true, "data", response, "count", response.size()));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancel(@PathVariable String id,
            @RequestParam(required = false) String reason) {
        AppointmentResponse response = appointmentService.cancel(id, reason);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<Map<String, Object>> reschedule(
            @PathVariable String id,
            @Valid @RequestBody RescheduleAppointmentRequest request) {
        AppointmentResponse response = appointmentService.reschedule(id, request);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirm(@PathVariable String id) {
        AppointmentResponse response = appointmentService.confirm(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    /** Receptionist front-desk check-in when patient arrives at clinic */
    @PutMapping("/{id}/check-in")
    public ResponseEntity<Map<String, Object>> checkIn(@PathVariable String id) {
        AppointmentResponse response = appointmentService.checkIn(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> complete(@PathVariable String id) {
        AppointmentResponse response = appointmentService.complete(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    /** Mark a patient as a no-show for a scheduled/confirmed appointment */
    @PutMapping("/{id}/no-show")
    public ResponseEntity<Map<String, Object>> markNoShow(@PathVariable String id) {
        AppointmentResponse response = appointmentService.markNoShow(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }
}
