package com.homestay.repository.spec;

import com.homestay.entity.Booking;
import com.homestay.entity.Room;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class RoomSpecifications {

    private RoomSpecifications() {}

    public static Specification<Room> withFilters(
            String search,
            String location,
            UUID propertyId,
            UUID floorId,
            List<String> roomTypes,
            Long minPrice,
            Long maxPrice,
            Integer capacity,
            Room.Status status,
            LocalDate checkIn,
            LocalDate checkOut
    ) {
        return (root, query, cb) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            Join<Object, Object> property = root.join("property", JoinType.INNER);

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (propertyId != null) {
                predicates.add(cb.equal(property.get("id"), propertyId));
            }
            if (floorId != null) {
                predicates.add(cb.equal(root.get("floor").get("id"), floorId));
            }
            if (roomTypes != null && !roomTypes.isEmpty()) {
                predicates.add(root.get("roomType").in(roomTypes));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerNight"), BigDecimal.valueOf(minPrice)));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerNight"), BigDecimal.valueOf(maxPrice)));
            }
            if (capacity != null && capacity > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), capacity));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("roomNumber")), pattern),
                        cb.like(cb.lower(root.get("roomType")), pattern),
                        cb.like(cb.lower(property.get("name")), pattern)
                ));
            }
            if (location != null && !location.isBlank()) {
                String pattern = "%" + location.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(property.get("name")), pattern),
                        cb.like(cb.lower(property.get("address")), pattern)
                ));
            }
            if (checkIn != null && checkOut != null && checkOut.isAfter(checkIn)) {
                predicates.add(isAvailableBetween(root, query, cb, checkIn, checkOut));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate isAvailableBetween(
            Root<Room> root,
            jakarta.persistence.criteria.CriteriaQuery<?> query,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            LocalDate checkIn,
            LocalDate checkOut
    ) {
        Subquery<Long> sub = query.subquery(Long.class);
        Root<Booking> booking = sub.from(Booking.class);
        sub.select(cb.literal(1L));
        sub.where(
                cb.equal(booking.get("room"), root),
                cb.notEqual(booking.get("status"), Booking.Status.CANCELLED),
                cb.lessThan(booking.get("checkInDate"), checkOut),
                cb.greaterThan(booking.get("checkOutDate"), checkIn)
        );
        return cb.not(cb.exists(sub));
    }
}
