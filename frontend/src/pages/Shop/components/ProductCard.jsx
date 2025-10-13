import React from "react";
import {formatPrice, generateStars, getBrandName, getColorCode} from "../helper";
import {BASE_API_URL} from "../../../services/appServices";
import clsx from "clsx";

const ProductCard = ({product, addToCart, isInCart}) => {
	const discountPercent = product.originalPrice
		? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
		: 0;
	
	return (
		<div className="product-card position-relative">
			<div className="product-image"
				style={{
					backgroundImage: product.url ? `url(${product.url?.replace("http://localhost:8080", BASE_API_URL)})` : "none",
					background: "var(--bg-color-grad-pink)",
					backgroundRepeat: "no-repeat",
					backgroundSize: "cover",
					backgroundPosition: "center top",
					backgroundBlendMode: "multiply",
				}}
			>
				<div className="product-badges">
					{product.badge === 'sale' && (
						<span className="product-badge badge-sale">Sale</span>
					)}
					{product.isNew && (
						<span className="product-badge badge-new">Mới</span>
					)}
				</div>
				<div className="product-actions">
					<button className="action-btn" title="Yêu thích">❤️</button>
					<button className="action-btn" title="Xem nhanh">👁️</button>
				</div>
			</div>
			<div className="product-info flex flex-column">
				<div className="product-brand">{getBrandName(product.brand)}</div>
				<h3 className="product-name">{product.name}</h3>
				<p className="product-description">{product.description}</p>
				<div className="product-price">
					<span className="current-price">{formatPrice(product.price)}</span>
					{product.originalPrice && (
						<>
							<span className="original-price">{formatPrice(product.originalPrice)}</span>
							<span className="discount-percent">-{discountPercent}%</span>
						</>
					)}
				</div>
				<div className="product-rating">
					<span className="stars">{generateStars(product.rating)}</span>
					<span className="rating-text">
                        {product.rating} ({product.reviews} đánh giá)
                    </span>
				</div>
				<div className="product-variants">
					{product.colors.map(color => (
						<div
							key={color.code}
							className="variant-color"
							style={{backgroundColor: getColorCode(color.code)}}
							title={color.name}
						/>
					))}
				</div>
				<div className="product-sizes">
					{product.sizes.slice(0, 5).map(size => (
						<span key={size} className="size-tag">{size}</span>
					))}
					{product.sizes.length > 5 && <span className="size-tag">+{product.sizes.length - 5}</span>}
				</div>
				<button
					className={clsx(
						"add-to-cart mt-auto",
						{"added": isInCart}
					)}
					onClick={() => addToCart(product.id)}
				>
					{isInCart ? '✓ Đã thêm vào giỏ' : '🛒 Thêm vào giỏ hàng'}
				</button>
			</div>
		</div>
	);
};

export default ProductCard;
