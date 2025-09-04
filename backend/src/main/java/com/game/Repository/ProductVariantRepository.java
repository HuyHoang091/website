package com.game.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.ProductVariant;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProduct_Id(Long productId);
}
