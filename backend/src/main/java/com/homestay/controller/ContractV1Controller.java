package com.homestay.controller;

import com.homestay.entity.User;
import com.homestay.service.ContractService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Customer/Manager contract PDF download (SCR-21 drawer).
 * List: GET /api/v1/customers/me/contracts ({@link CustomerContractV1Controller}).
 */
@RestController
@RequestMapping("/api/v1/contracts")
public class ContractV1Controller {

    private final ContractService contractService;

    public ContractV1Controller(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER')")
    public ResponseEntity<byte[]> downloadContractPdf(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        byte[] pdfBytes = contractService.downloadContractPdf(id, currentUser);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"Contract_" + id + ".pdf\"");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
