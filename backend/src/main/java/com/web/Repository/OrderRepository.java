package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser_Id(Long userId);
}
