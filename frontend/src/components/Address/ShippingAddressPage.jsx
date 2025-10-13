import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapSection from './MapSection';
import ShippingForm from './ShippingForm';
import { getShopInfo, matchAddressWithGHN } from './ghnService';
import axios from 'axios';
import './ShippingAddress.css';
import { ArrowLeftIcon } from '../ShoppingCart/Icons';

const ShippingAddressPage = () => {
    const navigate = useNavigate();
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

    const handleFormSubmit = async (formData) => {
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
        
        try {
            const userId = JSON.parse(localStorage.getItem("user")).id; // Lấy userId từ localStorage
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/addresses/create`, {
                user: {
                    id: userId
                },
                fullName: formData.fullName,
                phone: formData.phone,
                city: currentShippingInfo.province?.ProvinceName || "Không xác định",
                district: currentShippingInfo.district?.DistrictName || "Không xác định",
                priceShip: fee,
                detail: formData.detailAddress
            });

            console.log("Address created successfully:", response.data);

            navigate(-1);
        } catch (error) {
            console.error("Error creating address:", error.response?.data || error.message);
            alert("Đã xảy ra lỗi khi thêm địa chỉ. Vui lòng thử lại.");
        }
    };

    return (
        <div className="shipping-address-page">
            <div className="shipping-address-container">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p>
                        <h1>📍 Chọn địa chỉ giao hàng</h1>
                        <p>Tìm kiếm và chọn địa chỉ chính xác trên bản đồ</p>
                    </p>
                    <button onClick={() => navigate(-1)} className="continue-shopping-btn">
                        <ArrowLeftIcon />
                        Tiếp tục đặt hàng
                    </button>
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