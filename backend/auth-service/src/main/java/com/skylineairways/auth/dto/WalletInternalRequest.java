package com.skylineairways.auth.dto;

import java.math.BigDecimal;

/**
 * Request for internal wallet operations (called by other services).
 * Includes userId in the request body instead of JWT token.
 */
public class WalletInternalRequest {

    private Long userId;
    private BigDecimal amount;

    public WalletInternalRequest() {
    }

    public WalletInternalRequest(Long userId, BigDecimal amount) {
        this.userId = userId;
        this.amount = amount;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    @Override
    public String toString() {
        return "WalletInternalRequest{" +
                "userId=" + userId +
                ", amount=" + amount +
                '}';
    }
}
