package com.web.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.Discount;

public interface DiscountRepository extends JpaRepository<Discount, Long> {
    
}
