package com.skylineairways.auth.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.skylineairways.auth.dto.ApiMessageResponse;
import com.skylineairways.auth.dto.AuthResponse;
import com.skylineairways.auth.dto.LoginRequest;
import com.skylineairways.auth.dto.RegisterRequest;
import com.skylineairways.auth.service.AuthEmailService;
import com.skylineairways.auth.service.AuthService;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private AuthService authService;
    @Mock private AuthEmailService authEmailService;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        authController = new AuthController(authService, authEmailService);
    }

    @Test
    void registerReturnsCreatedMessage() {
        RegisterRequest request = new RegisterRequest();
        request.setPassword("secret");

        ResponseEntity<ApiMessageResponse> response = authController.register(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(authService).register(request);
    }

    @Test
    void loginReturnsAuthResponse() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("user");
        request.setPassword("secret");
        when(authService.login(request)).thenReturn(new AuthResponse("token", "User"));

        ResponseEntity<AuthResponse> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("token", response.getBody().getToken());
    }

    @Test
    void sendTestLoginEmailReturnsBadGatewayWhenMailFails() {
        when(authEmailService.sendLoginNotificationEmail(eq("test@example.com"), eq("Skyline User"), eq("127.0.0.1"), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(false);

        ResponseEntity<ApiMessageResponse> response = authController.sendTestLoginEmail(Map.of("email", "test@example.com"));

        assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
    }
}