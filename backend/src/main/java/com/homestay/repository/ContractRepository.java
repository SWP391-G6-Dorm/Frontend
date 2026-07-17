package com.homestay.repository;

import com.homestay.entity.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {

    // Manager: lấy tất cả, filter theo status + search
    @Query("SELECT c FROM Contract c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR (" +
           "LOWER(c.customer.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.room.roomNumber) LIKE LOWER(CONCAT('%', :search, '%'))))")
    Page<Contract> findAllWithFilters(@Param("status") Contract.Status status, @Param("search") String search, Pageable pageable);

    // Customer: chỉ lấy contract của mình, filter theo status + search (tên phòng / cơ sở)
    @Query("SELECT c FROM Contract c WHERE c.customer.id = :customerId " +
           "AND (:status IS NULL OR c.status = :status) " +
           "AND (:search IS NULL OR (" +
           "LOWER(c.room.roomNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.room.property.name) LIKE LOWER(CONCAT('%', :search, '%'))))")
    Page<Contract> findByCustomerWithFilters(
            @Param("customerId") UUID customerId,
            @Param("status") Contract.Status status,
            @Param("search") String search,
            Pageable pageable);


    java.util.Optional<Contract> findByBookingId(UUID bookingId);
}

