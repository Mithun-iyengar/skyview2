package com.skylineairways.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.skylineairways.auth.dto.AuthResponse;
import com.skylineairways.auth.dto.LoginRequest;
import com.skylineairways.auth.dto.RegisterRequest;
import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.exception.ResourceConflictException;
import com.skylineairways.auth.exception.UnauthorizedException;
import com.skylineairways.auth.model.User;
import com.skylineairways.auth.repository.UserRepository;
import com.skylineairways.auth.security.JwtUtil;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private AuthEmailService authEmailService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtUtil, authEmailService);
    }

    @Test
    void registerSavesNormalizedUserAndSendsConfirmationEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("  Mithun  ");
        request.setEmail("  TEST@EXAMPLE.COM  ");
        request.setPhone("  9876543210  ");
        request.setPassword("secret");

        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(authEmailService.sendRegistrationConfirmationEmail("test@example.com", "Mithun")).thenReturn(true);

        authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertEquals("Mithun", saved.getFullName());
        assertEquals("test@example.com", saved.getEmail());
        assertEquals("9876543210", saved.getPhone());
        assertEquals("encoded", saved.getPassword());
        verify(authEmailService).sendRegistrationConfirmationEmail("test@example.com", "Mithun");
    }

    @Test
    void registerRejectsEmptyIdentifiers() {
        RegisterRequest request = new RegisterRequest();
        request.setPassword("secret");

        assertThrows(BadRequestException.class, () -> authService.register(request));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("secret");

        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);

        assertThrows(ResourceConflictException.class, () -> authService.register(request));
    }

    @Test
    void loginReturnsTokenAndSendsNotification() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("test@example.com");
        request.setPassword("secret");

        User user = new User();
        user.setId(7L);
        user.setFullName("Mithun");
        user.setEmail("test@example.com");
        user.setPassword("encoded");
        user.setActive(true);
        user.setCreatedAt(Instant.now());

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);
        when(jwtUtil.generateToken(user)).thenReturn("jwt-token");
        when(authEmailService.sendLoginNotificationEmail(any(), any(), any(), any())).thenReturn(true);

        AuthResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("Mithun", response.getName());
        verify(authEmailService).sendLoginNotificationEmail(eq("test@example.com"), eq("Mithun"), eq("Unknown"), any());
    }

    @Test
    void loginRejectsUnknownUser() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("missing@example.com");
        request.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByPhone("missing@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByFullNameIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }

    @Test
    void loginRejectsInactiveUser() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("test@example.com");
        request.setPassword("secret");

        User user = new User();
        user.setEmail("test@example.com");
        user.setPassword("encoded");
        user.setActive(false);

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }
}