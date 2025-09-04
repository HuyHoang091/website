package com.game.Service;

import com.game.Model.OrderItem;
import com.game.Repository.OrderItemRepository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class OrderItemService {
    @Autowired
    private OrderItemRepository orderItemRepository;

    @Cacheable(value = "orderItems", key = "#orderId")
    public List<OrderItem> getOrderItemsByOrderId(Long orderId) {
        return orderItemRepository.findByOrder_Id(orderId);
    }

    @CacheEvict(value = "orderItems", key = "#orderItem.order.id")
    public OrderItem createOrderItem(OrderItem orderItem) {
        return orderItemRepository.save(orderItem);
    }

    @CacheEvict(value = "orderItems", key = "#orderId")
    public boolean deleteOrderItem(Long id, Long orderId) {
        OrderItem orderItem = orderItemRepository.findById(id).orElse(null);
        if (orderItem == null || !orderItem.getOrder().getId().equals(orderId)) {
            return false;
        }
        orderItemRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "orderItems", key = "#newOrderItem.order.id")
    public OrderItem updateOrderItem(Long id, OrderItem newOrderItem) {
        OrderItem oldOrderItem = orderItemRepository.findById(id).orElse(null);
        if (oldOrderItem == null) return null;
        newOrderItem.setId(oldOrderItem.getId());
        return orderItemRepository.save(newOrderItem);
    }
}
