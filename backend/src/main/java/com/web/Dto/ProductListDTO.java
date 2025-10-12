package com.web.Dto;

import com.web.Model.Product;
import lombok.Data;

@Data
public class ProductListDTO {
    private Long id;
    private String brand;
    private String name;
    private String description;
    private String category;
    private Product.STATUS status;

    public ProductListDTO(Long id, String brand, String name, String description, String category,
            Product.STATUS status) {
        this.id = id;
        this.brand = brand;
        this.name = name;
        this.description = description;
        this.category = category;
        this.status = status;
    }
}