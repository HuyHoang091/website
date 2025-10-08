package com.web.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.web.Dto.ProductInfo;
import com.web.Model.Product;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query(value = "SELECT " +
            "p.id AS id, " +
            "b.name AS brand, " +
            "p.name AS name, " +
            "p.description AS description, " +
            "p.slug AS slug, " +
            "(SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS url, "
            +
            "GROUP_CONCAT(DISTINCT pv.size) AS sizes, " +
            "GROUP_CONCAT(DISTINCT pv.color) AS colors, " +
            "MIN(pv.price) AS price, " +
            "CASE " +
            "  WHEN d.discount_percent IS NOT NULL AND d.start_date < NOW() AND d.end_date > NOW() AND d.status = 'active' "
            +
            "    THEN MIN(pv.price) * (1 - d.discount_percent) " +
            "  ELSE MIN(pv.price) " +
            "END AS priceNow, " +
            "p.categories_id AS categoriesId, " +
            "IFNULL((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 0) AS rating, " +
            "IFNULL((SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id), 0) AS numberReview, " +
            "p.created_at AS createAt " +
            "FROM products p " +
            "JOIN brands b ON p.brand_id = b.id " +
            "JOIN product_variants pv ON pv.product_id = p.id " +
            "LEFT JOIN discount d ON d.categories_id = p.categories_id " +
            "GROUP BY p.id", nativeQuery = true)
    List<ProductInfo> getAllProductInfo();

    interface ProductDetailInfo {
        Long getId();
        String getName();
        String getDescription();
        String getSlug();
        String getUrls();
        String getSizes();
        String getColors();
        Double getPrice();
        Double getPriceNow();
        Double getRating();
        Integer getNumberReview();
    }

    @Query(value = "SELECT " +
            "p.id AS id, " +
            "p.name AS name, " +
            "p.description AS description, " +
            "p.slug AS slug, " +
            "GROUP_CONCAT(DISTINCT pi.url ORDER BY pi.sort_order) AS urls, " +
            "GROUP_CONCAT(DISTINCT pv.size) AS sizes, " +
            "GROUP_CONCAT(DISTINCT pv.color) AS colors, " +
            "MIN(pv.price) AS price, " +
            "CASE " +
            "  WHEN d.discount_percent IS NOT NULL AND d.start_date < NOW() AND d.end_date > NOW() AND d.status = 'active' "
            +
            "    THEN MIN(pv.price) * (1 - d.discount_percent) " +
            "  ELSE MIN(pv.price) " +
            "END AS priceNow, " +
            "IFNULL((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 0) AS rating, " +
            "IFNULL((SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id), 0) AS numberReview " +
            "FROM products p " +
            "JOIN product_variants pv ON pv.product_id = p.id " +
            "LEFT JOIN discount d ON d.categories_id = p.categories_id " +
            "LEFT JOIN product_images pi ON pi.product_id = p.id " +
            "WHERE p.slug = :slug " +
            "GROUP BY p.id", nativeQuery = true)
    ProductDetailInfo getProductInfoBySlug(@Param("slug") String slug);

    Product findBySlug(String slug);
}