import formatCurrency from '../../utils/formatCurrency';

const TruckIcon = () => (
    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
);

const ClockIcon = () => (
    <svg className="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ShippingMethod = ({ methods, selected, onSelect }) => {
    return (
        <div className="checkout-section">
            <div className="section-header">
                <div className="section-title">
                    <TruckIcon />
                    <h2>Phương thức vận chuyển</h2>
                </div>
            </div>

            <div className="shipping-methods">
                {methods.map(method => (
                    <div
                        key={method.id}
                        className={`shipping-option ${selected === method.id ? 'selected' : ''}`}
                        onClick={() => onSelect(method.id)}
                    >
                        <input
                            type="radio"
                            name="shipping"
                            checked={selected === method.id}
                            onChange={() => onSelect(method.id)}
                            className="shipping-radio"
                        />
                        <div className="shipping-content">
                            <div className="shipping-main">
                                <span className="shipping-name">{method.name}</span>
                                <span className="shipping-price">{formatCurrency(method.priceAtAdd)}</span>
                            </div>
                            <div className="shipping-details">
                                <div className="shipping-time">
                                    <ClockIcon />
                                    <span>{method.time}</span>
                                </div>
                                <span className="shipping-description">{method.description}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShippingMethod;