package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.Model.Order;
import com.web.Model.User;
import com.web.Repository.OrderRepository;
import com.web.Repository.UserRepository;
import com.web.Service.OrderService;
import com.web.Service.OrderCancelRequestService;
import com.web.Service.OrderItemService;
import com.web.Dto.OrderDetailDto;
import com.web.Dto.OrderDTO;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemService orderItemService;

    @Autowired
    private OrderCancelRequestService cancelRequestService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("user/{userId}")
    public List<Order> getOrdersByUserId(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return orderRepository.findByCustomerFB(userId);
        }
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

    @GetMapping("/stats/daily")
    public ResponseEntity<?> getOrderStatsByDate() {
        try {
            List<Map<String, Object>> stats = orderRepository.findOrderStatsByDate();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving order stats: " + e.getMessage());
        }
    }

    /**
     * Gửi yêu cầu hủy đơn hàng
     */
    @PostMapping("/{orderId}/cancel-request")
    public ResponseEntity<?> requestCancelOrder(@PathVariable Long orderId, @RequestBody Map<String, String> payload) {
        String reason = payload.get("reason");
        String requestedBy = payload.get("requestedBy");

        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập lý do hủy đơn");
        }

        boolean requested = orderService.requestCancelOrder(orderId, reason, requestedBy);
        if (!requested) {
            return ResponseEntity.badRequest().body("Không thể gửi yêu cầu hủy đơn hàng");
        }

        return ResponseEntity.ok().body("Đã gửi yêu cầu hủy đơn hàng");
    }

    /**
     * Lấy danh sách tất cả yêu cầu hủy đơn
     */
    @GetMapping("/cancel-requests")
    public ResponseEntity<?> getAllCancelRequests() {
        List<Map<String, Object>> requests = cancelRequestService.getAllCancelRequests();
        return ResponseEntity.ok(requests);
    }

    /**
     * Lấy thông tin yêu cầu hủy theo order ID
     */
    @GetMapping("/{orderId}/cancel-request")
    public ResponseEntity<?> getCancelRequest(@PathVariable Long orderId) {
        Map<String, Object> request = cancelRequestService.getCancelRequest(orderId);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(request);
    }

    /**
     * Xác nhận hủy đơn hàng
     */
    @PostMapping("/{orderId}/confirm-cancel")
    public ResponseEntity<?> confirmCancelOrder(@PathVariable Long orderId, @RequestBody Map<String, String> payload) {
        String adminNote = payload.get("adminNote");

        boolean confirmed = orderService.confirmCancelOrder(orderId, adminNote);
        if (!confirmed) {
            return ResponseEntity.badRequest().body("Không thể xác nhận hủy đơn hàng");
        }

        return ResponseEntity.ok().body("Đã hủy đơn hàng thành công");
    }

    /**
     * Từ chối yêu cầu hủy đơn
     */
    @PostMapping("/{orderId}/reject-cancel")
    public ResponseEntity<?> rejectCancelRequest(@PathVariable Long orderId, @RequestBody Map<String, String> payload) {
        String adminNote = payload.get("adminNote");

        boolean rejected = orderService.rejectCancelRequest(orderId, adminNote);
        if (!rejected) {
            return ResponseEntity.badRequest().body("Không thể từ chối yêu cầu hủy đơn hàng");
        }

        return ResponseEntity.ok().body("Đã từ chối yêu cầu hủy đơn hàng");
    }

    @GetMapping("/check-cancel-status")
    public ResponseEntity<?> checkCancelRequestStatus(@RequestParam("orderIds") List<Long> orderIds) {
        Map<String, List<Long>> result = new HashMap<>();
        List<Long> cancelRequestedOrders = new ArrayList<>();
        
        try {
            // Lọc ra các orderIds có trong Redis
            for (Long orderId : orderIds) {
                Map<String, Object> request = cancelRequestService.getCancelRequest(orderId);
                if (request != null) {
                    cancelRequestedOrders.add(orderId);
                }
            }
            
            result.put("cancelRequested", cancelRequestedOrders);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error checking cancel request status: " + e.getMessage());
        }
    }
}
