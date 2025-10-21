import { useState } from 'react';

const CancelOrderModal = ({ order, onClose, onSubmit, isLoading }) => {
    const [reason, setReason] = useState('');
    const [selectedReason, setSelectedReason] = useState('');
    const [error, setError] = useState('');

    const predefinedReasons = [
        'Tôi muốn thay đổi địa chỉ giao hàng',
        'Tôi muốn thay đổi phương thức thanh toán',
        'Tôi không còn nhu cầu mua hàng nữa',
        'Tôi muốn thay đổi sản phẩm hoặc số lượng',
        'Tôi tìm thấy sản phẩm rẻ hơn ở nơi khác',
        'Khác'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let finalReason = selectedReason === 'Khác' ? reason : selectedReason;
        
        if (!finalReason || finalReason.trim() === '') {
            setError('Vui lòng nhập hoặc chọn lý do hủy đơn');
            return;
        }
        
        onSubmit(finalReason);
    };

    return (
        <div className="modal-overlay">
            <div className="cancel-order-modal">
                <div className="modal-header">
                    <h3>Yêu cầu hủy đơn hàng #{order.orderNumber}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="modal-body">
                    <p>Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng:</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Chọn lý do:</label>
                            <div className="reason-options">
                                {predefinedReasons.map((r, index) => (
                                    <div className="reason-option" key={index}>
                                        <input 
                                            type="radio" 
                                            id={`reason-${index}`} 
                                            name="cancelReason" 
                                            value={r}
                                            checked={selectedReason === r}
                                            onChange={() => {
                                                setSelectedReason(r);
                                                setError('');
                                            }}
                                        />
                                        <label htmlFor={`reason-${index}`}>{r}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {selectedReason === 'Khác' && (
                            <div className="form-group">
                                <label htmlFor="customReason">Lý do của bạn:</label>
                                <textarea
                                    id="customReason"
                                    className="form-control"
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Vui lòng nhập lý do hủy đơn hàng"
                                    rows="3"
                                ></textarea>
                            </div>
                        )}
                        
                        {error && <div className="error-message">{error}</div>}
                        
                        <div className="modal-actions">
                            <button 
                                type="button" 
                                className="btn-secondary" 
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Quay lại
                            </button>
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CancelOrderModal;