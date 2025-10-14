package com.web.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.math.BigDecimal;
import java.text.Normalizer;
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
import com.web.Dto.ProductListDTO;
import com.web.Dto.ProductRequestDto;
import com.web.Model.Brand;
import com.web.Model.Category;
import com.web.Model.Product;
import com.web.Model.ProductImage;
import com.web.Model.ProductVariant;
import com.web.Model.Review;
import com.web.Model.SkuSequence;
import com.web.Repository.CategoryRepository;
import com.web.Repository.ProductImageRepository;
import com.web.Repository.ProductRepository;
import com.web.Repository.ProductVariantRepository;
import com.web.Repository.ReviewRepository;
import com.web.Repository.SkuSequenceRepository;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private SkuSequenceRepository skuSequenceRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductImageRepository imageRepository;

    private static final Pattern BRACKET_PATTERN = Pattern.compile("\\[([^\\]]+)]");

    @Cacheable(value = "products")
    public List<ProductListDTO> getAllProducts() {
        return productRepository.findAllProductSummaries();
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

    @Transactional
    public Product addProduct(ProductRequestDto req) {
        // ---- 1. Sinh slug ----
        String slug = generateSlug(req.getName());
        String tmpSlug = slug;
        int counter = 1;
        while (productRepository.existsBySlug(tmpSlug)) {
            tmpSlug = slug + "-" + counter++;
        }
        slug = tmpSlug;

        // ---- 2. Tạo Product ----
        Product product = new Product();
        product.setName(req.getName());
        product.setSlug(slug);
        product.setDescription(req.getDescription());

        Brand brand = new Brand();
        brand.setId(req.getBrand_id());
        product.setBrand(brand);

        Category category = categoryRepository.findById(req.getCategories_id())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        product.setCategories(category);

        product.setStatus(Product.STATUS.valueOf(req.getStatus().toLowerCase()));
        productRepository.save(product);

        long sortOrder = 1;

        // ---- 3. Thêm ảnh chung của product ----
        if (req.getUrl() != null && !req.getUrl().isEmpty()) {
            for (String url : req.getUrl()) {
                ProductImage img = new ProductImage();
                img.setProduct(product);
                img.setUrl(url);
                img.setSortOrder(sortOrder++);
                imageRepository.save(img);
            }
        }

        // ---- 4. Thêm biến thể sản phẩm ----
        if (req.getVariant() != null && !req.getVariant().isEmpty()) {
            String prefix = getPrefixFromName(req.getName());

            for (ProductRequestDto.VariantDto variantDto : req.getVariant()) {
                // Chuẩn hóa size và color
                String size = variantDto.getSize() != null ? variantDto.getSize().trim().toUpperCase() : "";
                String colorDb = variantDto.getColor() != null ? variantDto.getColor().trim() : "";
                String colorSku = removeDiacritics(colorDb).replaceAll("\\s+", "").toUpperCase();

                // Tạo SKU
                long nextNumber = nextSkuNumber(prefix);
                String seqStr = String.format("%03d", nextNumber);
                String sku = String.format("%s%s-%s-%s", prefix, seqStr, size, colorSku);

                // Tạo variant
                ProductVariant variant = new ProductVariant();
                variant.setProduct(product);
                variant.setSize(size);
                variant.setColor(colorDb);
                variant.setSku(sku);
                variant.setPrice(req.getPrice() != null ? BigDecimal.valueOf(req.getPrice()) : BigDecimal.ZERO);
                variant.setStock(variantDto.getStock() != null ? variantDto.getStock() : 0L);
                productVariantRepository.save(variant);

                // Thêm ảnh cho variant nếu có
                if (variantDto.getUrl() != null && !variantDto.getUrl().isBlank()) {
                    ProductImage variantImg = new ProductImage();
                    variantImg.setProduct(product);
                    variantImg.setProductVariant(variant);
                    variantImg.setUrl(variantDto.getUrl());
                    variantImg.setSortOrder(sortOrder++); // Mỗi variant chỉ có một ảnh
                    imageRepository.save(variantImg);
                }
            }
        }

        return product;
    }

    @Transactional
    public Product updateProductFromRequest(Long productId, ProductRequestDto req) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

            // 1) Cập nhật thông tin cơ bản của sản phẩm
            if (req.getName() != null && !req.getName().isBlank() && !req.getName().equals(product.getName())) {
                String base = generateSlug(req.getName());
                String candidate = base;
                int c = 1;
                while (productRepository.existsBySlug(candidate) && !candidate.equals(product.getSlug())) {
                    candidate = base + "-" + c++;
                }
                product.setSlug(candidate);
                product.setName(req.getName());
            }

            if (req.getDescription() != null)
                product.setDescription(req.getDescription());
            if (req.getBrand_id() != null) {
                Brand b = new Brand();
                b.setId(req.getBrand_id());
                product.setBrand(b);
            }
            if (req.getCategories_id() != null) {
                Category cat = categoryRepository.findById(req.getCategories_id())
                        .orElseThrow(() -> new RuntimeException("Category not found"));
                product.setCategories(cat);
            }
            if (req.getStatus() != null) {
                try {
                    product.setStatus(Product.STATUS.valueOf(req.getStatus().toLowerCase()));
                } catch (Exception ex) {
                    throw new IllegalArgumentException("Invalid status: " + req.getStatus());
                }
            }
            productRepository.save(product);

            // 2) Lấy danh sách variants hiện tại của sản phẩm
            List<ProductVariant> existingVariants = productVariantRepository.findByProductId(product.getId());
            Map<Long, ProductVariant> variantMap = new HashMap<>();
            for (ProductVariant v : existingVariants) {
                variantMap.put(v.getId(), v);
            }

            // 3) Xóa và thêm mới ảnh của product (không phải của variant)
            try {
                imageRepository.deleteByProductIdAndVariantIdNull(product.getId());
            } catch (Exception e) {
                // Fallback nếu phương thức không tồn tại
                List<ProductImage> productImages = imageRepository
                        .findByProduct_IdAndProductVariantIsNull(product.getId());
                for (ProductImage img : productImages) {
                    imageRepository.delete(img);
                }
            }

            long sortOrder = 1;

            if (req.getUrl() != null && !req.getUrl().isEmpty()) {
                for (String url : req.getUrl()) {
                    if (url != null && !url.isBlank()) {
                        ProductImage img = new ProductImage();
                        img.setProduct(product);
                        img.setUrl(url);
                        img.setSortOrder(sortOrder++);
                        imageRepository.save(img);
                    }
                }
            }

            // 4) Xử lý variants: cập nhật variants hiện có, thêm mới, xóa cũ
            Set<Long> processedVariantIds = new HashSet<>();
            String prefix = getPrefixFromName(product.getName());

            if (req.getVariant() != null) {
                for (ProductRequestDto.VariantDto variantDto : req.getVariant()) {
                    ProductVariant variant;

                    // Chuẩn hóa size và color
                    String size = variantDto.getSize() != null ? variantDto.getSize().trim().toUpperCase() : "";
                    String colorDb = variantDto.getColor() != null ? variantDto.getColor().trim() : "";
                    String colorSku = removeDiacritics(colorDb).replaceAll("\\s+", "").toUpperCase();

                    if (variantDto.getId() != null && variantMap.containsKey(variantDto.getId())) {
                        // Cập nhật variant hiện có
                        variant = variantMap.get(variantDto.getId());
                        processedVariantIds.add(variant.getId());

                        variant.setSize(size);
                        variant.setColor(colorDb);
                        variant.setStock(variantDto.getStock() != null ? variantDto.getStock() : 0L);

                        // Cập nhật SKU nếu size hoặc color thay đổi
                        String existingSku = variant.getSku();
                        if (existingSku != null && existingSku.contains("-")) {
                            String[] skuParts = existingSku.split("-");
                            if (skuParts.length >= 3 &&
                                    (!skuParts[1].equals(size)
                                            || !removeDiacritics(variant.getColor()).replaceAll("\\s+", "")
                                                    .toUpperCase().equals(colorSku))) {
                                long nextNumber = nextSkuNumber(prefix);
                                String seqStr = String.format("%03d", nextNumber);
                                variant.setSku(String.format("%s%s-%s-%s", prefix, seqStr, size, colorSku));
                            }
                        }

                        // Cập nhật giá nếu cần
                        if (req.getPrice() != null) {
                            variant.setPrice(BigDecimal.valueOf(req.getPrice()));
                        }
                    } else {
                        // Tạo variant mới
                        variant = new ProductVariant();
                        variant.setProduct(product);
                        variant.setSize(size);
                        variant.setColor(colorDb);

                        // Tạo SKU mới
                        long nextNumber = nextSkuNumber(prefix);
                        String seqStr = String.format("%03d", nextNumber);
                        variant.setSku(String.format("%s%s-%s-%s", prefix, seqStr, size, colorSku));

                        variant.setPrice(req.getPrice() != null ? BigDecimal.valueOf(req.getPrice()) : BigDecimal.ZERO);
                        variant.setStock(variantDto.getStock() != null ? variantDto.getStock() : 0L);
                    }
                    productVariantRepository.save(variant);

                    // Xử lý ảnh variant: xóa cũ (nếu có) và thêm mới
                    try {
                        imageRepository.deleteByVariantId(variant.getId());
                    } catch (Exception e) {
                        // Fallback nếu phương thức không tồn tại
                        List<ProductImage> variantImages = imageRepository.findByProductVariant_Id(variant.getId());
                        for (ProductImage img : variantImages) {
                            imageRepository.delete(img);
                        }
                    }

                    if (variantDto.getUrl() != null && !variantDto.getUrl().isBlank()) {
                        ProductImage variantImg = new ProductImage();
                        variantImg.setProduct(product);
                        variantImg.setProductVariant(variant);
                        variantImg.setUrl(variantDto.getUrl());
                        variantImg.setSortOrder(sortOrder++); // Mỗi variant chỉ có một ảnh
                        imageRepository.save(variantImg);
                    }
                }
            }

            // 5) Xóa các variants không còn được sử dụng
            for (ProductVariant v : existingVariants) {
                if (!processedVariantIds.contains(v.getId())) {
                    try {
                        // Xóa ảnh liên kết với variant này trước
                        imageRepository.deleteByVariantId(v.getId());
                    } catch (Exception e) {
                        // Fallback nếu phương thức không tồn tại
                        List<ProductImage> variantImages = imageRepository.findByProductVariant_Id(v.getId());
                        for (ProductImage img : variantImages) {
                            imageRepository.delete(img);
                        }
                    }
                    // Sau đó xóa variant
                    productVariantRepository.delete(v);
                }
            }

            return product;
        } catch (Exception e) {
            // Log lỗi chi tiết - quan trọng để debug
            e.printStackTrace();
            // Ném lại exception để được xử lý ở tầng trên (controller)
            throw new RuntimeException("Error updating product: " + e.getMessage(), e);
        }
    }

    /**
     * Lấy dữ liệu cho bảng quản lý tồn kho
     */
    public List<Map<String, Object>> getInventoryData() {
        List<Map<String, Object>> result = new ArrayList<>();

        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());

            for (ProductVariant variant : variants) {
                Map<String, Object> item = new HashMap<>();
                item.put("productId", product.getId());
                item.put("variantId", variant.getId());
                item.put("name", product.getName());
                item.put("brand", product.getBrand() != null ? product.getBrand().getName() : "");
                item.put("category", product.getCategories() != null ? product.getCategories().getName() : "");
                item.put("sku", variant.getSku());
                item.put("size", variant.getSize());
                item.put("color", variant.getColor());
                item.put("stock", variant.getStock());
                item.put("price", variant.getPrice());
                item.put("status", product.getStatus().name());

                // Lấy URL ảnh của variant hoặc ảnh đầu tiên của product
                String imageUrl = "";
                List<ProductImage> variantImages = imageRepository.findByProductVariant_Id(variant.getId());
                if (!variantImages.isEmpty()) {
                    imageUrl = variantImages.get(0).getUrl();
                } else {
                    List<ProductImage> productImages = imageRepository
                            .findByProduct_IdAndProductVariantIsNull(product.getId());
                    if (!productImages.isEmpty()) {
                        imageUrl = productImages.get(0).getUrl();
                    }
                }
                item.put("imageUrl", imageUrl);

                result.add(item);
            }
        }

        return result;
    }

    /**
     * Lấy dữ liệu sản phẩm cho form chỉnh sửa
     */
    public Map<String, Object> getProductForEdit(Long productId) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return null;
        }

        Product product = productOpt.get();
        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        List<ProductImage> productImages = imageRepository.findByProduct_IdAndProductVariantIsNull(productId);

        Map<String, Object> result = new HashMap<>();
        result.put("id", product.getId());
        result.put("name", product.getName());
        result.put("brand_id", product.getBrand() != null ? product.getBrand().getId() : null);
        result.put("description", product.getDescription());
        result.put("categories_id", product.getCategories() != null ? product.getCategories().getId() : null);
        result.put("status", product.getStatus().name());

        // Giá sản phẩm (lấy từ variant đầu tiên)
        if (!variants.isEmpty()) {
            result.put("price", variants.get(0).getPrice());
        }

        // Ảnh sản phẩm
        List<String> urls = productImages.stream()
                .map(ProductImage::getUrl)
                .collect(Collectors.toList());
        result.put("url", urls);

        // Danh sách biến thể
        List<Map<String, Object>> variantsList = new ArrayList<>();
        for (ProductVariant variant : variants) {
            Map<String, Object> variantMap = new HashMap<>();
            variantMap.put("id", variant.getId());
            variantMap.put("size", variant.getSize());
            variantMap.put("color", variant.getColor());
            variantMap.put("stock", variant.getStock());

            // Lấy URL ảnh của variant nếu có
            String variantUrl = "";
            List<ProductImage> variantImages = imageRepository.findByProductVariant_Id(variant.getId());
            if (!variantImages.isEmpty()) {
                variantUrl = variantImages.get(0).getUrl();
            }
            variantMap.put("url", variantUrl);

            variantsList.add(variantMap);
        }
        result.put("variant", variantsList);

        return result;
    }

    /**
     * Xóa một biến thể sản phẩm
     */
    @Transactional
    public boolean deleteVariant(Long variantId) {
        Optional<ProductVariant> variantOpt = productVariantRepository.findById(variantId);
        if (variantOpt.isEmpty()) {
            return false;
        }

        ProductVariant variant = variantOpt.get();

        // Xóa ảnh của variant
        List<ProductImage> variantImages = imageRepository.findByProductVariant_Id(variantId);
        imageRepository.deleteAll(variantImages);

        // Xóa variant
        productVariantRepository.delete(variant);

        // Kiểm tra xem product còn variant nào không, nếu không còn thì xóa luôn
        // product
        Long productId = variant.getProduct().getId();
        List<ProductVariant> remainingVariants = productVariantRepository.findByProductId(productId);
        if (remainingVariants.isEmpty()
                || remainingVariants.size() == 1 && remainingVariants.get(0).getId().equals(variantId)) {
            // Xóa ảnh của product
            List<ProductImage> productImages = imageRepository.findByProduct_IdAndProductVariantIsNull(productId);
            imageRepository.deleteAll(productImages);

            // Xóa product
            productRepository.deleteById(productId);
        }

        return true;
    }

    // Helper: tạo slug thân thiện
    private String generateSlug(String input) {
        String nowhitespace = input.trim().replaceAll("\\s+", "-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = normalized.replaceAll("[^\\w-]", "").toLowerCase();
        return slug;
    }

    // Helper: lấy prefix SKU từ name (bỏ dấu, lấy ký tự đầu, uppercase)
    private String getPrefixFromName(String name) {
        if (name == null || name.isBlank())
            return "X";
        String cleaned = removeDiacritics(name).trim();
        if (cleaned.isEmpty())
            return "X";
        return cleaned.substring(0, 1).toUpperCase();
    }

    // Helper: remove diacritics
    private String removeDiacritics(String input) {
        if (input == null)
            return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "");
    }

    // Helper: Lấy số SKU tiếp theo, có khoá để tránh trùng
    private Long nextSkuNumber(String prefix) {
        Optional<SkuSequence> optional = skuSequenceRepository.findByPrefixForUpdate(prefix);
        SkuSequence seq;
        if (optional.isPresent()) {
            seq = optional.get();
            seq.setCurrentNumber(seq.getCurrentNumber() + 1);
        } else {
            seq = new SkuSequence();
            seq.setCategoryPrefix(prefix);
            seq.setCurrentNumber(1L);
        }
        skuSequenceRepository.save(seq);
        return seq.getCurrentNumber();
    }
}
