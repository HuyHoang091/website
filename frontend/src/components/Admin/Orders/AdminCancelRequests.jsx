import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AdminCancelRequests = () => {
    const [cancelRequests, setCancelRequests] = useState([]);
    const [quantity, setQuantity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [sortField, setSortField] = useState('requestTime');
    const [sortDirection, setSortDirection] = useState('desc');
    const [refreshing, setRefreshing] = useState(false);
    const cancelRequestsRef = useRef(cancelRequests.length);
    const previousCountRef = useRef(0);

    // Fetch cancel requests from Redis
    const fetchCancelRequests = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            
            const response = await axios.get('http://localhost:8080/api/orders/cancel-requests');
            
            if (response.data && response.data.length > 0) {
                const requestsWithOrderDetails = await Promise.all(
                    response.data.map(async (request) => {
                        try {
                            const orderResponse = await axios.get(`http://localhost:8080/api/orders/${request.orderId}/details`);
                            return { ...request, orderDetails: orderResponse.data[0] };
                        } catch (err) {
                            console.error(`Error fetching details for order ${request.orderId}:`, err);
                            return request;
                        }
                    })
                );
                setCancelRequests(requestsWithOrderDetails);
                setQuantity(requestsWithOrderDetails.length);
                previousCountRef.current = requestsWithOrderDetails.length;
            } else {
                setCancelRequests([]);
                setQuantity(0);
                previousCountRef.current = 0;
            }
            
            if (isManualRefresh) {
                showToast('Đã cập nhật danh sách yêu cầu hủy đơn', 'success');
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching cancel requests:', err);
            setError('Không thể tải yêu cầu hủy đơn. Vui lòng thử lại sau.');
            if (isManualRefresh) {
                setRefreshing(false);
                showToast('Không thể cập nhật danh sách', 'error');
            } else {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        cancelRequestsRef.current = cancelRequests.length;
    }, [cancelRequests]);

    useEffect(() => {
        fetchCancelRequests();
        
        // Chỉ tự động cập nhật số lượng yêu cầu (không reload toàn bộ danh sách)
        const intervalId = setInterval(async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/orders/cancel-requests');
                const newCount = response.data.length;
                const oldCount = previousCountRef.current;

                // Chỉ cập nhật nếu số lượng thay đổi
                if (newCount !== cancelRequestsRef.current) {
                    // Có thể hiển thị badge thông báo có yêu cầu mới
                    console.log('Có thay đổi trong số lượng yêu cầu hủy đơn');
                    const newItems = newCount - oldCount;
                    cancelRequestsRef.current = newCount;
                    setQuantity(response.data.length);
                    showToast(`Có ${newItems} yêu cầu hủy đơn mới`, 'success');
                }
            } catch (err) {
                console.error('Error checking cancel requests count:', err);
            }
        }, 5000);
        
        return () => clearInterval(intervalId);
    }, []);

    const handleViewRequest = (request) => {
        setSelectedRequest(request);
        setAdminNote('');
    };

    const handleCloseModal = () => {
        setSelectedRequest(null);
        setAdminNote('');
    };

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    const handleManualRefresh = () => {
        fetchCancelRequests(true);
    };

    const sortedRequests = [...cancelRequests].sort((a, b) => {
        if (sortField === 'requestTime') {
            const dateA = new Date(a.requestTime);
            const dateB = new Date(b.requestTime);
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (sortField === 'orderId') {
            return sortDirection === 'asc' 
                ? a.orderId - b.orderId 
                : b.orderId - a.orderId;
        }
        
        const valueA = a[sortField] || '';
        const valueB = b[sortField] || '';
        return sortDirection === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
    });

    const handleConfirmCancel = async () => {
        if (!selectedRequest) return;
        
        try {
            setActionLoading(true);
            
            await axios.post(`http://localhost:8080/api/orders/${selectedRequest.orderId}/confirm-cancel`, {
                adminNote: adminNote
            });
            
            setCancelRequests(prev => prev.filter(req => req.orderId !== selectedRequest.orderId));
            
            setActionLoading(false);
            setSelectedRequest(null);
            
            showToast('Đã xác nhận hủy đơn hàng thành công');
            setQuantity(prev => prev - 1);
            cancelRequestsRef.current -= 1;
            previousCountRef.current -= 1;
        } catch (error) {
            console.error('Error confirming cancellation:', error);
            setActionLoading(false);
            showToast('Có lỗi xảy ra khi xác nhận hủy đơn. Vui lòng thử lại.', 'error');
        }
    };

    const handleRejectCancel = async () => {
        if (!selectedRequest) return;
        
        // if (!adminNote || adminNote.trim() === '') {
        //     showToast('Vui lòng nhập lý do từ chối yêu cầu hủy đơn', 'error');
        //     return;
        // }
        
        try {
            setActionLoading(true);
            
            await axios.post(`http://localhost:8080/api/orders/${selectedRequest.orderId}/reject-cancel`, {
                adminNote: adminNote
            });
            
            setCancelRequests(prev => prev.filter(req => req.orderId !== selectedRequest.orderId));
            
            setActionLoading(false);
            setSelectedRequest(null);
            
            showToast('Đã từ chối yêu cầu hủy đơn hàng');
            setQuantity(prev => prev - 1);
            cancelRequestsRef.current -= 1;
            previousCountRef.current -= 1;
        } catch (error) {
            console.error('Error rejecting cancellation:', error);
            setActionLoading(false);
            showToast('Có lỗi xảy ra khi từ chối yêu cầu hủy đơn. Vui lòng thử lại.', 'error');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="loading-spinner">Đang tải yêu cầu hủy đơn...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="admin-cancel-requests">
            <div className="admin-header-container">
                <h2>Quản lý yêu cầu hủy đơn hàng</h2>
                
                <div className="admin-tools">
                    <button 
                        className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        title="Tải lại danh sách"
                    >
                        <svg 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            width="20" 
                            height="20"
                            className={refreshing ? 'spin' : ''}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {refreshing ? 'Đang tải...' : 'Tải lại'}
                    </button>
                    
                    <div className="view-toggle">
                        <button 
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Danh sách
                        </button>
                        <button 
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Thẻ
                        </button>
                    </div>
                    
                    <div className="sort-controls">
                        <label>Sắp xếp theo:</label>
                        <select 
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                        >
                            <option value="requestTime">Thời gian yêu cầu</option>
                            <option value="orderId">Mã đơn hàng</option>
                        </select>
                        <button 
                            className="sort-direction"
                            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
                
                <div className="request-count">
                    <span className="count-badge">{quantity}</span>
                    <span className="count-label">yêu cầu đang chờ xử lý</span>
                </div>
            </div>
            
            {cancelRequests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>Không có yêu cầu hủy đơn nào</h3>
                    <p>Hiện tại không có yêu cầu hủy đơn hàng nào cần xử lý.</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="cancel-requests-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã đơn hàng</th>
                                <th>Khách hàng</th>
                                <th>Số điện thoại</th>
                                <th>Thời gian yêu cầu</th>
                                <th>Lý do hủy</th>
                                <th>Tổng tiền</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRequests.map((request) => (
                                <tr key={request.orderId}>
                                    <td className="order-id">#{request.orderDetails.orderNumber}</td>
                                    <td>
                                        {request.orderDetails?.customerName || 
                                         (request.orderDetails?.fullName) || 'Không xác định'}
                                    </td>
                                    <td>
                                        {request.orderDetails?.phone || 'Không có SĐT'}
                                    </td>
                                    <td className="request-time">{formatDate(request.requestTime)}</td>
                                    <td className="reason-cell" title={request.reason}>
                                        {request.reason.length > 60 ? `${request.reason.substring(0, 60)}...` : request.reason}
                                    </td>
                                    <td className="amount-cell">
                                        {request.orderDetails?.totalAmount ? 
                                            `${request.orderDetails.totalAmount.toLocaleString('vi-VN')} VNĐ` : 
                                            'Không rõ'}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-view"
                                            onClick={() => handleViewRequest(request)}
                                        >
                                            Xử lý yêu cầu
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="cancel-requests-grid">
                    {sortedRequests.map((request) => (
                        <div className="request-card" key={request.orderId}>
                            <div className="request-header">
                                <span className="request-id">Đơn hàng #{request.orderDetails.orderNumber}</span>
                                <span className="request-date">{formatDate(request.requestTime)}</span>
                            </div>
                            <div className="request-body">
                                <div className="request-info">
                                    <div className="info-item">
                                        <span className="info-label">Khách hàng:</span>
                                        <span className="info-value">
                                            {request.orderDetails?.customerName || 
                                             (request.orderDetails?.fullName) || 'Không xác định'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Điện thoại:</span>
                                        <span className="info-value">
                                            {request.orderDetails?.phone || 'Không có SĐT'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Tổng tiền:</span>
                                        <span className="info-value bold">
                                            {request.orderDetails?.totalAmount ? 
                                                `${request.orderDetails.totalAmount.toLocaleString('vi-VN')} VNĐ` : 
                                                'Không rõ'}
                                        </span>
                                    </div>
                                </div>
                                <div className="reason-box">
                                    <span className="reason-label">Lý do hủy:</span>
                                    <p className="reason-text">{request.reason}</p>
                                </div>
                            </div>
                            <div className="request-footer">
                                <button 
                                    className="btn-process"
                                    onClick={() => handleViewRequest(request)}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Xử lý yêu cầu
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {selectedRequest && (
                <div className="modal-overlay">
                    <div className="cancel-request-modal">
                        <div className="modal-header">
                            <h3>Xử lý yêu cầu hủy đơn #{selectedRequest.orderId}</h3>
                            <button className="close-btn" onClick={handleCloseModal}>&times;</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="request-details-container">
                                <h4 className="section-title">Thông tin đơn hàng</h4>
                                <div className="request-details">
                                    <div className="detail-row">
                                        <div className="detail-label">Mã đơn hàng:</div>
                                        <div className="detail-value">#{selectedRequest.orderId}</div>
                                    </div>
                                    
                                    <div className="detail-row">
                                        <div className="detail-label">Người yêu cầu:</div>
                                        <div className="detail-value">{selectedRequest.requestedBy}</div>
                                    </div>
                                    
                                    <div className="detail-row">
                                        <div className="detail-label">Thời gian yêu cầu:</div>
                                        <div className="detail-value">{formatDate(selectedRequest.requestTime)}</div>
                                    </div>
                                    
                                    <div className="detail-row">
                                        <div className="detail-label">Lý do hủy:</div>
                                        <div className="detail-value reason-highlight">{selectedRequest.reason}</div>
                                    </div>
                                    
                                    {selectedRequest.orderDetails && (
                                        <>
                                            <div className="detail-row">
                                                <div className="detail-label">Tổng tiền:</div>
                                                <div className="detail-value amount-highlight">
                                                    {selectedRequest.orderDetails.totalAmount?.toLocaleString('vi-VN')} VND
                                                </div>
                                            </div>
                                            
                                            <div className="detail-row">
                                                <div className="detail-label">Trạng thái hiện tại:</div>
                                                <div className="detail-value status-badge">
                                                    {selectedRequest.orderDetails.status}
                                                </div>
                                            </div>
                                            
                                            {selectedRequest.orderDetails.address && (
                                                <>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Người nhận:</div>
                                                        <div className="detail-value">
                                                            {selectedRequest.orderDetails.address.fullName}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="detail-row">
                                                        <div className="detail-label">Số điện thoại:</div>
                                                        <div className="detail-value">
                                                            {selectedRequest.orderDetails.address.phone}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="detail-row">
                                                        <div className="detail-label">Địa chỉ:</div>
                                                        <div className="detail-value">
                                                            {selectedRequest.orderDetails.address.detail}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="admin-action-container">
                                <h4 className="section-title">Xử lý yêu cầu</h4>
                                
                                <div className="form-group">
                                    <label htmlFor="adminNote">
                                        Ghi chú xử lý <span className="required-mark">*</span>
                                    </label>
                                    <textarea
                                        id="adminNote"
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Thêm ghi chú của bạn về việc xử lý yêu cầu này"
                                        className="admin-note"
                                        rows="3"
                                        required
                                    ></textarea>
                                    <div className="form-hint">
                                        * Ghi chú sẽ được lưu vào hệ thống và gửi thông báo đến khách hàng
                                    </div>
                                </div>
                                
                                <div className="modal-actions">
                                    <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        onClick={handleCloseModal}
                                        disabled={actionLoading}
                                    >
                                        Quay lại
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-reject" 
                                        onClick={handleRejectCancel}
                                        disabled={actionLoading}
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {actionLoading ? 'Đang xử lý...' : 'Từ chối yêu cầu'}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-confirm" 
                                        onClick={handleConfirmCancel}
                                        disabled={actionLoading}
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {actionLoading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <div className="toast-content">
                            {toast.type === 'success' && (
                                <svg className="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {toast.type === 'error' && (
                                <svg className="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            <div className="toast-message">{toast.message}</div>
                        </div>
                    </div>
                ))}
            </div>
            
            <style>{`
                .refresh-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .refresh-btn:hover:not(:disabled) {
                    background: #45a049;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                }
                
                .refresh-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .refresh-btn svg {
                    transition: transform 0.3s ease;
                }
                
                .refresh-btn.refreshing svg {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .admin-tools {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    flex-wrap: wrap;
                }
            `}</style>
        </div>
    );
};

export default AdminCancelRequests;