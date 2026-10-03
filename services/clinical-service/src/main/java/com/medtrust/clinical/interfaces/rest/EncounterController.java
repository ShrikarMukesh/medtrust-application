package com.medtrust.clinical.interfaces.rest;

import com.medtrust.clinical.application.dto.AddClinicalNoteRequest;
import com.medtrust.clinical.application.dto.ClinicalNoteResponseDTO;
import com.medtrust.clinical.application.dto.CreateEncounterRequest;
import com.medtrust.clinical.application.dto.EncounterResponse;
import com.medtrust.clinical.application.service.EncounterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/encounters")
public class EncounterController {

    private final EncounterService encounterService;

    public EncounterController(EncounterService encounterService) {
        this.encounterService = encounterService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody CreateEncounterRequest request) {
        EncounterResponse response = encounterService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "data", response));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll() {
        List<EncounterResponse> response = encounterService.getAll();
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable String id) {
        EncounterResponse response = encounterService.getById(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    /** Patient portal and clinician view: get encounters for a specific patient */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<Map<String, Object>> getByPatientId(@PathVariable String patientId) {
        List<EncounterResponse> response = encounterService.getByPatientId(patientId);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PutMapping("/{id}/admit")
    public ResponseEntity<Map<String, Object>> admit(@PathVariable String id) {
        EncounterResponse response = encounterService.admit(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PutMapping("/{id}/discharge")
    public ResponseEntity<Map<String, Object>> discharge(@PathVariable String id) {
        EncounterResponse response = encounterService.discharge(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<Map<String, Object>> addNote(
            @PathVariable String id,
            @Valid @RequestBody AddClinicalNoteRequest request) {
        ClinicalNoteResponseDTO response = encounterService.addNote(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "data", response));
    }
}
