const ConversionInfo = ({ rate, vndAmount, usdAmount }) => {
    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const formatUSD = (amount) => {
        return parseFloat(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const rateDisplay = rate 
        ? `1 USD = ${formatVND((1 / rate).toFixed(0))} VND`
        : 'Đang tải...';

    const usdDisplay = rate 
        ? `$${formatUSD(usdAmount)}`
        : '$0.00';

    return (
        <div className="conversion-info">
            <p>Tỷ giá quy đổi hiện tại:</p>
            <div className="conversion-rate">{rateDisplay}</div>
            <p style={{ marginTop: '0.75rem' }}>Số tiền thanh toán (USD):</p>
            <div className="usd-amount">{usdDisplay}</div>
        </div>
    );
};

export default ConversionInfo;