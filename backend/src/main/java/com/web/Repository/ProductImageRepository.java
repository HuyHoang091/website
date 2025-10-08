package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.ProductImage;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProduct_Id(Long productId);
}
