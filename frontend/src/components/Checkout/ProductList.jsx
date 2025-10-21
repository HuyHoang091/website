import formatCurrency from '../../utils/formatCurrency';

const PackageIcon = () => (
    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const ProductList = ({ items }) => {
    return (
        <div className="checkout-section">
            <div className="section-header">
                <div className="section-title">
                    <PackageIcon />
                    <h2>Sản phẩm đã chọn</h2>
                    <span className="item-count">({items.length} sản phẩm)</span>
                </div>
            </div>

            <div className="product-list">
                {items.map(item => (
                    <div key={item.id} className="product-item">
                        <div className="product-image-wrapper">
                            <img src={item.url} alt={item.name} className="product-image" />
                            <span className="product-quantity">{item.quantity}</span>
                        </div>
                        <div className="product-info">
                            <h3 className="product-name">{item.name}</h3>
                            <p className="product-brand">{item.brand}</p>
                            <div className="product-specs">
                                <span>Kích cỡ: {item.size}</span>
                                <span>•</span>
                                <span>Màu: {item.color.split(",")[0].trim()}</span>
                            </div>
                        </div>
                        <div className="product-price">
                            <p className="price-value">{formatCurrency(item.priceAtAdd)}</p>
                            <p className="price-total">
                                Tổng: {formatCurrency(item.priceAtAdd * item.quantity)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductList;