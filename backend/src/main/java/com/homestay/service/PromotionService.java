package com.homestay.service;

import com.homestay.dto.request.PromotionRequest;
import com.homestay.dto.response.PromotionResponse;
import com.homestay.entity.Promotion;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.PromotionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PromotionService {

    private final PromotionRepository promotionRepository;

    public PromotionService(PromotionRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    /** Public: chỉ lấy banner đang active */
    @Transactional(readOnly = true)
    public List<PromotionResponse> getActivePromotions() {
        return promotionRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream().map(PromotionResponse::fromEntity).collect(Collectors.toList());
    }

    /** Manager: lấy tất cả kể cả inactive */
    @Transactional(readOnly = true)
    public List<PromotionResponse> getAllPromotions() {
        return promotionRepository.findAllByOrderBySortOrderAsc()
                .stream().map(PromotionResponse::fromEntity).collect(Collectors.toList());
    }

    /** Manager: tạo mới */
    @Transactional
    public PromotionResponse create(PromotionRequest req) {
        Promotion p = new Promotion();
        applyRequest(p, req);
        return PromotionResponse.fromEntity(promotionRepository.save(p));
    }

    /** Manager: cập nhật */
    @Transactional
    public PromotionResponse update(UUID id, PromotionRequest req) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner không tồn tại"));
        applyRequest(p, req);
        return PromotionResponse.fromEntity(promotionRepository.save(p));
    }

    /** Manager: xóa */
    @Transactional
    public void delete(UUID id) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner không tồn tại"));
        promotionRepository.delete(p);
    }

    private void applyRequest(Promotion p, PromotionRequest req) {
        p.setSubtitle(req.getSubtitle());
        p.setTitle(req.getTitle());
        p.setDescription(req.getDescription());
        p.setCtaText(req.getCtaText());
        p.setCtaUrl(req.getCtaUrl());
        p.setImageUrl(req.getImageUrl());
        p.setColorTheme(req.getColorTheme());
        p.setActive(req.getIsActive() != null ? req.getIsActive() : true);
        p.setSortOrder(req.getSortOrder());
    }
}
