import React from 'react';
import {getBrandName} from '../../utils/shopFormatters';

const ProductCard = ({product, onAddToCart, addedToCart, wishlist}) => {
	const isAddedToCart = addedToCart.includes(product.id);
	
	return (
		<div className="product-card">
			<div className="product-image">
				{/* badges */}
				{product.image}
			</div>
			<div className="product-info">
				<div className="product-brand">{getBrandName(product.brand)}</div>
				<h3 className="product-name">{product.name}</h3>
				{/* rest of layout copied from HTML */}
				<button className={`add-to-cart ${isAddedToCart ? 'added' : ''}`} onClick={(e) => {
					e.stopPropagation();
					onAddToCart(product.id);
				}}>
					{isAddedToCart ? 'Đã thêm!' : 'Thêm vào giỏ hàng'}
				</button>
			</div>
		</div>
	);
};

export default ProductCard;