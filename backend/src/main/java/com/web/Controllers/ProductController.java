package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.web.Dto.ProductDetailResponse;
import com.web.Dto.ProductListDTO;
import com.web.Dto.ProductRequestDto;
import com.web.Dto.ProductResponse;
import com.web.Dto.ReviewResponse;
import com.web.Dto.VariantResponse;
import com.web.Model.Product;
import com.web.Service.ProductService;

import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping("/info")
    public List<ProductResponse> getAllProductInfo() {
        return productService.getProductInfoList();
    }

    @GetMapping("/variants/aggregation")
    public VariantResponse getAllVariantsAggregation() {
        return productService.getAllVariantsAggregation();
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ProductDetailResponse> getBySlug(@PathVariable("slug") String slug) {
        ProductDetailResponse resp = productService.getProductBySlug(slug);
        if (resp == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/slug/{slug}/reviews")
    public List<ReviewResponse> getReviewsBySlug(@PathVariable String slug) {
        return productService.getReviewsBySlug(slug);
    }

    @GetMapping("/slug/{slug}/reviews/all")
    public List<ReviewResponse> getAllReviewsBySlug(@PathVariable String slug) {
        return productService.getAllReviewsBySlug(slug);
    }

    @GetMapping("/all")
    public List<ProductListDTO> getAllProducts() {
        return productService.getAllProducts();
    }

    @PostMapping("/create")
    public Product create(@RequestBody ProductRequestDto req) {
        return productService.addProduct(req);
    }

    @PutMapping("/update/{id}")
    public Product update(@PathVariable Long id, @RequestBody ProductRequestDto req) {
        return productService.updateProductFromRequest(id, req);
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<Map<String, Object>>> getInventory() {
        List<Map<String, Object>> inventoryData = productService.getInventoryData();
        return ResponseEntity.ok(inventoryData);
    }

    @GetMapping("/{id}/edit")
    public ResponseEntity<Map<String, Object>> getProductForEdit(@PathVariable Long id) {
        Map<String, Object> productData = productService.getProductForEdit(id);
        if (productData == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(productData);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        boolean deleted = productService.deleteProduct(id);
        if (deleted) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/variant/{id}")
    public ResponseEntity<?> deleteVariant(@PathVariable Long id) {
        boolean deleted = productService.deleteVariant(id);
        if (deleted) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}