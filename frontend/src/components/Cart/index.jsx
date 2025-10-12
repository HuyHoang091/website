// index.jsx
import React, { useState } from 'react';
import CartItemCard from './CartItemCard';
import CartSummary from './CartSummary';
import EmptyCart from './EmptyCart';
import { ShoppingCartIcon, ArrowLeftIcon } from './Icons';

// Mock data
const initialCartData = [
  {
    id: 1,
    name: "Áo Thun Nam Cotton Premium",
    size: "L",
    color: "Đen",
    url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
    brand: "Coolmate",
    quantity: 2,
    price_at_add: 199000
  },
  // ... các sản phẩm khác
];

const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState(initialCartData);
  const [selectedItems, setSelectedItems] = useState(new Set(initialCartData.map(item => item.id)));

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedItemsCount = Array.from(selectedItems).length;

  const handleUpdateQuantity = (itemId, newQuantity) => {
    setCartItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(items => items.filter(item => item.id !== itemId));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const handleSelectItem = (itemId, isSelected) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleContinueShopping = () => {
    alert('Chuyển đến trang sản phẩm...');
  };

  const handleCheckout = () => {
    alert('Chuyển đến trang thanh toán...');
  };

  if (cartItems.length === 0) {
    return <EmptyCart onContinueShopping={handleContinueShopping} />;
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <ShoppingCartIcon />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
              <p className="text-gray-600 mt-1">
                {totalItems} sản phẩm trong giỏ hàng • {selectedItemsCount} đã chọn
              </p>
            </div>
          </div>
          <button
            onClick={handleContinueShopping}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            <ArrowLeftIcon />
            Tiếp tục mua sắm
          </button>
        </div>

        {/* Select All */}
        <div className="bg-white rounded-xl cart-shadow p-4 mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedItemsCount === cartItems.length && cartItems.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="font-medium text-gray-900">
              Chọn tất cả ({cartItems.length} sản phẩm)
            </span>
          </label>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                isSelected={selectedItems.has(item.id)}
                onSelectItem={handleSelectItem}
              />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              items={cartItems}
              selectedItems={selectedItems}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;