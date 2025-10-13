const SuccessMessage = ({ payerName, amount }) => {
    return (
        <div className="success-message active">
            <h3>✓ Thanh toán thành công!</h3>
            <p>Người thanh toán: {payerName}</p>
            <p>Số tiền: ${amount} USD</p>
        </div>
    );
};

export default SuccessMessage;