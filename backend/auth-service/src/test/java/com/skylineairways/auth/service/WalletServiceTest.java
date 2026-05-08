package com.skylineairways.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skylineairways.auth.dto.WalletResponse;
import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.model.User;
import com.skylineairways.auth.model.Wallet;
import com.skylineairways.auth.repository.UserRepository;
import com.skylineairways.auth.repository.WalletRepository;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock private WalletRepository walletRepository;
    @Mock private UserRepository userRepository;

    private WalletService walletService;

    @BeforeEach
    void setUp() {
        walletService = new WalletService(walletRepository, userRepository);
    }

    @Test
    void getWalletBalanceReturnsExistingWallet() {
        Wallet wallet = new Wallet();
        wallet.setId(3L);
        wallet.setBalance(BigDecimal.valueOf(2500));
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));

        WalletResponse response = walletService.getWalletBalance(1L);

        assertEquals(3L, response.getWalletId());
        assertEquals(BigDecimal.valueOf(2500), response.getBalance());
    }

    @Test
    void getWalletBalanceCreatesWalletWhenMissing() {
        User user = new User();
        user.setId(1L);
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(walletRepository.save(org.mockito.ArgumentMatchers.any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletResponse response = walletService.getWalletBalance(1L);

        assertEquals(BigDecimal.ZERO, response.getBalance());
        verify(walletRepository).save(org.mockito.ArgumentMatchers.any(Wallet.class));
    }

    @Test
    void addMoneyRejectsInvalidAmount() {
        assertThrows(BadRequestException.class, () -> walletService.addMoneyToWallet(1L, BigDecimal.ZERO));
    }

    @Test
    void addMoneyUpdatesBalance() {
        Wallet wallet = new Wallet();
        wallet.setId(2L);
        wallet.setBalance(BigDecimal.valueOf(100));
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(org.mockito.ArgumentMatchers.any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletResponse response = walletService.addMoneyToWallet(1L, BigDecimal.valueOf(50));

        assertEquals(BigDecimal.valueOf(150), response.getBalance());
    }

    @Test
    void deductMoneyRejectsInsufficientFunds() {
        Wallet wallet = new Wallet();
        wallet.setId(2L);
        wallet.setBalance(BigDecimal.valueOf(100));
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));

        assertThrows(BadRequestException.class, () -> walletService.deductMoneyFromWallet(1L, BigDecimal.valueOf(200)));
    }
}