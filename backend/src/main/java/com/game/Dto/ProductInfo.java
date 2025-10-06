package com.game.Dto;

public interface ProductInfo {
    Long getId();
    String getBrand();
    String getName();
    String getDescription();
    String getSlug();
    String getUrl();
    String getSizes();
    String getColors();
    Double getPrice();
    Double getPriceNow();
    Long getCategoriesId();
    Double getRating();
    Integer getNumberReview();
    String getCreateAt();
}