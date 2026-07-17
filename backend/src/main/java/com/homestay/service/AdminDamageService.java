package com.homestay.service;

import com.homestay.dto.request.CoApproveDamageRequest;
import com.homestay.dto.response.AdminDamageReportResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.Attachment;
import com.homestay.entity.DamageItem;
import com.homestay.entity.DamageReport;
import com.homestay.entity.Notification;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.AttachmentRepository;
import com.homestay.repository.DamageReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SCR-53 — Damage Escalation (Admin). Queue escalated reports + co-approve.
 * Does not own SCR-43 (Manager), SCR-64 (Employee), or Customer dispute/pay.
 */
@Service
@RequiredArgsConstructor
public class AdminDamageService {

    private static final String ATTACHMENT_ENTITY_TYPE = "DamageItem";

    private final DamageReportRepository damageReportRepository;
    private final AttachmentRepository attachmentRepository;
    private final NotificationService notificationService;
    private final DamageFeeSettlementService damageFeeSettlementService;

    @Transactional(readOnly = true)
    public PageResponse<AdminDamageReportResponse> listEscalated(Pageable pageable) {
        Page<DamageReport> page = damageReportRepository.findEscalatedForAdmin(
                DamageReport.Status.PENDING_APPROVAL, pageable);

        page.getContent().forEach(dr -> {
            if (dr.getItems() != null) {
                dr.getItems().size();
            }
        });

        List<UUID> allItemIds = page.getContent().stream()
                .flatMap(dr -> safeItems(dr).stream())
                .map(DamageItem::getId)
                .toList();

        Map<UUID, List<Attachment>> attByItemId = allItemIds.isEmpty()
                ? Map.of()
                : attachmentRepository
                    .findByEntityTypeAndEntityIdIn(ATTACHMENT_ENTITY_TYPE, allItemIds)
                    .stream()
                    .collect(Collectors.groupingBy(Attachment::getEntityId));

        List<AdminDamageReportResponse> content = page.getContent().stream()
                .map(dr -> AdminDamageReportResponse.from(dr, collectAttachments(dr, attByItemId)))
                .toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    @Transactional
    public AdminDamageReportResponse coApprove(UUID id, CoApproveDamageRequest req, User admin) {
        DamageReport dr = damageReportRepository.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo hư hại"));

        if (!Boolean.TRUE.equals(dr.getRequiresAdminEscalation())
                || dr.getStatus() != DamageReport.Status.PENDING_APPROVAL) {
            throw new BusinessException("Báo cáo không ở trạng thái chờ Admin duyệt");
        }
        if (dr.getApprovedBy() == null) {
            throw new BusinessException("Báo cáo chưa được Manager escalate — không thể co-approve");
        }
        if (dr.getAdminApprover() != null) {
            throw new BusinessException("Báo cáo đã được Admin duyệt");
        }

        BigDecimal fee = req.getApprovedFee() != null
                ? req.getApprovedFee()
                : dr.getApprovedAmount();
        if (fee == null || fee.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Số tiền duyệt phải lớn hơn 0");
        }

        dr.setStatus(DamageReport.Status.APPROVED);
        dr.setAdminApprover(admin);
        dr.setApprovedAmount(fee);
        if (dr.getApprovedAt() == null) {
            dr.setApprovedAt(LocalDateTime.now());
        }
        if (req.getNote() != null && !req.getNote().isBlank()) {
            String existing = dr.getNote() != null ? dr.getNote().trim() : "";
            String adminNote = req.getNote().trim();
            dr.setNote(existing.isEmpty()
                    ? "[Admin] " + adminNote
                    : existing + "\n[Admin] " + adminNote);
        }

        damageFeeSettlementService.applyApprovedFee(dr, fee);

        DamageReport saved = damageReportRepository.save(dr);
        notifyCustomer(saved);

        return AdminDamageReportResponse.from(saved, collectAttachments(saved, null));
    }

    private List<DamageItem> safeItems(DamageReport dr) {
        return dr.getItems() == null ? Collections.emptyList() : dr.getItems();
    }

    private List<Attachment> collectAttachments(DamageReport dr, Map<UUID, List<Attachment>> attByItemId) {
        List<UUID> itemIds = safeItems(dr).stream().map(DamageItem::getId).toList();
        if (itemIds.isEmpty()) {
            return List.of();
        }
        if (attByItemId == null) {
            return attachmentRepository.findByEntityTypeAndEntityIdIn(ATTACHMENT_ENTITY_TYPE, itemIds);
        }
        List<Attachment> result = new ArrayList<>();
        for (UUID itemId : itemIds) {
            List<Attachment> atts = attByItemId.get(itemId);
            if (atts != null) {
                result.addAll(atts);
            }
        }
        return result;
    }

    private void notifyCustomer(DamageReport dr) {
        if (dr.getBooking() != null && dr.getBooking().getCustomer() != null) {
            notificationService.sendNotification(
                    dr.getBooking().getCustomer().getId(),
                    Notification.Type.SYSTEM,
                    "Cập nhật báo cáo hư hại",
                    "Phí bồi thường đã được Admin duyệt. Vui lòng thanh toán phí thiệt hại. Bạn có 24 giờ để Dispute nếu không đồng ý.",
                    dr.getId(),
                    "DamageReport");
        }
    }
}
