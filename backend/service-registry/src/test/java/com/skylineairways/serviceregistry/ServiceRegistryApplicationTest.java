package com.skylineairways.serviceregistry;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

class ServiceRegistryApplicationTest {

    @Test
    void applicationClassCanBeInstantiated() {
        assertDoesNotThrow(ServiceRegistryApplication::new);
    }
}
