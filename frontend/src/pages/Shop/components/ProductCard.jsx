import React, { useEffect, useState, useContext } from "react";
import {formatPrice, generateStars, getBrandName, getColorCode} from "../helper";
import {BASE_API_URL} from "../../../services/appServices";
import axios from "axios";
import clsx from "clsx";
import { CartContext } from "../../../context/CartContext";
import { useNavigate } from "react-router-dom";
import styles from '../shopPage.module.scss';

const ProductCard = ({product, addToCart, isInCart}) => {
    const [productUrl, setProductUrl] = useState(null);
    const { setCartCount } = useContext(CartContext);
    const navigate = useNavigate();

    useEffect(() => {
        setProductUrl(product.url);
    }, [product]);

    const discountPercent = product.priceNow < product.price
        ? Math.round(((product.price - product.priceNow) / product.price) * 100)
        : 0;

    const handleAddToCart = async () => {
        try {
            const userId = JSON.parse(localStorage.getItem("user")).id;
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/add`, {
                userId: userId.toString(),
                productId: product.id.toString(),
                quantity: "1",
                priceAtAdd: product.price.toString()
            });

            console.log("Product added to cart:", response.data);

            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/list/${userId}/items`);
                const cartItems = response.data || [];
                setCartCount(cartItems.length);
            } catch (error) {
                console.error("Error fetching cart count:", error.response?.data || error.message);
            }
            
            addToCart(product.id);
        } catch (error) {
            console.error("Error adding product to cart:", error.response?.data || error.message);
        }
    };

    const handleNavigateToProduct = () => {
        navigate(`/product/${product.slug}`);
    };
    
    return (
        <div className={`${styles.productCard} position-relative`}
            onClick={handleNavigateToProduct}
            style={{ cursor: "pointer" }}>
            <div className={styles.productImage}
                style={{
                    backgroundImage: productUrl ? `url(${productUrl.replace("http://localhost:8080", BASE_API_URL)})` : 'none',
                    background: "var(--bg-color-grad-pink)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "center top",
                    backgroundBlendMode: "multiply",
                }}
            >
                <div className={styles.productBadges}>
                    {product.badge === 'sale' && (
                        <span className={`${styles.productBadge} ${styles.badgeSale}`}>Sale</span>
                    )}
                    {product.isNew && (
                        <span className={`${styles.productBadge} ${styles.badgeNew}`}>Mới</span>
                    )}
                </div>
                <div className={styles.productActions}>
                    <button className={styles.actionBtn} title="Yêu thích" onClick={(e) => e.stopPropagation()}>❤️</button>
                    <button className={styles.actionBtn} title="Xem nhanh" onClick={(e) => e.stopPropagation()}>👁️</button>
                </div>
            </div>
            <div className={`${styles.productInfo} flex flex-column`}>
                <div className={styles.productBrand}>{getBrandName(product.brand)}</div>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productDescription}>{product.description}</p>
                <div className={styles.productPrice}>
                    {/* <span className={styles.currentPrice}>{formatPrice(product.price)}</span> */}
                    {product.priceNow < product.price ? (
                        <>
                            <span className={styles.currentPrice}>{formatPrice(product.priceNow)}</span>
                            <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                            <span className={styles.discountPercent}>-{discountPercent}%</span>
                        </>
                    ) : 
                        <span className={styles.currentPrice}>{formatPrice(product.price)}</span>
                    }
                </div>
                <div className={styles.productRating}>
                    <span className={styles.stars}>{generateStars(product.rating)}</span>
                    <span className={styles.ratingText}>
                        {product.rating} ({product.numberReview} đánh giá)
                    </span>
                </div>
                <div className={styles.productVariants}>
                    {product.colors.map(color => (
                        <div
                            key={color.code}
                            className={styles.variantColor}
                            style={{backgroundColor: getColorCode(color.code)}}
                            title={color.name}
                        />
                    ))}
                </div>
                <div className={styles.productSizes}>
                    {product.sizes.slice(0, 5).map(size => (
                        <span key={size} className={styles.sizeTag}>{size}</span>
                    ))}
                    {product.sizes.length > 5 && <span className={styles.sizeTag}>+{product.sizes.length - 5}</span>}
                </div>
                <button
                    className={clsx(
                        `${styles.addToCart} mt-auto`,
                        {[styles.added]: isInCart}
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart();
                    }}
                >
                    {isInCart ? '✓ Đã thêm vào giỏ' : '🛒 Thêm vào giỏ hàng'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
