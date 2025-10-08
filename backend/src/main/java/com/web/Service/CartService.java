package com.web.Service;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.Cart;
import com.web.Repository.CartRepository;

@Service
public class CartService {
    @Autowired
    private CartRepository cartRepository;

    @Cacheable(value = "carts", key = "#userId")
    public List<Cart> getCartByUserId(Long userId) {
        return cartRepository.findByUser_Id(userId);
    }

    @CacheEvict(value = "carts", key = "#cart.user.id")
    public Cart createCart(Cart cart) {
        return cartRepository.save(cart);
    }

    @CacheEvict(value = "carts", key = "#userId")
    public boolean deleteCart(Long id, Long userId) {
        Cart cart = cartRepository.findById(id).orElse(null);
        if (cart == null || !cart.getUser().getId().equals(userId)) {
            return false;
        }
        cartRepository.deleteById(id);
        return true;
    }

    @Transactional
    @CacheEvict(value = "carts", key = "#newCart.user.id")
    public Cart updateCart(Long id, Cart newCart) {
        Cart oldCart = cartRepository.findById(id).orElse(null);
        if (oldCart == null) return null;
        newCart.setId(oldCart.getId());
        return cartRepository.save(newCart);
    }
}
