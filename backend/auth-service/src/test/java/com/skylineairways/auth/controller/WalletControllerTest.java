package com.skylineairways.auth.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.skylineairways.auth.dto.WalletAddRequest;
import com.skylineairways.auth.dto.WalletResponse;
import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.service.WalletService;

import jakarta.servlet.http.HttpServletRequest;

class WalletControllerTest {

    private WalletService walletService;
    private WalletController walletController;
    private HttpServletRequest request;
    private Authentication authentication;
    private SecurityContext securityContext;

    @BeforeEach
    void setUp() {
        walletService = mock(WalletService.class);
        walletController = new WalletController(walletService);
        request = mock(HttpServletRequest.class);
        authentication = mock(Authentication.class);
        securityContext = mock(SecurityContext.class);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void getWalletBalanceReturnsOkWhenAuthenticated() {
        when(request.getAttribute("userId")).thenReturn(1L);
        when(walletService.getWalletBalance(1L)).thenReturn(new WalletResponse(1L, BigDecimal.valueOf(2500)));

        ResponseEntity<WalletResponse> response = walletController.getWalletBalance(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(BigDecimal.valueOf(2500), response.getBody().getBalance());
    }

    @Test
    void getWalletBalanceReturnsForbiddenWhenUserIdMissing() {
        when(request.getAttribute("userId")).thenReturn(null);

        ResponseEntity<WalletResponse> response = walletController.getWalletBalance(request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void addMoneyThrowsBadRequestWhenAmountIsInvalid() {
        when(request.getAttribute("userId")).thenReturn(1L);
        WalletAddRequest requestBody = new WalletAddRequest(BigDecimal.ZERO);

        assertThrows(BadRequestException.class, () -> walletController.addMoney(request, requestBody));
    }
}
