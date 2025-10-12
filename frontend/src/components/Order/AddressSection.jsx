const MapPinIcon = () => (
    <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EditIcon = () => (
    <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const AddressSection = ({ selectedAddress, onChangeAddress }) => {
    return (
        <div className="checkout-section">
            <div className="section-header">
                <div className="section-title">
                    <MapPinIcon />
                    <h2>Địa chỉ giao hàng</h2>
                </div>
            </div>

            <div className="address-card">
                <div className="address-info">
                    <div className="address-name-phone">
                        <span className="address-name">{selectedAddress.name}</span>
                        <span className="address-divider">|</span>
                        <span className="address-phone">{selectedAddress.phone}</span>
                    </div>
                    <p className="address-detail">
                        {selectedAddress.address}, {selectedAddress.city}
                    </p>
                    {selectedAddress.isDefault && (
                        <span className="default-badge">Mặc định</span>
                    )}
                </div>
                <button onClick={onChangeAddress} className="change-address-btn">
                    <EditIcon />
                    Thay đổi
                </button>
            </div>
        </div>
    );
};

export default AddressSection;