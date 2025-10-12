import formatCurrency from '../../utils/formatCurrency';

const CartSummary = ({ items, selectedItems, onCheckout }) => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id));
    const subtotal = selectedItemsData.reduce((sum, item) => sum + (item.priceAtAdd * item.quantity), 0);
    const shipping = subtotal > 500000 ? 0 : 30000;
    const total = subtotal + shipping;

    return (
        <div className="cart-summary">
            <h3 className="summary-title">Tổng kết đơn hàng</h3>
            <p className="summary-subtitle">{selectedItemsData.length} sản phẩm được chọn</p>
            
            <div className="summary-details">
                <div className="summary-row">
                    <span>Tạm tính</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className={`summary-row ${shipping === 0 ? 'free-shipping' : ''}`}>
                    <span>Phí vận chuyển</span>
                    <span>{shipping === 0 ? "Miễn phí" : formatCurrency(shipping)}</span>
                </div>
                {shipping === 0 && (
                    <p className="free-shipping-note">🎉 Bạn được miễn phí vận chuyển!</p>
                )}
                <hr className="summary-divider" />
                <div className="summary-total">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(total)}</span>
                </div>
            </div>

            <button
                onClick={onCheckout}
                disabled={selectedItemsData.length === 0}
                className={`checkout-btn ${selectedItemsData.length === 0 ? 'disabled' : 'enabled'}`}
            >
                {selectedItemsData.length === 0 
                    ? 'Chọn sản phẩm để thanh toán' 
                    : 'Tiến hành thanh toán'
                }
            </button>

            <p className="terms-note">
                Bằng cách thanh toán, bạn đồng ý với điều khoản sử dụng của chúng tôi
            </p>
        </div>
    );
};

export default CartSummary;