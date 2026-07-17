package com.homestay.service;

import com.homestay.dto.request.AssignInspectionRequest;
import com.homestay.dto.response.InspectionSummaryResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.EmployeePropertyAssignment;
import com.homestay.entity.RoomInspection;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ConflictException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.EmployeePropertyAssignmentRepository;
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
 * SCR-42 — Inspection Management (Manager).
 * List + Assign/Reassign inspector. Pass/Fail thuộc Employee SCR-62.
 */
@Service
@RequiredArgsConstructor
public class RoomInspectionManagerService {

    private final RoomInspectionRepository inspectionRepository;
    private final EmployeePropertyAssignmentRepository employeeAssignmentRepository;
    private final ReportPropertyScopeValidator scopeValidator;

    @Transactional(readOnly = true)
    public PageResponse<InspectionSummaryResponse> listForManager(
            User manager,
            UUID propertyId,
            RoomInspection.Status status,
            boolean unassignedOnly,
            String search,
            int page,
            int size) {

        scopeValidator.validateManagerAccess(manager, propertyId);

        Pageable pageable = PageRequest.of(page, size);
        Page<RoomInspection> result = inspectionRepository.findForManagerBoard(
                propertyId, status, unassignedOnly, search, pageable);

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

    @Transactional
    public void assignInspector(User manager, UUID inspectionId, AssignInspectionRequest request) {
        RoomInspection inspection = inspectionRepository.findByIdWithDetails(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kiểm tra phòng"));

        UUID propertyId = inspection.getProperty().getId();
        scopeValidator.validateManagerAccess(manager, propertyId);

        RoomInspection.Status status = inspection.getStatus();
        if (status != RoomInspection.Status.PENDING && status != RoomInspection.Status.IN_PROGRESS) {
            throw new ConflictException("Chỉ gán inspector khi đang chờ hoặc đang kiểm tra");
        }

        UUID employeeId = request.getEmployeeId();
        boolean assigned = employeeAssignmentRepository.existsByEmployeeIdAndPropertyIdAndStatus(
                employeeId, propertyId, EmployeePropertyAssignment.Status.ACTIVE);
        if (!assigned) {
            throw new BusinessException("Nhân viên không thuộc homestay này");
        }

        User employee = employeeAssignmentRepository.findActiveEmployeesByPropertyId(
                        propertyId, EmployeePropertyAssignment.Status.ACTIVE, User.Role.EMPLOYEE)
                .stream()
                .filter(e -> e.getId().equals(employeeId))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Nhân viên không hợp lệ"));

        inspection.setAssignedEmployee(employee);
        inspectionRepository.save(inspection);
    }
}
