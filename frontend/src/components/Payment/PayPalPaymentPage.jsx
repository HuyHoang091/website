import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentHeader from './PaymentHeader';
import AmountInput from './AmountInput';
import ConversionInfo from './ConversionInfo';
import PayPalButton from './PayPalButton';
import SuccessMessage from './SuccessMessage';
import SecurityBadge from './SecurityBadge';
import { getVNDtoUSDRate } from './currencyService';
import axios from 'axios';
import './PayPalPayment.css';

const PayPalPaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { amount = 100000, paymentMethod = 'credit_card', orderItems = [], 
            shippingAddress = {}, shippingMethod = {} } = location.state || {};
            
    const [vndAmount, setVndAmount] = useState(amount);
    const [currentRate, setCurrentRate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(null);
    
    const paymentTitle = paymentMethod === 'credit_card' 
        ? 'Thanh toán bằng thẻ tín dụng' 
        : 'Thanh toán qua ví điện tử';

    useEffect(() => {
        const fetchRate = async () => {
            const rate = await getVNDtoUSDRate();
            setCurrentRate(rate);
            console.log('Fetched exchange rate:', rate);
        };
        fetchRate();
    }, []);

    useEffect(() => {
        console.log('Updated currentRate:', currentRate);
        console.log('Order items:', orderItems);
    }, [currentRate]);

    const handleAmountChange = (newAmount) => {
        setVndAmount(newAmount);
    };

    const CreditCardIcon = () => (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    );

    const handlePaymentSuccess = async (details) => {
        try {
            const userId = JSON.parse(localStorage.getItem("user")).id;
            const name = JSON.parse(localStorage.getItem("user")).fullName;
            const addressId = shippingAddress.id;

            const captureId = details.purchase_units[0].payments.captures[0].id;
            console.log('Payment capture ID:', captureId);
            // Tạo đơn hàng
            const orderResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/orders/create`, {
                userId: userId,
                addressId: addressId,
                status: 'paid',
                createBy: name,
                note: '',
                items: orderItems.map(item => ({
                    id: item.id.toString(),
                    variantId: item.variantId.toString(),
                    quantity: item.quantity.toString()
                }))
            });

            const orderId = orderResponse.data; // Lấy order_id từ phản hồi API
            console.log('Order created successfully:', orderResponse.data);

            // Tạo thanh toán
            const paymentResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/payment/create`, {
                order: { id: orderId },
                method: paymentMethod,
                amount: vndAmount,
                status: 'success',
                captureId: captureId
            });

            console.log('Payment created successfully:', paymentResponse.data);

            // Hiển thị thông báo thanh toán thành công
            setPaymentSuccess({
                payerName: `${details.payer.name.given_name} ${details.payer.name.surname}`,
                amount: details.purchase_units[0].amount.value
            });

            // Sau 3 giây chuyển về trang đơn hàng
            setTimeout(() => {
                navigate('/');
            }, 5000);
        } catch (error) {
            console.error('Error creating order or payment:', error);
            alert('Đã xảy ra lỗi khi tạo đơn hàng hoặc thanh toán. Vui lòng thử lại.');
        }
    };

    const usdAmount = currentRate ? (vndAmount * currentRate).toFixed(2) : 0;
    
    const renderOrderSummary = () => {
        if (!orderItems || orderItems.length === 0) return null;
        
        return (
            <div className="order-summary">
                <h3>Thông tin đơn hàng</h3>
                <div className="summary-items">
                    <p>{orderItems.length} sản phẩm</p>
                    <p>Địa chỉ: {shippingAddress.detail}</p>
                    <p>Phương thức vận chuyển: {shippingMethod.name}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="paypal-payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        &larr; Quay lại
                    </button>
                    <div className="header-content">
                        <div className="payment-icon"><CreditCardIcon /></div>
                        <h1>{paymentTitle}</h1>
                        <p>Vui lòng hoàn tất thanh toán để hoàn thành đơn hàng</p>
                    </div>
                </div>

                <div className="payment-body">
                    {renderOrderSummary()}
                    
                    <div className="payment-amount">
                        <h3>Tổng thanh toán:</h3>
                        <div className="amount-display">{vndAmount.toLocaleString('vi-VN')} VND</div>
                    </div>

                    <ConversionInfo 
                        rate={currentRate}
                        vndAmount={vndAmount}
                        usdAmount={usdAmount}
                    />

                    <div className="info-box">
                        <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="info-text">
                            Thanh toán được xử lý an toàn qua cổng PayPal. Bạn không cần tài khoản PayPal để thanh toán.
                        </div>
                    </div>

                    {isLoading && (
                        <div className="loader active">
                            <div className="spinner"></div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                Đang xử lý thanh toán...
                            </p>
                        </div>
                    )}

                    {currentRate && !paymentSuccess && (
                        <PayPalButton
                            vndAmount={vndAmount}
                            currentRate={currentRate}
                            onLoadingChange={setIsLoading}
                            onSuccess={handlePaymentSuccess}
                            method={paymentMethod}
                        />
                    )}

                    {!currentRate && !isLoading && (
                        <div className="loading-message">Đang tải thông tin thanh toán...</div>
                    )}

                    {paymentSuccess && (
                        <SuccessMessage 
                            payerName={paymentSuccess.payerName}
                            amount={paymentSuccess.amount}
                        />
                    )}

                    <SecurityBadge />
                </div>
            </div>
        </div>
    );
};

export default PayPalPaymentPage;