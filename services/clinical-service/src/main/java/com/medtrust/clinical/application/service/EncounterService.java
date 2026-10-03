package com.medtrust.clinical.application.service;

import com.medtrust.clinical.application.dto.AddClinicalNoteRequest;
import com.medtrust.clinical.application.dto.ClinicalNoteResponseDTO;
import com.medtrust.clinical.application.dto.CreateEncounterRequest;
import com.medtrust.clinical.application.dto.EncounterResponse;
import com.medtrust.clinical.domain.model.ClinicalNote;
import com.medtrust.clinical.domain.model.Encounter;
import com.medtrust.clinical.domain.model.NoteType;
import com.medtrust.clinical.domain.repository.EncounterRepository;
import com.medtrust.clinical.infrastructure.kafka.ClinicalKafkaProducer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EncounterService {

        private static final Logger log = LoggerFactory.getLogger(EncounterService.class);
        private static final String CLINICAL_EVENTS_TOPIC = "clinical-events";

        private final EncounterRepository encounterRepository;
        private final ClinicalKafkaProducer kafkaProducer;

        public EncounterService(EncounterRepository encounterRepository,
                        ClinicalKafkaProducer kafkaProducer) {
                this.encounterRepository = encounterRepository;
                this.kafkaProducer = kafkaProducer;
        }

        public EncounterResponse create(CreateEncounterRequest request) {
                Encounter encounter = Encounter.create(request.patientId());
                Encounter saved = encounterRepository.save(encounter);

                // Publish domain events (EncounterCreatedEvent) to Kafka
                publishDomainEvents(saved);

                return toResponse(saved);
        }

        public EncounterResponse admit(String id) {
                Encounter encounter = encounterRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Encounter with ID " + id + " not found"));

                encounter.admit();
                Encounter saved = encounterRepository.save(encounter);

                // Publish domain events (PatientAdmittedEvent) to Kafka
                publishDomainEvents(saved);

                return toResponse(saved);
        }

        public EncounterResponse discharge(String id) {
                Encounter encounter = encounterRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Encounter with ID " + id + " not found"));

                encounter.discharge();
                Encounter saved = encounterRepository.save(encounter);

                // Publish domain events (PatientDischargedEvent) to Kafka
                publishDomainEvents(saved);

                return toResponse(saved);
        }

        @Transactional(readOnly = true)
        public List<EncounterResponse> getAll() {
                return encounterRepository.findAll().stream()
                                .map(this::toResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public EncounterResponse getById(String id) {
                Encounter encounter = encounterRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Encounter with ID " + id + " not found"));
                return toResponse(encounter);
        }

        @Transactional(readOnly = true)
        public List<EncounterResponse> getByPatientId(String patientId) {
                return encounterRepository.findByPatientId(patientId).stream()
                                .map(this::toResponse)
                                .toList();
        }

        public ClinicalNoteResponseDTO addNote(String encounterId, AddClinicalNoteRequest request) {
                Encounter encounter = encounterRepository.findById(encounterId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Encounter with ID " + encounterId + " not found"));

                ClinicalNote note = encounter.addNote(
                                request.content(),
                                request.authorId(),
                                NoteType.valueOf(request.noteType()));

                encounterRepository.save(encounter);

                return new ClinicalNoteResponseDTO(
                                note.getId(),
                                note.getEncounterId(),
                                note.getContent(),
                                note.getAuthorId(),
                                note.getNoteType().name(),
                                note.getCreatedAt().toString());
        }

        /**
         * Pulls domain events from the aggregate and publishes each to Kafka.
         * The Kafka producer is protected by @CircuitBreaker + @Retry,
         * so if Kafka is down the circuit will trip and fallback will log the event.
         */
        private void publishDomainEvents(Encounter encounter) {
                encounter.pullDomainEvents().forEach(event -> {
                        log.info("[EncounterService] Publishing domain event: {}", event.eventType());
                        kafkaProducer.publish(CLINICAL_EVENTS_TOPIC, event);
                });
        }

        private EncounterResponse toResponse(Encounter encounter) {
                return new EncounterResponse(
                                encounter.getId(),
                                encounter.getPatientId(),
                                encounter.getStatus().name(),
                                encounter.getStartDate().toString(),
                                encounter.getEndDate() != null ? encounter.getEndDate().toString() : null,
                                encounter.getClinicalNotes().stream()
                                                .map(n -> new EncounterResponse.ClinicalNoteResponse(
                                                                n.getId(),
                                                                n.getContent(),
                                                                n.getAuthorId(),
                                                                n.getNoteType().name(),
                                                                n.getCreatedAt().toString()))
                                                .toList(),
                                encounter.getDiagnoses().stream()
                                                .map(d -> new EncounterResponse.DiagnosisResponse(
                                                                d.getCode(),
                                                                d.getDescription()))
                                                .toList(),
                                encounter.getCreatedAt().toString(),
                                encounter.getUpdatedAt().toString());
        }
}
