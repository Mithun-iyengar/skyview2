package com.skylineairways.auth.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.skylineairways.auth.model.AdminUser;
import com.skylineairways.auth.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * JWT helper for token creation and parsing.
 */
@Component
public class JwtUtil {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationMs);
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("fullName", user.getFullName());
        claims.put("email", user.getEmail());
        claims.put("phone", user.getPhone());
        claims.put("active", user.isActive());
        claims.put("accountType", "USER");

        return buildToken(resolveSubject(user), claims, now, expiresAt);
    }

    public String generateToken(AdminUser adminUser) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("adminId", adminUser.getId());
        claims.put("username", adminUser.getUsername());
        claims.put("email", adminUser.getEmail());
        claims.put("active", adminUser.isActive());
        claims.put("accountType", "ADMIN");

        return buildToken(resolveAdminSubject(adminUser), claims, now, expiresAt);
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    private String resolveSubject(User user) {
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            return user.getPhone();
        }
        return user.getFullName();
    }

    private String resolveAdminSubject(AdminUser adminUser) {
        if (adminUser.getEmail() != null && !adminUser.getEmail().isBlank()) {
            return adminUser.getEmail();
        }
        return adminUser.getUsername();
    }

    private String buildToken(String subject, Map<String, Object> claims, Instant issuedAt, Instant expiresAt) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }
}
