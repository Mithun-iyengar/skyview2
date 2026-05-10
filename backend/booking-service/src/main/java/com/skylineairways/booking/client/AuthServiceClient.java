package com.skylineairways.booking.client;

import com.skylineairways.booking.dto.WalletResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Feign client for auth-service wallet operations.
 * Used to deduct and refund wallet balance during booking payment.
 * Calls internal endpoints that don't require JWT authentication.
 */
@FeignClient(name = "auth-service", url = "${services.auth.url:http://localhost:8086}")
public interface AuthServiceClient {

    /**
     * Internal endpoint: Deduct money from user's wallet.
     * Request body contains userId and amount.
     * Returns updated wallet balance.
     */
    @PostMapping("/api/wallet/internal/deduct")
    WalletResponse deductMoneyFromWallet(@RequestBody Map<String, Object> request);

    /**
     * Internal endpoint: Add money to user's wallet (for refunds on payment failure).
     * Request body contains userId and amount.
     * Returns updated wallet balance.
     */
    @PostMapping("/api/wallet/internal/add")
    WalletResponse addMoneyToWallet(@RequestBody Map<String, Object> request);
}
