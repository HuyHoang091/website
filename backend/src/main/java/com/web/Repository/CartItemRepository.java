package com.web.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import com.web.Dto.CartItemDTO;
import com.web.Model.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCart_Id(Long cartId);

    @Query("SELECT new com.web.Dto.CartItemDTO( " +
        "ci.id, " +
        "p.name, " +
        "pv.size, " +
        "pv.color, " +
        "(SELECT pi.url FROM ProductImage pi WHERE pi.product.id = p.id AND pi.sortOrder = 1), " +
        "b.name, " +
        "ci.quantity, " +
        "ci.priceAtAdd) " +
        "FROM CartItem ci " +
        "JOIN ci.productVariant pv " +
        "JOIN pv.product p " +
        "LEFT JOIN p.brand b " +
        "WHERE ci.cart.id = :cartId")
    List<CartItemDTO> findCartItemsByCartId(@Param("cartId") Long cartId);
}
