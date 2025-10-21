package com.web.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.Address;
import com.web.Model.Order;
import com.web.Model.OrderItem;
import com.web.Model.Payment;
import com.web.Model.ProductVariant;
import com.web.Model.User;
import com.web.Repository.AddressRepository;
import com.web.Repository.CartItemRepository;
import com.web.Repository.OrderItemRepository;
import com.web.Repository.OrderRepository;
import com.web.Repository.PaymentRepository;
import com.web.Repository.ProductVariantRepository;
import com.web.Repository.UserRepository;
import com.web.Dto.OrderDetailDto;
import com.web.Dto.OrderItemDto;
import com.web.Dto.RefundMessageDto;
import com.web.Dto.OrderDTO;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderCancelRequestService cancelRequestService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PayPalService payPalService;

    @Autowired
    private RefundQueueService refundQueueService;

    @Cacheable(value = "orders", key = "#userId")
    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUser_Id(userId);
    }

    @CacheEvict(value = "orders", key = "#userId")
    public boolean deleteOrder(Long id, Long userId) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null || !order.getUser().getId().equals(userId)) {
            return false;
        }
        orderRepository.deleteById(id);
        return true;
    }

    // @Transactional
    // @CacheEvict(value = "orders", key = "#newOrder.user.id")
    // public Order updateOrder(Long id, Order newOrder) {
    //     Order oldOrder = orderRepository.findById(id).orElse(null);
    //     if (oldOrder == null)
    //         return null;
    //     newOrder.setId(oldOrder.getId());
    //     return orderRepository.save(newOrder);
    // }

    // trả về DTO JSON
    public List<OrderDetailDto> getDetailedOrderByOrderId(Long id) {
        return orderRepository.findOrderDetailsById(id);
    }

    public List<OrderDetailDto> getAllOrderDetails() {
        return orderRepository.findAllOrderDetails();
    }

    @Transactional
    public String createOrder(OrderDTO orderDTO) {
        User user = userRepository.findById(orderDTO.getUserId()).orElse(null);
        if (user == null) {
            return "User not found";
        }
        Address address = addressRepository.findById(orderDTO.getAddressId()).orElse(null);
        if (address == null) {
            return "Address not found";
        }
        Order order = new Order();
        order.setUser(user);
        order.setAddress(address);
        order.setStatus(orderDTO.getStatus());
        order.setCreateBy(orderDTO.getCreateBy());
        order.setNote(orderDTO.getNote());

        Order newOrder = orderRepository.save(order);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemDto itemDto : orderDTO.getItems()) {
            if (itemDto.getVariantId() == null) {
                continue;
            }
            ProductVariant variant = productVariantRepository.findById(itemDto.getVariantId()).orElse(null);
            if (variant == null) {
                return "Product variant not found: ID = " + itemDto.getVariantId();
            }
            OrderItem item = new OrderItem();
            item.setOrder(newOrder);
            item.setVariantId(variant.getId());
            item.setProductName(variant.getProduct().getName());
            item.setSku(variant.getSku());
            item.setQuantity((long) itemDto.getQuantity());
            item.setUnitPrice(variant.getPrice());
            item.setLineTotal(variant.getPrice().multiply(java.math.BigDecimal.valueOf(itemDto.getQuantity())));

            orderItemRepository.save(item);
            if (cartItemRepository.existsById(itemDto.getId())) {
                cartItemRepository.deleteById(itemDto.getId());
            }
            totalAmount = totalAmount.add(item.getLineTotal());
        }
        newOrder.setTotalAmount(totalAmount);
        if (newOrder.getOrderNumber() == null) {
            String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            newOrder.setOrderNumber("NH" + time + "-" + newOrder.getId());
        }
        orderRepository.save(newOrder);
        return newOrder.getId().toString();
    }

    @Transactional
    public String updateOrder(Long orderId, OrderDTO orderDTO) {
        // 1. Kiểm tra user
        User user = userRepository.findById(orderDTO.getUserId()).orElse(null);
        if (user == null) {
            return "User not found";
        }

        // 2. Kiểm tra address
        Address address = addressRepository.findById(orderDTO.getAddressId()).orElse(null);
        if (address == null) {
            return "Address not found";
        }

        // 3. Kiểm tra order
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return "Order not found";
        }

        // 4. Cập nhật thông tin đơn hàng
        order.setUser(user);
        order.setAddress(address);
        order.setStatus(orderDTO.getStatus());
        order.setCreateBy(orderDTO.getCreateBy());
        order.setNote(orderDTO.getNote());

        orderRepository.save(order);

        // 5. Lấy danh sách OrderItem hiện tại
        List<OrderItem> existingItems = orderItemRepository.findByOrder_Id(orderId);
        Map<Long, OrderItem> existingItemMap = existingItems.stream()
                .filter(item -> item.getId() != null)
                .collect(Collectors.toMap(OrderItem::getId, item -> item));

        // 6. Tổng tiền
        BigDecimal totalAmount = BigDecimal.ZERO;

        // 7. ID các item được gửi lên
        Set<Long> incomingIds = new HashSet<>();

        for (OrderItemDto itemDto : orderDTO.getItems()) {
            ProductVariant variant = productVariantRepository.findById(itemDto.getVariantId()).orElse(null);
            if (variant == null) {
                return "Product variant not found: ID = " + itemDto.getVariantId();
            }

            OrderItem item;

            if (itemDto.getId() != null && existingItemMap.containsKey(itemDto.getId())) {
                // Cập nhật item cũ
                item = existingItemMap.get(itemDto.getId());
            } else {
                // Tạo item mới
                item = new OrderItem();
                item.setOrder(order);
            }

            item.setVariantId(variant.getId());
            item.setProductName(variant.getProduct().getName());
            item.setSku(variant.getSku());
            item.setQuantity((long) itemDto.getQuantity());
            item.setUnitPrice(variant.getPrice());
            item.setLineTotal(variant.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));

            orderItemRepository.save(item);

            totalAmount = totalAmount.add(item.getLineTotal());

            if (item.getId() != null) {
                incomingIds.add(item.getId());
            }
        }

        // 8. Xoá các item cũ không còn trong danh sách mới
        for (OrderItem oldItem : existingItems) {
            if (!incomingIds.contains(oldItem.getId())) {
                orderItemRepository.delete(oldItem);
            }
        }

        // 9. Cập nhật tổng tiền
        order.setTotalAmount(totalAmount);
        orderRepository.save(order);

        return "Order updated successfully";
    }

    /**
     * Yêu cầu hủy đơn hàng - lưu vào Redis
     */
    public boolean requestCancelOrder(Long orderId, String reason, String requestedBy) {
        try {
            // Kiểm tra đơn hàng tồn tại
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return false;
            }
            
            // Kiểm tra trạng thái đơn hàng có thể hủy
            if (order.getStatus() == Order.STATUS.delivered || 
                order.getStatus() == Order.STATUS.cancelled) {
                return false;
            }
            
            // Lưu yêu cầu hủy vào Redis
            return cancelRequestService.saveCancelRequest(orderId, reason, requestedBy);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Xác nhận hủy đơn hàng
     */
    public boolean confirmCancelOrder(Long orderId, String adminNote) {
        try {
            // Lấy thông tin đơn hàng
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return false;
            }
            
            // Lấy thông tin yêu cầu hủy từ Redis
            Map<String, Object> cancelRequest = cancelRequestService.getCancelRequest(orderId);
            if (cancelRequest == null) {
                return false;
            }

            String reason = (String) cancelRequest.get("reason");
            String requestedBy = (String) cancelRequest.get("requestedBy");

            // Xử lý hoàn tiền nếu đã thanh toán
            String method = "cod";
            Payment payment = paymentRepository.findByOrder_Id(orderId);
        if (payment != null && !payment.getMethod().equalsIgnoreCase(method)) {
            // Thay vì xử lý hoàn tiền ngay, gửi vào message queue
            RefundMessageDto refundMessage = new RefundMessageDto(
                orderId,
                payment.getCaptureId(),
                reason,
                adminNote,
                requestedBy
            );
            
            // Đưa vào hàng đợi
            refundQueueService.enqueueRefundRequest(refundMessage);
            
            // Đánh dấu đơn hàng đang xử lý hoàn tiền
            order.setStatus(Order.STATUS.processing);
        } else {
            order.setStatus(Order.STATUS.cancelled);
        }
            
            String currentNote = order.getNote() != null ? order.getNote() : "";
            String newNote = currentNote + "\n Lý do hủy: " + reason;
            if (adminNote != null && !adminNote.isEmpty()) {
                newNote += "\n Ghi chú admin: " + adminNote;
            }

            order.setNote(newNote.trim());
            
            // Lưu thay đổi
            orderRepository.save(order);
            
            // Xóa yêu cầu khỏi Redis
            cancelRequestService.removeCancelRequest(orderId);
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Từ chối yêu cầu hủy đơn hàng
     */
    public boolean rejectCancelRequest(Long orderId, String adminNote) {
        try {
            // Kiểm tra đơn hàng tồn tại
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return false;
            }
            
            // Thêm ghi chú về việc từ chối hủy
            String currentNote = order.getNote() != null ? order.getNote() : "";
            String newNote = currentNote + "\n Từ chối yêu cầu hủy đơn";
            if (adminNote != null && !adminNote.isEmpty()) {
                newNote += ": " + adminNote;
            }
            order.setNote(newNote.trim());
            
            // Lưu thay đổi
            orderRepository.save(order);
            
            // Xóa yêu cầu khỏi Redis
            cancelRequestService.removeCancelRequest(orderId);
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
