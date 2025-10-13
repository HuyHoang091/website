package com.web.Dto;

import java.math.BigDecimal;

public class CartItemDTO {
    private Long id;
    private Long variantId;
    private String name;
    private String size;
    private String color;
    private String url;
    private String brand;
    private Long quantity;
    private BigDecimal priceAtAdd;

    public CartItemDTO(Long id, Long variantId, String name, String size, String color, String url, String brand, Long quantity,
            BigDecimal priceAtAdd) {
        this.id = id;
        this.variantId = variantId;
        this.name = name;
        this.size = size;
        this.color = color;
        this.url = url;
        this.brand = brand;
        this.quantity = quantity;
        this.priceAtAdd = priceAtAdd;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getVariantId() {
        return variantId;
    }
    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getSize() {
        return size;
    }
    public void setSize(String size) {
        this.size = size;
    }
    public String getColor() {
        return color;
    }
    public void setColor(String color) {
        this.color = color;
    }
    public String getUrl() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }
    public String getBrand() {
        return brand;
    }
    public void setBrand(String brand) {
        this.brand = brand;
    }
    public Long getQuantity() {
        return quantity;
    }
    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }
    public BigDecimal getPriceAtAdd() {
        return priceAtAdd;
    }
    public void setPriceAtAdd(BigDecimal priceAtAdd) {
        this.priceAtAdd = priceAtAdd;
    }
}