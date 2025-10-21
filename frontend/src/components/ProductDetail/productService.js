const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Get product details by slug
 * @param {string} slug 
 * @returns {Promise<Object>}
 */
export const getProductBySlug = async (slug) => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/slug/${slug}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

/**
 * Get review statistics for a product
 * @param {string} slug 
 * @returns {Promise<Object>}
 */
export const getReviewStatistics = async (slug) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/product/${slug}/statistics`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching review statistics:', error);
        throw error;
    }
};

/**
 * Get top 3 reviews for a product
 * @param {string} slug 
 * @returns {Promise<Array>}
 */
export const getProductReviews = async (slug) => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/slug/${slug}/reviews`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
};

/**
 * Get all reviews for a product
 * @param {string} slug 
 * @returns {Promise<Array>}
 */
export const getAllReviews = async (slug) => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/slug/${slug}/reviews/all`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        throw error;
    }
};

/**
 * Add product to cart (placeholder)
 * @param {Object} cartItem 
 * @returns {Promise<Object>}
 */
export const addToCart = async (cartItem) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cartItem)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
};

/**
 * Add/remove product from wishlist (placeholder)
 * @param {number} productId 
 * @param {boolean} add 
 * @returns {Promise<Object>}
 */
export const toggleWishlist = async (productId, add = true) => {
    try {
        const endpoint = add ? 'add' : 'remove';
        const response = await fetch(`${API_BASE_URL}/wishlist/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        throw error;
    }
};