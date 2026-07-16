package com.homestay.configs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Chuyển cột VARCHAR → NVARCHAR trước khi Hibernate đọc dữ liệu Unicode.
 * Thay thế việc phải chạy fix-unicode.sql thủ công trong SSMS.
 */
@Component
@Order(0)
public class UnicodeSchemaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(UnicodeSchemaInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public UnicodeSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        migrate("properties", "name", "NVARCHAR(200) NOT NULL");
        migrate("properties", "address", "NVARCHAR(500) NOT NULL");
        migrate("properties", "description", "NVARCHAR(MAX) NULL");
        migrate("floors", "description", "NVARCHAR(500) NULL");
        migrateRoomNumber();
        migrate("rooms", "room_type", "NVARCHAR(100) NULL");
        migrate("rooms", "description", "NVARCHAR(MAX) NULL");
        migrate("users", "full_name", "NVARCHAR(200) NOT NULL");
        migrate("promotions", "subtitle", "NVARCHAR(100) NOT NULL");
        migrate("promotions", "title", "NVARCHAR(200) NOT NULL");
        migrate("promotions", "description", "NVARCHAR(400) NULL");
        migrate("promotions", "cta_text", "NVARCHAR(80) NOT NULL");
        migrate("promotions", "cta_url", "NVARCHAR(300) NOT NULL");
        migrate("promotions", "image_url", "NVARCHAR(500) NULL");
        migrate("promotions", "color_theme", "NVARCHAR(20) NOT NULL");
    }

    /** room_number có unique constraint — phải drop trước khi đổi kiểu cột. */
    private void migrateRoomNumber() {
        try {
            if (!needsMigration("rooms", "room_number")) {
                return;
            }
            dropConstraintIfExists("rooms", "uq_room_number_property");
            jdbcTemplate.execute("ALTER TABLE rooms ALTER COLUMN room_number NVARCHAR(50) NOT NULL");
            jdbcTemplate.execute(
                    "ALTER TABLE rooms ADD CONSTRAINT uq_room_number_property UNIQUE (room_number, property_id)"
            );
            log.info("Migrated rooms.room_number to NVARCHAR(50) NOT NULL");
        } catch (Exception e) {
            log.error("Could not migrate rooms.room_number: {}", e.getMessage(), e);
        }
    }

    private void migrate(String table, String column, String sqlType) {
        try {
            if (!needsMigration(table, column)) {
                return;
            }
            jdbcTemplate.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " " + sqlType);
            log.info("Migrated {}.{} to {}", table, column, sqlType);
        } catch (Exception e) {
            log.error("Could not migrate {}.{}: {}", table, column, e.getMessage(), e);
        }
    }

    private boolean needsMigration(String table, String column) {
        Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?",
                Integer.class,
                table
        );
        if (tableExists == null || tableExists == 0) {
            return false;
        }

        String currentType = jdbcTemplate.queryForObject(
                """
                SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = ? AND COLUMN_NAME = ?
                """,
                String.class,
                table,
                column
        );
        return currentType != null && !currentType.equalsIgnoreCase("nvarchar");
    }

    private void dropConstraintIfExists(String table, String constraintName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM sys.objects o
                JOIN sys.tables t ON o.parent_object_id = t.object_id
                WHERE o.name = ? AND t.name = ?
                """,
                Integer.class,
                constraintName,
                table
        );
        if (count != null && count > 0) {
            jdbcTemplate.execute("ALTER TABLE " + table + " DROP CONSTRAINT " + constraintName);
            log.info("Dropped constraint {} on {}", constraintName, table);
        }
    }
}
