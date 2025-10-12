// Cart.jsx
import React from 'react';
import ShoppingCart from '../components/Cart';
import '../styles/cart.css'; // Import CSS cô lập

const CartPage = () => {
  return (
    <div className="cart-container">
      <ShoppingCart />
    </div>
  );
};

export default CartPage;