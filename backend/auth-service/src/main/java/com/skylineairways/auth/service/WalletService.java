package com.skylineairways.auth.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skylineairways.auth.dto.WalletResponse;
import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.model.User;
import com.skylineairways.auth.model.Wallet;
import com.skylineairways.auth.repository.UserRepository;
import com.skylineairways.auth.repository.WalletRepository;

/**
 * Service for wallet operations.
 */
@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    public WalletService(WalletRepository walletRepository, UserRepository userRepository) {
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get the wallet for a user. Creates one if it doesn't exist.
     */
    private Wallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId((long) userId).orElseGet(() -> {
            User user = userRepository.findById((long) userId)
                    .orElseThrow(() -> new BadRequestException("User not found"));

            Wallet wallet = new Wallet(user);
            return walletRepository.save(wallet);
        });
    }

    /**
     * Get the current wallet balance for a user.
     */
    public WalletResponse getWalletBalance(Long userId) {
        Wallet wallet = getOrCreateWallet(userId);
        return new WalletResponse(wallet.getId(), wallet.getBalance());
    }

    /**
     * Add money to a user's wallet.
     */
    @Transactional
    public WalletResponse addMoneyToWallet(Long userId, BigDecimal amount) {
        // Validate amount
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }

        // Get or create wallet
        Wallet wallet = getOrCreateWallet(userId);

        // Add money to wallet
        wallet.addBalance(amount);

        // Save updated wallet
        walletRepository.save(wallet);

        return new WalletResponse(wallet.getId(), wallet.getBalance());
    }

    /**
     * Deduct money from a user's wallet.
     */
    @Transactional
    public WalletResponse deductMoneyFromWallet(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }

        Wallet wallet = getOrCreateWallet(userId);

        if (wallet.getBalance() == null || wallet.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient funds in wallet");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        return new WalletResponse(wallet.getId(), wallet.getBalance());
    }
}
