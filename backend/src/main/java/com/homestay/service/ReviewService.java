package com.homestay.service;

import com.homestay.dto.request.CreateReviewRequest;
import com.homestay.dto.request.UpdateReviewRequest;
import com.homestay.dto.response.MyReviewResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.Booking;
import com.homestay.entity.Review;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ForbiddenException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public MyReviewResponse submitReview(CreateReviewRequest request, User currentUser) {
        Booking booking = bookingRepository.findByIdWithRoomAndCustomer(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Đặt phòng không tồn tại"));

        if (!booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Bạn không thể đánh giá đơn đặt phòng của người khác");
        }

        if (booking.getStatus() != Booking.Status.CHECKED_OUT) {
            throw new BusinessException("Chỉ được đánh giá sau khi hoàn tất lưu trú (Đã trả phòng)");
        }

        if (reviewRepository.existsByBooking_Id(request.getBookingId())) {
            throw new BusinessException("Đơn đặt phòng này đã được đánh giá");
        }

        String comment = request.getComment().trim();
        if (comment.length() < 20 || comment.length() > 200) {
            throw new BusinessException("Bình luận phải từ 20 đến 200 ký tự");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setCustomer(currentUser);
        review.setRoom(booking.getRoom());
        review.setRating(request.getRating());
        review.setComment(comment);
        review.setStatus(Review.Status.PUBLISHED);

        Review saved = reviewRepository.save(review);

        // Re-fetch with EntityGraph so MyReviewResponse can safely read room/property/images
        return reviewRepository.findByIdAndCustomer_Id(saved.getId(), currentUser.getId())
                .map(MyReviewResponse::fromEntity)
                .orElseGet(() -> MyReviewResponse.fromEntity(saved));
    }

    @Transactional(readOnly = true)
    public PageResponse<MyReviewResponse> getMyReviews(User currentUser, Pageable pageable) {
        Page<Review> result = reviewRepository.findByCustomer_IdOrderByCreatedAtDesc(currentUser.getId(), pageable);
        return new PageResponse<>(
                result.getContent().stream().map(MyReviewResponse::fromEntity).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public MyReviewResponse getReviewByIdForCustomer(UUID id, User currentUser) {
        Review review = reviewRepository.findByIdAndCustomer_Id(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));
        return MyReviewResponse.fromEntity(review);
    }

    @Transactional
    public MyReviewResponse updateReview(UUID id, UpdateReviewRequest request, User currentUser) {
        Review review = reviewRepository.findByIdAndCustomer_Id(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        String comment = request.getComment().trim();
        if (comment.length() < 20 || comment.length() > 200) {
            throw new BusinessException("Bình luận phải từ 20 đến 200 ký tự");
        }

        review.setRating(request.getRating());
        review.setComment(comment);

        Review saved = reviewRepository.save(review);
        return reviewRepository.findByIdAndCustomer_Id(saved.getId(), currentUser.getId())
                .map(MyReviewResponse::fromEntity)
                .orElseGet(() -> MyReviewResponse.fromEntity(saved));
    }

    @Transactional
    public void deleteReview(UUID id, User currentUser) {
        Review review = reviewRepository.findByIdAndCustomer_Id(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        reviewRepository.delete(review);
    }
}
