import { useState, useEffect, useContext } from 'react';
import RatingStars from './RatingStars';
import axios from 'axios';
import { CartContext } from "../../context/CartContext";
import { useNavigate } from 'react-router-dom';

const CheckIcon = () => (
    <svg className='feature-icon' fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const CheckIcon1 = () => (
    <svg className='color-check' fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const MinusIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
);

const PlusIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const ProductInfo = ({ product, slug }) => {
    const [selectedColor, setSelectedColor] = useState(product.color[0]);
    const [selectedSize, setSelectedSize] = useState(product.size[0]);
    const [quantity, setQuantity] = useState(1);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const { setCartCount } = useContext(CartContext);
    const navigate = useNavigate();

    const hasDiscount = product.price !== product.price_now;
    const discountPercent = hasDiscount 
        ? Math.round(((product.price - product.price_now) / product.price) * 100)
        : 0;

    // Lấy thông tin biến thể từ API
    useEffect(() => {
        const fetchVariants = async () => {
            try {
                setInventoryLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/products/inventory`);
                // Lọc các biến thể của sản phẩm hiện tại
                const productVariants = response.data.filter(
                    variant => variant.productId === product.id
                );
                setVariants(productVariants);
                setInventoryLoading(false);
            } catch (error) {
                console.error('Error fetching variants:', error);
                setInventoryLoading(false);
            }
        };
        
        fetchVariants();
    }, [product.id]);

    // Cập nhật biến thể đã chọn mỗi khi size hoặc color thay đổi
    useEffect(() => {
        if (!variants.length || inventoryLoading) return;
        
        // Tìm biến thể phù hợp với size và color đã chọn
        const variant = variants.find(v => {
            const colorName = selectedColor.name;
            const colorMatch = v.color.split(',')[0].trim() === colorName;
            const sizeMatch = v.size.split(',')[0].trim() === selectedSize;
            return colorMatch && sizeMatch;
        });
        
        if (variant) {
            setSelectedVariant(variant);
            
            // Giới hạn số lượng không vượt quá stock
            if (quantity > variant.stock) {
                setQuantity(variant.stock);
            }
        } else {
            setSelectedVariant(null);
        }
    }, [selectedColor, selectedSize, variants, inventoryLoading, quantity]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color);
    };

    const handleSizeSelect = (size) => {
        setSelectedSize(size);
    };

    const increaseQuantity = () => {
        if (selectedVariant && quantity < selectedVariant.stock) {
            setQuantity(prev => prev + 1);
        } else if (!selectedVariant) {
            setQuantity(prev => prev + 1);
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    // Hiển thị toast message
    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        
        // Tự động ẩn toast sau 3 giây
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    // Xử lý thêm vào giỏ hàng
    const handleAddToCart = async () => {
        try {
            if (!selectedVariant) {
                showToast('Không tìm thấy phiên bản sản phẩm phù hợp với size và màu đã chọn', 'error');
                return;
            }

            if (selectedVariant.stock < quantity) {
                showToast(`Chỉ còn ${selectedVariant.stock} sản phẩm trong kho`, 'warning');
                return;
            }

            setLoading(true);

            const userId = JSON.parse(localStorage.getItem('user')).id;
            const guestId = localStorage.getItem('guestToken');
            
            // Chuẩn bị payload
            const cartItem = {
                userId: userId || guestId,
                variantId: selectedVariant.variantId,
                productId: String(product.id),
                quantity: String(quantity),
                priceAtAdd: String(product.price_now)
            };
            
            // Gọi API thêm vào giỏ hàng
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/add`, cartItem);
            
            if (response.status === 200) {
                showToast(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`, 'success');
            }

            try {
				const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/list/${userId}/items`);
				const cartItems = response.data || [];
				setCartCount(cartItems.length);
			} catch (error) {
				console.error("Error fetching cart count:", error.response?.data || error.message);
			}
            
            setLoading(false);
        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng', 'error');
            setLoading(false);
        }
    };

    const handleBuyNow = () => {
        if (!selectedVariant) {
            showToast('Không tìm thấy phiên bản sản phẩm phù hợp với size và màu đã chọn', 'error');
            return;
        }

        if (selectedVariant.stock < quantity) {
            showToast(`Chỉ còn ${selectedVariant.stock} sản phẩm trong kho`, 'warning');
            return;
        }

        // Tạo dữ liệu cho item để chuyển đến trang checkout
        const checkoutItem = {
            id: selectedVariant.variantId,
            variantId: selectedVariant.variantId,
            name: product.name,
            size: selectedSize,
            color: selectedColor.name,
            url: selectedVariant.imageUrl || product.url,
            brand: selectedVariant.brand || product.brand || "",
            quantity: quantity,
            priceAtAdd: product.price_now,
            productId: product.id
        };

        // Chuyển hướng đến trang checkout với thông tin sản phẩm
        navigate('/order', {
            state: {
                items: [checkoutItem],
                fromBuyNow: true
            }
        });
    };

    return (
        <div className="product-info-detail">
            <div>
                <h1 className="product-title font-playfair">{product.name}</h1>
                <div className="rating-section">
                    <div className="stars">
                        <RatingStars rating={product.rating} size="large" />
                        <span className="rating-text-product">
                            {product.rating.toFixed(1)} ({product.number_review} đánh giá)
                        </span>
                    </div>
                </div>
            </div>

            <div className="price-section">
                <span className="current-price-product">{formatCurrency(product.price_now)}</span>
                {hasDiscount && (
                    <>
                        <span className="original-price">{formatCurrency(product.price)}</span>
                        <span className="discount-badge">-{discountPercent}%</span>
                    </>
                )}
            </div>

            <p className="description">{product.description}</p>

            {inventoryLoading ? (
                <div className="loading-variants">Đang tải thông tin sản phẩm...</div>
            ) : (
                <>
                    {/* Thông tin tồn kho */}
                    {selectedVariant && (
                        <div className="stock-info">
                            <span className={selectedVariant.stock > 0 ? "in-stock" : "out-of-stock"}>
                                {selectedVariant.stock > 0 
                                    ? `Còn hàng (${selectedVariant.stock} sản phẩm)` 
                                    : "Hết hàng"}
                            </span>
                        </div>
                    )}

                    {/* Color Selection */}
                    <div className="selection-section">
                        <h3 className="section-title">Màu sắc</h3>
                        <div className="color-options">
                            {product.color.map((color, index) => (
                                <div
                                    key={index}
                                    className={`color-option ${selectedColor.name === color.name ? 'active' : ''}`}
                                    style={{ background: color.code }}
                                    onClick={() => handleColorSelect(color)}
                                    title={color.name}
                                >
                                    {selectedColor.name === color.name && (
                                        <CheckIcon1 />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="selection-section">
                        <h3 className="section-title">Kích thước</h3>
                        <div className="size-options">
                            {product.size.map((size, index) => (
                                <div
                                    key={index}
                                    className={`size-option-product ${selectedSize === size ? 'active' : ''}`}
                                    onClick={() => handleSizeSelect(size)}
                                >
                                    {size}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="selection-section">
                        <h3 className="section-title">Số lượng</h3>
                        <div className="quantity-section">
                            <button 
                                className="quantity-btn" 
                                onClick={decreaseQuantity}
                                disabled={quantity <= 1}
                            >
                                <MinusIcon />
                            </button>
                            <span className="quantity-display">{quantity}</span>
                            <button 
                                className="quantity-btn" 
                                onClick={increaseQuantity}
                                disabled={selectedVariant && quantity >= selectedVariant.stock}
                            >
                                <PlusIcon />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button 
                            className="btn-product btn-primary-detail" 
                            onClick={handleBuyNow}
                            disabled={loading || !selectedVariant || selectedVariant.stock === 0}
                        >
                            {loading ? 'Đang xử lý...' : 'Mua ngay'}
                        </button>
                        <button 
                            className="btn-product btn-secondary-product" 
                            onClick={handleAddToCart}
                            disabled={loading || !selectedVariant || selectedVariant.stock === 0}
                        >
                            {loading ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
                        </button>
                    </div>
                </>
            )}

            {/* Features */}
            <div className="features-section">
                <h3 className="section-title">Đặc điểm nổi bật</h3>
                <ul className="features-list">
                    <li className="feature-item">
                        <CheckIcon />
                        <span>Chất liệu vải cao cấp nhập khẩu</span>
                    </li>
                    <li className="feature-item">
                        <CheckIcon />
                        <span>Thiết kế hiện đại, phù hợp mọi dáng người</span>
                    </li>
                    <li className="feature-item">
                        <CheckIcon />
                        <span>Dễ dàng giặt và bảo quản</span>
                    </li>
                    <li className="feature-item">
                        <CheckIcon />
                        <span>Đổi trả miễn phí trong 7 ngày</span>
                    </li>
                </ul>
            </div>

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <div className="toast-message">{toast.message}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductInfo;