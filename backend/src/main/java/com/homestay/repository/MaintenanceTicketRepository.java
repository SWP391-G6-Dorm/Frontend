package com.homestay.repository;

import com.homestay.entity.MaintenanceTicket;
import com.homestay.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, UUID> {
    List<MaintenanceTicket> findByCustomerOrderByCreatedAtDesc(User customer);
    List<MaintenanceTicket> findAllByOrderByCreatedAtDesc();

    /** SCR-22 — Customer ticket list with DB pagination and optional status filter. */
    @Query(value = """
            SELECT m FROM MaintenanceTicket m
            WHERE m.customer = :customer
              AND (:status IS NULL OR m.status = :status)
            ORDER BY m.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(m) FROM MaintenanceTicket m
            WHERE m.customer = :customer
              AND (:status IS NULL OR m.status = :status)
            """)
    Page<MaintenanceTicket> findByCustomerPaged(
            @Param("customer") User customer,
            @Param("status") MaintenanceTicket.Status status,
            Pageable pageable);

    long countByCustomerIdAndStatusIn(UUID customerId, java.util.Collection<MaintenanceTicket.Status> statuses);

    @Query("""
        SELECT COUNT(m) FROM MaintenanceTicket m
        JOIN m.room r
        WHERE r.property.id = :propertyId
          AND m.status = 'OPEN'
        """)
    long countOpenByPropertyId(@Param("propertyId") UUID propertyId);

    // SCR-41: Danh sách bảo trì Manager — EntityGraph thay JOIN FETCH để pagination đúng trên DB.
    @EntityGraph(attributePaths = {"room", "room.property", "customer", "assignedEmployee"})
    @Query(value = """
            SELECT m FROM MaintenanceTicket m
            WHERE m.room.property.id = :propertyId
              AND (:status IS NULL OR m.status = :status)
              AND (:search IS NULL OR :search = '' OR
                   LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY m.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(m) FROM MaintenanceTicket m
            WHERE m.room.property.id = :propertyId
              AND (:status IS NULL OR m.status = :status)
              AND (:search IS NULL OR :search = '' OR
                   LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<MaintenanceTicket> findForManagerBoard(
            @Param("propertyId") UUID propertyId,
            @Param("status") MaintenanceTicket.Status status,
            @Param("search") String search,
            Pageable pageable);

    /** SCR-41 — Load ticket + room/property/customer/assignee for assign & verify-close. */
    @EntityGraph(attributePaths = {"room", "room.property", "customer", "assignedEmployee"})
    @Query("SELECT m FROM MaintenanceTicket m WHERE m.id = :id")
    Optional<MaintenanceTicket> findByIdWithDetails(@Param("id") UUID id);

    // SCR-59: pending maintenance for employee dashboard KPI
    long countByAssignedEmployeeIdAndStatusIn(
            UUID employeeId,
            java.util.Collection<MaintenanceTicket.Status> statuses);

    // SCR-61: employee maintenance workspace — EntityGraph thay JOIN FETCH để pagination đúng.
    @EntityGraph(attributePaths = {"room", "room.floor"})
    @Query(
            value = """
            SELECT m FROM MaintenanceTicket m
            WHERE m.assignedEmployee.id = :employeeId
              AND (:status IS NULL OR m.status = :status)
            ORDER BY m.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(m) FROM MaintenanceTicket m
            WHERE m.assignedEmployee.id = :employeeId
              AND (:status IS NULL OR m.status = :status)
            """)
    Page<MaintenanceTicket> findForEmployee(
            @Param("employeeId") UUID employeeId,
            @Param("status") MaintenanceTicket.Status status,
            Pageable pageable);

    /** SCR-61 — Load assigned ticket with room for status update. */
    @EntityGraph(attributePaths = {"room", "room.floor"})
    @Query("""
            SELECT m FROM MaintenanceTicket m
            WHERE m.id = :id
              AND m.assignedEmployee.id = :employeeId
            """)
    Optional<MaintenanceTicket> findByIdAndAssignedEmployeeId(
            @Param("id") UUID id,
            @Param("employeeId") UUID employeeId);
}