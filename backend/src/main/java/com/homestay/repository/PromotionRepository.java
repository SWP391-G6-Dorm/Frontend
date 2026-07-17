package com.homestay.repository;

import com.homestay.entity.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, UUID> {

    /** Lấy tất cả banner đang active, sắp xếp theo sortOrder */
    List<Promotion> findByIsActiveTrueOrderBySortOrderAsc();

    /** Lấy tất cả banner (kể cả inactive) để Manager quản lý */
    List<Promotion> findAllByOrderBySortOrderAsc();

    // SCR-57: Admin paged list (sortOrder ASC)
    Page<Promotion> findAllByOrderBySortOrderAsc(Pageable pageable);
}
