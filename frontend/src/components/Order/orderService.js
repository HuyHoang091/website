const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Get user orders by userId
 * @param {number} userId 
 * @returns {Promise<Array>}
 */
export const getUserOrders = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Sort orders by createdAt descending (newest first)
        return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error('Error fetching user orders:', error);
        throw error;
    }
};

/**
 * Get order details by orderId
 * @param {number} orderId 
 * @returns {Promise<Object>}
 */
export const getOrderDetails = async (orderId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
};

/**
 * Cancel an order
 * @param {number} orderId 
 * @returns {Promise<Object>}
 */
export const cancelOrder = async (orderId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
    }
};

/**
 * Reorder - create new order from existing order
 * @param {number} orderId 
 * @returns {Promise<Object>}
 */
export const reorder = async (orderId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error reordering:', error);
        throw error;
    }
};

/**
 * Get user from localStorage
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};