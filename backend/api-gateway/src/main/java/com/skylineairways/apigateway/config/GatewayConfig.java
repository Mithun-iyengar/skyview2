package com.skylineairways.apigateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder, JwtAuthenticationFilter jwtFilter) {
        return builder.routes()
            .route("auth-service", r -> r
                .path("/api/auth/**", "/api/v1/auth/**")
                .uri("lb://auth-service"))
            .route("admin-auth-service", r -> r
                .path("/api/admin/auth/**", "/api/v1/admin/auth/**")
                .uri("lb://auth-service"))
            .route("auth-wallet-service", r -> r
                .path("/api/wallet", "/api/wallet/**", "/api/v1/wallet", "/api/v1/wallet/**")
                .uri("lb://auth-service"))
            .route("flight-service", r -> r
                .path("/api/v1/flights", "/api/v1/flights/**")
                .filters(f -> f.stripPrefix(2))
                .uri("lb://flight-service"))
            .route("booking-service", r -> r
                .path("/api/v1/bookings", "/api/v1/bookings/**")
                .filters(f -> f.stripPrefix(2).filter(jwtFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://booking-service"))
            .route("seat-service", r -> r
                .path("/api/v1/seats/**")
                .filters(f -> f.stripPrefix(2).filter(jwtFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://booking-service"))
            .route("payment-service", r -> r
                .path("/api/v1/payments/**")
                .filters(f -> f.stripPrefix(2).filter(jwtFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://payment-service"))
            .route("notification-service", r -> r
                .path("/api/v1/notifications/**")
                .filters(f -> f.stripPrefix(2).filter(jwtFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://notification-service"))
            .build();
    }
}