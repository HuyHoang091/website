import { useEffect, useRef } from 'react';
import { generateSignature } from './securityService';

const PayPalButton = ({ vndAmount, currentRate, onLoadingChange, onSuccess, method }) => {
    const paypalRef = useRef(null);
    const buttonsRendered = useRef(false);

    const currentRateRef = useRef(currentRate);
    const vndAmountRef = useRef(vndAmount);

    useEffect(() => {
        currentRateRef.current = currentRate;
        vndAmountRef.current = vndAmount;
    }, [currentRate, vndAmount]);

    useEffect(() => {
        if (buttonsRendered.current || !window.paypal) return;

        const renderPayPalButtons = () => {
            const fundingSource =
                method === 'bank'
                    ? window.paypal.FUNDING.CARD // chỉ thẻ
                    : window.paypal.FUNDING.PAYPAL; // hiển thị mặc định (cả PayPal + Thẻ)

            const buttonConfig = {
                fundingSource, // nếu undefined thì mặc định sẽ lấy tất cả
                createOrder: async (data, actions) => {
                    const currentVnd = vndAmountRef.current;
                    const rate = currentRateRef.current;

                    onLoadingChange(true);

                    if (!currentVnd || currentVnd < 1000) {
                        alert("Vui lòng nhập số tiền hợp lệ (tối thiểu 1,000 VND)");
                        onLoadingChange(false);
                        return;
                    }

                    if (!rate) {
                        alert("Không lấy được tỷ giá!");
                        onLoadingChange(false);
                        return;
                    }

                    const usdAmount = (currentVnd * rate).toFixed(2);
                    const timestamp = Date.now();
                    const signature = generateSignature(currentVnd, timestamp);

                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: usdAmount,
                                currency_code: "USD"
                            },
                            description: `Thanh toán ${currentVnd.toLocaleString('vi-VN')} VND`,
                            custom_id: `${timestamp}:${signature}`
                        }]
                    });
                },
                onApprove: (data, actions) => {
                    return actions.order.capture().then((details) => {
                        onLoadingChange(false);
                        if (details.status === "COMPLETED") {
                            onSuccess(details);
                            console.log("Chi tiết giao dịch:", details);
                        } else {
                            alert("Thanh toán chưa hoàn tất. Trạng thái: " + details.status);
                        }
                    });
                },
                onError: (err) => {
                    onLoadingChange(false);
                    console.error("Lỗi PayPal:", err);
                    alert("Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.");
                },
                onCancel: () => {
                    onLoadingChange(false);
                    alert("Bạn đã hủy thanh toán.");
                }
            };

            const button = window.paypal.Buttons(buttonConfig);

            if (button.isEligible()) {
                button.render(paypalRef.current);
                buttonsRendered.current = true;
            } else {
                console.warn("Phương thức không hỗ trợ thanh toán này.");
            }
        };

        if (window.paypal) {
            renderPayPalButtons();
        } else {
            const checkPayPal = setInterval(() => {
                if (window.paypal) {
                    renderPayPalButtons();
                    clearInterval(checkPayPal);
                }
            }, 100);

            return () => clearInterval(checkPayPal);
        }
    }, [onLoadingChange, onSuccess, method]);

    return <div ref={paypalRef} id="paypal-button-container" />;
};

export default PayPalButton;