package com.homestay.service;

import com.homestay.entity.ManagerPropertyAssignment;
import com.homestay.entity.User;
import com.homestay.exception.ForbiddenException;
import com.homestay.repository.ManagerPropertyAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Validates Manager access to a Property via ACTIVE assignment (FR-16). */
@Component
@RequiredArgsConstructor
public class ReportPropertyScopeValidator {

    private final ManagerPropertyAssignmentRepository assignmentRepository;

    public void validateManagerAccess(User manager, UUID propertyId) {
        if (manager == null || propertyId == null) {
            throw new ForbiddenException("Bạn không có quyền truy cập property này");
        }
        boolean assigned = assignmentRepository.existsByManagerIdAndPropertyIdAndStatus(
                manager.getId(), propertyId, ManagerPropertyAssignment.Status.ACTIVE);
        if (!assigned) {
            throw new ForbiddenException("Bạn không có quyền truy cập property này");
        }
    }
}
