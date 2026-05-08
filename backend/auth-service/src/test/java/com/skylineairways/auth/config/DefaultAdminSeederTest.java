package com.skylineairways.auth.config;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.skylineairways.auth.model.AdminUser;
import com.skylineairways.auth.repository.AdminUserRepository;

@ExtendWith(MockitoExtension.class)
class DefaultAdminSeederTest {

    @Mock private AdminUserRepository adminUserRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private DefaultAdminSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new DefaultAdminSeeder(adminUserRepository, passwordEncoder);
    }

    @Test
    void runCreatesDefaultAdminWhenMissing() throws Exception {
        when(adminUserRepository.existsByUsernameIgnoreCase("MITHUN M N")).thenReturn(false);
        when(passwordEncoder.encode("Mimmi123")).thenReturn("encoded");

        seeder.run(null);

        verify(adminUserRepository).save(org.mockito.ArgumentMatchers.any(AdminUser.class));
    }

    @Test
    void runSkipsWhenDefaultAdminExists() throws Exception {
        when(adminUserRepository.existsByUsernameIgnoreCase("MITHUN M N")).thenReturn(true);

        seeder.run(null);

        verify(adminUserRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}