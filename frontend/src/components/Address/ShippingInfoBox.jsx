const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

const ShippingInfoBox = ({ shippingInfo }) => {
    const hasInfo = shippingInfo && (shippingInfo.province || shippingInfo.district);

    if (!hasInfo) {
        return null;
    }

    return (
        <div className="shipping-info active">
            <div className="shipping-info-row">
                <span className="shipping-info-label">Tỉnh/Thành phố:</span>
                <span className="shipping-info-value">
                    {shippingInfo.province?.ProvinceName || '-'}
                </span>
            </div>
            
            <div className="shipping-info-row">
                <span className="shipping-info-label">Quận/Huyện:</span>
                <span className="shipping-info-value">
                    {shippingInfo.district?.DistrictName || '-'}
                </span>
            </div>
            
            <div className="shipping-info-row">
                <span className="shipping-info-label">Dịch vụ vận chuyển:</span>
                <span className="shipping-info-value">
                    {shippingInfo.service?.short_name || '-'}
                </span>
            </div>
            
            <div className="shipping-info-row">
                <span className="shipping-info-label">🚚 Phí vận chuyển:</span>
                <span 
                    className="shipping-info-value" 
                    style={{ color: '#dc2626', fontSize: '1.125rem' }}
                >
                    {shippingInfo.fee ? formatCurrency(shippingInfo.fee) : '-'}
                </span>
            </div>
        </div>
    );
};

export default ShippingInfoBox;