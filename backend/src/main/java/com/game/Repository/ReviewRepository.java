package com.game.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct_Id(Long productId);
}
