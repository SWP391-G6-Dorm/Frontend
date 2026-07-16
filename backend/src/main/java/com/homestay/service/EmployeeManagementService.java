package com.homestay.service;



import com.homestay.dto.request.AssignEmployeeRequest;

import com.homestay.dto.request.CreateEmployeeRequest;

import com.homestay.dto.request.UpdateEmployeeRequest;

import com.homestay.dto.request.UpdateEmployeeStatusRequest;

import com.homestay.dto.response.EmployeeSummaryResponse;

import com.homestay.dto.response.PageResponse;

import com.homestay.entity.EmployeePropertyAssignment;

import com.homestay.entity.Property;

import com.homestay.entity.User;

import com.homestay.exception.BusinessException;

import com.homestay.exception.ConflictException;

import com.homestay.exception.ResourceNotFoundException;

import com.homestay.repository.EmployeePropertyAssignmentRepository;

import com.homestay.repository.PropertyRepository;

import com.homestay.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.Pageable;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.time.LocalDateTime;

import java.util.List;

import java.util.UUID;



/** SCR-39 — Manager employee management. */

@Service

@RequiredArgsConstructor

public class EmployeeManagementService {



    private final EmployeePropertyAssignmentRepository assignmentRepository;

    private final UserRepository userRepository;

    private final PropertyRepository propertyRepository;

    private final ReportPropertyScopeValidator scopeValidator;

    private final PasswordEncoder passwordEncoder;



    @Transactional(readOnly = true)

    public PageResponse<EmployeeSummaryResponse> listByProperty(

            User manager, UUID propertyId, String search, int page, int size) {

        scopeValidator.validateManagerAccess(manager, propertyId);

        Pageable pageable = PageRequest.of(page, size);

        String normalizedSearch = normalizeSearch(search);

        Page<EmployeePropertyAssignment> result = assignmentRepository
                .findByPropertyIdAndStatusWithSearch(
                        propertyId, EmployeePropertyAssignment.Status.ACTIVE, normalizedSearch, pageable);

        List<EmployeeSummaryResponse> content = result.getContent().stream()

                .map(EmployeeSummaryResponse::fromAssignment)

                .toList();

        return new PageResponse<>(content, page, size, result.getTotalElements(), result.getTotalPages());

    }



    @Transactional(readOnly = true)

    public PageResponse<EmployeeSummaryResponse> listUnassigned(

            User manager, UUID propertyId, String search, int page, int size) {

        scopeValidator.validateManagerAccess(manager, propertyId);

        Pageable pageable = PageRequest.of(page, size);

        String normalizedSearch = normalizeSearch(search);

        Page<User> result = assignmentRepository.findUnassignedEmployees(
                normalizedSearch,
                User.Role.EMPLOYEE,
                User.Status.ACTIVE,
                EmployeePropertyAssignment.Status.ACTIVE,
                pageable);

        List<EmployeeSummaryResponse> content = result.getContent().stream()

                .map(EmployeeSummaryResponse::fromUser)

                .toList();

        return new PageResponse<>(content, page, size, result.getTotalElements(), result.getTotalPages());

    }



    @Transactional

    public EmployeeSummaryResponse assignEmployee(User manager, AssignEmployeeRequest request) {

        UUID propertyId = request.getPropertyId();

        UUID employeeId = request.getEmployeeId();

        scopeValidator.validateManagerAccess(manager, propertyId);



        Property property = propertyRepository.findById(propertyId)

                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy homestay"));

        if (property.getStatus() != Property.Status.ACTIVE) {

            throw new BusinessException("Homestay không ở trạng thái hoạt động");

        }



        User employee = userRepository.findById(employeeId)

                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        if (employee.getRole() != User.Role.EMPLOYEE) {

            throw new BusinessException("Người dùng không phải nhân viên");

        }

        if (employee.getStatus() != User.Status.ACTIVE) {

            throw new BusinessException("Chỉ có thể gán nhân viên đang hoạt động");

        }



        if (assignmentRepository.existsByEmployeeIdAndPropertyIdAndStatus(

                employeeId, propertyId, EmployeePropertyAssignment.Status.ACTIVE)) {

            throw new ConflictException("Nhân viên đã được gán homestay này");

        }



        assignmentRepository.findFirstByEmployee_IdAndStatus(
                employeeId, EmployeePropertyAssignment.Status.ACTIVE).ifPresent(existing -> {

            if (!existing.getProperty().getId().equals(propertyId)) {

                throw new ConflictException("Nhân viên đã được gán homestay khác");

            }

        });



        EmployeePropertyAssignment epa = new EmployeePropertyAssignment();

        epa.setEmployee(employee);

        epa.setProperty(property);

        epa.setAssignedBy(manager);

        epa.setAssignedAt(LocalDateTime.now());

        epa.setStatus(EmployeePropertyAssignment.Status.ACTIVE);

        assignmentRepository.save(epa);



        return EmployeeSummaryResponse.fromAssignment(epa);

    }



    @Transactional

    public EmployeeSummaryResponse createEmployee(User manager, CreateEmployeeRequest request) {

        UUID propertyId = request.getPropertyId();

        scopeValidator.validateManagerAccess(manager, propertyId);



        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {

            throw new ConflictException("Email đã được sử dụng");

        }



        String fullName = request.getFullName().trim();

        if (fullName.length() < 2) {

            throw new BusinessException("Họ tên phải có ít nhất 2 ký tự");

        }



        Property property = propertyRepository.findById(propertyId)

                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy homestay"));

        if (property.getStatus() != Property.Status.ACTIVE) {

            throw new BusinessException("Homestay không ở trạng thái hoạt động");

        }



        User employee = new User();

        employee.setFullName(fullName);

        employee.setEmail(email);

        employee.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);

        employee.setRole(User.Role.EMPLOYEE);

        employee.setStatus(User.Status.ACTIVE);

        // SCR-39: no invite email flow — random password, employee resets via FR-02 later

        employee.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));

        userRepository.save(employee);



        EmployeePropertyAssignment epa = new EmployeePropertyAssignment();

        epa.setEmployee(employee);

        epa.setProperty(property);

        epa.setAssignedBy(manager);

        epa.setAssignedAt(LocalDateTime.now());

        epa.setStatus(EmployeePropertyAssignment.Status.ACTIVE);

        assignmentRepository.save(epa);



        return EmployeeSummaryResponse.fromAssignment(epa);

    }



    @Transactional

    public EmployeeSummaryResponse updateEmployee(

            User manager, UUID employeeId, UUID propertyId, UpdateEmployeeRequest request) {

        EmployeePropertyAssignment epa = requireManagedActiveAssignment(manager, employeeId, propertyId);

        User employee = epa.getEmployee();

        String fullName = request.getFullName().trim();

        if (fullName.length() < 2) {

            throw new BusinessException("Họ tên phải có ít nhất 2 ký tự");

        }



        employee.setFullName(fullName);

        employee.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);

        userRepository.save(employee);



        return EmployeeSummaryResponse.fromAssignment(epa);

    }



    @Transactional

    public EmployeeSummaryResponse updateEmployeeStatus(

            User manager, UUID employeeId, UUID propertyId, UpdateEmployeeStatusRequest request) {

        if (request.getStatus() != User.Status.ACTIVE && request.getStatus() != User.Status.SUSPENDED) {

            throw new BusinessException("Chỉ hỗ trợ chuyển trạng thái Đang hoạt động hoặc Tạm khóa");

        }



        EmployeePropertyAssignment epa = requireManagedActiveAssignment(manager, employeeId, propertyId);

        User employee = epa.getEmployee();



        if (employee.getStatus() == request.getStatus()) {

            return EmployeeSummaryResponse.fromAssignment(epa);

        }



        employee.setStatus(request.getStatus());

        userRepository.save(employee);



        return EmployeeSummaryResponse.fromAssignment(epa);

    }



    private EmployeePropertyAssignment requireManagedActiveAssignment(

            User manager, UUID employeeId, UUID propertyId) {

        scopeValidator.validateManagerAccess(manager, propertyId);

        return assignmentRepository.findByEmployee_IdAndProperty_IdAndStatus(

                employeeId, propertyId, EmployeePropertyAssignment.Status.ACTIVE)

                .orElseThrow(() -> new ResourceNotFoundException(

                        "Nhân viên chưa được gán homestay này hoặc không tồn tại"));

    }



    private static String normalizeSearch(String search) {

        if (search == null || search.isBlank()) {

            return null;

        }

        return search.trim();

    }

}

