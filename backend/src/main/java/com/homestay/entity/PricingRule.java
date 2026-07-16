package com.homestay.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pricing_rules",
    indexes = {
        @Index(name = "idx_pr_property",  columnList = "property_id"),
        @Index(name = "idx_pr_dates",     columnList = "start_date, end_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class PricingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    // Áp dụng cho loại phòng cụ thể (null = áp dụng cho tất cả)
    @Column(name = "room_type_id")
    private UUID roomTypeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "price_per_night", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerNight;

    // Ưu tiên cao hơn sẽ ghi đè giá mặc định
    @Column(name = "priority", nullable = false)
    private Integer priority = 0;
}
