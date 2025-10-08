package com.web.Service;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Dto.ColorDto;
import com.web.Dto.ProductDetailResponse;
import com.web.Dto.ProductInfo;
import com.web.Dto.ProductResponse;
import com.web.Dto.ReviewResponse;
import com.web.Dto.VariantResponse;
import com.web.Model.Product;
import com.web.Model.Review;
import com.web.Repository.ProductRepository;
import com.web.Repository.ProductVariantRepository;
import com.web.Repository.ReviewRepository;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    private static final Pattern BRACKET_PATTERN = Pattern.compile("\\[([^\\]]+)]");

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
        if (oldProduct == null)
            return null;
        newProduct.setId(oldProduct.getId());
        return productRepository.save(newProduct);
    }

    public List<ProductResponse> getProductInfoList() {
        List<ProductInfo> infos = productRepository.getAllProductInfo();
        Pattern bracketPattern = Pattern.compile("\\[([^\\]]+)]"); // finds content inside [...]
        return infos.stream().map(info -> {
            ProductResponse res = new ProductResponse();
            res.setId(info.getId());
            res.setBrand(info.getBrand());
            res.setName(info.getName());
            res.setDescription(info.getDescription());
            res.setSlug(info.getSlug());
            res.setUrl(info.getUrl());
            res.setSizes(
                    info.getSizes() != null ? Arrays.asList(info.getSizes().split(",")) : List.of());

            // parse colors robustly
            String colorsRaw = info.getColors();
            List<ColorDto> colorList = new ArrayList<>();
            if (colorsRaw != null && !colorsRaw.isBlank()) {
                // 1) Try bracket style: "[Đỏ, #dc3545],[Xanh, #0d6efd]"
                Matcher m = bracketPattern.matcher(colorsRaw);
                boolean found = false;
                while (m.find()) {
                    found = true;
                    String inside = m.group(1); // e.g. "Đỏ, #dc3545"
                    String[] parts = inside.split(",", 2);
                    String name = parts.length > 0 ? parts[0].trim().replaceAll("^['\"]|['\"]$", "") : "";
                    String code = parts.length > 1 ? parts[1].trim().replaceAll("^['\"]|['\"]$", "") : "";
                    colorList.add(new ColorDto(name, code));
                }

                if (!found) {
                    // 2) Fallback: no brackets -> assume flat comma-separated pairs "Đỏ, #dc3545,
                    // Xanh, #0d6efd"
                    String cleaned = colorsRaw.replaceAll("[\\[\\]]", "").trim();
                    // remove surrounding quotes if present
                    cleaned = cleaned.replaceAll("[\"']", "");
                    String[] tokens = cleaned.split("\\s*,\\s*");
                    for (int i = 0; i + 1 < tokens.length; i += 2) {
                        String name = tokens[i].trim();
                        String code = tokens[i + 1].trim();
                        colorList.add(new ColorDto(name, code));
                    }
                }
            }
            res.setColors(colorList != null ? colorList : List.of());

            res.setPrice(info.getPrice());
            res.setPriceNow(info.getPriceNow());
            res.setCategoriesId(info.getCategoriesId());
            res.setRating(info.getRating());
            res.setNumberReview(info.getNumberReview());
            res.setCreateAt(info.getCreateAt());
            return res;
        }).collect(Collectors.toList());
    }

    public VariantResponse getAllVariantsAggregation() {
        ProductVariantRepository.VariantAgg agg = productVariantRepository.findAllAggregation();
        VariantResponse out = new VariantResponse();
        if (agg == null) {
            out.setSizes(List.of());
            out.setColors(List.of());
            return out;
        }

        // parse sizes "S,M,L" -> List<String>
        String sizesRaw = agg.getSizes();
        List<String> sizes = (sizesRaw == null || sizesRaw.isBlank())
                ? List.of()
                : Arrays.stream(sizesRaw.split("\\s*,\\s*"))
                        .filter(s -> !s.isBlank())
                        .collect(Collectors.toList());
        out.setSizes(sizes);

        // parse colors
        String colorsRaw = agg.getColors();
        List<ColorDto> colors = new ArrayList<>();
        if (colorsRaw != null && !colorsRaw.isBlank()) {
            Matcher m = BRACKET_PATTERN.matcher(colorsRaw);
            boolean found = false;
            while (m.find()) {
                found = true;
                String inside = m.group(1); // e.g. "Đỏ, #dc3545"
                String[] parts = inside.split("\\s*,\\s*", 2);
                String name = parts.length > 0 ? parts[0].trim().replaceAll("^['\"]|['\"]$", "") : "";
                String code = parts.length > 1 ? parts[1].trim().replaceAll("^['\"]|['\"]$", "") : "";
                colors.add(new ColorDto(name, code));
            }

            if (!found) {
                // fallback flat list "Đỏ, #dc3545, Xanh, #0d6efd"
                String cleaned = colorsRaw.replaceAll("[\\[\\]\"]", "").trim();
                String[] tokens = cleaned.split("\\s*,\\s*");
                for (int i = 0; i + 1 < tokens.length; i += 2) {
                    String name = tokens[i].trim();
                    String code = tokens[i + 1].trim();
                    colors.add(new ColorDto(name, code));
                }
            }
        }
        out.setColors(colors);
        return out;
    }

    public ProductDetailResponse getProductBySlug(String slug) {
        ProductRepository.ProductDetailInfo info = productRepository.getProductInfoBySlug(slug);
        if (info == null)
            return null;

        ProductDetailResponse out = new ProductDetailResponse();
        out.setId(info.getId());
        out.setName(info.getName());
        out.setDescription(info.getDescription());

        // urls: GROUP_CONCAT -> split by comma
        String urlsRaw = info.getUrls();
        if (urlsRaw == null || urlsRaw.isBlank()) {
            out.setUrl(List.of());
        } else {
            List<String> urls = Arrays.stream(urlsRaw.split("\\s*,\\s*"))
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList());
            out.setUrl(urls);
        }

        // sizes
        String sizesRaw = info.getSizes();
        if (sizesRaw == null || sizesRaw.isBlank()) {
            out.setSize(List.of());
        } else {
            out.setSize(Arrays.stream(sizesRaw.split("\\s*,\\s*"))
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList()));
        }

        // colors -> parse pairs
        String colorsRaw = info.getColors();
        List<ColorDto> colors = new ArrayList<>();
        if (colorsRaw != null && !colorsRaw.isBlank()) {
            Matcher m = BRACKET_PATTERN.matcher(colorsRaw);
            boolean found = false;
            while (m.find()) {
                found = true;
                String inside = m.group(1);
                String[] parts = inside.split("\\s*,\\s*", 2);
                String name = parts.length > 0 ? parts[0].trim().replaceAll("^['\"]|['\"]$", "") : "";
                String code = parts.length > 1 ? parts[1].trim().replaceAll("^['\"]|['\"]$", "") : "";
                colors.add(new ColorDto(name, code));
            }
            if (!found) {
                String cleaned = colorsRaw.replaceAll("[\\[\\]\"]", "").trim();
                String[] tokens = cleaned.split("\\s*,\\s*");
                for (int i = 0; i + 1 < tokens.length; i += 2) {
                    String name = tokens[i].trim();
                    String code = tokens[i + 1].trim();
                    colors.add(new ColorDto(name, code));
                }
            }
        }
        out.setColor(colors);

        out.setPrice(info.getPrice());
        out.setPrice_now(info.getPriceNow());
        out.setRating(info.getRating());
        out.setNumber_review(info.getNumberReview());
        return out;
    }

    public List<ReviewResponse> getReviewsBySlug(String slug) {
        List<Review> reviews = reviewRepository.findTop3ByProduct_SlugOrderByCreatedAtDesc(slug);
        return reviews.stream().map(r -> {
            ReviewResponse dto = new ReviewResponse();
            dto.setId(r.getId());
            if (r.getUser() != null) {
                dto.setUsername(r.getUser().getFullName());
            }
            dto.setRating(r.getRating());
            dto.setComment(r.getComment());
            dto.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
            return dto;
        }).collect(Collectors.toList());
    }

    public List<ReviewResponse> getAllReviewsBySlug(String slug) {
        List<Review> reviews = reviewRepository.findByProduct_Slug(slug);
        return reviews.stream().map(r -> {
            ReviewResponse dto = new ReviewResponse();
            dto.setId(r.getId());
            if (r.getUser() != null) {
                dto.setUsername(r.getUser().getFullName());
            }
            dto.setRating(r.getRating());
            dto.setComment(r.getComment());
            dto.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
            return dto;
        }).collect(Collectors.toList());
    }
}
