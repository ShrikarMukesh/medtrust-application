package com.medtrust.notification.application.service;

import com.medtrust.notification.application.dto.NotificationResponse;
import com.medtrust.notification.application.dto.SendNotificationRequest;
import com.medtrust.notification.application.port.NotificationSender;
import com.medtrust.notification.domain.model.Notification;
import com.medtrust.notification.domain.model.NotificationChannel;
import com.medtrust.notification.domain.model.NotificationStatus;
import com.medtrust.notification.domain.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final Map<String, NotificationSender> senderMap;

    public NotificationService(NotificationRepository notificationRepository,
                                List<NotificationSender> senders) {
        this.notificationRepository = notificationRepository;
        this.senderMap = senders.stream()
                .collect(Collectors.toMap(NotificationSender::channel, Function.identity()));
        log.info("[NotificationService] Registered channels: {}", senderMap.keySet());
    }

    /**
     * Send a notification via the specified channel.
     */
    public NotificationResponse send(SendNotificationRequest request, String sourceEvent) {
        NotificationChannel channel = NotificationChannel.valueOf(request.channel().toUpperCase());

        Notification notification = Notification.create(
                request.recipientId(), request.recipientContact(),
                channel, request.templateName(),
                request.subject(), request.body(), sourceEvent);

        notification = notificationRepository.save(notification);

        NotificationSender sender = senderMap.get(channel.name());
        if (sender == null) {
            notification.markFailed("No sender registered for channel: " + channel);
            notificationRepository.save(notification);
            log.error("[NotificationService] No sender for channel: {}", channel);
            return toResponse(notification);
        }

        try {
            String messageId = sender.send(
                    request.recipientContact(), request.subject(), request.body());
            notification.markSent(messageId);
            log.info("[NotificationService] Sent via {} to {}, messageId: {}",
                    channel, request.recipientContact(), messageId);
        } catch (Exception e) {
            notification.markFailed(e.getMessage());
            log.error("[NotificationService] Failed to send via {}: {}", channel, e.getMessage());
        }

        return toResponse(notificationRepository.save(notification));
    }

    /**
     * Process a Kafka event → auto-dispatch notification.
     */
    public void processEvent(String eventType, Map<String, Object> payload) {
        String recipientContact = extractString(payload, "email",
                extractString(payload, "phone", null));
        String recipientId = extractString(payload, "userId",
                extractString(payload, "patientId", "unknown"));

        if (recipientContact == null) {
            log.debug("[NotificationService] No contact info in '{}' event, skipping", eventType);
            return;
        }

        // Determine channel from payload or contact format
        String requestedChannel = extractString(payload, "channel", null);
        NotificationChannel channel;
        if (requestedChannel != null) {
            try {
                channel = NotificationChannel.valueOf(requestedChannel.toUpperCase());
            } catch (IllegalArgumentException e) {
                channel = recipientContact.contains("@") ? NotificationChannel.EMAIL : NotificationChannel.SMS;
            }
        } else {
            channel = recipientContact.contains("@")
                    ? NotificationChannel.EMAIL : NotificationChannel.SMS;
        }

        String subject = "MedTrust — " + humanize(eventType);
        String body = buildMessageBody(eventType, payload);

        SendNotificationRequest request = new SendNotificationRequest(
                recipientId, recipientContact, channel.name(),
                eventType, subject, body);

        send(request, eventType);
    }

    @Transactional(readOnly = true)
    public NotificationResponse findById(String id) {
        return notificationRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findByRecipientId(String recipientId) {
        return notificationRepository.findByRecipientId(recipientId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findByStatus(String status) {
        return notificationRepository.findByStatus(NotificationStatus.valueOf(status.toUpperCase()))
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findByChannel(String channel) {
        return notificationRepository.findByChannel(NotificationChannel.valueOf(channel.toUpperCase()))
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findAll() {
        return notificationRepository.findAll().stream().map(this::toResponse).toList();
    }

    // ── Helpers ──

    private String buildMessageBody(String eventType, Map<String, Object> payload) {
        return switch (eventType) {
            case "appointment.scheduled" -> String.format(
                    "Your appointment has been scheduled for %s with Dr. %s.",
                    extractString(payload, "appointmentDate", "TBD"),
                    extractString(payload, "doctorName", "your doctor"));
            case "appointment.cancelled" -> "Your appointment has been cancelled. Please reschedule.";
            case "user.registered" -> "Welcome to MedTrust! Your account is now active.";
            case "consent.granted" -> "A new data access consent has been granted for your records.";
            case "consent.revoked" -> "A data access consent for your records has been revoked.";
            case "patient.registered" -> "Your patient profile has been created in MedTrust.";
            default -> "You have a new notification from MedTrust regarding: " + humanize(eventType);
        };
    }

    private String humanize(String eventType) {
        if (eventType == null) return "Notification";
        return eventType.replace(".", " ").replace("_", " ");
    }

    private static String extractString(Map<String, Object> m, String key, String fallback) {
        if (m == null) return fallback;
        Object v = m.get(key);
        return v != null ? v.toString() : fallback;
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getRecipientId(), n.getRecipientContact(),
                n.getChannel().name(), n.getTemplateName(),
                n.getSubject(), n.getBody(), n.getStatus().name(),
                n.getProviderMessageId(), n.getFailureReason(),
                n.getRetryCount(), n.getSourceEvent(),
                n.getCreatedAt().toString(),
                n.getSentAt() != null ? n.getSentAt().toString() : null,
                n.getUpdatedAt().toString());
    }
}
