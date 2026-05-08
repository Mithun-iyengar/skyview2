package com.skylineairways.dbmigration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

class DbMigrationApplicationTest {

    @Test
    void applicationClassCanBeInstantiated() {
        assertDoesNotThrow(DbMigrationApplication::new);
    }
}
