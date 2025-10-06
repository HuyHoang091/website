package com.game.Service;

import com.game.Model.ProductImage;
import com.game.Repository.ProductImageRepository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class ProductImageService {
    @Autowired
    private ProductImageRepository productImageRepository;

    @Cacheable(value = "productImages", key = "#productId")
    public List<ProductImage> getProductImagesByProductId(Long productId) {
        return productImageRepository.findByProduct_Id(productId);
    }

    @CacheEvict(value = "productImages", key = "#productImage.product.id")
    public ProductImage createProductImage(ProductImage productImage) {
        return productImageRepository.save(productImage);
    }

    @CacheEvict(value = "productImages", key = "#productId")
    public boolean deleteProductImage(Long id, Long productId) {
        ProductImage productImage = productImageRepository.findById(id).orElse(null);
        if (productImage == null || !productImage.getProduct().getId().equals(productId)) {
            return false;
        }
        productImageRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "productImages", key = "#newProductImage.product.id")
    public ProductImage updateProductImage(Long id, ProductImage newProductImage) {
        ProductImage oldProductImage = productImageRepository.findById(id).orElse(null);
        if (oldProductImage == null) return null;
        newProductImage.setId(oldProductImage.getId());
        return productImageRepository.save(newProductImage);
    }
}
