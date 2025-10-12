import { TrashIcon, PlusIcon, MinusIcon } from './Icons';
import formatCurrency from '../../utils/formatCurrency';

const CartItemCard = ({ item, onUpdateQuantity, onRemoveItem, isSelected, onSelectItem }) => {
    const handleQuantityChange = (newQuantity) => {
        if (newQuantity >= 1) {
            onUpdateQuantity(item.id, newQuantity);
        }
    };

    return (
        <div className={`cart-item-card ${isSelected ? 'selected' : ''}`}>
            <div className="cart-item-content">
                <div className="item-checkbox-col">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectItem(item.id, e.target.checked)}
                        className="checkbox"
                    />
                </div>
                <div>
                    <div className="item-image-wrapper">
                        <img 
                            src={item.url} 
                            alt={item.name}
                            className="item-image"
                        />
                    </div>
                </div>
                <div className="item-info">
                    <div className="item-info-top">
                        <div className="item-details">
                            <h3>{item.name}</h3>
                            <p className="item-brand">{item.brand}</p>
                            <div className="item-specs">
                                <span>Kích cỡ: <span>{item.size}</span></span>
                                <span>Màu: <span>{item.color.split(",")[0].trim()}</span></span>
                            </div>
                        </div>
                        <div className="item-price">
                            <p>{formatCurrency(item.priceAtAdd)}</p>
                        </div>
                    </div>
                    <div className="item-actions">
                        <div className="quantity-control">
                            <span className="quantity-label">Số lượng:</span>
                            <div className="quantity-buttons">
                                <button
                                    onClick={() => handleQuantityChange(item.quantity - 1)}
                                    className="quantity-btn"
                                    disabled={item.quantity <= 1}
                                >
                                    <MinusIcon />
                                </button>
                                <span className="quantity-value">{item.quantity}</span>
                                <button
                                    onClick={() => handleQuantityChange(item.quantity + 1)}
                                    className="quantity-btn"
                                >
                                    <PlusIcon />
                                </button>
                            </div>
                        </div>
                        <button onClick={() => onRemoveItem(item.id)} className="remove-btn">
                            <TrashIcon />
                            <span>Xóa</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItemCard;