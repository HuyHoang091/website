/**
 * Get VND to USD exchange rate
 * @returns {Promise<number|null>} Exchange rate or null if error
 */
export const getVNDtoUSDRate = async () => {
    try {
        const res = await fetch("https://open.er-api.com/v6/latest/VND");
        const data = await res.json();
        
        if (data && data.rates && data.rates.USD) {
            return data.rates.USD;
        }
        
        throw new Error("Invalid response from exchange rate API");
    } catch (err) {
        console.error("Lỗi lấy tỷ giá:", err);
        return null;
    }
};

/**
 * Format VND currency
 * @param {number} amount 
 * @returns {string}
 */
export const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

/**
 * Format USD currency
 * @param {number} amount 
 * @returns {string}
 */
export const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};