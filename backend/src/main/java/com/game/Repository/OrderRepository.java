package com.game.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser_Id(Long userId);
}
