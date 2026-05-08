package com.skylineairways.auth.config;

import java.time.Instant;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.skylineairways.auth.model.AdminUser;
import com.skylineairways.auth.repository.AdminUserRepository;

@Component
public class DefaultAdminSeeder implements ApplicationRunner {

    private static final String DEFAULT_ADMIN_USERNAME = "MITHUN M N";
    private static final String DEFAULT_ADMIN_PASSWORD = "Mimmi123";

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    public DefaultAdminSeeder(AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminUserRepository.existsByUsernameIgnoreCase(DEFAULT_ADMIN_USERNAME)) {
            return;
        }

        AdminUser admin = new AdminUser();
        admin.setUsername(DEFAULT_ADMIN_USERNAME);
        admin.setPassword(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
        admin.setEmail(null);
        admin.setActive(true);
        admin.setCreatedAt(Instant.now());

        adminUserRepository.save(admin);
    }
}
