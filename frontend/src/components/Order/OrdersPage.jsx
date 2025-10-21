import { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import OrderFilters from './OrderFilters';
import { getUserOrders } from './orderService';
import axios from 'axios';
import './Orders.css';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                
                // Get user from localStorage
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    throw new Error('Vui lòng đăng nhập để xem đơn hàng');
                }

                const user = JSON.parse(userStr);
                if (!user.id) {
                    throw new Error('Không tìm thấy thông tin người dùng');
                }

                // Fetch orders
                const data = await getUserOrders(user.id);
                setOrders(data);
                setFilteredOrders(data);
                
                // Kiểm tra trạng thái hủy đơn sau khi có dữ liệu
                await checkCancelRequestStatus(data);
                
                setLoading(false);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const checkCancelRequestStatus = async (ordersList) => {
        try {
            // Lấy tất cả order IDs
            const orderIds = ordersList.map(order => order.id);
            
            if (orderIds.length === 0) return;
            
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/orders/check-cancel-status`, {
                params: {
                    orderIds: orderIds
                },
                paramsSerializer: params => {
                    return params.orderIds.map(id => `orderIds=${id}`).join('&');
                }
            });
            
            if (response.data && response.data.cancelRequested) {
                // Cập nhật trạng thái cho các đơn hàng đang có yêu cầu hủy
                const cancelRequestedIds = new Set(response.data.cancelRequested);
                
                const updatedOrders = ordersList.map(order => {
                    if (cancelRequestedIds.has(order.id)) {
                        return { ...order, status: 'cancel_requested' };
                    }
                    return order;
                });
                
                // Cập nhật cả orders và filteredOrders
                setOrders(updatedOrders);
                
                // Cập nhật filteredOrders theo bộ lọc đang chọn
                if (activeFilter === 'all') {
                    setFilteredOrders(updatedOrders);
                } else {
                    const filtered = updatedOrders.filter(order => order.status === activeFilter);
                    setFilteredOrders(filtered);
                }
            }
        } catch (error) {
            console.error('Error checking cancel request status:', error);
        }
    };

    const handleFilterChange = (status) => {
        setActiveFilter(status);
        
        if (status === 'all') {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter(order => order.status === status);
            setFilteredOrders(filtered);
        }
    };

    // Hàm cập nhật trạng thái đơn hàng khi người dùng hủy đơn
    const updateOrderStatus = (orderId, status) => {
        const updatedOrders = orders.map(order => {
            if (order.id === orderId) {
                return { ...order, status: status };
            }
            return order;
        });
        
        setOrders(updatedOrders);
        
        // Cập nhật filteredOrders theo bộ lọc hiện tại
        if (activeFilter === 'all') {
            setFilteredOrders(updatedOrders);
        } else {
            const filtered = updatedOrders.filter(order => order.status === activeFilter);
            setFilteredOrders(filtered);
        }
    };

    if (loading) {
        return (
            <div className="orders-page">
                <div className="orders-container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Đang tải đơn hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders-page">
                <div className="orders-container">
                    <div className="error-state">
                        <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2>Đã xảy ra lỗi</h2>
                        <p>{error}</p>
                        <button 
                            className="retry-btn"
                            onClick={() => window.location.reload()}
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="orders-container">
                <div className="orders-header">
                    <h1>Đơn hàng của tôi</h1>
                    <p>Quản lý và theo dõi đơn hàng của bạn</p>
                </div>

                <OrderFilters 
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    orders={orders}
                />

                {filteredOrders.length > 0 ? (
                    <div className="orders-list">
                        {filteredOrders.map(order => (
                            <OrderCard 
                                key={order.id} 
                                order={order}
                                onStatusChange={updateOrderStatus} // Truyền callback để cập nhật trạng thái
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h2>Chưa có đơn hàng</h2>
                        <p>
                            {activeFilter === 'all' 
                                ? 'Bạn chưa có đơn hàng nào' 
                                : `Không có đơn hàng với trạng thái này`
                            }
                        </p>
                        <button 
                            className="shop-now-btn"
                            onClick={() => window.location.href = '/'}
                        >
                            Mua sắm ngay
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;