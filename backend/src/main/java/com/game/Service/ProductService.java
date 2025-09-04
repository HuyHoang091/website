package com.game.Service;

import com.game.Model.Product;
import com.game.Repository.ProductRepository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    @Cacheable(value = "products")
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Cacheable(value = "product", key = "#id")
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    @CacheEvict(value = "products", allEntries = true)
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @CacheEvict(value = { "products", "product" }, allEntries = true)
    public boolean deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            return false;
        }
        productRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = { "products", "product" }, allEntries = true)
    public Product updateProduct(Long id, Product newProduct) {
        Product oldProduct = productRepository.findById(id).orElse(null);
        if (oldProduct == null) return null;
        newProduct.setId(oldProduct.getId());
        return productRepository.save(newProduct);
    }
}
