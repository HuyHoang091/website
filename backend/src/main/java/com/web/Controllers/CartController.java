package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.web.Dto.CartItemDTO;
import com.web.Model.Cart;
import com.web.Model.CartItem;
import com.web.Model.User;
import com.web.Repository.CartItemRepository;
import com.web.Repository.CartRepository;
import com.web.Repository.UserRepository;
import com.web.Service.CartItemService;
import com.web.Service.CartService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    @Autowired
    private CartItemService cartItemService;

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("list/{userId}/items")
    public List<CartItemDTO> getCartItems(@PathVariable String userId) {
        Cart cart = null;

        try {
            // Nếu userId là số, coi là user đã login
            Long userIdLong = Long.valueOf(userId);
            cart = cartRepository.findByUser_Id(userIdLong);

            // Nếu không tìm thấy, thử tìm theo token (tức là fallback cho trường hợp "user
            // có token giống id")
            if (cart == null) {
                cart = cartRepository.findByToken(userId);
            }

            // Nếu chưa có cart thì tạo mới
            if (cart == null) {
                cart = new Cart();
                User user = userRepository.findById(userIdLong).orElse(null);
                if (user != null) {
                    cart.setUser(user);
                } else {
                    cart.setToken(userId);
                }
                cart = cartRepository.save(cart);
            }
        } catch (NumberFormatException e) {
            // userId không phải là số => là token (guest)
            cart = cartRepository.findByToken(userId);
            if (cart == null) {
                cart = new Cart();
                cart.setToken(userId);
                try {
                    cart = cartRepository.save(cart);
                } catch (Exception ex) {
                    return List.of(); // Có thể log lỗi nếu cần
                }
            }
        }

        List<CartItemDTO> items = cartItemService.getCartItems(cart.getId());
        return items != null ? items : List.of();
    }

    @PostMapping("add")
    public ResponseEntity<?> addCartItem(@RequestBody Map<String, Object> cartItem) {
        cartService.addCartItem(cartItem);
        return ResponseEntity.ok().build();
    }

    @PutMapping("items/{itemId}/quantity")
    public ResponseEntity<?> updateItemQuantity(
            @PathVariable Long itemId,
            @RequestBody Map<String, Object> payload) {

        Number quantityValue = (Number) payload.get("quantity");
        if (quantityValue == null) {
            return ResponseEntity.badRequest().body("Missing quantity");
        }

        long quantity = quantityValue.longValue();
        if (quantity <= 0) {
            cartItemRepository.deleteById(itemId);
            return ResponseEntity.ok().build();
        }
        CartItem cartItem = cartItemRepository.findById(itemId).orElse(null);
        if (cartItem == null) {
            return ResponseEntity.notFound().build();
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("items/{itemId}")
    public ResponseEntity<?> deleteCartItem(@PathVariable Long itemId) {
        boolean exists = cartItemRepository.existsById(itemId);
        if (!exists) {
            return ResponseEntity.notFound().build();
        }
        cartItemRepository.deleteById(itemId);

        return ResponseEntity.ok().build();
    }
}