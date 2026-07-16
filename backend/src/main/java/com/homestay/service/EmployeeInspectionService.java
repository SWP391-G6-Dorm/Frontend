package com.homestay.service;

import com.homestay.dto.request.EmployeeInspectionResultRequest;
import com.homestay.dto.response.EmployeeInspectionResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.EmployeePropertyAssignment;
import com.homestay.entity.RoomInspection;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.EmployeePropertyAssignmentRepository;
import com.homestay.repository.RoomInspectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * SCR-62 - Employee Room Inspection Hub.
 * List PENDING/IN_PROGRESS inspections in ACTIVE properties; pass or fail by inspection id.
 */
@Service
@RequiredArgsConstructor
public class EmployeeInspectionService {

    private final RoomInspectionRepository roomInspectionRepository;
    private final EmployeePropertyAssignmentRepository employeePropertyAssignmentRepository;

    @Transactional(readOnly = true)
    public PageResponse<EmployeeInspectionResponse> list(User employee, Pageable pageable) {
        List<UUID> propertyIds = employeePropertyAssignmentRepository
                .findPropertyIdsByEmployeeIdAndStatus(employee.getId(), EmployeePropertyAssignment.Status.ACTIVE);
        if (propertyIds.isEmpty()) {
            return new PageResponse<>(List.of(), pageable.getPageNumber(), pageable.getPageSize(), 0, 0);
        }
        Page<RoomInspection> page = roomInspectionRepository.findForEmployee(
                propertyIds,
                List.of(RoomInspection.Status.PENDING, RoomInspection.Status.IN_PROGRESS),
                pageable);
        List<EmployeeInspectionResponse> content = page.getContent().stream()
                .map(EmployeeInspectionResponse::fromEntity)
                .toList();
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    @Transactional
    public EmployeeInspectionResponse pass(User employee, UUID id, EmployeeInspectionResultRequest request) {
        RoomInspection inspection = loadInScope(employee.getId(), id);
        guardOpen(inspection);
        inspection.setStatus(RoomInspection.Status.PASSED);
        inspection.setInspectedBy(employee);
        inspection.setInspectedAt(LocalDateTime.now());
        inspection.setNote(buildNote(request, false));
        return EmployeeInspectionResponse.fromEntity(roomInspectionRepository.save(inspection));
    }

    @Transactional
    public EmployeeInspectionResponse fail(User employee, UUID id, EmployeeInspectionResultRequest request) {
        if (request == null || !StringUtils.hasText(request.getNotes())) {
            throw new BusinessException("Ghi chu bat buoc khi Fail");
        }
        RoomInspection inspection = loadInScope(employee.getId(), id);
        guardOpen(inspection);
        inspection.setStatus(RoomInspection.Status.FAILED_WITH_DAMAGE);
        inspection.setInspectedBy(employee);
        inspection.setInspectedAt(LocalDateTime.now());
        inspection.setNote(buildNote(request, true));
        return EmployeeInspectionResponse.fromEntity(roomInspectionRepository.save(inspection));
    }

    private RoomInspection loadInScope(UUID employeeId, UUID inspectionId) {
        List<UUID> propertyIds = employeePropertyAssignmentRepository
                .findPropertyIdsByEmployeeIdAndStatus(employeeId, EmployeePropertyAssignment.Status.ACTIVE);
        if (propertyIds.isEmpty()) {
            throw new ResourceNotFoundException("Khong tim thay room inspection");
        }
        return roomInspectionRepository.findByIdAndPropertyIdIn(inspectionId, propertyIds)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay room inspection"));
    }

    private void guardOpen(RoomInspection inspection) {
        RoomInspection.Status status = inspection.getStatus();
        if (status != RoomInspection.Status.PENDING && status != RoomInspection.Status.IN_PROGRESS) {
            throw new BusinessException("Inspection da hoan tat");
        }
    }

    private String buildNote(EmployeeInspectionResultRequest request, boolean fail) {
        if (request == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        if (StringUtils.hasText(request.getNotes())) {
            sb.append(request.getNotes().trim());
        }
        EmployeeInspectionResultRequest.Checklist c = request.getChecklist();
        if (c != null) {
            List<String> parts = new ArrayList<>();
            appendCheck(parts, "tv", c.getTv());
            appendCheck(parts, "minibar", c.getMinibar());
            appendCheck(parts, "ac", c.getAc());
            appendCheck(parts, "bathroom", c.getBathroom());
            appendCheck(parts, "beds", c.getBeds());
            if (!parts.isEmpty()) {
                if (sb.length() > 0) {
                    sb.append(" | ");
                }
                sb.append("Checklist: ").append(String.join(", ", parts));
            }
        }
        if (fail && sb.length() == 0) {
            throw new BusinessException("Ghi chu bat buoc khi Fail");
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    private void appendCheck(List<String> parts, String name, Boolean ok) {
        if (ok == null) {
            return;
        }
        parts.add(name + "=" + (ok ? "OK" : "FAIL"));
    }
}