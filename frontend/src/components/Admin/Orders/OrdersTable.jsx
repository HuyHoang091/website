import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const OrdersTable = ({ orders, loading, onEdit, styles }) => {
    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: 'Chờ xử lý', className: styles.statusPending },
            'processing': { label: 'Đang xử lý', className: styles.statusProcessing },
            'shipped': { label: 'Đang vận chuyển', className: styles.statusShipped },
            'paid': { label: 'Đã thanh toán', className: styles.statusPaid },
            'delivered': { label: 'Đã giao hàng', className: styles.statusDelivered },
            'cancelled': { label: 'Đã hủy', className: styles.statusCancelled },
            'returned': { label: 'Đã hoàn trả', className: styles.statusReturned }
        };

        const statusInfo = statusMap[status] || { label: status, className: '' };
        
        return (
            <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                {statusInfo.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className={styles.noData}>
                <i className="fas fa-inbox fa-3x"></i>
                <p>Không tìm thấy đơn hàng nào</p>
            </div>
        );
    }

    return (
        <div className={styles.tableResponsive}>
            <table className={styles.ordersTable}>
                <thead>
                    <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Liên hệ</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th>Tổng tiền</th>
                        <th>Người tạo</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td>{order.orderNumber}</td>
                            <td>{order.fullName}</td>
                            <td>
                                <div>{order.phone}</div>
                                <div className={styles.addressPreview}>{order.fullAddress}</div>
                            </td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td className={styles.priceColumn}>{formatCurrency(order.totalAmount)}</td>
                            <td>{order.createBy}</td>
                            <td>
                                <button 
                                    className={`${styles.btnIcon} ${styles.btnEdit}`}
                                    onClick={() => onEdit(order)}
                                    title="Sửa đơn hàng"
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrdersTable;