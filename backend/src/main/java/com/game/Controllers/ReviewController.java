package com.game.Controllers;

import com.game.Service.ReviewService;
import com.game.Model.Review;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @PostMapping
    public Review createReview(@RequestBody Review review) {
        return reviewService.createReview(review);
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
