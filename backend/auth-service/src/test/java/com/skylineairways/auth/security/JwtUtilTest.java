package com.skylineairways.auth.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.skylineairways.auth.model.AdminUser;
import com.skylineairways.auth.model.User;

import io.jsonwebtoken.Claims;

class JwtUtilTest {

    private final JwtUtil jwtUtil = new JwtUtil("12345678901234567890123456789012", 3600000L);

    @Test
    void generateAndParseUserToken() {
        User user = new User();
        user.setId(11L);
        user.setFullName("Mithun");
        user.setEmail("test@example.com");
        user.setPhone("9876543210");
        user.setActive(true);
        user.setCreatedAt(Instant.now());

        String token = jwtUtil.generateToken(user);
        Claims claims = jwtUtil.parseClaims(token);

        assertEquals("test@example.com", claims.getSubject());
        assertEquals(11L, ((Number) claims.get("userId")).longValue());
        assertEquals("USER", claims.get("accountType"));
    }

    @Test
    void generateAndParseAdminToken() {
        AdminUser admin = new AdminUser();
        admin.setId(5L);
        admin.setUsername("admin");
        admin.setEmail("admin@example.com");
        admin.setActive(true);
        admin.setCreatedAt(Instant.now());

        String token = jwtUtil.generateToken(admin);
        Claims claims = jwtUtil.parseClaims(token);

        assertEquals("admin@example.com", claims.getSubject());
        assertEquals(5L, ((Number) claims.get("adminId")).longValue());
        assertEquals("ADMIN", claims.get("accountType"));
    }
}