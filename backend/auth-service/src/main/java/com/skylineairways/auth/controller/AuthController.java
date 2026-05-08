package com.skylineairways.auth.controller;

import com.skylineairways.auth.dto.ApiMessageResponse;
import com.skylineairways.auth.dto.AuthResponse;
import com.skylineairways.auth.dto.LoginRequest;
import com.skylineairways.auth.dto.RegisterRequest;
import com.skylineairways.auth.service.AuthEmailService;
import com.skylineairways.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Authentication API for Skyline Airways frontend integration.
 */
@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
public class AuthController {

    private final AuthService authService;
    private final AuthEmailService authEmailService;

    public AuthController(AuthService authService, AuthEmailService authEmailService) {
        this.authService = authService;
        this.authEmailService = authEmailService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiMessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiMessageResponse("Registration successful. Please log in to continue."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/email/test-login")
    public ResponseEntity<ApiMessageResponse> sendTestLoginEmail(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String fullName = payload.getOrDefault("fullName", "Skyline User");
        String ipAddress = payload.getOrDefault("ipAddress", "127.0.0.1");
        String loginTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a"));

        boolean sent = authEmailService.sendLoginNotificationEmail(email, fullName, ipAddress, loginTime);
        if (sent) {
            return ResponseEntity.ok(new ApiMessageResponse("Test login email sent successfully."));
        }
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ApiMessageResponse("Test login email failed. Check auth-service logs for SMTP/SendGrid errors."));
    }
}