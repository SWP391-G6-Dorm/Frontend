package com.homestay.repository;

import com.homestay.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.status = 'PUBLISHED'")
    Double averagePublishedRating();

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.room.id = :roomId AND r.status = 'PUBLISHED'")
    Double averageRatingByRoomId(@Param("roomId") UUID roomId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.room.id = :roomId AND r.status = 'PUBLISHED'")
    long countPublishedByRoomId(@Param("roomId") UUID roomId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.status = 'PUBLISHED'")
    long countPublished();

    @EntityGraph(attributePaths = {"customer"})
    Page<Review> findByRoom_IdAndStatusOrderByCreatedAtDesc(UUID roomId, Review.Status status, Pageable pageable);

    boolean existsByBooking_Id(UUID bookingId);

    @EntityGraph(attributePaths = {"booking", "room", "room.property", "room.roomImages"})
    Page<Review> findByCustomer_IdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);

    /** SCR-24/25 — Load own review with room/booking for detail, update, delete. */
    @EntityGraph(attributePaths = {"booking", "room", "room.property", "room.roomImages", "customer"})
    java.util.Optional<Review> findByIdAndCustomer_Id(UUID id, UUID customerId);
}

