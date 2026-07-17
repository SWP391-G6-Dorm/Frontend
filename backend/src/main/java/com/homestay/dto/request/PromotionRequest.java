package com.homestay.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PromotionRequest {

    @NotBlank(message = "Subtitle is required")
    private String subtitle;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "CTA text is required")
    private String ctaText;

    @NotBlank(message = "CTA URL is required")
    private String ctaUrl;

    /** URL ảnh banner (tùy chọn) */
    private String imageUrl;

    @NotBlank(message = "Color theme is required")
    private String colorTheme;

    @NotNull
    private Boolean isActive = true;

    private int sortOrder = 0;
}
