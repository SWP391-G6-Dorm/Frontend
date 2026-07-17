package com.homestay.controller;

import com.homestay.dto.request.EmployeeInspectionResultRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.EmployeeInspectionResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.User;
import com.homestay.service.EmployeeInspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** SCR-62 - Employee Room Inspection Hub. Resource /api/v1/employees/inspections. */
@RestController
@RequestMapping("/api/v1/employees/inspections")
@PreAuthorize("hasRole('EMPLOYEE')")
@RequiredArgsConstructor
public class EmployeeInspectionController {

    private final EmployeeInspectionService employeeInspectionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<EmployeeInspectionResponse>>> list(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        PageResponse<EmployeeInspectionResponse> data =
                employeeInspectionService.list(currentUser, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/{id}/pass")
    public ResponseEntity<ApiResponse<EmployeeInspectionResponse>> pass(
            @AuthenticationPrincipal User currentUser,
            @PathVariable UUID id,
            @RequestBody(required = false) EmployeeInspectionResultRequest request) {
        EmployeeInspectionResponse data = employeeInspectionService.pass(currentUser, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Inspection passed", data));
    }

    @PostMapping("/{id}/fail")
    public ResponseEntity<ApiResponse<EmployeeInspectionResponse>> fail(
            @AuthenticationPrincipal User currentUser,
            @PathVariable UUID id,
            @RequestBody(required = false) EmployeeInspectionResultRequest request) {
        EmployeeInspectionResponse data = employeeInspectionService.fail(currentUser, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Inspection failed", data));
    }
}