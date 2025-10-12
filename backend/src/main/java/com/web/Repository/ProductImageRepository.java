package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.web.Model.ProductImage;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProduct_Id(Long productId);

    void deleteByProductId(Long productId);

    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId AND pi.productVariant IS NULL")
    void deleteByProductIdAndVariantIdNull(@Param("productId") Long productId);

    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.productVariant.id = :variantId")
    void deleteByVariantId(@Param("variantId") Long variantId);

    // Thêm các phương thức fallback để đảm bảo có thể sử dụng khi các phương thức
    // @Query không hoạt động
    List<ProductImage> findByProduct_IdAndProductVariantIsNull(Long productId);

    List<ProductImage> findByProductVariant_Id(Long variantId);
}
