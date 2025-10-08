package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.web.Dto.ProductDetailResponse;
import com.web.Dto.ProductResponse;
import com.web.Dto.ReviewResponse;
import com.web.Dto.VariantResponse;
import com.web.Service.ProductService;

import org.springframework.http.ResponseEntity;

import java.util.List;

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

}
