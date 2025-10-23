package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Dto.RatingDto;
import com.web.Dto.ReviewDTO;
import com.web.Model.ProductVariant;
import com.web.Model.Review;
import com.web.Model.User;
import com.web.Repository.ProductVariantRepository;
import com.web.Repository.ReviewRepository;
import com.web.Repository.UserRepository;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Review> getAllReview() {
        return reviewRepository.findAll();
    }

    public Review createReview(ReviewDTO review) {
        System.out.print("Data: " + review);
        ProductVariant variant = productVariantRepository.findById(review.getVariantId()).orElse(null);
        if (variant == null) {
            return null;
        }
        User user = userRepository.findById(review.getUserId()).orElse(null);
        if (user == null) {
            return null;
        }
        Review newReview = new Review();
        newReview.setProduct(variant.getProduct());
        newReview.setUser(user);
        newReview.setRating(review.getRating());
        newReview.setComment(review.getComment());

        return reviewRepository.save(newReview);
    }

    public boolean deleteReview(Long id, Long productId) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null || !review.getProduct().getId().equals(productId)) {
            return false;
        }
        reviewRepository.deleteById(id);
        return true;
    }

    @Transactional
    public Review updateReview(Long id, Review newReview) {
        Review oldReview = reviewRepository.findById(id).orElse(null);
        if (oldReview == null) return null;
        newReview.setId(oldReview.getId());
        return reviewRepository.save(newReview);
    }

    public RatingDto getReviewStatisticsByProductSlug(String slug) {
        return reviewRepository.getReviewStatisticsByProductSlug(slug);
    }

    public List<Review> getReviewByUserAndProduct(Long userId, Long productId) {
        return reviewRepository.findByUser_IdAndProduct_Id(userId, productId);
    }
}
