package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.ProductVariant;
import com.web.Repository.ProductVariantRepository;

@Service
public class ProductVariantService {
    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Cacheable(value = "productVariants", key = "#productId")
    public List<ProductVariant> getProductVariantsByProductId(Long productId) {
        return productVariantRepository.findByProductId(productId);
    }

    @CacheEvict(value = "productVariants", key = "#productVariant.product.id")
    public ProductVariant createProductVariant(ProductVariant productVariant) {
        return productVariantRepository.save(productVariant);
    }

    @CacheEvict(value = "productVariants", key = "#productId")
    public boolean deleteProductVariant(Long id, Long productId) {
        ProductVariant productVariant = productVariantRepository.findById(id).orElse(null);
        if (productVariant == null || !productVariant.getProduct().getId().equals(productId)) {
            return false;
        }
        productVariantRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "productVariants", key = "#newProductVariant.product.id")
    public ProductVariant updateProductVariant(Long id, ProductVariant newProductVariant) {
        ProductVariant oldProductVariant = productVariantRepository.findById(id).orElse(null);
        if (oldProductVariant == null) return null;
        newProductVariant.setId(oldProductVariant.getId());
        return productVariantRepository.save(newProductVariant);
    }
}
