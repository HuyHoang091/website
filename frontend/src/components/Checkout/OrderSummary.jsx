import formatCurrency from '../../utils/formatCurrency';

const OrderSummary = ({ subtotal, shippingFee, total, itemCount, onPlaceOrder }) => {
    return (
        <div className="order-summary">
            <h3 className="summary-title">Thông tin đơn hàng</h3>
            
            <div className="summary-details">
                <div className="summary-row">
                    <span>Tạm tính ({itemCount} sản phẩm)</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="summary-row">
                    <span>Phí vận chuyển</span>
                    <span>{formatCurrency(shippingFee)}</span>
                </div>
                <hr className="summary-divider" />
                <div className="summary-total">
                    <span>Tổng cộng</span>
                    <span className="total-amount">{formatCurrency(total)}</span>
                </div>
            </div>

            <button onClick={onPlaceOrder} className="place-order-btn">
                Đặt hàng
            </button>

            <div className="order-note">
                <p>Bằng cách đặt hàng, bạn đồng ý với:</p>
                <ul>
                    <li>Điều khoản sử dụng</li>
                    <li>Chính sách bảo mật</li>
                    <li>Chính sách đổi trả hàng</li>
                </ul>
            </div>
        </div>
    );
};

export default OrderSummary;