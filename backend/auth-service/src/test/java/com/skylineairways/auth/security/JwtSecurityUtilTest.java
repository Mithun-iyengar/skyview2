package com.skylineairways.auth.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.skylineairways.auth.model.User;

class JwtSecurityUtilTest {

    private final JwtUtil jwtUtil = new JwtUtil("12345678901234567890123456789012", 3600000L);
    private final JwtSecurityUtil jwtSecurityUtil = new JwtSecurityUtil(jwtUtil);

    @Test
    void getCurrentUserIdFromBearerTokenReturnsUserId() {
        User user = new User();
        user.setId(42L);
        user.setFullName("Mithun");
        user.setEmail("test@example.com");
        user.setActive(true);
        user.setCreatedAt(Instant.now());

        String token = jwtUtil.generateToken(user);

        assertEquals(42L, jwtSecurityUtil.getCurrentUserIdFromToken("Bearer " + token));
    }

    @Test
    void getCurrentUserIdFromTokenReturnsNullForInvalidHeader() {
        assertNull(jwtSecurityUtil.getCurrentUserIdFromToken("Basic abc"));
        assertNull(jwtSecurityUtil.getCurrentUserIdFromToken(null));
    }
}