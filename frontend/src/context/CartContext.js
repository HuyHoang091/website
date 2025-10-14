import React, { createContext, useState } from "react";

// Tạo Context
export const CartContext = createContext();

// Tạo Provider để bao bọc ứng dụng
export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);

    return (
        <CartContext.Provider value={{ cartCount, setCartCount }}>
            {children}
        </CartContext.Provider>
    );
};