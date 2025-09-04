package com.game.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    
}
