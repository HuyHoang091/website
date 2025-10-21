const CreditCardIcon = () => (
    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const PaymentMethod = ({ methods, selected, onSelect }) => {
    return (
        <div className="checkout-section">
            <div className="section-header">
                <div className="section-title">
                    <CreditCardIcon />
                    <h2>Phương thức thanh toán</h2>
                </div>
            </div>

            <div className="payment-methods">
                {methods.map(method => (
                    <div
                        key={method.id}
                        className={`payment-option ${selected === method.id ? 'selected' : ''}`}
                        onClick={() => onSelect(method.id)}
                    >
                        <input
                            type="radio"
                            name="payment"
                            checked={selected === method.id}
                            onChange={() => onSelect(method.id)}
                            className="payment-radio"
                        />
                        <span className="payment-icon">{method.icon}</span>
                        <div className="payment-content">
                            <span className="payment-name">{method.name}</span>
                            <span className="payment-description">{method.description}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaymentMethod;