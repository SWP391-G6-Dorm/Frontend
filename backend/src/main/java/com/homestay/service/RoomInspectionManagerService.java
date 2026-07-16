package com.homestay.service;

import com.homestay.dto.response.InspectionSummaryResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.RoomInspection;
import com.homestay.entity.User;
import com.homestay.repository.RoomInspectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * SCR-42 — Inspection Management (Manager only, READ-ONLY).
 * Chỉ xem danh sách + chi tiết kiểm tra phòng, scope theo property.id.
 * Mọi mutation (start/pass/fail) thuộc Employee SCR-62 — KHÔNG thuộc service này.
 */
@Service
@RequiredArgsConstructor
public class RoomInspectionManagerService {

    private final RoomInspectionRepository inspectionRepository;
    private final ReportPropertyScopeValidator scopeValidator;

    @Transactional(readOnly = true)
    public PageResponse<InspectionSummaryResponse> listForManager(
            User manager, UUID propertyId, RoomInspection.Status status, String search, int page, int size) {

        scopeValidator.validateManagerAccess(manager, propertyId);

        Pageable pageable = PageRequest.of(page, size);
        Page<RoomInspection> result =
                inspectionRepository.findForManagerBoard(propertyId, status, search, pageable);

        List<InspectionSummaryResponse> content = result.getContent().stream()
                .map(InspectionSummaryResponse::fromEntity)
                .toList();

        return new PageResponse<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }
}
