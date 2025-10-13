import { useState, useEffect } from 'react';
import MapSection from './MapSection';
import ShippingForm from './ShippingForm';
import { getShopInfo, matchAddressWithGHN } from './ghnService';
import './ShippingAddress.css';

const ShippingAddressPage = () => {
    const [shopInfo, setShopInfo] = useState(null);
    const [currentShippingInfo, setCurrentShippingInfo] = useState({});
    const [selectedAddress, setSelectedAddress] = useState('');
    const [markerPosition, setMarkerPosition] = useState(null);

    useEffect(() => {
        // Initialize shop info
        const fetchShopInfo = async () => {
            const info = await getShopInfo();
            setShopInfo(info);
        };
        fetchShopInfo();
    }, []);

    const handleAddressSelect = async (address, lat, lon) => {
        setSelectedAddress(address);
        setMarkerPosition({ lat, lon });
        
        if (shopInfo) {
            const shippingInfo = await matchAddressWithGHN(address, shopInfo);
            setCurrentShippingInfo(shippingInfo);
        }
    };

    const handleFormSubmit = (formData) => {
        const submissionData = {
            ...formData,
            shippingInfo: currentShippingInfo
        };
        
        console.log("Form submitted:", submissionData);
        
        const fee = currentShippingInfo.fee || 0;
        const feeText = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(fee);
        
        alert(`Thông tin đã được xác nhận!\n\nHọ tên: ${formData.fullName}\nSĐT: ${formData.phone}\nĐịa chỉ: ${formData.detailAddress}\nPhí ship: ${feeText}`);
    };

    return (
        <div className="shipping-address-page">
            <div className="shipping-address-container">
                <div className="page-header">
                    <h1>📍 Chọn địa chỉ giao hàng</h1>
                    <p>Tìm kiếm và chọn địa chỉ chính xác trên bản đồ</p>
                </div>

                <div className="content-grid">
                    <MapSection 
                        onAddressSelect={handleAddressSelect}
                        markerPosition={markerPosition}
                        selectedAddress={selectedAddress}
                    />
                    
                    <ShippingForm 
                        selectedAddress={selectedAddress}
                        shippingInfo={currentShippingInfo}
                        onSubmit={handleFormSubmit}
                    />
                </div>
            </div>
        </div>
    );
};

export default ShippingAddressPage;