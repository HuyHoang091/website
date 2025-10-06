package com.game.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.Discount;

public interface DiscountRepository extends JpaRepository<Discount, Long> {
    
}
