// CartItemCard.jsx
import React from 'react';
import { TrashIcon, PlusIcon, MinusIcon } from './Icons';
import { formatCurrency } from './utils';

const CartItemCard = ({ item, onUpdateQuantity, onRemoveItem, isSelected, onSelectItem }) => {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className={`cart-bg-white cart-rounded-xl cart-shadow cart-hover:cart-shadow-hover cart-transition-all cart-duration-300 cart-p-6 cart-group ${isSelected ? 'cart-ring-2 cart-ring-blue-500' : ''}`}>
      <div className="cart-flex cart-flex-col cart-md:cart-flex-row cart-gap-6">
        {/* Checkbox */}
        <div className="cart-flex-shrink-0 cart-flex cart-items-start cart-pt-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectItem(item.id, e.target.checked)}
            className="cart-w-5 cart-h-5 cart-text-blue-600 cart-border-gray-300 cart-rounded cart-focus:cart-ring-blue-500 cart-focus:cart-ring-2"
          />
        </div>
        
        {/* Product Image */}
        <div className="cart-flex-shrink-0">
          <div className="cart-w-32 cart-h-32 cart-md:cart-w-24 cart-md:cart-h-24 cart-rounded-lg cart-overflow-hidden cart-bg-gray-100">
            <img 
              src={item.url} 
              alt={item.name}
              className="cart-w-full cart-h-full cart-object-cover cart-group-hover:cart-scale-105 cart-transition-transform cart-duration-300"
              onError={(e) => {
                e.target.src = '';
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="cart-w-full cart-h-full cart-bg-gray-200 cart-flex cart-items-center cart-justify-center cart-text-gray-400 cart-text-sm">Ảnh</div>';
              }}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="cart-flex-1 cart-min-w-0">
          {/* Product details */}
          <div className="cart-flex cart-flex-col cart-md:cart-flex-row cart-md:cart-justify-between cart-md:cart-items-start cart-gap-4">
            <div className="cart-flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 mb-2">{item.brand}</p>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Kích cỡ: <span className="font-medium">{item.size}</span></span>
                <span>Màu: <span className="font-medium">{item.color}</span></span>
              </div>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(item.price_at_add)}
              </p>
            </div>
          </div>

          {/* Quantity and Remove */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Số lượng:</span>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  className="p-2 hover:bg-gray-50 transition-colors duration-200 rounded-l-lg"
                  disabled={item.quantity <= 1}
                >
                  <MinusIcon />
                </button>
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="p-2 hover:bg-gray-50 transition-colors duration-200 rounded-r-lg"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>

            <button
              onClick={() => onRemoveItem(item.id)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-200"
            >
              <TrashIcon />
              <span className="text-sm font-medium">Xóa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;