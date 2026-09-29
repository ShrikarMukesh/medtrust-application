package com.medtrust.auth.infrastructure.persistence.adapter;

import com.medtrust.auth.domain.model.Role;
import com.medtrust.auth.domain.model.User;
import com.medtrust.auth.domain.repository.UserRepository;
import com.medtrust.auth.infrastructure.persistence.entity.UserJpaEntity;
import com.medtrust.auth.infrastructure.persistence.repository.UserJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class JpaUserRepositoryAdapter implements UserRepository {

    private final UserJpaRepository jpaRepository;

    public JpaUserRepositoryAdapter(UserJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public User save(User user) {
        UserJpaEntity entity = toEntity(user);
        UserJpaEntity saved = jpaRepository.save(entity);
        User result = toDomain(saved);
        result.addDomainEvents(user.pullDomainEvents());
        return result;
    }

    @Override
    public Optional<User> findById(String id) {
        return jpaRepository.findById(UUID.fromString(id)).map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public List<User> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    private UserJpaEntity toEntity(User user) {
        UserJpaEntity entity = new UserJpaEntity();
        entity.setId(UUID.fromString(user.getId()));
        entity.setEmail(user.getEmail());
        entity.setPasswordHash(user.getPasswordHash());
        entity.setFirstName(user.getFirstName());
        entity.setLastName(user.getLastName());
        entity.setRole(user.getRole().name());
        entity.setActive(user.isActive());
        entity.setEmailVerified(user.isEmailVerified());
        entity.setLastLoginAt(user.getLastLoginAt());
        entity.setCreatedAt(user.getCreatedAt());
        entity.setUpdatedAt(user.getUpdatedAt());
        return entity;
    }

    private User toDomain(UserJpaEntity entity) {
        return User.reconstitute(
                entity.getId().toString(),
                entity.getEmail(),
                entity.getPasswordHash(),
                entity.getFirstName(),
                entity.getLastName(),
                Role.valueOf(entity.getRole()),
                entity.isActive(),
                entity.isEmailVerified(),
                entity.getLastLoginAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
