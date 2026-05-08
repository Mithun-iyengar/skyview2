package com.skylineairways.auth.controller;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skylineairways.auth.dto.WalletAddRequest;
import com.skylineairways.auth.dto.WalletInternalRequest;
import com.skylineairways.auth.dto.WalletResponse;
import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.service.WalletService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * API endpoints for wallet operations.
 */
@RestController
@RequestMapping({"/api/wallet", "/api/v1/wallet"})
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    /**
     * Extract userId from request attributes (set by JwtAuthenticationFilter)
     */
    private Long getCurrentUserId(HttpServletRequest request) {
        Object userIdObj = request.getAttribute("userId");
        if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        }
        if (userIdObj instanceof Number) {
            return ((Number) userIdObj).longValue();
        }
        return null;
    }

    /**
     * Get the current wallet balance for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<WalletResponse> getWalletBalance(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        WalletResponse response = walletService.getWalletBalance(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Add money to the authenticated user's wallet.
     */
    @PostMapping("/add")
    public ResponseEntity<WalletResponse> addMoney(
            HttpServletRequest request,
            @RequestBody WalletAddRequest requestBody) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (requestBody.getAmount() == null || requestBody.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }

        WalletResponse response = walletService.addMoneyToWallet(userId, requestBody.getAmount());
        return ResponseEntity.ok(response);
    }

    /**
     * Deduct money from the authenticated user's wallet.
     */
    @PostMapping("/deduct")
    public ResponseEntity<WalletResponse> deductMoney(
            HttpServletRequest request,
            @RequestBody WalletAddRequest requestBody) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (requestBody.getAmount() == null || requestBody.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }

        WalletResponse response = walletService.deductMoneyFromWallet(userId, requestBody.getAmount());
        return ResponseEntity.ok(response);
    }

    // ============= INTERNAL ENDPOINTS (Called by other services) =============

    /**
     * Internal endpoint: Deduct money from wallet by userId.
     * Called by booking-service during payment processing.
     * No authentication required - relies on internal network isolation.
     */
    @PostMapping("/internal/deduct")
    public ResponseEntity<WalletResponse> deductMoneyInternal(
            @RequestBody WalletInternalRequest request) {
        if (request.getUserId() == null) {
            throw new BadRequestException("userId is required");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }

        WalletResponse response = walletService.deductMoneyFromWallet(request.getUserId(), request.getAmount());
        return ResponseEntity.ok(response);
    }

    /**
     * Internal endpoint: Add money to wallet by userId (for refunds).
     * Called by booking-service when payment fails.
     * No authentication required - relies on internal network isolation.
     */
    @PostMapping("/internal/add")
    public ResponseEntity<WalletResponse> addMoneyInternal(
            @RequestBody WalletInternalRequest request) {
        if (request.getUserId() == null) {
            throw new BadRequestException("userId is required");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }

        WalletResponse response = walletService.addMoneyToWallet(request.getUserId(), request.getAmount());
        return ResponseEntity.ok(response);
    }
}
