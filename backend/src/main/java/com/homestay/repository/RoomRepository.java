package com.homestay.repository;

import com.homestay.entity.Room;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID>, JpaSpecificationExecutor<Room> {

    // Tìm phòng theo property
    Page<Room> findByPropertyId(UUID propertyId, Pageable pageable);

    long countByPropertyId(UUID propertyId);

    long countByPropertyIdAndStatus(UUID propertyId, Room.Status status);

    // Tìm phòng theo floor
    List<Room> findByFloorId(UUID floorId);

    // Lọc phòng theo status
    Page<Room> findByStatus(Room.Status status, Pageable pageable);

    // Đếm phòng theo status — dùng cho Dashboard KPI
    long countByStatus(Room.Status status);

    // Tìm phòng available theo property
    Page<Room> findByPropertyIdAndStatus(UUID propertyId, Room.Status status, Pageable pageable);

    // Tìm kiếm phòng theo tên phòng, loại phòng
    Page<Room> findByRoomNumberContainingIgnoreCaseOrRoomTypeContainingIgnoreCase(
            String roomNumber, String roomType, Pageable pageable);

    /** Pessimistic lock — SQL Server race safety on create booking. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") UUID id);

    // Overlap with checkout-day buffer: inventory [checkIn, checkOut] inclusive
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.room.id = :roomId
        AND b.status NOT IN ('CANCELLED', 'CHECKED_OUT', 'NO_SHOW')
        AND b.checkInDate <= :checkOut
        AND b.checkOutDate >= :checkIn
    """)
    boolean existsOverlapBooking(@Param("roomId") UUID roomId,
                                 @Param("checkIn") LocalDate checkIn,
                                 @Param("checkOut") LocalDate checkOut);

    /** True if room still has any inventory-blocking booking. */
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.room.id = :roomId
        AND b.status NOT IN ('CANCELLED', 'CHECKED_OUT', 'NO_SHOW')
    """)
    boolean hasBlockingBookings(@Param("roomId") UUID roomId);

    // Lấy các khoảng ngày đã đặt kèm trạng thái booking (dùng cho SCR-10 calendar)
    @Query("""
        SELECT b.checkInDate, b.checkOutDate, b.status FROM Booking b
        WHERE b.room.id = :roomId
        AND b.status NOT IN ('CANCELLED', 'CHECKED_OUT', 'NO_SHOW')
        AND b.checkOutDate >= CURRENT_DATE
        ORDER BY b.checkInDate
    """)
    List<Object[]> findBookedDateRanges(@Param("roomId") UUID roomId);

    // SCR-09: blocking bookings overlapping a date window (inventory includes checkout day)
    @Query("""
        SELECT b.checkInDate, b.checkOutDate, b.status FROM Booking b
        WHERE b.room.id = :roomId
        AND b.status IN ('PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN', 'PENDING_INSPECTION', 'PENDING_DAMAGE_PAYMENT')
        AND b.checkInDate <= :endDate
        AND b.checkOutDate >= :startDate
        ORDER BY b.checkInDate
    """)
    List<Object[]> findBlockingBookingsInRange(@Param("roomId") UUID roomId,
                                               @Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate);

    // Public listing filter — SCR-07/SCR-09 (keyword: tên/địa chỉ homestay, số phòng, loại phòng)
    @Query("""
        SELECT r FROM Room r
        WHERE (:keyword IS NULL OR
               LOWER(r.roomNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
               LOWER(r.roomType)   LIKE LOWER(CONCAT('%', :keyword, '%')) OR
               LOWER(r.property.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
               LOWER(r.property.address) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:status    IS NULL OR r.status        = :status)
        AND (:propertyId IS NULL OR r.property.id = :propertyId)
        AND (:roomTypes IS NULL OR CONCAT(',', :roomTypes, ',') LIKE CONCAT('%,', r.roomType, ',%'))
        AND (:minPrice IS NULL OR r.pricePerNight >= :minPrice)
        AND (:maxPrice IS NULL OR r.pricePerNight <= :maxPrice)
        AND (:capacity IS NULL OR r.capacity >= :capacity)
        AND (:checkIn IS NULL OR :checkOut IS NULL OR NOT EXISTS (
            SELECT b FROM Booking b
            WHERE b.room = r
            AND b.status NOT IN ('CANCELLED', 'CHECKED_OUT', 'NO_SHOW')
            AND b.checkInDate <= :checkOut
            AND b.checkOutDate >= :checkIn
        ))
    """)
    Page<Room> findPublicWithFilters(
            @Param("keyword")    String keyword,
            @Param("status")     Room.Status status,
            @Param("propertyId") UUID propertyId,
            @Param("roomTypes")  String roomTypes,
            @Param("minPrice")   java.math.BigDecimal minPrice,
            @Param("maxPrice")   java.math.BigDecimal maxPrice,
            @Param("capacity")   Integer capacity,
            @Param("checkIn")    LocalDate checkIn,
            @Param("checkOut")   LocalDate checkOut,
            Pageable pageable
    );

    // SCR-39: Combined filter dành cho Manager — hỗ trợ search + status + propertyId + floorId + roomType
    @Query("""
        SELECT r FROM Room r
        WHERE (:search IS NULL OR
               LOWER(r.roomNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(r.roomType)   LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:status    IS NULL OR r.status        = :status)
        AND (:propertyId IS NULL OR r.property.id = :propertyId)
        AND (:floorId    IS NULL OR r.floor.id    = :floorId)
        AND (:roomType   IS NULL OR LOWER(r.roomType) = LOWER(:roomType))
    """)
    Page<Room> findWithFilters(
            @Param("search")     String search,
            @Param("status")     Room.Status status,
            @Param("propertyId") UUID propertyId,
            @Param("floorId")    UUID floorId,
            @Param("roomType")   String roomType,
            Pageable pageable
    );

    // SCR-29: Manager list scoped to assigned properties
    @Query("""
        SELECT r FROM Room r
        WHERE (:search IS NULL OR
               LOWER(r.roomNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(r.roomType)   LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:status IS NULL OR r.status = :status)
        AND r.property.id IN :propertyIds
        AND (:floorId IS NULL OR r.floor.id = :floorId)
        AND (:roomType IS NULL OR LOWER(r.roomType) = LOWER(:roomType))
        """)
    Page<Room> findWithFiltersInProperties(
            @Param("search")      String search,
            @Param("status")      Room.Status status,
            @Param("propertyIds") List<UUID> propertyIds,
            @Param("floorId")     UUID floorId,
            @Param("roomType")    String roomType,
            Pageable pageable
    );

    // Lấy khoảng giá thực tế từ DB — dùng cho slider bộ lọc
    @Query("SELECT MIN(r.pricePerNight) FROM Room r WHERE r.status = :status")
    java.math.BigDecimal findMinPrice(@Param("status") Room.Status status);

    @Query("SELECT MAX(r.pricePerNight) FROM Room r WHERE r.status = :status")
    java.math.BigDecimal findMaxPrice(@Param("status") Room.Status status);

    // SCR-39: Kiểm tra phòng có booking active không (trước khi xóa)
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.room.id = :roomId
        AND b.status NOT IN ('CANCELLED', 'COMPLETED')
    """)
    boolean hasActiveBookings(@Param("roomId") UUID roomId);
}

