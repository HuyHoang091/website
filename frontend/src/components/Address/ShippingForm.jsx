import { useState, useEffect } from 'react';
import ShippingInfoBox from './ShippingInfoBox';

const UserIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const InfoIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ShippingForm = ({ selectedAddress, shippingInfo, onSubmit }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        detailAddress: ''
    });

    useEffect(() => {
        if (selectedAddress) {
            setFormData(prev => ({
                ...prev,
                detailAddress: selectedAddress
            }));
        }
    }, [selectedAddress]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="form-section">
            <div className="section-header" style={{ padding: '0 0 1rem 0', border: 'none' }}>
                <UserIcon />
                <h2>Thông tin người nhận</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">
                        Họ và tên<span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        className="form-input"
                        placeholder="Nguyễn Văn A"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Số điện thoại<span className="required">*</span>
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        className="form-input"
                        placeholder="0123456789"
                        pattern="[0-9]{10,11}"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Địa chỉ chi tiết<span className="required">*</span>
                    </label>
                    <textarea
                        name="detailAddress"
                        className="form-textarea"
                        placeholder="Số nhà, tên đường, khu vực..."
                        value={formData.detailAddress}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="info-box">
                    <div className="info-box-header">
                        <InfoIcon />
                        <h3>Gợi ý</h3>
                    </div>
                    <div className="info-content">
                        Tìm kiếm địa chỉ trên bản đồ và kéo marker để điều chỉnh vị trí chính xác
                    </div>
                </div>

                <ShippingInfoBox shippingInfo={shippingInfo} />

                <button type="submit" className="submit-btn">
                    Xác nhận địa chỉ giao hàng
                </button>
            </form>
        </div>
    );
};

export default ShippingForm;