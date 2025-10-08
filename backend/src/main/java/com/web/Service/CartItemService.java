package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Dto.CartItemDTO;
import com.web.Model.CartItem;
import com.web.Repository.CartItemRepository;

@Service
public class CartItemService {
    @Autowired
    private CartItemRepository cartItemRepository;

    @Cacheable(value = "cartItems", key = "#cartId")
    public List<CartItemDTO> getCartItems(Long cartId) {
        return cartItemRepository.findCartItemsByCartId(cartId);
    }

    @CacheEvict(value = "cartItems", key = "#cartItem.cart.id")
    public CartItem createCartItem(CartItem cartItem) {
        return cartItemRepository.save(cartItem);
    }

    @CacheEvict(value = "cartItems", key = "#cartId")
    public boolean deleteCartItem(Long id, Long cartId) {
        CartItem cartItem = cartItemRepository.findById(id).orElse(null);
        if (cartItem == null || !cartItem.getCart().getId().equals(cartId)) {
            return false;
        }
        cartItemRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "cartItems", key = "#newCartItem.cart.id")
    public CartItem updateCartItem(Long id, CartItem newCartItem) {
        CartItem oldCartItem = cartItemRepository.findById(id).orElse(null);
        if (oldCartItem == null) return null;
        newCartItem.setId(oldCartItem.getId());
        return cartItemRepository.save(newCartItem);
    }
}
