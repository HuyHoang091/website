const GHN_TOKEN = "6b59f4d3-8b36-11f0-87a6-b6731eee7e4b";

// Utility functions
export const removeVietnameseTones = (str) => {
    return str.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
};

export const capitalizeFirstLetter = (str) => {
    return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const normalizeDistrictName = (name) => {
    return removeVietnameseTones(
        name.toLowerCase()
            .replace("huyen", "")
            .replace("quan", "")
            .replace("thanh pho", "")
            .replace("tp.", "")
            .replace("thi xa", "")
            .replace("phuong", "")
            .trim()
    );
};

export const extractDistrictFromOSM = (addr) => {
    let txt = removeVietnameseTones(addr.toLowerCase());
    let districtMatch = txt.match(/(huyen|quan|thi xa|tp|thanh pho|phuong)\s+([a-z\s]+)/);
    
    if (districtMatch) {
        return districtMatch[2].trim().replace(/[,\.]/g, "");
    }

    let provinceIndex = txt.indexOf("tinh");
    if (provinceIndex > 0) {
        let beforeProvince = txt.substring(0, provinceIndex).trim();
        let parts = beforeProvince.split(" ");
        if (parts.length >= 2) {
            return parts.slice(-2).join(" ").replace(/[,\.]/g, "");
        }
    }

    return null;
};

// Get shop information
export const getShopInfo = async () => {
    try {
        const res = await fetch("https://online-gateway.ghn.vn/shiip/public-api/v2/shop/all", {
            headers: { "Token": GHN_TOKEN }
        });
        const data = await res.json();
        
        if (data.data && data.data.shops.length > 0) {
            return data.data.shops.find(s => s.district_id !== 0);
        }
        return null;
    } catch (err) {
        console.error("Error getting shop info:", err);
        return null;
    }
};

// Get province by name
export const getProvince = async (addressText) => {
    try {
        const cleanAddr = removeVietnameseTones(addressText.toLowerCase());
        
        const res = await fetch("https://online-gateway.ghn.vn/shiip/public-api/master-data/province", {
            headers: { "Token": GHN_TOKEN }
        });
        const data = await res.json();

        return data.data.find(p =>
            cleanAddr.includes(removeVietnameseTones(p.ProvinceName.toLowerCase()))
        );
    } catch (err) {
        console.error("Error getting province:", err);
        return null;
    }
};

// Get district by province
export const getDistrict = async (provinceId, addressText) => {
    try {
        const cleanAddr = removeVietnameseTones(addressText.toLowerCase());

        const res = await fetch("https://online-gateway.ghn.vn/shiip/public-api/master-data/district", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Token": GHN_TOKEN 
            },
            body: JSON.stringify({ province_id: provinceId })
        });
        const data = await res.json();

        let districtGuess = extractDistrictFromOSM(addressText);
        let district = null;

        if (districtGuess) {
            district = data.data.find(d =>
                normalizeDistrictName(d.DistrictName).includes(districtGuess)
            );
        }

        if (!district) {
            district = data.data.find(d =>
                cleanAddr.includes(removeVietnameseTones(d.DistrictName.toLowerCase()))
            );
        }

        // ✅ Nếu vẫn không tìm thấy, fallback trả về object đơn giản chỉ chứa tên
        if (!district) {
            const extractedName = extractDistrictFromOSM(addressText);
            
            // ✅ Dùng địa chỉ gốc, nhưng cắt ra đoạn có thể là tên quận/huyện để hiển thị đẹp hơn
            return {
                DistrictID: 0,
                DistrictName: extractedName 
                    ? capitalizeFirstLetter(extractedName) 
                    : addressText
            };
        }

        return district;
    } catch (err) {
        console.error("Error getting district:", err);
        return {
            DistrictID: 0,
            DistrictName: extractDistrictFromOSM(addressText) || addressText
        };
    }
};

// Get available services
export const getAvailableServices = async (shopId, fromDistrict, toDistrict) => {
    try {
        const res = await fetch("https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Token": GHN_TOKEN 
            },
            body: JSON.stringify({
                shop_id: shopId,
                from_district: fromDistrict,
                to_district: toDistrict
            })
        });
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            return data.data[0]; // Return first service
        }
        return null;
    } catch (err) {
        console.error("Error getting services:", err);
        return null;
    }
};

// Calculate shipping fee
export const calculateShippingFee = async (fromDistrict, fromWard, toDistrict, serviceId) => {
    try {
        const res = await fetch("https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Token": GHN_TOKEN 
            },
            body: JSON.stringify({
                from_district_id: fromDistrict,
                from_ward_code: fromWard,
                to_district_id: toDistrict,
                to_ward_code: "",
                service_id: serviceId,
                weight: 300,
                length: 30,
                width: 20,
                height: 5
            })
        });
        const data = await res.json();

        if (data.data) {
            return data.data.total;
        }
        return null;
    } catch (err) {
        console.error("Error calculating fee:", err);
        return null;
    }
};

// Main function to match address with GHN and get shipping info
export const matchAddressWithGHN = async (addressText, shopInfo) => {
    const shippingInfo = {
        fee: 30000, // Default fee
        district: { DistrictName: addressText }, // Use addressText as default district name
        service: { short_name: "Hàng nhẹ" } // Default service
    };

    try {
        // Get province
        const province = await getProvince(addressText);
        if (!province) {
            console.log("Province not found");
            return shippingInfo;
        }
        shippingInfo.province = province;

        // Get district
        const district = await getDistrict(province.ProvinceID, addressText);
        shippingInfo.district = district;

        if (!shopInfo) {
            return shippingInfo;
        }

        // Get service
        const service = await getAvailableServices(
            shopInfo._id,
            shopInfo.district_id,
            district?.DistrictID || 0 // Use 0 if district is not found
        );
        if (service) {
            shippingInfo.service = service;

            // Calculate fee
            const fee = await calculateShippingFee(
                shopInfo.district_id,
                shopInfo.ward_code,
                district?.DistrictID || 0,
                service.service_id
            );
            if (fee) {
                shippingInfo.fee = fee;
            }
        } else {
            console.log("Service not available, using default fee");
        }

        return shippingInfo;
    } catch (err) {
        console.error("Error matching address:", err);
        return shippingInfo;
    }
};