package com.skylineairways.dbmigration;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class FlywayMigrationRunner implements CommandLineRunner {

    private final DataSource dataSource;
    private final String locations;

    public FlywayMigrationRunner(
            DataSource dataSource,
            @Value("${app.flyway.locations:classpath:db/migration}") String locations) {
        this.dataSource = dataSource;
        this.locations = locations;
    }

    @Override
    public void run(String... args) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations(locations)
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load();

        flyway.repair();
        flyway.migrate();
    }
}
