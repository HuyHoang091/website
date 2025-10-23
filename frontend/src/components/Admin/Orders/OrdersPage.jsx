import React, { useState, useEffect } from 'react';
import OrdersTable from './OrdersTable';
import OrderEditModal from './OrderEditModal';
import Pagination from '../Users/Pagination';
import { getAllOrders, getOrderDetails, updateOrder } from '../../../services/orderService';
import styles from './OrdersPage.module.css';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
    const [ordersPerPage] = useState(10); // Số lượng đơn hàng trên mỗi trang

    const indexOfLastOrder = currentPage * ordersPerPage; // Vị trí cuối cùng của đơn hàng trên trang hiện tại
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage; // Vị trí đầu tiên của đơn hàng trên trang hiện tại
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder); // Đơn hàng trên trang hiện tại
    
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [orders, searchTerm, statusFilter, dateRangeFilter]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await getAllOrders();
            setOrders(data);
            setFilteredOrders(data);
        } catch (err) {
            setError('Không thể tải danh sách đơn hàng');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = () => {
        let result = [...orders];

        // Filter by search term
        if (searchTerm) {
            result = result.filter(order => 
                order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.phone.includes(searchTerm)
            );
        }

        // Filter by status
        if (statusFilter) {
            result = result.filter(order => order.status === statusFilter);
        }

        // Filter by date range
        if (dateRangeFilter.start && dateRangeFilter.end) {
            const startDate = new Date(dateRangeFilter.start);
            const endDate = new Date(dateRangeFilter.end);
            endDate.setHours(23, 59, 59); // End of day

            result = result.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= startDate && orderDate <= endDate;
            });
        }

        setFilteredOrders(result);
    };

    const handleEdit = async (order) => {
        setSelectedOrder(order);
        try {
            const details = await getOrderDetails(order.id);
            setOrderDetails(details);
            setEditModalVisible(true);
        } catch (err) {
            setError('Không thể tải chi tiết đơn hàng');
            console.error(err);
        } finally {
        }
    };

    const handleCloseEditModal = () => {
        setEditModalVisible(false);
        setSelectedOrder(null);
        setOrderDetails(null);
    };

    const handleOrderUpdated = () => {
        loadOrders(); // Reload orders after update
        handleCloseEditModal();
    };

    const handleConfirm = async (order) => {
        try {
            setLoading(true);

            // Lấy chi tiết đơn hàng hiện tại
            const currentOrder = await getOrderDetails(order.id);

            // Tạo payload đầy đủ
            const payload = {
                userId: order.userId,
                createBy: order.createBy || 'Unknown',
                status: 'processing', // Cập nhật trạng thái thành "processing"
                note: order.note || '',
                addressId: order.addressId,
                items: currentOrder.orderItems.map(item => ({
                    id: item.id,
                    variantId: item.variantId,
                    quantity: item.quantity
                }))
            };

            // Gọi API cập nhật đơn hàng
            await updateOrder(order.id, payload);

            // Tải lại danh sách đơn hàng
            loadOrders();
        } catch (err) {
            setError('Không thể xác nhận đơn hàng');
            console.error('Error updating order:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.ordersPage}>
            <h2 className={styles.pageTitle}>Quản lý đơn hàng</h2>
            
            {error && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className={styles.closeBtn}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            <div className={styles.ordersFilters}>
                <div className={styles.searchBox}>
                    <i className={`fas fa-search ${styles.searchIcon}`}></i>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn, tên, SĐT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đã giao cho vận chuyển</option>
                        <option value="delivered">Đã giao hàng</option>
                        <option value="cancelled">Đã hủy</option>
                        <option value="returned">Đã hoàn trả</option>
                    </select>
                </div>

                <div className={styles.dateFilters}>
                    <div className={styles.dateFilter}>
                        <label>Từ:</label>
                        <input
                            type="date"
                            value={dateRangeFilter.start}
                            onChange={(e) => setDateRangeFilter({ 
                                ...dateRangeFilter, 
                                start: e.target.value 
                            })}
                        />
                    </div>
                    
                    <div className={styles.dateFilter}>
                        <label>Đến:</label>
                        <input
                            type="date"
                            value={dateRangeFilter.end}
                            onChange={(e) => setDateRangeFilter({ 
                                ...dateRangeFilter, 
                                end: e.target.value 
                            })}
                        />
                    </div>
                </div>
            </div>

            <OrdersTable
                orders={currentOrders}
                loading={loading}
                onEdit={handleEdit}
                onConfirm={handleConfirm}
                styles={styles}
            />

            <Pagination
                usersPerPage={ordersPerPage}
                totalUsers={filteredOrders.length}
                paginate={paginate}
                currentPage={currentPage}
            />

            {editModalVisible && selectedOrder && orderDetails && (
                <OrderEditModal
                    order={selectedOrder}
                    orderItems={orderDetails.orderItems}
                    cancelRequest={orderDetails.cancelRequest}
                    onClose={handleCloseEditModal}
                    onOrderUpdated={handleOrderUpdated}
                    styles={styles}
                />
            )}
        </div>
    );
};

export default OrdersPage;