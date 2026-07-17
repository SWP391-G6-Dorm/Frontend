package com.homestay.repository;

import com.homestay.entity.RoomInspection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomInspectionRepository extends JpaRepository<RoomInspection, UUID> {

    Optional<RoomInspection> findByBookingId(UUID bookingId);

    @Query(
            value = """
            SELECT ri FROM RoomInspection ri
            JOIN FETCH ri.room r
            JOIN FETCH ri.property p
            JOIN FETCH ri.booking b
            LEFT JOIN FETCH ri.assignedEmployee ae
            LEFT JOIN FETCH ri.inspectedBy ib
            WHERE p.id = :propertyId
              AND (:status IS NULL OR ri.status = :status)
              AND (:unassignedOnly = false OR ri.assignedEmployee IS NULL)
              AND (:search IS NULL OR :search = '' OR
                   LOWER(r.roomNumber) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY ri.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(ri) FROM RoomInspection ri
            WHERE ri.property.id = :propertyId
              AND (:status IS NULL OR ri.status = :status)
              AND (:unassignedOnly = false OR ri.assignedEmployee IS NULL)
              AND (:search IS NULL OR :search = '' OR
                   LOWER(ri.room.roomNumber) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<RoomInspection> findForManagerBoard(
            @Param("propertyId") UUID propertyId,
            @Param("status") RoomInspection.Status status,
            @Param("unassignedOnly") boolean unassignedOnly,
            @Param("search") String search,
            Pageable pageable);

    @Query("""
            SELECT ri FROM RoomInspection ri
            JOIN FETCH ri.room r
            JOIN FETCH ri.property p
            JOIN FETCH ri.booking b
            LEFT JOIN FETCH ri.assignedEmployee ae
            LEFT JOIN FETCH ri.inspectedBy ib
            WHERE ri.id = :id
            """)
    Optional<RoomInspection> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
            SELECT COUNT(ri) FROM RoomInspection ri
            WHERE ri.status IN :statuses
              AND ri.property.id IN :propertyIds
            """)
    long countPendingForProperties(
            @Param("statuses") Collection<RoomInspection.Status> statuses,
            @Param("propertyIds") Collection<UUID> propertyIds);

    @Query(
            value = """
            SELECT ri FROM RoomInspection ri
            JOIN FETCH ri.room r
            JOIN FETCH ri.booking b
            LEFT JOIN FETCH ri.assignedEmployee ae
            WHERE ri.property.id IN :propertyIds
              AND ri.status IN :statuses
            ORDER BY ri.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(ri) FROM RoomInspection ri
            WHERE ri.property.id IN :propertyIds
              AND ri.status IN :statuses
            """)
    Page<RoomInspection> findForEmployee(
            @Param("propertyIds") Collection<UUID> propertyIds,
            @Param("statuses") Collection<RoomInspection.Status> statuses,
            Pageable pageable);

    @Query("""
            SELECT ri FROM RoomInspection ri
            JOIN FETCH ri.room r
            JOIN FETCH ri.booking b
            LEFT JOIN FETCH ri.assignedEmployee ae
            WHERE ri.id = :id
              AND ri.property.id IN :propertyIds
            """)
    Optional<RoomInspection> findByIdAndPropertyIdIn(
            @Param("id") UUID id,
            @Param("propertyIds") Collection<UUID> propertyIds);

    @Query("""
            SELECT ri FROM RoomInspection ri
            JOIN FETCH ri.booking b
            JOIN FETCH ri.property p
            JOIN FETCH ri.room r
            WHERE ri.room.id = :roomId
              AND ri.inspectedBy.id = :employeeId
              AND ri.status = :status
            ORDER BY ri.inspectedAt DESC
            """)
    List<RoomInspection> findFailedForEmployeeAndRoom(
            @Param("roomId") UUID roomId,
            @Param("employeeId") UUID employeeId,
            @Param("status") RoomInspection.Status status,
            Pageable pageable);

    @Query("""
            SELECT ri FROM RoomInspection ri
            JOIN FETCH ri.room r
            JOIN FETCH ri.booking b
            WHERE ri.inspectedBy.id = :employeeId
              AND ri.status = :status
              AND NOT EXISTS (
                  SELECT 1 FROM DamageReport dr WHERE dr.inspection.id = ri.id
              )
            ORDER BY ri.inspectedAt DESC
            """)
    List<RoomInspection> findEligibleForDamageReport(
            @Param("employeeId") UUID employeeId,
            @Param("status") RoomInspection.Status status);

    @Query("""
            SELECT ri FROM RoomInspection ri
            JOIN FETCH ri.booking b
            JOIN FETCH ri.property p
            JOIN FETCH ri.room r
            WHERE ri.id = :id
              AND ri.inspectedBy.id = :employeeId
              AND ri.status = :status
            """)
    Optional<RoomInspection> findFailedByIdForEmployee(
            @Param("id") UUID id,
            @Param("employeeId") UUID employeeId,
            @Param("status") RoomInspection.Status status);
}
