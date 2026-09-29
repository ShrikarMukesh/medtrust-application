package com.medtrust.auth.domain.model;

import com.medtrust.auth.domain.event.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class User {

    private final String id;
    private final String email;
    private String passwordHash;
    private final String firstName;
    private final String lastName;
    private final Role role;
    private boolean active;
    private boolean emailVerified;
    private Instant lastLoginAt;
    private final Instant createdAt;
    private Instant updatedAt;

    private final List<DomainEvent> domainEvents = new ArrayList<>();

    private User(String id, String email, String passwordHash,
                 String firstName, String lastName, Role role,
                 boolean active, boolean emailVerified, Instant lastLoginAt,
                 Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.active = active;
        this.emailVerified = emailVerified;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static User create(String email, String passwordHash,
                               String firstName, String lastName, Role role) {
        var user = new User(
                UUID.randomUUID().toString(),
                email,
                passwordHash,
                firstName,
                lastName,
                role,
                true,
                false,
                null,
                Instant.now(),
                Instant.now());
        user.addDomainEvent(new UserRegisteredEvent(user.id, email, role.name()));
        return user;
    }

    public static User reconstitute(String id, String email, String passwordHash,
                                     String firstName, String lastName, Role role,
                                     boolean active, boolean emailVerified,
                                     Instant lastLoginAt, Instant createdAt, Instant updatedAt) {
        return new User(id, email, passwordHash, firstName, lastName, role,
                active, emailVerified, lastLoginAt, createdAt, updatedAt);
    }

    // ── Domain behaviour ──

    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.updatedAt = Instant.now();
        addDomainEvent(new PasswordChangedEvent(this.id, this.email));
    }

    public void recordLogin() {
        this.lastLoginAt = Instant.now();
        this.updatedAt = Instant.now();
        addDomainEvent(new UserLoggedInEvent(this.id, this.email));
    }

    public void deactivate() {
        if (!this.active) {
            throw new IllegalStateException("User is already deactivated");
        }
        this.active = false;
        this.updatedAt = Instant.now();
        addDomainEvent(new UserDeactivatedEvent(this.id, this.email));
    }

    public void reactivate() {
        if (this.active) {
            throw new IllegalStateException("User is already active");
        }
        this.active = true;
        this.updatedAt = Instant.now();
    }

    // ── Domain events ──

    public void addDomainEvents(List<DomainEvent> events) {
        if (events != null) {
            this.domainEvents.addAll(events);
        }
    }

    private void addDomainEvent(DomainEvent event) {
        this.domainEvents.add(event);
    }

    public List<DomainEvent> pullDomainEvents() {
        var events = List.copyOf(this.domainEvents);
        this.domainEvents.clear();
        return events;
    }

    // ── Getters ──

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getFullName() { return firstName + " " + lastName; }
    public Role getRole() { return role; }
    public boolean isActive() { return active; }
    public boolean isEmailVerified() { return emailVerified; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
