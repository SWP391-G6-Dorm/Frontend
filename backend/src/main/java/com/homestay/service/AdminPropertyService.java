package com.homestay.service;

import com.homestay.dto.request.AdminCreatePropertyRequest;
import com.homestay.dto.request.AdminUpdatePropertyRequest;
import com.homestay.dto.response.AdminPropertyResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.ManagerPropertyAssignment;
import com.homestay.entity.Property;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.ManagerPropertyAssignmentRepository;
import com.homestay.repository.PropertyRepository;
import com.homestay.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SCR-46 — Property Management (Admin list). Chỉ đọc.
 * Tái dùng PropertyRepository; gộp 1 query lấy manager ACTIVE để tránh N+1.
 */
@Service
@RequiredArgsConstructor
public class AdminPropertyService {

    private final PropertyRepository propertyRepository;
    private final ManagerPropertyAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminPropertyResponse> listProperties(String status, Pageable pageable) {
        Property.Status statusFilter = parseStatus(status);

        Page<Property> page = (statusFilter != null)
                ? propertyRepository.findByStatus(statusFilter, pageable)
                : propertyRepository.findAll(pageable);

        List<Property> properties = page.getContent();

        // Gom manager ACTIVE cho cả trang trong 1 query
        Map<UUID, User> managerByPropertyId = Map.of();
        if (!properties.isEmpty()) {
            List<UUID> propertyIds = properties.stream().map(Property::getId).toList();
            managerByPropertyId = assignmentRepository
                    .findActiveByPropertyIds(propertyIds, ManagerPropertyAssignment.Status.ACTIVE)
                    .stream()
                    .collect(Collectors.toMap(
                            mpa -> mpa.getProperty().getId(),
                            ManagerPropertyAssignment::getManager,
                            (existing, ignored) -> existing));
        }

        final Map<UUID, User> managers = managerByPropertyId;
        List<AdminPropertyResponse> content = properties.stream()
                .map(p -> AdminPropertyResponse.fromEntity(p, managers.get(p.getId())))
                .toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    @Transactional
    public AdminPropertyResponse createProperty(AdminCreatePropertyRequest req) {
        Property property = new Property();
        property.setName(req.getName().trim());
        property.setAddress(req.getLocation().trim());
        property.setStatus(Property.Status.ACTIVE);
        property.setDescription(null);

        Property saved = propertyRepository.save(property);
        return AdminPropertyResponse.fromEntity(saved, null);
    }

    @Transactional
    public AdminPropertyResponse updateProperty(UUID id, AdminUpdatePropertyRequest req) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy property với ID: " + id));

        if (req.getName() != null && !req.getName().isBlank()) {
            property.setName(req.getName().trim());
        }
        if (req.getStatus() != null) {
            Property.Status status = parseStatus(req.getStatus());
            if (status != null) {
                property.setStatus(status);
            }
        }

        Property saved = propertyRepository.save(property);

        User manager = assignmentRepository
                .findActiveByPropertyIds(List.of(saved.getId()), ManagerPropertyAssignment.Status.ACTIVE)
                .stream()
                .findFirst()
                .map(ManagerPropertyAssignment::getManager)
                .orElse(null);

        return AdminPropertyResponse.fromEntity(saved, manager);
    }

    @Transactional
    public AdminPropertyResponse assignManager(UUID propertyId, UUID managerId, User currentUser) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy property với ID: " + propertyId));

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + managerId));

        if (manager.getRole() != User.Role.MANAGER) {
            throw new BusinessException("User được chọn không phải MANAGER");
        }

        // Một property chỉ 1 manager ACTIVE: vô hiệu hóa các assignment ACTIVE hiện tại
        List<ManagerPropertyAssignment> currentActive = assignmentRepository
                .findActiveByPropertyIds(List.of(propertyId), ManagerPropertyAssignment.Status.ACTIVE);
        if (!currentActive.isEmpty()) {
            currentActive.forEach(mpa -> mpa.setStatus(ManagerPropertyAssignment.Status.INACTIVE));
            assignmentRepository.saveAll(currentActive);
        }

        ManagerPropertyAssignment assignment = new ManagerPropertyAssignment();
        assignment.setManager(manager);
        assignment.setProperty(property);
        assignment.setAssignedBy(currentUser);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setStatus(ManagerPropertyAssignment.Status.ACTIVE);
        assignmentRepository.save(assignment);

        return AdminPropertyResponse.fromEntity(property, manager);
    }

    /** Parse status; null hoặc không hợp lệ → không lọc. */
    private Property.Status parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return Property.Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
