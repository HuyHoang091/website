package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.web.Dto.ReviewDTO;
import com.web.Model.ProductVariant;
import com.web.Model.Review;
import com.web.Repository.ProductVariantRepository;
import com.web.Service.ReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @PostMapping
    public Review createReview(@RequestBody ReviewDTO review) {
        return reviewService.createReview(review);
    }

    @GetMapping("/{userId}/variant/{variantId}")
    public List<Review> getReviewByUserAndProduct(@PathVariable Long userId, @PathVariable Long variantId) {
        ProductVariant productVariant = productVariantRepository.findById(variantId).orElse(null);
        if (productVariant == null) {
            return null;
        }
        return reviewService.getReviewByUserAndProduct(userId, productVariant.getProduct().getId());
    }

    @DeleteMapping("/{id}/{productId}")
    public boolean deleteReview(@PathVariable Long id, @PathVariable Long productId) {
        return reviewService.deleteReview(id, productId);
    }

    @PutMapping("/{id}")
    public Review updateReview(@PathVariable Long id, @RequestBody Review newReview) {
        return reviewService.updateReview(id, newReview);
    }

    @GetMapping("/product/{slug}/statistics")
    public Object getReviewStatisticsByProductSlug(@PathVariable String slug) {
        return reviewService.getReviewStatisticsByProductSlug(slug);
    }
}
