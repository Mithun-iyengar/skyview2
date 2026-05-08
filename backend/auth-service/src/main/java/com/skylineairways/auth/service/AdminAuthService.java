package com.skylineairways.auth.service;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.skylineairways.auth.dto.AuthResponse;
import com.skylineairways.auth.dto.AdminLoginRequest;
import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.exception.UnauthorizedException;
import com.skylineairways.auth.model.AdminUser;
import com.skylineairways.auth.repository.AdminUserRepository;
import com.skylineairways.auth.security.JwtUtil;

@Service
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AdminAuthService(AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse login(AdminLoginRequest request) {
        String username = normalize(request.getUsername());
        if (username == null) {
            throw new BadRequestException("username is required");
        }

        AdminUser admin = findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Admin not found. Please create an admin record first."));

        if (!admin.isActive()) {
            throw new UnauthorizedException("Admin account is inactive.");
        }

        if (!passwordMatches(request.getPassword(), admin.getPassword())) {
            throw new UnauthorizedException("Incorrect password.");
        }

        String token = jwtUtil.generateToken(admin);
        return new AuthResponse(token, admin.getUsername());
    }

    private Optional<AdminUser> findByUsername(String username) {
        return adminUserRepository.findByUsernameIgnoreCase(username);
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }
        if (passwordEncoder.matches(rawPassword, storedPassword)) {
            return true;
        }
        return rawPassword.equals(storedPassword);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
