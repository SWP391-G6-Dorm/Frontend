package com.homestay.configs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Sửa dữ liệu demo bị lỗi dấu tiếng Việt (?) — tương đương scripts/fix-unicode.sql.
 */
@Component
@Order(5)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = false)
public class UnicodeDemoDataFixer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(UnicodeDemoDataFixer.class);

    private final JdbcTemplate jdbcTemplate;

    public UnicodeDemoDataFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            fixProperty("Old Quarter Inn",
                    "Hà Nội Old Quarter Inn",
                    "25 Hàng Bạc, Hà Nội",
                    "Homestay phố cổ Hà Nội, đi bộ tới Hồ Hoàn Kiếm.");
            fixProperty("Sunset Resort",
                    "Sunset Resort Đà Nẵng",
                    "123 Nguyễn Tất Thành, Đà Nẵng",
                    null);
            fixProperty("Garden Villa",
                    "Hội An Garden Villa",
                    "78 Phan Bội Châu, Hội An",
                    null);
            fixProperty("Beach House",
                    "Phú Quốc Beach House",
                    "12 Trần Hưng Đạo, Phú Quốc",
                    null);
            fixAddress("Mountain View", "456 Trần Phú, Đà Lạt");
            fixAddress("Nha Trang", "88 Trần Phú, Nha Trang");
            log.info("[Seed] Unicode demo property names/addresses verified");
        } catch (Exception e) {
            log.warn("[Seed] Unicode demo data fix skipped: {}", e.getMessage());
        }
    }

    private void fixProperty(String likePattern, String name, String address, String description) {
        if (!tableExists("properties")) return;
        int updated = jdbcTemplate.update(
                """
                UPDATE properties SET
                    name = ?,
                    address = ?,
                    description = COALESCE(?, description)
                WHERE name LIKE ?
                """,
                name, address, description, "%" + likePattern + "%"
        );
        if (updated > 0) {
            log.info("[Seed] Fixed Unicode for property matching '{}'", likePattern);
        }
    }

    private void fixAddress(String likePattern, String address) {
        if (!tableExists("properties")) return;
        jdbcTemplate.update(
                "UPDATE properties SET address = ? WHERE name LIKE ?",
                address, "%" + likePattern + "%"
        );
    }

    private boolean tableExists(String table) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?",
                Integer.class,
                table
        );
        return count != null && count > 0;
    }
}
