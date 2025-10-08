package com.web.Dto;

import lombok.Data;
import java.util.List;

@Data
public class ProductResponse {
    private Long id;
    private String brand;
    private String name;
    private String description;
    private String slug;
    private String url;
    private List<String> sizes;
    private List<ColorDto> colors; // changed from List<String> to List<ColorDto>
    private Double price;
    private Double priceNow;
    private Long categoriesId;
    private Double rating;
    private Integer numberReview;
    private String createAt;
}