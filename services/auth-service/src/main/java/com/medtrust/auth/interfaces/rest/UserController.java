package com.medtrust.auth.interfaces.rest;

import com.medtrust.auth.application.dto.ChangePasswordRequest;
import com.medtrust.auth.application.dto.UserResponse;
import com.medtrust.auth.application.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        String userId = authentication.getName();
        UserResponse response = userManagementService.findById(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    /** Authenticated staff/patient UI: list users for provider and consent pickers. */
    @GetMapping("/directory")
    public ResponseEntity<Map<String, Object>> directory() {
        List<UserResponse> users = userManagementService.findAll();
        return ResponseEntity.ok(Map.of("success", true, "data", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable String id) {
        UserResponse response = userManagementService.findById(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listAllUsers() {
        List<UserResponse> users = userManagementService.findAll();
        return ResponseEntity.ok(Map.of("success", true, "data", users));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        String userId = authentication.getName();
        UserResponse response = userManagementService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deactivateUser(@PathVariable String id) {
        UserResponse response = userManagementService.deactivate(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateUser(@PathVariable String id) {
        UserResponse response = userManagementService.reactivate(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }
}
