package com.homestay.service;

import com.homestay.dto.response.AdminComplaintResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.Complaint;
import com.homestay.entity.Notification;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * SCR-54 - Complaint Management (Admin). List + status update / resolve.
 * KHONG dung ComplaintService (Manager/Customer).
 */
@Service
@RequiredArgsConstructor
public class AdminComplaintService {

    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<AdminComplaintResponse> listComplaints(
            String statusStr, String keyword, Pageable pageable) {
        Complaint.Status status = parseStatus(statusStr);
        String search = normalizeSearch(keyword);
        Page<Complaint> page = complaintRepository.findForAdmin(status, search, pageable);
        return new PageResponse<>(
                page.getContent().stream().map(AdminComplaintResponse::from).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    @Transactional
    public AdminComplaintResponse resolve(UUID id, String resolution, User admin) {
        return updateStatus(id, Complaint.Status.RESOLVED, resolution, admin);
    }

    @Transactional
    public AdminComplaintResponse updateStatus(
            UUID id, Complaint.Status target, String resolution, User admin) {
        Complaint c = complaintRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khiếu nại"));

        Complaint.Status current = c.getStatus();
        if (current == Complaint.Status.CLOSED) {
            throw new BusinessException("Khiếu nại đã đóng, không thể cập nhật");
        }
        if (current == target) {
            throw new BusinessException("Trạng thái mới trùng với trạng thái hiện tại");
        }
        validateTransition(current, target);

        if (target == Complaint.Status.RESOLVED || target == Complaint.Status.CLOSED) {
            String note = resolution != null ? resolution.trim() : "";
            if (note.isBlank() && (c.getResolutionNotes() == null || c.getResolutionNotes().isBlank())) {
                throw new BusinessException("Ghi chú giải quyết là bắt buộc khi giải quyết hoặc đóng khiếu nại");
            }
            if (!note.isBlank()) {
                c.setResolutionNotes(note);
            }
        } else if (resolution != null && !resolution.isBlank()) {
            c.setResolutionNotes(resolution.trim());
        }

        if (target == Complaint.Status.RESOLVED && c.getResolvedAt() == null) {
            c.setResolvedAt(LocalDateTime.now());
        }

        c.setStatus(target);
        Complaint saved = complaintRepository.save(c);

        Complaint mapped = complaintRepository.findByIdWithUser(saved.getId()).orElse(saved);
        notifyCustomer(mapped, target);
        return AdminComplaintResponse.from(mapped);
    }

    private void validateTransition(Complaint.Status current, Complaint.Status next) {
        boolean ok = switch (current) {
            case OPEN -> next == Complaint.Status.INVESTIGATING || next == Complaint.Status.RESOLVED;
            case INVESTIGATING -> next == Complaint.Status.RESOLVED;
            case RESOLVED -> next == Complaint.Status.CLOSED;
            case CLOSED -> false;
        };
        if (!ok) {
            throw new BusinessException(
                    "Không thể chuyển từ " + current.name() + " sang " + next.name());
        }
    }

    private Complaint.Status parseStatus(String statusStr) {
        if (statusStr == null || statusStr.isBlank() || "ALL".equalsIgnoreCase(statusStr.trim())) {
            return null;
        }
        try {
            return Complaint.Status.valueOf(statusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Trạng thái không hợp lệ");
        }
    }

    private static String normalizeSearch(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return keyword.trim();
    }

    private void notifyCustomer(Complaint c, Complaint.Status target) {
        if (c.getUser() == null) {
            return;
        }
        String msg = switch (target) {
            case INVESTIGATING -> "Khiếu nại của bạn đang được xem xét.";
            case RESOLVED -> "Khiếu nại của bạn đã được giải quyết.";
            case CLOSED -> "Khiếu nại của bạn đã được đóng.";
            default -> "Khiếu nại của bạn đã được cập nhật.";
        };
        notificationService.sendNotification(
                c.getUser().getId(),
                Notification.Type.SYSTEM,
                "Cập nhật khiếu nại",
                msg,
                c.getId(),
                "Complaint");
    }
}
