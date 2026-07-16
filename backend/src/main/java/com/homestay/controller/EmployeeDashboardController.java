package com.homestay.controller;

import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.EmployeeKpisResponse;
import com.homestay.entity.User;
import com.homestay.service.EmployeeDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** SCR-59 - Employee Dashboard. Resource /api/v1/employee. */
@RestController
@RequestMapping("/api/v1/employee")
@PreAuthorize("hasRole('EMPLOYEE')")
@RequiredArgsConstructor
public class EmployeeDashboardController {

    private final EmployeeDashboardService employeeDashboardService;

    @GetMapping("/kpis")
    public ResponseEntity<ApiResponse<EmployeeKpisResponse>> getKpis(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(employeeDashboardService.getKpis(currentUser)));
    }
}