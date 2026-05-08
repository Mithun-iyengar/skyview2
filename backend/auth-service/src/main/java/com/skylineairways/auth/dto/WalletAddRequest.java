package com.skylineairways.auth.dto;

import java.math.BigDecimal;

/**
 * Request to add money to wallet.
 */
public class WalletAddRequest {

    private BigDecimal amount;

    public WalletAddRequest() {
    }

    public WalletAddRequest(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
