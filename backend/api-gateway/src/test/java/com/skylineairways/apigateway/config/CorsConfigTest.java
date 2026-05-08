package com.skylineairways.apigateway.config;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class CorsConfigTest {

    @Test
    void corsWebFilterBeanCanBeCreated() {
        CorsConfig config = new CorsConfig();
        assertNotNull(config.corsWebFilter());
    }
}
