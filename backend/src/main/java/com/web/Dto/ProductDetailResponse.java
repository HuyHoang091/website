package com.web.Dto;

import lombok.Data;
import java.util.List;

@Data
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String description;
    private List<String> url; // list of image urls
    private List<String> size;
    private List<ColorDto> color;
    private Double price;
    private Double price_now;
    private Double rating;
    private Integer number_review;
}