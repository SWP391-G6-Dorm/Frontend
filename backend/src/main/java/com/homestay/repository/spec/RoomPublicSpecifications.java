package com.homestay.repository.spec;

import com.homestay.entity.Booking;
import com.homestay.entity.Room;
import com.homestay.util.SearchKeywordExpander;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public final class RoomPublicSpecifications {

    private RoomPublicSpecifications() {}

    public static Specification<Room> withFilters(
            String keyword,
            Room.Status status,
            UUID propertyId,
            String roomTypesCsv,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer capacity,
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
            if (roomTypesCsv != null && !roomTypesCsv.isBlank()) {
                List<String> types = Arrays.stream(roomTypesCsv.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                if (!types.isEmpty()) {
                    predicates.add(root.get("roomType").in(types));
                }
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerNight"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerNight"), maxPrice));
            }
            if (capacity != null && capacity > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), capacity));
            }

            if (keyword != null && !keyword.isBlank()) {
                List<String> terms = SearchKeywordExpander.expand(keyword);
                List<Predicate> termMatches = new ArrayList<>();
                for (String term : terms) {
                    String pattern = "%" + term.toLowerCase(Locale.ROOT) + "%";
                    termMatches.add(cb.or(
                            cb.like(cb.lower(root.get("roomNumber")), pattern),
                            cb.like(cb.lower(root.get("roomType")), pattern),
                            cb.like(cb.lower(property.get("name")), pattern),
                            cb.like(cb.lower(property.get("address")), pattern)
                    ));
                }
                predicates.add(cb.or(termMatches.toArray(new Predicate[0])));
            }

            if (checkIn != null && checkOut != null && checkOut.isAfter(checkIn)) {
                // Date search: exclude ops-blocked rooms; availability = no overlapping booking
                predicates.add(cb.not(root.get("status").in(
                        Room.Status.MAINTENANCE,
                        Room.Status.OUT_OF_SERVICE,
                        Room.Status.PENDING_CLEANING,
                        Room.Status.CLEANING_IN_PROGRESS
                )));
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
                cb.not(booking.get("status").in(
                        Booking.Status.CANCELLED,
                        Booking.Status.CHECKED_OUT,
                        Booking.Status.NO_SHOW
                )),
                cb.lessThanOrEqualTo(booking.get("checkInDate"), checkOut),
                cb.greaterThanOrEqualTo(booking.get("checkOutDate"), checkIn)
        );
        return cb.not(cb.exists(sub));
    }
}
