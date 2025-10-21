export const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
export const getBrandName = (brand) => ({ zara: 'ZARA', hm: 'H&M', uniqlo: 'UNIQLO', mango: 'MANGO', local: 'LOCAL BRAND' }[brand] || brand?.toUpperCase?.() || '');
export const generateStars = (rating) => { const stars = Math.round(rating); return '★'.repeat(stars) + '☆'.repeat(5 - stars); };
export const getColorCode = (color) => ({ red: '#ff0000', green: '#00ff00', blue: '#0000ff', black: '#000000', white: '#ffffff' })[color] || '#cccccc';
export const formatDate = (dateArray) => {
    console.log('Received dateArray:', dateArray);

    // Kiểm tra nếu không phải mảng hoặc mảng không đủ phần tử
    if (!Array.isArray(dateArray) || dateArray.length < 6) {
        console.error('Invalid dateArray:', dateArray);
        return 'Invalid date';
    }

    // Tách các phần từ mảng
    const [year, month, day, hour, minute, second] = dateArray;

    // Tạo đối tượng Date
    const date = new Date(
        Number(year),
        Number(month) - 1, // Trừ 1 vì tháng trong JS bắt đầu từ 0
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
    );

    // Kiểm tra xem đối tượng Date có hợp lệ không
    if (isNaN(date.getTime())) {
        console.error('Invalid date object created:', dateArray);
        return 'Invalid date';
    }

    // Định dạng ngày tháng
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};