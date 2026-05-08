package com.skylineairways.apigateway.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import reactor.core.publisher.Mono;

class JwtAuthenticationFilterTest {

    private JwtAuthenticationFilter filter;
    private String jwtSecret;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter();
        jwtSecret = "12345678901234567890123456789012";
        ReflectionTestUtils.setField(filter, "jwtSecret", jwtSecret);
    }

    @Test
    void applyBypassesAuthEndpoints() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/auth/login").build());
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        filter.apply(new JwtAuthenticationFilter.Config()).filter(exchange, chain).block();

        assertNull(exchange.getRequest().getHeaders().getFirst("X-User-Id"));
    }

    @Test
    void applyAddsHeadersForValidToken() {
        String token = generateToken("7", "User", "ROLE_USER");

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/bookings")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .build());
        AtomicReference<org.springframework.web.server.ServerWebExchange> captured = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            captured.set(ex);
            return Mono.empty();
        };

        filter.apply(new JwtAuthenticationFilter.Config()).filter(exchange, chain).block();

        assertEquals("7", captured.get().getRequest().getHeaders().getFirst("X-User-Id"));
        assertEquals("User", captured.get().getRequest().getHeaders().getFirst("X-User-Name"));
    }

    private String generateToken(String userId, String fullName, String role) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Map<String, Object> claims = new HashMap<>();
        claims.put("name", fullName);
        claims.put("role", role);

        return Jwts.builder()
                .setSubject(userId)
                .addClaims(claims)
                .setIssuedAt(Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(key)
                .compact();
    }
}
