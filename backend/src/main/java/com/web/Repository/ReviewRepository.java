package com.web.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.web.Dto.RatingDto;
import com.web.Model.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findTop3ByProduct_SlugOrderByCreatedAtDesc(String slug);
    List<Review> findByProduct_Slug(String slug);
    @Query("SELECT " +
           "AVG(r.rating) as avgRating, " +
           "SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as rating5, " +
           "SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as rating4, " +
           "SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as rating3, " +
           "SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as rating2, " +
           "SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as rating1 " +
           "FROM Review r WHERE r.product.slug = :slug")
    RatingDto getReviewStatisticsByProductSlug(@Param("slug") String slug);
}