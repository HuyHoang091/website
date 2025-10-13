package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.Model.Order;
import com.web.Service.OrderService;
import com.web.Service.OrderItemService;
import com.web.Dto.OrderDetailDto;
import com.web.Dto.OrderDTO;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderItemService orderItemService;

    @GetMapping("user/{userId}")
    public List<Order> getOrdersByUserId(@PathVariable Long userId) {
        return orderService.getOrdersByUserId(userId);
    }

    @DeleteMapping("{orderId}/delete/user/{userId}")
    public boolean deleteOrder(@PathVariable Long orderId, @PathVariable Long userId) {
        return orderService.deleteOrder(orderId, userId);
    }

    // Trả về JSON DTO
    @GetMapping("{orderId}/details")
    public List<OrderDetailDto> getDetailedOrderByOrderId(@PathVariable Long orderId) {
        return orderService.getDetailedOrderByOrderId(orderId);
    }

    @GetMapping("details/all")
    public List<OrderDetailDto> getAllOrderDetails() {
        return orderService.getAllOrderDetails();
    }

    @GetMapping("{orderId}/items")
    public List<com.web.Model.OrderItem> getOrderItemsByOrderId(@PathVariable Long orderId) {
        return orderItemService.getOrderItemsByOrderId(orderId);
    }

    @PostMapping("create")
    public ResponseEntity<?> createOrder(@RequestBody OrderDTO orderDto) {
        System.out.println("Creating order for user: " + orderDto.getUserId() + " with data: " + orderDto);
        String create = orderService.createOrder(orderDto);
        if (create == null) {
            return ResponseEntity.badRequest().body("Failed to create order");
        }
        return ResponseEntity.ok(create);
    }

    @PutMapping("{orderId}/update")
    public ResponseEntity<?> updateOrder(@PathVariable Long orderId, @RequestBody OrderDTO orderDto) {
        String updatedOrder = orderService.updateOrder(orderId, orderDto);
        if (updatedOrder == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedOrder);
    }
}
