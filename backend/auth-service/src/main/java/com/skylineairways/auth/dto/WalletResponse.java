package com.skylineairways.auth.dto;

import java.math.BigDecimal;

/**
 * Response containing wallet information.
 */
public class WalletResponse {

    private Long walletId;
    private BigDecimal balance;

    public WalletResponse() {
    }

    public WalletResponse(Long walletId, BigDecimal balance) {
        this.walletId = walletId;
        this.balance = balance;
    }

    public Long getWalletId() {
        return walletId;
    }

    public void setWalletId(Long walletId) {
        this.walletId = walletId;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }
}
