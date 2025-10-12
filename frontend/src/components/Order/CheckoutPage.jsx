import { useState } from 'react';
import AddressSection from './AddressSection';
import ProductList from './ProductList';
import ShippingMethod from './ShippingMethod';
import PaymentMethod from './PaymentMethod';
import OrderSummary from './OrderSummary';
import '../../assets/styles/components/Order/CheckoutPage.css';

const CheckoutPage = () => {
    const [selectedAddress, setSelectedAddress] = useState({
        id: 1,
        name: "Nguyễn Văn A",
        phone: "0123456789",
        address: "123 Đường ABC, Phường XYZ",
        city: "Hà Nội",
        isDefault: true
    });

    const [orderItems] = useState([
        {
            id: 1,
            name: "Áo Thun Nam Cotton Premium",
            size: "L",
            color: "Đen",
            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
            brand: "Coolmate",
            quantity: 2,
            price: 199000
        },
        {
            id: 2,
            name: "Quần Jeans Slim Fit",
            size: "32",
            color: "Xanh đậm",
            url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center",
            brand: "Levi's",
            quantity: 1,
            price: 899000
        }
    ]);

    const [selectedShipping, setSelectedShipping] = useState('standard');
    const [selectedPayment, setSelectedPayment] = useState('cod');

    const shippingMethods = [
        {
            id: 'standard',
            name: 'Giao hàng tiêu chuẩn',
            time: '3-5 ngày',
            price: 30000,
            description: 'Giao hàng trong giờ hành chính'
        },
        {
            id: 'express',
            name: 'Giao hàng nhanh',
            time: '1-2 ngày',
            price: 50000,
            description: 'Giao hàng ưu tiên, nhanh chóng'
        },
        {
            id: 'super_express',
            name: 'Giao hàng hỏa tốc',
            time: '2-4 giờ',
            price: 100000,
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

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = shippingMethods.find(m => m.id === selectedShipping)?.price || 0;
    const total = subtotal + shippingFee;

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <div className="checkout-header">
                    <h1>Thanh toán đơn hàng</h1>
                    <p>Vui lòng kiểm tra thông tin trước khi đặt hàng</p>
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