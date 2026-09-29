package com.medtrust.notification.infrastructure.channel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrust.notification.application.port.NotificationSender;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.UUID;

/**
 * SMS sender via Twilio REST API.
 *
 * Required config:
 * - app.sms.twilio.account-sid (or twilio.account.sid / TWILIO_ACCOUNT_SID)
 * - app.sms.twilio.auth-token (or twilio.auth.token / TWILIO_AUTH_TOKEN)
 * - app.sms.twilio.from-number (or twilio.from.number / TWILIO_FROM_NUMBER)
 * - app.sms.enabled (or SMS_ENABLED)
 */
@Component
public class SmsSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(SmsSender.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String accountSid;
    private final String authToken;
    private final String fromNumber;
    private final boolean enabled;

    public SmsSender(RestClient.Builder restClientBuilder,
                     ObjectMapper objectMapper,
                     @Value("${app.sms.twilio.account-sid:${twilio.account.sid:}}") String accountSid,
                     @Value("${app.sms.twilio.auth-token:${twilio.auth.token:}}") String authToken,
                     @Value("${app.sms.twilio.from-number:${twilio.from.number:}}") String fromNumber,
                     @Value("${app.sms.enabled:false}") boolean enabled) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
        this.enabled = enabled;
    }

    @Override
    public String channel() { return "SMS"; }

    @Override
    @CircuitBreaker(name = "smsSender", fallbackMethod = "sendFallback")
    @Retry(name = "smsSender")
    public String send(String recipientPhone, String subject, String body) {
        if (!enabled) {
            String mockId = "sms-mock-" + UUID.randomUUID().toString().substring(0, 8);
            log.info("[SMS] MOCK mode — would send to {}: {}", recipientPhone, body);
            return mockId;
        }

        String url = String.format(
                "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSid);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        String from = fromNumber != null ? fromNumber.trim() : "";
        if (from.startsWith("MG")) {
            formData.add("MessagingServiceSid", from);
        } else {
            formData.add("From", from);
        }
        formData.add("To", recipientPhone != null ? recipientPhone.trim() : "");
        formData.add("Body", body);

        String response;
        try {
            response = restClient.post()
                    .uri(url)
                    .headers(h -> h.setBasicAuth(accountSid, authToken))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException e) {
            log.error("[SMS] Twilio API error [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().is4xxClientError()) {
                throw new TwilioClientException("Twilio SMS client error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString(), e);
            }
            throw new RuntimeException("Twilio SMS failed (" + e.getStatusCode() + "): " + e.getResponseBodyAsString(), e);
        }

        String messageSid = null;
        try {
            JsonNode root = objectMapper.readTree(response);
            if (root.hasNonNull("sid")) {
                messageSid = root.get("sid").asText();
            }
        } catch (Exception e) {
            log.debug("[SMS] Could not parse Twilio response SID: {}", e.getMessage());
        }

        String finalSid = messageSid != null ? messageSid : "sms-" + UUID.randomUUID().toString().substring(0, 8);
        log.info("[SMS] Sent to {}, Twilio SID: {}", recipientPhone, finalSid);
        return finalSid;
    }

    @SuppressWarnings("unused")
    private String sendFallback(String phone, String subject, String body, Throwable t) {
        log.error("[SMS] FALLBACK — Failed to send to {}: {}", phone, t.getMessage());
        throw new RuntimeException("SMS delivery failed: " + t.getMessage(), t);
    }
}
