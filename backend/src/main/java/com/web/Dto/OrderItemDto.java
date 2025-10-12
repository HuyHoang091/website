package com.web.Dto;

import lombok.Data;

@Data
public class OrderItemDto {
    private Long id;
    private Long variantId;
    private int quantity;
}
