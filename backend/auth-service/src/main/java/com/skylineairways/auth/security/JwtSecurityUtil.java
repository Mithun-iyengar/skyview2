package com.skylineairways.auth.security;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;

/**
 * Utility to extract user information from JWT in security context.
 */
@Component
public class JwtSecurityUtil {

    private final JwtUtil jwtUtil;

    public JwtSecurityUtil(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    /**
     * Extract userId from Authorization header or security context.
     * Returns null if no valid token is found.
     */
    public Long getCurrentUserIdFromToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authorizationHeader.substring(7);
        try {
            Claims claims = jwtUtil.parseClaims(token);
            Object userIdObj = claims.get("userId");
            if (userIdObj != null) {
                return ((Number) userIdObj).longValue();
            }
        } catch (Exception e) {
            return null;
        }

        return null;
    }

    /**
     * Extract userId from the currently authenticated user's token.
     * Requires a valid JWT token in the Authorization header.
     */
    public Long getCurrentUserId(String authorizationHeader) {
        return getCurrentUserIdFromToken(authorizationHeader);
    }
}
