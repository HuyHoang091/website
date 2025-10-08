package com.web.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.web.Dto.CartItemDTO;
import com.web.Service.CartItemService;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    @Autowired
    private CartItemService cartItemService;

    @GetMapping("list/{cartId}/items")
    public List<CartItemDTO> getCartItems(@PathVariable Long cartId) {
        return cartItemService.getCartItems(cartId);
    }
}