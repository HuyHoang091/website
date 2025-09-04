package com.game.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.game.Model.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCart_Id(Long cartId);
}
