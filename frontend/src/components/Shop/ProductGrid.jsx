import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, addedToCart, wishlist }) => (
    <div className="products-grid">
        {products.map(product => (
            <ProductCard key={product.id} product={product} addedToCart={addedToCart} wishlist={wishlist} onAddToCart={() => {}} onAddToWishlist={() => {}} />
        ))}
    </div>
);

export default ProductGrid;