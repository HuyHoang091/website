package com.web.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.transaction.Transactional;

import org.aspectj.weaver.ast.Var;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.Address;
import com.web.Model.Order;
import com.web.Model.OrderItem;
import com.web.Model.Product;
import com.web.Model.ProductVariant;
import com.web.Model.User;
import com.web.Repository.AddressRepository;
import com.web.Repository.OrderItemRepository;
import com.web.Repository.OrderRepository;
import com.web.Repository.ProductVariantRepository;
import com.web.Repository.UserRepository;
import com.web.Dto.OrderDetailDto;
import com.web.Dto.OrderItemDto;
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

    @Transactional
    @CacheEvict(value = "orders", key = "#newOrder.user.id")
    public Order updateOrder(Long id, Order newOrder) {
        Order oldOrder = orderRepository.findById(id).orElse(null);
        if (oldOrder == null)
            return null;
        newOrder.setId(oldOrder.getId());
        return orderRepository.save(newOrder);
    }

    // trả về DTO JSON
    public List<OrderDetailDto> getDetailedOrderByOrderId(Long id) {
        return orderRepository.findOrderDetailsById(id);
    }

    public List<OrderDetailDto> getAllOrderDetails() {
        return orderRepository.findAllOrderDetails();
    }

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
            ProductVariant variant = productVariantRepository.findById(itemDto.getVariantId()).orElse(null);
            if (variant == null) {
                return "Product variant not found: ID = " + itemDto.getVariantId();
            }
            OrderItem item = new OrderItem();
            item.setOrder(newOrder);
            item.setProductVariant(variant);
            item.setProductName(variant.getProduct().getName());
            item.setSku(variant.getSku());
            item.setQuantity((long) itemDto.getQuantity());
            item.setUnitPrice(variant.getPrice());
            item.setLineTotal(variant.getPrice().multiply(java.math.BigDecimal.valueOf(itemDto.getQuantity())));

            orderItemRepository.save(item);
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

            item.setProductVariant(variant);
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
}
