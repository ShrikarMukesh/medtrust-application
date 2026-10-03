package com.medtrust.auth.infrastructure.config;

import com.medtrust.auth.domain.model.Role;
import com.medtrust.auth.domain.model.User;
import com.medtrust.auth.domain.repository.UserRepository;
import com.medtrust.auth.infrastructure.security.PasswordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public DataInitializer(UserRepository userRepository, PasswordService passwordService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    @Override
    public void run(String... args) {
        seedUserIfMissing("admin@medtrust.com", "System", "Admin", Role.ADMIN);
        seedUserIfMissing("dr.smith@medtrust.com", "John", "Smith", Role.DOCTOR);
        seedUserIfMissing("nurse.clara@medtrust.com", "Clara", "Barton", Role.NURSE);
        seedUserIfMissing("recep.sarah@medtrust.com", "Sarah", "Jenkins", Role.RECEPTIONIST);
        seedUserIfMissing("patient.james@medtrust.com", "James", "Rodriguez", Role.PATIENT);
    }

    private void seedUserIfMissing(String email, String firstName, String lastName, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            String passwordHash = passwordService.hash("Password123!");
            User user = User.create(email, passwordHash, firstName, lastName, role);
            userRepository.save(user);
            log.info("[DataInitializer] Seeded demo user: {} ({})", email, role);
        }
    }
}
