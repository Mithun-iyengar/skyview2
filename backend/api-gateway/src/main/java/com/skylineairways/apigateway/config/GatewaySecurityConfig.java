package com.skylineairways.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.config.web.server.ServerHttpSecurity.CsrfSpec;
import org.springframework.security.config.web.server.ServerHttpSecurity.FormLoginSpec;
import org.springframework.security.config.web.server.ServerHttpSecurity.HttpBasicSpec;
import org.springframework.security.config.web.server.ServerHttpSecurity.AuthorizeExchangeSpec;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;

/**
 * Disables default browser auth flows for the reactive API gateway.
 * JWT validation is handled by route filters, not by gateway security login pages.
 */
@Configuration
@EnableWebFluxSecurity
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(CsrfSpec::disable)
                .httpBasic(HttpBasicSpec::disable)
                .formLogin(FormLoginSpec::disable)
                .authorizeExchange(this::authorizeAll)
                .build();
    }

    private void authorizeAll(AuthorizeExchangeSpec exchanges) {
        exchanges
                .pathMatchers("/actuator/**").permitAll()
                .pathMatchers("/api/**").permitAll()
                .anyExchange().permitAll();
    }
}
