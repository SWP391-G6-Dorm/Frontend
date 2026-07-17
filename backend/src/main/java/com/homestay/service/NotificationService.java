package com.homestay.service;

import com.homestay.entity.Notification;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.NotificationRepository;
import com.homestay.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 1. Lấy danh sách thông báo phân trang cho Customer
    // ══════════════════════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public Map<String, Object> getNotifications(UUID userId, int page, int size, boolean unreadOnly) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> result;

        if (unreadOnly) {
            result = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable);
        } else {
            result = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<Map<String, Object>> content = result.getContent().stream()
                .map(this::notifToMap)
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        return response;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. Đếm số thông báo chưa đọc (badge)
    // ══════════════════════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. Đánh dấu tất cả đã đọc
    // ══════════════════════════════════════════════════════════════════════════
    @Transactional
    public int markAllRead(UUID userId) {
        return notificationRepository.markAllAsReadByUserId(userId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. Xem chi tiết 1 thông báo + auto mark read (SCR-14)
    // ══════════════════════════════════════════════════════════════════════════
    @Transactional
    public Map<String, Object> getNotificationDetail(UUID notifId, UUID userId) {
        Notification notif = findOwnedNotification(notifId, userId);
        if (!notif.getIsRead()) {
            notif.setIsRead(true);
            notificationRepository.save(notif);
        }
        return notifToMap(notif);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4b. Đánh dấu 1 thông báo đã đọc (SCR-14)
    // ══════════════════════════════════════════════════════════════════════════
    @Transactional
    public Map<String, Object> markAsRead(UUID notifId, UUID userId) {
        Notification notif = findOwnedNotification(notifId, userId);
        if (!notif.getIsRead()) {
            notif.setIsRead(true);
            notificationRepository.save(notif);
        }
        return notifToMap(notif);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 5. Manager xóa 1 thông báo
    // ══════════════════════════════════════════════════════════════════════════
    @Transactional
    public void deleteNotification(UUID notifId) {
        Notification notif = notificationRepository.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notificationRepository.delete(notif);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 6. GỬI THÔNG BÁO MỀM — được gọi bởi các Service khác
    //    (BookingService, ContractService, MaintenanceTicketService...)
    // ══════════════════════════════════════════════════════════════════════════
    @Transactional
    public Notification sendNotification(UUID userId, Notification.Type type,
                                         String title, String content,
                                         UUID relatedEntityId, String relatedEntityType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for notification"));

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setType(type);
        notif.setTitle(title);
        notif.setContent(content);
        notif.setIsRead(false);
        notif.setRelatedEntityId(relatedEntityId);
        notif.setRelatedEntityType(relatedEntityType);

        return notificationRepository.save(notif);
    }

    // ── Helper: Entity → Map ─────────────────────────────────────────────────
    private Notification findOwnedNotification(UUID notifId, UUID userId) {
        Notification notif = notificationRepository.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
        if (!notif.getUser().getId().equals(userId)) {
            throw new BusinessException("Bạn không có quyền xem thông báo này");
        }
        return notif;
    }

    private Map<String, Object> notifToMap(Notification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId().toString());
        m.put("type", n.getType().name());
        m.put("title", n.getTitle());
        m.put("content", n.getContent());
        m.put("isRead", n.getIsRead());
        m.put("relatedEntityId", n.getRelatedEntityId() != null ? n.getRelatedEntityId().toString() : null);
        m.put("relatedEntityType", n.getRelatedEntityType());
        m.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        return m;
    }
}
