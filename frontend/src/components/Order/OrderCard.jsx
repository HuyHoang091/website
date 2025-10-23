import { useState, useEffect } from 'react';
import axios from 'axios';
import CancelOrderModal from './CancelOrderModal';

const OrderCard = ({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewedItems, setReviewedItems] = useState({});
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        // Nếu đơn hàng đã giao, tải danh sách sản phẩm
        if (order.status === 'delivered') {
            fetchOrderItems();
        }
    }, [order.id, order.status]);

    const fetchOrderItems = async () => {
        try {
            setLoadingItems(true);
            const response = await axios.get(`http://localhost:8080/api/orders/${order.id}/items`);
            
            if (response.data && Array.isArray(response.data)) {
                setOrderItems(response.data);
                
                // Kiểm tra trạng thái đánh giá của từng sản phẩm
                const userId = getUserIdFromToken();
                const reviewStatus = {};
                
                // Gom nhóm các sản phẩm theo productName
                const uniqueItems = response.data.reduce((acc, item) => {
                    if (!acc[item.productName]) {
                        acc[item.productName] = item;
                    }
                    return acc;
                }, {});
                
                // Kiểm tra từng sản phẩm đã được đánh giá chưa
                for (const productName in uniqueItems) {
                    const item = uniqueItems[productName];
                    try {
                        const reviewResponse = await axios.get(
                            `http://localhost:8080/api/reviews/${userId}/variant/${item.variantId}`
                        );
                        reviewStatus[item.variantId] = reviewResponse.data && reviewResponse.data.length > 0;
                    } catch (error) {
                        reviewStatus[item.variantId] = false;
                    }
                }
                
                setReviewedItems(reviewStatus);
            }
        } catch (error) {
            console.error('Error fetching order items:', error);
            showToast('Không thể tải danh sách sản phẩm', 'error');
        } finally {
            setLoadingItems(false);
        }
    };

    const getUserIdFromToken = () => {
        // Lấy userId từ localStorage
        const token = localStorage.getItem('tokenJWT');
        // Giả định: Thực hiện decode hoặc lấy userId từ token
        // Đây là một giả định đơn giản, thực tế cần decode JWT
        // Ví dụ đơn giản: Giả sử token chứa id
        try {
            // Đây là giả định, thực tế cần decode JWT
            // Nếu bạn đang lưu user object trong localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.id;
        } catch {
            return null;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        
        // Tự động ẩn toast sau 3 giây
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Chờ xác nhận', color: '#f59e0b', bg: '#fef3c7' },
            processing: { label: 'Đang xử lý', color: '#3b82f6', bg: '#dbeafe' },
            shipped: { label: 'Đang giao hàng', color: '#8b5cf6', bg: '#ede9fe' },
            delivered: { label: 'Đã giao hàng', color: '#10b981', bg: '#d1fae5' },
            paid: { label: 'Đã thanh toán', color: '#3b82f6', bg: '#dbeafe' },
            cancelled: { label: 'Đã hủy', color: '#ef4444', bg: '#fee2e2' },
            returned: { label: 'Đã trả hàng', color: '#3b82f6', bg: '#dbeafe' },
            cancel_requested: { label: 'Đang chờ hủy', color: '#f97316', bg: '#ffedd5' } // Thêm trạng thái đang chờ hủy
        };
        return statusMap[status.toLowerCase()] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
    };

    const statusInfo = getStatusInfo(order.status);

    const handleViewDetails = () => {
        // Navigate to order detail page
        window.location.href = `/orders/${order.id}`;
    };

    const handleReorder = () => {
        showToast('Đặt lại đơn hàng: ' + order.orderNumber);
        // TODO: Implement reorder logic
    };

    const handleCancelOrder = () => {
        setShowCancelModal(true);
    };

    const handleCancelSubmit = async (reason) => {
        try {
            setCancelLoading(true);
            const user = JSON.parse(localStorage.getItem('user')) || {};
            const requestedBy = user.id ? `${user.fullName} (ID: ${user.id})` : 'Khách hàng';
            
            await axios.post(`http://localhost:8080/api/orders/${order.id}/cancel-request`, {
                reason: reason,
                requestedBy: requestedBy
            });
            
            setCancelLoading(false);
            setShowCancelModal(false);
            
            // Hiển thị thông báo thành công
            showToast('Yêu cầu hủy đơn hàng đã được gửi. Chúng tôi sẽ xem xét và phản hồi sớm nhất.');
            
            order.status = 'cancel_requested';
        } catch (error) {
            setCancelLoading(false);
            console.error('Error requesting order cancellation:', error);
            showToast('Có lỗi xảy ra khi gửi yêu cầu hủy đơn. Vui lòng thử lại sau.', 'error');
        }
    };

    const handleOpenReview = (item) => {
        setSelectedItem(item);
        setRating(5); // Mặc định 5 sao
        setComment('');
        setShowReviewModal(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedItem) return;

        try {
            setReviewLoading(true);
            const userId = getUserIdFromToken();
            
            if (!userId) {
                showToast('Bạn cần đăng nhập để đánh giá sản phẩm', 'error');
                return;
            }

            await axios.post('http://localhost:8080/api/reviews', {
                variantId: selectedItem.variantId.toString(),
                userId: userId.toString(),
                rating: rating.toString(),
                comment: comment
            });

            setReviewLoading(false);
            setShowReviewModal(false);
            showToast('Cảm ơn bạn đã đánh giá sản phẩm!');
            
            // Cập nhật trạng thái đánh giá
            setReviewedItems(prev => ({
                ...prev,
                [selectedItem.variantId]: true
            }));
        } catch (error) {
            setReviewLoading(false);
            console.error('Error submitting review:', error);
            showToast('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.', 'error');
        }
    };

    return (
        <div className="order-card">
            <div className="order-card-header">
                <div className="order-info">
                    <div className="order-number">
                        <svg className="order-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="order-label">Mã đơn hàng:</span>
                        <span className="order-value">{order.orderNumber}</span>
                    </div>
                    <div className="order-date">
                        <svg className="date-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(order.createdAt)}</span>
                    </div>
                </div>
                <div 
                    className="order-status-badge"
                    style={{ 
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color
                    }}
                >
                    {statusInfo.label}
                </div>
            </div>

            <div className="order-card-body">
                <div className="order-summary">
                    <div className="summary-item">
                        <span className="summary-label">Người nhận:</span>
                        <span className="summary-value">{order.address.fullName}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Số điện thoại:</span>
                        <span className="summary-value">{order.address.phone}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Địa chỉ:</span>
                        <span className="summary-value">{order.address.detail}</span>
                    </div>
                    {order.note && (
                        <div className="summary-item">
                            <span className="summary-label">Ghi chú:</span>
                            <span className="summary-value">{order.note}</span>
                        </div>
                    )}
                </div>

                {expanded && (
                    <div className="order-details">
                        <div className="detail-row">
                            <span className="detail-label">Phí vận chuyển:</span>
                            <span className="detail-value">
                                {formatCurrency(order.address.priceShip)}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Người tạo:</span>
                            <span className="detail-value">{order.createBy}</span>
                        </div>
                        
                        {/* Hiển thị danh sách sản phẩm và trạng thái đánh giá */}
                        {order.status === 'delivered' && orderItems.length > 0 && (
                            <div className="products-review-section">
                                <h4 className="products-review-title">Sản phẩm trong đơn hàng</h4>
                                
                                {loadingItems ? (
                                    <div className="loading-indicator">Đang tải...</div>
                                ) : (
                                    <div className="products-list">
                                        {/* Nhóm các sản phẩm theo tên */}
                                        {Object.values(orderItems.reduce((acc, item) => {
                                            if (!acc[item.productName]) {
                                                acc[item.productName] = item;
                                            }
                                            return acc;
                                        }, {})).map((item) => (
                                            <div key={item.variantId} className="product-review-item">
                                                <div className="product-review-name">
                                                    {item.productName}
                                                </div>
                                                <div className="product-review-actions">
                                                    {reviewedItems[item.variantId] ? (
                                                        <span className="already-reviewed">Đã đánh giá</span>
                                                    ) : (
                                                        <button
                                                            className="btn-review"
                                                            onClick={() => handleOpenReview(item)}
                                                        >
                                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                            </svg>
                                                            Đánh giá
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="order-card-footer">
                <div className="order-total">
                    <span className="total-label">Tổng tiền:</span>
                    <span className="total-amount">{formatCurrency(order.totalAmount)}</span>
                </div>

                <div className="order-actions">
                    <button 
                        className="action-btn btn-details"
                        onClick={handleViewDetails}
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Chi tiết
                    </button>

                    {(order.status === 'pending' || order.status === 'paid') && 
                     order.status !== 'cancel_requested' && (
                        <button 
                            className="action-btn btn-cancel"
                            onClick={handleCancelOrder}
                            disabled={cancelLoading}
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {cancelLoading ? 'Đang xử lý...' : 'Hủy đơn'}
                        </button>
                    )}

                    {order.status === 'delivered' && (
                        <button 
                            className="action-btn btn-review"
                            onClick={() => setExpanded(true)}
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Đánh giá
                        </button>
                    )}

                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                        <button 
                            className="action-btn btn-reorder"
                            onClick={handleReorder}
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Mua lại
                        </button>
                    )}

                    <button 
                        className="action-btn btn-toggle"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Thu gọn' : 'Xem thêm'}
                        <svg 
                            className={`toggle-icon ${expanded ? 'rotated' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Modal yêu cầu hủy đơn */}
            {showCancelModal && (
                <CancelOrderModal 
                    order={order}
                    onClose={() => setShowCancelModal(false)}
                    onSubmit={handleCancelSubmit}
                    isLoading={cancelLoading}
                />
            )}

            {/* Modal đánh giá sản phẩm */}
            {showReviewModal && selectedItem && (
                <div className="modal-overlay">
                    <div className="review-modal">
                        <div className="review-modal-header">
                            <h3>Đánh giá sản phẩm</h3>
                            <button 
                                className="close-modal-btn"
                                onClick={() => setShowReviewModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="review-modal-body">
                            <div className="product-info">
                                <h4>{selectedItem.productName}</h4>
                            </div>
                            
                            <div className="rating-container">
                                <p>Đánh giá của bạn:</p>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span 
                                            key={star}
                                            className={`star ${star <= rating ? 'filled' : ''}`}
                                            onClick={() => setRating(star)}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="comment-container">
                                <label htmlFor="comment">Nhận xét của bạn:</label>
                                <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Hãy chia sẻ trải nghiệm của bạn với sản phẩm này"
                                    rows={4}
                                ></textarea>
                            </div>
                        </div>
                        <div className="review-modal-footer">
                            <button 
                                className="cancel-btn"
                                onClick={() => setShowReviewModal(false)}
                            >
                                Hủy
                            </button>
                            <button 
                                className="submit-review-btn"
                                onClick={handleSubmitReview}
                                disabled={reviewLoading}
                            >
                                {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <div className="toast-message">{toast.message}</div>
                    </div>
                ))}
            </div>

            {/* Hiển thị thông báo khi đơn hàng đang trong trạng thái yêu cầu hủy */}
            {order.status === 'cancel_requested' && (
                <div className="cancel-pending-badge">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Đang chờ xử lý hủy</span>
                </div>
            )}
        </div>
    );
};

export default OrderCard;