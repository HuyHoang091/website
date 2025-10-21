const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

const ShippingInfoBox = ({ shippingInfo, styles }) => {
    const hasInfo = shippingInfo && (shippingInfo.province || shippingInfo.district);

    if (!hasInfo) {
        return null;
    }

    return (
        <div className={styles["shipping-info"]}>
            <div className={styles["shipping-info-row"]}>
                <span className={styles["shipping-info-label"]}>Tỉnh/Thành phố:</span>
                <span className={styles["shipping-info-value"]}>
                    {shippingInfo.province?.ProvinceName || '-'}
                </span>
            </div>

            <div className={styles["shipping-info-row"]}>
                <span className={styles["shipping-info-label"]}>Quận/Huyện:</span>
                <span className={styles["shipping-info-value"]}>
                    {shippingInfo.district?.DistrictName || '-'}
                </span>
            </div>

            <div className={styles["shipping-info-row"]}>
                <span className={styles["shipping-info-label"]}>Dịch vụ vận chuyển:</span>
                <span className={styles["shipping-info-value"]}>
                    {shippingInfo.service?.short_name || '-'}
                </span>
            </div>

            <div className={styles["shipping-info-row"]}>
                <span className={styles["shipping-info-label"]}>🚚 Phí vận chuyển:</span>
                <span 
                    className={styles["shipping-info-value"]} 
                    style={{ color: '#dc2626', fontSize: '1.125rem' }}
                >
                    {shippingInfo.fee ? formatCurrency(shippingInfo.fee) : '-'}
                </span>
            </div>
        </div>
    );
};

export default ShippingInfoBox;