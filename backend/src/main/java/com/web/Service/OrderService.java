package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.Order;
import com.web.Repository.OrderRepository;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Cacheable(value = "orders", key = "#userId")
    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUser_Id(userId);
    }

    @CacheEvict(value = "orders", key = "#order.user.id")
    public Order createOrder(Order order) {
        return orderRepository.save(order);
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
        if (oldOrder == null) return null;
        newOrder.setId(oldOrder.getId());
        return orderRepository.save(newOrder);
    }
}
