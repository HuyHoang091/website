package com.game.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrder_Id(Long orderId);
}
