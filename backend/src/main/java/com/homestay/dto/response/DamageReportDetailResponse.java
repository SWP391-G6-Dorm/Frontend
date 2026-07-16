package com.homestay.dto.response;

import com.homestay.entity.DamageItem;
import com.homestay.entity.DamageReport;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** SCR-43: Chi tiết báo cáo hư hại cho Drawer (kèm danh sách hạng mục). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DamageReportDetailResponse {

    private UUID id;
    private UUID bookingId;
    private String roomNumber;
    private UUID propertyId;
    private String propertyName;
    private BigDecimal totalEstimatedCost;
    private BigDecimal approvedAmount;
    private String status;
    private String inspectorName;
    private String approvedByName;
    private Boolean requiresAdminEscalation;
    private String note;
    private LocalDateTime createdAt;
    private List<DamageItemResponse> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DamageItemResponse {
        private UUID id;
        private String itemName;
        private String description;
        private BigDecimal estimatedCost;

        static DamageItemResponse fromEntity(DamageItem it) {
            return new DamageItemResponse(
                    it.getId(),
                    it.getItemName(),
                    it.getDescription(),
                    it.getEstimatedCost());
        }
    }

    public static DamageReportDetailResponse fromEntity(DamageReport dr) {
        List<DamageItemResponse> items = dr.getItems() == null ? List.of()
                : dr.getItems().stream().map(DamageItemResponse::fromEntity).toList();
        return new DamageReportDetailResponse(
                dr.getId(),
                dr.getBooking().getId(),
                dr.getInspection().getRoom().getRoomNumber(),
                dr.getInspection().getProperty().getId(),
                dr.getInspection().getProperty().getName(),
                dr.getTotalEstimatedCost(),
                dr.getApprovedAmount(),
                dr.getStatus().name(),
                dr.getInspection().getInspectedBy() != null
                        ? dr.getInspection().getInspectedBy().getFullName() : null,
                dr.getApprovedBy() != null ? dr.getApprovedBy().getFullName() : null,
                dr.getRequiresAdminEscalation(),
                dr.getNote(),
                dr.getCreatedAt(),
                items
        );
    }
}
