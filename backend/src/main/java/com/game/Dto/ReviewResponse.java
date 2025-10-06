package com.game.Dto;

import lombok.Data;

@Data
public class ReviewResponse {
    private Long id;
    private String username;
    private Long rating;
    private String comment;
    private String createdAt;
}