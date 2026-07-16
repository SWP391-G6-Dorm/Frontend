package com.homestay.service;

import com.homestay.dto.request.PromotionRequest;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.PromotionResponse;
import com.homestay.entity.Promotion;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * SCR-57/58 - Admin Promotion list/delete + create/update.
 * Does not touch Manager PromotionService / public landing.
 */
@Service
@RequiredArgsConstructor
public class AdminPromotionService {

    private final PromotionRepository promotionRepository;

    @Transactional(readOnly = true)
    public PageResponse<PromotionResponse> listForAdmin(Pageable pageable) {
        Page<Promotion> page = promotionRepository.findAllByOrderBySortOrderAsc(pageable);
        return new PageResponse<>(
                page.getContent().stream().map(PromotionResponse::fromEntity).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    @Transactional
    public PromotionResponse create(PromotionRequest req) {
        Promotion p = new Promotion();
        applyRequest(p, req);
        return PromotionResponse.fromEntity(promotionRepository.save(p));
    }

    @Transactional
    public PromotionResponse update(UUID id, PromotionRequest req) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay promotion"));
        applyRequest(p, req);
        return PromotionResponse.fromEntity(promotionRepository.save(p));
    }

    @Transactional
    public void deleteForAdmin(UUID id) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay promotion"));
        promotionRepository.delete(p);
    }

    private void applyRequest(Promotion p, PromotionRequest req) {
        p.setSubtitle(req.getSubtitle());
        p.setTitle(req.getTitle());
        p.setDescription(req.getDescription());
        p.setCtaText(req.getCtaText());
        p.setCtaUrl(req.getCtaUrl());
        p.setColorTheme(req.getColorTheme());
        p.setActive(req.getIsActive() != null ? req.getIsActive() : true);
        p.setSortOrder(req.getSortOrder());
    }
}