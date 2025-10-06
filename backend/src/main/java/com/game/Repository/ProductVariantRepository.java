package com.game.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.game.Model.ProductVariant;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProduct_Id(Long productId);

    interface VariantAgg {
        String getSizes();
        String getColors();
    }

    @Query(value = "SELECT GROUP_CONCAT(DISTINCT pv.size) AS sizes, GROUP_CONCAT(DISTINCT pv.color) AS colors " +
            "FROM product_variants pv", nativeQuery = true)
    VariantAgg findAllAggregation();
}
