package com.homestay.dto.response;

import com.homestay.entity.Attachment;
import com.homestay.entity.DamageReport;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * SCR-53 — Damage Escalation (Admin).
 * Flat fields match current FE; also expose managerNote / approvedAmount for Drawer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDamageReportResponse {

    private String id;
    private String roomId;
    private String roomName;
    private String propertyName;
    private String reportedBy;
    private BigDecimal totalFee;
    /** Manager-proposed fee after escalate (SCR-43). */
    private BigDecimal approvedAmount;
    private String status;
    private String managerNote;
    private String managerName;
    private Boolean requiresAdminEscalation;
    private List<Item> items;
    private List<AttachmentDto> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime escalatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private String name;
        private BigDecimal estimatedCost;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentDto {
        private String url;
        private String type;
        private String fileName;
    }

    public static AdminDamageReportResponse from(DamageReport dr, List<Attachment> reportAttachments) {
        var inspection = dr.getInspection();
        String reportedBy = (inspection.getInspectedBy() != null)
                ? inspection.getInspectedBy().getFullName() : "";
        String managerName = dr.getApprovedBy() != null
                ? dr.getApprovedBy().getFullName() : null;

        List<Item> items = (dr.getItems() == null) ? List.of()
                : dr.getItems().stream()
                    .map(it -> Item.builder()
                            .name(it.getItemName())
                            .estimatedCost(it.getEstimatedCost())
                            .build())
                    .toList();

        List<AttachmentDto> atts = (reportAttachments == null) ? List.of()
                : reportAttachments.stream()
                    .map(a -> AttachmentDto.builder()
                            .url(a.getFileUrl())
                            .type("IMAGE")
                            .fileName(a.getFileName())
                            .build())
                    .toList();

        return AdminDamageReportResponse.builder()
                .id(dr.getId().toString())
                .roomId(inspection.getRoom().getId().toString())
                .roomName(inspection.getRoom().getRoomNumber())
                .propertyName(inspection.getProperty().getName())
                .reportedBy(reportedBy)
                .totalFee(dr.getTotalEstimatedCost())
                .approvedAmount(dr.getApprovedAmount())
                .status(mapStatus(dr))
                .managerNote(dr.getNote())
                .managerName(managerName)
                .requiresAdminEscalation(dr.getRequiresAdminEscalation())
                .items(items)
                .attachments(atts)
                .createdAt(dr.getCreatedAt())
                .escalatedAt(dr.getApprovedAt())
                .build();
    }

    /** Queue items map to ESCALATED; finalized → APPROVED. */
    private static String mapStatus(DamageReport dr) {
        if (dr.getStatus() == DamageReport.Status.APPROVED) {
            return "APPROVED";
        }
        if (dr.getStatus() == DamageReport.Status.PENDING_APPROVAL
                && Boolean.TRUE.equals(dr.getRequiresAdminEscalation())) {
            return "ESCALATED";
        }
        return "PENDING_REVIEW";
    }
}
