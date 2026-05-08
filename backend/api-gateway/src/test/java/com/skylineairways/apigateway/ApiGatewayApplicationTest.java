package com.skylineairways.apigateway;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

class ApiGatewayApplicationTest {

    @Test
    void applicationClassCanBeInstantiated() {
        assertDoesNotThrow(ApiGatewayApplication::new);
    }
}
