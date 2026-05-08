package com.skylineairways.auth.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.skylineairways.auth.dto.AdminLoginRequest;
import com.skylineairways.auth.dto.AuthResponse;
import com.skylineairways.auth.service.AdminAuthService;

@ExtendWith(MockitoExtension.class)
class AdminAuthControllerTest {

    @Mock private AdminAuthService adminAuthService;
    private AdminAuthController adminAuthController;

    @BeforeEach
    void setUp() {
        adminAuthController = new AdminAuthController(adminAuthService);
    }

    @Test
    void loginDelegatesToService() {
        AdminLoginRequest request = new AdminLoginRequest();
        request.setUsername("admin");
        request.setPassword("secret");
        when(adminAuthService.login(request)).thenReturn(new AuthResponse("token", "admin"));

        ResponseEntity<AuthResponse> response = adminAuthController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("token", response.getBody().getToken());
    }
}