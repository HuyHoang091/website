import axios from 'axios';

const API_URL = 'http://localhost:8080/api/orders';

// Lấy token từ localStorage
const getAuthToken = () => {
    return localStorage.getItem('tokenJWT');
};

// Cấu hình header với token
const getAuthConfig = () => ({
    headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
    }
});

// Lấy tất cả đơn hàng
export const getAllOrders = async () => {
    try {
        const response = await axios.get(`${API_URL}/details/all`, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

// Lấy chi tiết sản phẩm trong đơn hàng
export const getOrderItems = async (orderId) => {
    try {
        const response = await axios.get(`${API_URL}/${orderId}/items`, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error(`Error fetching order items for order ${orderId}:`, error);
        throw error;
    }
};

// Cập nhật đơn hàng
export const updateOrder = async (orderId, orderData) => {
    try {
        const response = await axios.put(`${API_URL}/${orderId}/update`, orderData, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error(`Error updating order ${orderId}:`, error);
        throw error;
    }
};

// Lấy chi tiết đơn hàng để sửa
export const getOrderDetails = async (orderId) => {
    try {
        const [orderItems, cancelRequest] = await Promise.all([
            getOrderItems(orderId),
            axios.get(`${API_URL}/${orderId}/cancel-request`, getAuthConfig())
                .then(res => res.data)
                .catch(() => null)
        ]);

        return {
            orderItems,
            cancelRequest
        };
    } catch (error) {
        console.error(`Error fetching order details for order ${orderId}:`, error);
        throw error;
    }
};