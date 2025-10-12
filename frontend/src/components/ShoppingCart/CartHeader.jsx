import { ShoppingCartIcon, ArrowLeftIcon } from './Icons';

const CartHeader = ({ totalItems, selectedItemsCount, onContinueShopping }) => {
    return (
        <div className="header">
            <div className="header-content">
                <ShoppingCartIcon />
                <div className="header-title">
                    <h1>Giỏ hàng của bạn</h1>
                    <p>{totalItems} sản phẩm trong giỏ hàng • {selectedItemsCount} đã chọn</p>
                </div>
            </div>
            <button onClick={onContinueShopping} className="continue-shopping-btn">
                <ArrowLeftIcon />
                Tiếp tục mua sắm
            </button>
        </div>
    );
};

export default CartHeader;