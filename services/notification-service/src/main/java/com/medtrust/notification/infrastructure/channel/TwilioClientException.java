package com.medtrust.notification.infrastructure.channel;

/**
 * Thrown when Twilio returns a 4xx client error (e.g. invalid number, auth error).
 * Ignored by circuit breaker and retry so non-transient errors don't trip the breaker.
 */
public class TwilioClientException extends RuntimeException {

    public TwilioClientException(String message) {
        super(message);
    }

    public TwilioClientException(String message, Throwable cause) {
        super(message, cause);
    }
}
