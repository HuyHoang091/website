import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { updateOrder } from '../../../services/orderService';

const OrderEditModal = ({ order, orderItems, cancelRequest, onClose, onOrderUpdated, styles }) => {
    const [formData, setFormData] = useState({
        userId: order.userId || '',
        addressId: order.addressId || '',
        status: order.status || 'pending',
        createBy: order.createBy || '',
        note: order.note || '',
        items: []
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        // Định dạng items từ orderItems API response
        if (orderItems && orderItems.length > 0) {
            const formattedItems = orderItems.map(item => ({
                id: item.id.toString(),
                variantId: item.variantId ? item.variantId.toString() : '',
                quantity: item.quantity.toString()
            }));
            
            setFormData(prev => ({
                ...prev,
                items: formattedItems
            }));
        }
    }, [orderItems]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            console.log('Submitting form data:', formData);
            await updateOrder(order.id, formData);
            setSuccess('Cập nhật đơn hàng thành công!');
            // setTimeout(() => {
                onOrderUpdated();
            // }, 1500);
        } catch (err) {
            setError('Không thể cập nhật đơn hàng: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const getStatusOptions = () => {
        const statuses = [
            { value: 'pending', label: 'Chờ xử lý' },
            { value: 'processing', label: 'Đang xử lý' },
            { value: 'shipped', label: 'Đã giao cho vận chuyển' },
            { value: 'delivered', label: 'Đã giao hàng' },
            { value: 'cancelled', label: 'Đã hủy' },
            { value: 'returned', label: 'Đã hoàn trả' }
        ];

        return statuses.map(status => (
            <option key={status.value} value={status.value}>
                {status.label}
            </option>
        ));
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.orderEditModal}>
                <div className={styles.modalHeader}>
                    <h3>Sửa đơn hàng #{order.orderNumber}</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {error && (
                        <div className={`${styles.alert} ${styles.alertError}`}>
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className={`${styles.alert} ${styles.alertSuccess}`}>
                            <i className="fas fa-check-circle"></i>
                            <span>{success}</span>
                        </div>
                    )}

                    <div className={styles.orderDetailsSection}>
                        <div className={styles.orderDetailsHeader}>
                            <h4>Thông tin đơn hàng</h4>
                        </div>
                        
                        <div className={styles.orderInfoGrid}>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Mã đơn hàng:</span>
                                <span className={styles.infoValue}>{order.orderNumber}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Ngày tạo:</span>
                                <span className={styles.infoValue}>{formatDate(order.createdAt, true)}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Khách hàng:</span>
                                <span className={styles.infoValue}>{order.fullName}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Điện thoại:</span>
                                <span className={styles.infoValue}>{order.phone}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Địa chỉ:</span>
                                <span className={styles.infoValue}>{order.fullAddress}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Tổng tiền:</span>
                                <span className={`${styles.infoValue} ${styles.priceValue}`}>{formatCurrency(order.totalAmount)}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Nguồn đơn:</span>
                                <span className={styles.infoValue}>{order.source || 'Trực tiếp'}</span>
                            </div>
                        </div>
                    </div>

                    {cancelRequest && (
                        <div className={styles.cancelRequestSection}>
                            <div className={styles.sectionHeaderWarning}>
                                <i className="fas fa-exclamation-triangle"></i>
                                <h4>Yêu cầu hủy đơn</h4>
                            </div>
                            <div className={styles.cancelRequestDetails}>
                                <p><strong>Lý do:</strong> {cancelRequest.reason}</p>
                                <p><strong>Ngày yêu cầu:</strong> {formatDate(cancelRequest.requestedAt, true)}</p>
                                <p><strong>Người yêu cầu:</strong> {cancelRequest.requestedBy}</p>
                                {cancelRequest.adminNote && (
                                    <p><strong>Ghi chú admin:</strong> {cancelRequest.adminNote}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={styles.orderItemsSection}>
                        <div className={styles.sectionHeader}>
                            <h4>Sản phẩm trong đơn</h4>
                        </div>
                        <div className={styles.orderItemsTable}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Mã SKU</th>
                                        <th>Đơn giá</th>
                                        <th>Số lượng</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems && orderItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.productName}</td>
                                            <td>{item.sku}</td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.lineTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="4" className={styles.totalLabel}>Tổng cộng</td>
                                        <td className={styles.totalValue}>{formatCurrency(order.totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.orderEditForm}>
                        <div className={styles.formGroup}>
                            <label>Trạng thái đơn hàng</label>
                            <select 
                                name="status" 
                                value={formData.status}
                                onChange={handleInputChange}
                                className={styles.formControl}
                            >
                                {getStatusOptions()}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Người xử lý</label>
                            <input 
                                type="text"
                                name="createBy"
                                value={formData.createBy}
                                onChange={handleInputChange}
                                className={styles.formControl}
                                placeholder="Tên người xử lý"
                                maxlength="100"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Ghi chú</label>
                            <textarea 
                                name="note"
                                value={formData.note || ''}
                                onChange={handleInputChange}
                                className={styles.formControl}
                                rows="3"
                                placeholder="Ghi chú cho đơn hàng"
                                maxlength="1000"
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button 
                                type="button" 
                                onClick={onClose}
                                className={styles.btnSecondary}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button 
                                type="submit"
                                className={styles.btnPrimary}
                                disabled={loading}
                            >
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OrderEditModal;