import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../ShoppingCart/Icons';
import AddressSection from './AddressSection';
import ProductList from './ProductList';
import ShippingMethod from './ShippingMethod';
import PaymentMethod from './PaymentMethod';
import OrderSummary from './OrderSummary';
import '../../assets/styles/components/Order/CheckoutPage.css';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { items: incomingItems = [] } = location.state || {};

    const [selectedAddress, setSelectedAddress] = useState({
        id: 1,
        name: "Nguyễn Văn A",
        phone: "0123456789",
        address: "123 Đường ABC, Phường XYZ",
        city: "Hà Nội",
        isDefault: true
    });

    const [orderItems, setOrderItems] = useState(() => {
        if (incomingItems.length > 0) {
            return incomingItems;
        }
        return [
            {
                id: 1,
                name: "Áo Thun Nam Cotton Premium",
                size: "L",
                color: "Đen",
                url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
                brand: "Coolmate",
                quantity: 2,
                priceAtAdd: 199000
            },
            {
                id: 2,
                name: "Quần Jeans Slim Fit",
                size: "32",
                color: "Xanh đậm",
                url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center",
                brand: "Levi's",
                quantity: 1,
                priceAtAdd: 899000
            }
        ];
    });

    const [selectedShipping, setSelectedShipping] = useState('standard');
    const [selectedPayment, setSelectedPayment] = useState('cod');

    const shippingMethods = [
        {
            id: 'standard',
            name: 'Giao hàng tiêu chuẩn',
            time: '3-5 ngày',
            priceAtAdd: 30000,
            description: 'Giao hàng trong giờ hành chính'
        },
        {
            id: 'express',
            name: 'Giao hàng nhanh',
            time: '1-2 ngày',
            priceAtAdd: 50000,
            description: 'Giao hàng ưu tiên, nhanh chóng'
        },
        {
            id: 'super_express',
            name: 'Giao hàng hỏa tốc',
            time: '2-4 giờ',
            priceAtAdd: 100000,
            description: 'Giao hàng trong ngày (nội thành)'
        }
    ];

    const paymentMethods = [
        {
            id: 'cod',
            name: 'Thanh toán khi nhận hàng (COD)',
            description: 'Thanh toán bằng tiền mặt khi nhận hàng',
            icon: '💵'
        },
        {
            id: 'bank_transfer',
            name: 'Chuyển khoản ngân hàng',
            description: 'Chuyển khoản qua ATM/Internet Banking',
            icon: '🏦'
        },
        {
            id: 'credit_card',
            name: 'Thẻ tín dụng/Ghi nợ',
            description: 'Visa, Mastercard, JCB',
            icon: '💳'
        },
        {
            id: 'e_wallet',
            name: 'Ví điện tử',
            description: 'MoMo, ZaloPay, VNPay',
            icon: '📱'
        }
    ];

    const handlePlaceOrder = () => {
        alert('Đặt hàng thành công!');
    };

    const subtotal = useMemo(
        () => orderItems.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0),
        [orderItems]
    );
    const shippingFee = shippingMethods.find(m => m.id === selectedShipping)?.priceAtAdd || 0;
    const total = subtotal + shippingFee;

    if (incomingItems.length === 0 && orderItems.length === 0) {
        return (
            <div className="checkout-page">
                <p>Không có sản phẩm để thanh toán.</p>
                <button onClick={() => navigate('/cart')}>Quay lại giỏ hàng</button>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <div className="checkout-header" >
                    <p>
                        <h1>Thanh toán đơn hàng</h1>
                        <p>Vui lòng kiểm tra thông tin trước khi đặt hàng</p>
                    </p>
                    <button onClick={() => navigate('/cart')} className="continue-shopping-btn">
                        <ArrowLeftIcon />
                        Quay lại giỏ hàng
                    </button>
                </div>

                <div className="checkout-grid">
                    <div className="checkout-left">
                        <AddressSection 
                            selectedAddress={selectedAddress}
                            onChangeAddress={() => alert('Mở modal chọn địa chỉ')}
                        />

                        <ProductList items={orderItems} />

                        <ShippingMethod
                            methods={shippingMethods}
                            selected={selectedShipping}
                            onSelect={setSelectedShipping}
                        />

                        <PaymentMethod
                            methods={paymentMethods}
                            selected={selectedPayment}
                            onSelect={setSelectedPayment}
                        />
                    </div>

                    <div className="checkout-right">
                        <OrderSummary
                            subtotal={subtotal}
                            shippingFee={shippingFee}
                            total={total}
                            itemCount={orderItems.length}
                            onPlaceOrder={handlePlaceOrder}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;