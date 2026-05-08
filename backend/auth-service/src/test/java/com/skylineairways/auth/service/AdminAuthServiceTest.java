package com.skylineairways.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.skylineairways.auth.dto.AdminLoginRequest;
import com.skylineairways.auth.dto.AuthResponse;
import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.exception.UnauthorizedException;
import com.skylineairways.auth.model.AdminUser;
import com.skylineairways.auth.repository.AdminUserRepository;
import com.skylineairways.auth.security.JwtUtil;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock private AdminUserRepository adminUserRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    private AdminAuthService adminAuthService;

    @BeforeEach
    void setUp() {
        adminAuthService = new AdminAuthService(adminUserRepository, passwordEncoder, jwtUtil);
    }

    @Test
    void loginReturnsTokenForValidAdmin() {
        AdminLoginRequest request = new AdminLoginRequest();
        request.setUsername("admin");
        request.setPassword("secret");

        AdminUser admin = new AdminUser();
        admin.setId(1L);
        admin.setUsername("admin");
        admin.setPassword("encoded");
        admin.setEmail("admin@example.com");
        admin.setActive(true);
        admin.setCreatedAt(Instant.now());

        when(adminUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);
        when(jwtUtil.generateToken(admin)).thenReturn("admin-token");

        AuthResponse response = adminAuthService.login(request);

        assertEquals("admin-token", response.getToken());
        assertEquals("admin", response.getName());
    }

    @Test
    void loginRejectsMissingUsername() {
        AdminLoginRequest request = new AdminLoginRequest();
        request.setPassword("secret");

        assertThrows(BadRequestException.class, () -> adminAuthService.login(request));
    }

    @Test
    void loginRejectsUnknownAdmin() {
        AdminLoginRequest request = new AdminLoginRequest();
        request.setUsername("missing");
        request.setPassword("secret");

        when(adminUserRepository.findByUsernameIgnoreCase("missing")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> adminAuthService.login(request));
    }
}