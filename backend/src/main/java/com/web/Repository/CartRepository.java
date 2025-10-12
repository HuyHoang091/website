package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Model.Cart;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Cart findByUser_Id(Long userId);
    Cart findByToken(String token);
}