package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrder_Id(Long orderId);

    
}
