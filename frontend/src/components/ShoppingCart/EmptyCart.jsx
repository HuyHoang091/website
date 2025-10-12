import { ShoppingCartIcon } from './Icons';

const EmptyCart = ({ onContinueShopping }) => {
    return (
        <div className="empty-cart">
            <div className="container">
                <div className="empty-cart-content">
                    <ShoppingCartIcon />
                    <h2>Giỏ hàng trống</h2>
                    <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
                    <button onClick={onContinueShopping}>
                        Tiếp tục mua sắm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmptyCart;