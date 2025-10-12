package com.web.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.web.Model.Cart;
import com.web.Model.CartItem;
import com.web.Model.Product;
import com.web.Model.ProductVariant;
import com.web.Model.User;
import com.web.Repository.CartItemRepository;
import com.web.Repository.CartRepository;
import com.web.Repository.ProductVariantRepository;

@Service
public class CartService {
    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

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

    public boolean addCartItem(Map<String, Object> cartItem) {
        if (cartItem.get("userId") == null) {
            return false;
        }

        Long userId = Long.valueOf(cartItem.get("userId").toString());

        // Lấy hoặc tạo Cart
        Cart cart = cartRepository.findByUser_Id(userId);
        if (cart == null) {
            User user = userService.getUserById(userId);
            cart = new Cart();
            cart.setUser(user);
            cart = cartRepository.save(cart);
        }

        // Lấy ProductVariant
        ProductVariant variant = null;
        if (cartItem.get("variantId") != null) {
            variant = productVariantRepository.findById(Long.valueOf(cartItem.get("variantId").toString())).orElse(null);
        }
        if (variant == null) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(Long.valueOf(cartItem.get("productId").toString()));
            if (!variants.isEmpty()) {
                variant = variants.get(0);
            } else {
                return false;
            }
        }

        // Tìm CartItem đã có variantId trong giỏ hàng
        CartItem existingItem = cartItemRepository.findByCartIdAndProductVariantId(cart.getId(), variant.getId());

        if (existingItem != null) {
            // Nếu đã có thì tăng số lượng
            Long currentQty = existingItem.getQuantity();
            Long addQty = Long.valueOf(cartItem.get("quantity").toString());
            existingItem.setQuantity(currentQty + addQty);
            cartItemRepository.save(existingItem);
        } else {
            // Nếu chưa có thì tạo mới
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProductVariant(variant);
            newItem.setQuantity(Long.valueOf(cartItem.get("quantity").toString()));
            newItem.setPriceAtAdd(BigDecimal.valueOf(Double.valueOf(cartItem.get("priceAtAdd").toString())));
            cartItemRepository.save(newItem);
        }

        return true;
    }
}
