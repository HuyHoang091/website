package com.web.Dto;

import lombok.Data;
import com.web.Model.Order;

import java.util.List;

import com.web.Dto.OrderItemDto;

@Data
public class OrderDTO {
    private Long userId;
    private Long addressId;
    private Order.STATUS status;
    private String createBy;
    private String note;
    private List<OrderItemDto> items;
}
