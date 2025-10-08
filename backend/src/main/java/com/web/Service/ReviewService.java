package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Dto.RatingDto;
import com.web.Model.Review;
import com.web.Repository.ReviewRepository;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;

    @Cacheable(value = "reviews", key = "#productId")
    public List<Review> getAllReview() {
        return reviewRepository.findAll();
    }

    @CacheEvict(value = "reviews", key = "#review.product.id")
    public Review createReview(Review review) {
        return reviewRepository.save(review);
    }

    @CacheEvict(value = "reviews", key = "#productId")
    public boolean deleteReview(Long id, Long productId) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null || !review.getProduct().getId().equals(productId)) {
            return false;
        }
        reviewRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "reviews", key = "#newReview.product.id")
    public Review updateReview(Long id, Review newReview) {
        Review oldReview = reviewRepository.findById(id).orElse(null);
        if (oldReview == null) return null;
        newReview.setId(oldReview.getId());
        return reviewRepository.save(newReview);
    }

    public RatingDto getReviewStatisticsByProductSlug(String slug) {
        return reviewRepository.getReviewStatisticsByProductSlug(slug);
    }

    
}
