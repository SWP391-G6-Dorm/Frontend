package com.homestay.configs;

import com.homestay.entity.Promotion;
import com.homestay.repository.PromotionRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * SCR-01 — Seed banner mặc định khi bảng promotions trống (dev/demo).
 * Manager có thể sửa/xóa qua /manager/promotions.
 */
@Component
@Order(20)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = false)
public class PromotionDataSeeder implements ApplicationRunner {

    private static final String[] DEFAULT_IMAGES = {
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=480&fit=crop",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=480&fit=crop",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=480&fit=crop",
    };

    private static final String[][] DEFAULT_PROMO_TEXT = {
            {
                    "Ưu đãi cuối tuần",
                    "Giảm 20%\nthứ 6 – chủ nhật",
                    "Áp dụng cho phòng trống cuối tuần tại tất cả homestay.",
                    "Đặt ngay →",
            },
            {
                    "Đặt sớm hè 2026",
                    "Combo 3 đêm\n+ bữa sáng miễn phí",
                    "Ưu đãi có hạn — đặt trước 31/08/2026.",
                    "Khám phá →",
            },
            {
                    "Lưu trú dài hạn",
                    "Giảm thêm 15%\ncho booking từ 5 đêm",
                    "Lý tưởng cho kỳ nghỉ dài ngày hoặc công tác.",
                    "Xem phòng →",
            },
    };

    private final PromotionRepository promotionRepository;

    public PromotionDataSeeder(PromotionRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (promotionRepository.count() > 0) {
            backfillMissingImages();
            backfillUnicodeText();
            return;
        }

        promotionRepository.save(build(
                "Ưu đãi cuối tuần",
                "Giảm 20%\nthứ 6 – chủ nhật",
                "Áp dụng cho phòng trống cuối tuần tại tất cả homestay.",
                "Đặt ngay →",
                "/search?sort=price-asc",
                "red",
                DEFAULT_IMAGES[0],
                0
        ));
        promotionRepository.save(build(
                "Đặt sớm hè 2026",
                "Combo 3 đêm\n+ bữa sáng miễn phí",
                "Ưu đãi có hạn — đặt trước 31/08/2026.",
                "Khám phá →",
                "/search",
                "blue",
                DEFAULT_IMAGES[1],
                1
        ));
        promotionRepository.save(build(
                "Lưu trú dài hạn",
                "Giảm thêm 15%\ncho booking từ 5 đêm",
                "Lý tưởng cho kỳ nghỉ dài ngày hoặc công tác.",
                "Xem phòng →",
                "/rooms",
                "green",
                DEFAULT_IMAGES[2],
                2
        ));

        System.out.println("[Seed] Created 3 default promotion banners (SCR-01)");
    }

    private void backfillMissingImages() {
        var promotions = promotionRepository.findAllByOrderBySortOrderAsc();
        boolean updated = false;
        for (int i = 0; i < promotions.size(); i++) {
            Promotion p = promotions.get(i);
            if (p.getImageUrl() == null || p.getImageUrl().isBlank()) {
                p.setImageUrl(DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]);
                updated = true;
            }
        }
        if (updated) {
            promotionRepository.saveAll(promotions);
            System.out.println("[Seed] Backfilled promotion banner images");
        }
    }

    /** Sửa banner demo bị lỗi dấu do cột VARCHAR trên SQL Server. */
    private void backfillUnicodeText() {
        var promotions = promotionRepository.findAllByOrderBySortOrderAsc();
        boolean updated = false;
        for (Promotion p : promotions) {
            if (!looksCorrupted(p)) {
                continue;
            }
            int idx = Math.min(Math.max(p.getSortOrder(), 0), DEFAULT_PROMO_TEXT.length - 1);
            String[] text = DEFAULT_PROMO_TEXT[idx];
            p.setSubtitle(text[0]);
            p.setTitle(text[1]);
            p.setDescription(text[2]);
            p.setCtaText(text[3]);
            updated = true;
        }
        if (updated) {
            promotionRepository.saveAll(promotions);
            System.out.println("[Seed] Backfilled promotion Unicode text");
        }
    }

    private static boolean looksCorrupted(Promotion p) {
        return containsCorruption(p.getSubtitle())
                || containsCorruption(p.getTitle())
                || containsCorruption(p.getDescription())
                || containsCorruption(p.getCtaText());
    }

    private static boolean containsCorruption(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return value.contains("?")
                || value.contains("Ð")
                || value.contains("�");
    }

    private static Promotion build(
            String subtitle, String title, String description,
            String ctaText, String ctaUrl, String colorTheme, String imageUrl, int sortOrder) {
        Promotion p = new Promotion();
        p.setSubtitle(subtitle);
        p.setTitle(title);
        p.setDescription(description);
        p.setCtaText(ctaText);
        p.setCtaUrl(ctaUrl);
        p.setColorTheme(colorTheme);
        p.setImageUrl(imageUrl);
        p.setActive(true);
        p.setSortOrder(sortOrder);
        return p;
    }
}
