package com.web.Dto;

import lombok.Data;

@Data
public class ReviewDTO {
    private Long variantId;
    private Long userId;
    private Long rating;
    private String comment;
}
