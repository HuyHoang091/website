// CartSummary.jsx
import React from 'react';
import { formatCurrency } from './utils';

const CartSummary = ({ items, selectedItems, onCheckout }) => {
  const selectedItemsData = items.filter(item => selectedItems.has(item.id));
  const subtotal = selectedItemsData.reduce((sum, item) => sum + (item.price_at_add * item.quantity), 0);
  const shipping = subtotal > 500000 ? 0 : 30000; // Free shipping over 500k
  const total = subtotal + shipping;

  return (
    <div className="bg-white rounded-xl cart-shadow p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Tổng kết đơn hàng</h3>
      <p className="text-sm text-gray-600 mb-4">
        {selectedItemsData.length} sản phẩm được chọn
      </p>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Tạm tính</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Phí vận chuyển</span>
          <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
            {shipping === 0 ? "Miễn phí" : formatCurrency(shipping)}
          </span>
        </div>
        {shipping === 0 && (
          <p className="text-sm text-green-600">🎉 Bạn được miễn phí vận chuyển!</p>
        )}
        <hr className="border-gray-200" />
        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Tổng cộng</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={selectedItemsData.length === 0}
        className={`w-full font-semibold py-4 px-6 rounded-xl transition-colors duration-200 mb-4 ${
          selectedItemsData.length === 0 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {selectedItemsData.length === 0 
          ? 'Chọn sản phẩm để thanh toán' 
          : 'Tiến hành thanh toán'
        }
      </button>

      <p className="text-xs text-gray-500 text-center">
        Bằng cách thanh toán, bạn đồng ý với điều khoản sử dụng của chúng tôi
      </p>
    </div>
  );
};

export default CartSummary;