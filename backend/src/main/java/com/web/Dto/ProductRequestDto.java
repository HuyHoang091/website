package com.web.Dto;

import lombok.Data;

import java.util.List;

@Data
public class ProductRequestDto {
    private String name;
    private Long brand_id;
    private String description;
    private Long categories_id;
    private String status;
    private List<String> url; // ảnh của product
    private Double price;
    private List<VariantDto> variant;

    @Data
    public static class VariantDto {
        private Long id; // null nếu thêm mới
        private String size;
        private String color;
        private String url; // ảnh của variant
        private Long stock;
    }
}
